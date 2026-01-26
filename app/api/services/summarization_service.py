import asyncio
from functools import lru_cache

from openai import AsyncAzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

from config import settings


class SummarizationService:
    """Service to clean and summarize document chunks using Azure OpenAI."""

    def __init__(self):
        self._client: AsyncAzureOpenAI | None = None
        self._token_provider = None

    def _get_client(self) -> AsyncAzureOpenAI:
        """Lazy initialization of Azure OpenAI async client."""
        if self._client is None:
            # Create token provider once in the main thread
            self._token_provider = get_bearer_token_provider(
                DefaultAzureCredential(),
                "https://cognitiveservices.azure.com/.default"
            )
            self._client = AsyncAzureOpenAI(
                azure_endpoint=settings.azure_openai_endpoint,
                azure_ad_token_provider=self._token_provider,
                api_version="2024-02-15-preview"
            )
        return self._client

    def _build_prompt(self, chunk_content: str, query: str) -> str:
        """Build the prompt for summarizing a chunk."""
        return f"""Extract and summarize the relevant information from this document excerpt.
Remove any page headers, footers, document metadata, and formatting artifacts.
Focus on content relevant to the user's query: "{query}"
Keep the summary concise (2-4 sentences) and factual.

Document excerpt:
{chunk_content}

Summary:"""

    async def _summarize_chunk(self, chunk_content: str, query: str) -> str:
        """Summarize a single chunk using Azure OpenAI."""
        client = self._get_client()

        try:
          response = await client.chat.completions.create(
              model=settings.azure_openai_deployment,
              messages=[
                  {
                      "role": "system",
                      "content": "You are a technical documentation assistant. Extract and summarize relevant information concisely."
                  },
                  {
                      "role": "user",
                      "content": self._build_prompt(chunk_content, query)
                  }
              ],
              max_tokens=200,
              temperature=0.3
          )

          print("Summarized chunk: " + response.choices[0].message.content)
        except Exception as e:
          print(f"Error summarizing chunk", e)

        return response.choices[0].message.content or chunk_content

    async def summarize_chunks(self, chunks: list[str], query: str) -> list[str]:
        """
        Summarize multiple chunks in parallel.

        Args:
            chunks: List of chunk content strings to summarize
            query: The user's search query for context

        Returns:
            List of summarized strings in the same order as input chunks
        """
        print(f"Summarizing {len(chunks)} chunks")

        # Run all summarization tasks concurrently using native async
        tasks = [
            self._summarize_chunk(chunk, query)
            for chunk in chunks
        ]

        summaries = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions by falling back to original content
        return [
            summary if isinstance(summary, str) else chunks[i]
            for i, summary in enumerate(summaries)
        ]


@lru_cache(maxsize=1)
def get_summarization_service() -> SummarizationService:
    """Get or create a singleton SummarizationService instance."""
    return SummarizationService()
