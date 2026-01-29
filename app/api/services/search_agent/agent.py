"""Pydantic AI agent for intelligent semantic search."""

import time
from contextvars import ContextVar
from functools import lru_cache
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import ModelRequest, ModelResponse, ToolCallPart, TextPart
from pydantic_ai.models import Model, ModelRequestParameters
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider
from pydantic_ai.settings import ModelSettings
from openai import AsyncAzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from config import settings
from .dependencies import SearchAgentDeps
from .tools import vector_search, get_chunk_context

# Context variable to track request count across calls
_request_count: ContextVar[int] = ContextVar("request_count", default=0)


class LoggingModelWrapper(Model):
    """Wrapper around a model that logs requests and responses."""

    def __init__(self, wrapped_model: Model):
        self._wrapped = wrapped_model

    @property
    def model_name(self) -> str:
        return self._wrapped.model_name

    @property
    def system(self) -> str:
        return self._wrapped.system

    async def request(
        self,
        messages: list[ModelRequest],
        model_settings: ModelSettings | None,
        model_request_parameters: ModelRequestParameters,
    ) -> ModelResponse:
        count = _request_count.get() + 1
        _request_count.set(count)

        # Log request summary
        last_msg = messages[-1] if messages else None
        if last_msg:
            parts_summary = _summarize_request_parts(last_msg)
            print(f"DEBUG: LLM request #{count} - {last_msg.kind}, parts: [{parts_summary}]")

        start_time = time.perf_counter()
        response = await self._wrapped.request(messages, model_settings, model_request_parameters)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Log response summary
        parts_summary = _summarize_response_parts(response)
        usage_str = ""
        if response.usage:
            usage_str = f", tokens: {response.usage.input_tokens}in/{response.usage.output_tokens}out"

        print(f"DEBUG: LLM response #{count} in {elapsed_ms:.2f}ms{usage_str} - parts: [{parts_summary}]")

        return response


def _summarize_request_parts(request: ModelRequest) -> str:
    """Summarize request parts for logging."""
    parts = []
    for part in request.parts:
        if isinstance(part, TextPart):
            preview = part.content[:80] + "..." if len(part.content) > 80 else part.content
            preview = preview.replace("\n", "\\n")
            parts.append(f"text({len(part.content)}): '{preview}'")
        elif hasattr(part, "tool_name"):
            parts.append(f"tool_result({part.tool_name})")
        else:
            parts.append(type(part).__name__)
    return ", ".join(parts)


def _summarize_response_parts(response: ModelResponse) -> str:
    """Summarize response parts for logging."""
    parts = []
    for part in response.parts:
        if isinstance(part, TextPart):
            preview = part.content[:80] + "..." if len(part.content) > 80 else part.content
            preview = preview.replace("\n", "\\n")
            parts.append(f"text({len(part.content)}): '{preview}'")
        elif isinstance(part, ToolCallPart):
            args_preview = str(part.args)[:50] + "..." if len(str(part.args)) > 50 else str(part.args)
            parts.append(f"tool_call({part.tool_name}, {args_preview})")
        else:
            parts.append(type(part).__name__)
    return ", ".join(parts)


class PassageResult(BaseModel):
    """A relevant passage returned by the search agent."""

    chunk_id: int = Field(description="The database ID of the chunk")
    content: str = Field(description="Cleaned content for display")
    page_number: int | None = Field(description="Page number in source document")
    chapter_title: str | None = Field(description="Chapter title if available")
    document_guid: str = Field(description="Unique identifier for the document")
    document_name: str = Field(description="Human-readable document name")
    aircraft_model_name: str | None = Field(description="Aircraft model if applicable")
    similarity: float = Field(description="Vector similarity score (0-1)")
    relevance_note: str = Field(description="Brief explanation of why this passage is relevant")


class SearchAgentOutput(BaseModel):
    """Output from the search agent."""

    results: list[PassageResult] = Field(
        description="List of relevant passages, ordered by relevance"
    )


SYSTEM_PROMPT = """You are a technical documentation search assistant for aviation manuals.

Your task: Find the most relevant passages for the user's query.

Process:
1. Execute a vector search with the original query
2. Review results - if they seem off-topic or incomplete, try a reformulated query
   (e.g., different terminology like "landing gear" vs "undercarriage", or more specific terms)
3. For promising results, optionally get surrounding context if the chunk seems partial or cut off
4. Filter out clearly irrelevant results
5. Return the best passages, ensuring content is clean and readable

Content cleaning guidelines:
- Remove document headers, footers, page numbers, or metadata artifacts from content
- Remove formatting artifacts like "..." or repeated characters
- Omit serialized tables with pipes (|)
- Keep passages concise but complete - include enough context to be useful
- Preserve technical accuracy - don't paraphrase technical specifications

Important constraints:
- Maximum 2 search iterations to keep response fast
- Return results ordered by relevance to the user's actual intent
- Focus on passages that directly answer or address the user's query
- If no relevant results found, return an empty list rather than unrelated content
"""


def _create_azure_openai_client() -> AsyncAzureOpenAI:
    """Create an Azure OpenAI async client with Azure AD authentication."""
    token_provider = get_bearer_token_provider(
        DefaultAzureCredential(),
        "https://cognitiveservices.azure.com/.default"
    )

    return AsyncAzureOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        azure_ad_token_provider=token_provider,
        api_version="2024-06-01",
    )


def _create_search_agent() -> Agent[SearchAgentDeps, SearchAgentOutput]:
    """Create the search agent with tools."""
    # Create Azure provider with Azure AD authenticated client
    azure_client = _create_azure_openai_client()
    provider = AzureProvider(openai_client=azure_client)

    # Create the model using OpenAIModel with the Azure provider
    model = OpenAIChatModel(
        settings.azure_openai_deployment,
        provider=provider,
    )

    # Wrap model with logging
    logging_model = LoggingModelWrapper(model)

    agent = Agent(
        logging_model,
        deps_type=SearchAgentDeps,
        output_type=SearchAgentOutput,
        system_prompt=SYSTEM_PROMPT,
    )

    # Register tools
    agent.tool(vector_search)
    agent.tool(get_chunk_context)

    return agent


@lru_cache(maxsize=1)
def get_search_agent() -> Agent[SearchAgentDeps, SearchAgentOutput]:
    """Get or create the singleton search agent."""
    return _create_search_agent()
