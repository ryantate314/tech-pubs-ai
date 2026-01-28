"""Pydantic AI agent for intelligent semantic search."""

from functools import lru_cache

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.azure import AzureProvider
from openai import AsyncAzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from config import settings
from .dependencies import SearchAgentDeps
from .tools import vector_search, get_chunk_context


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
    model = OpenAIModel(
        settings.azure_openai_deployment,
        provider=provider,
    )

    agent = Agent(
        model,
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
