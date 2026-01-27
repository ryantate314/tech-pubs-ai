import json
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

    def _build_batch_prompt(self, chunks: list[str], query: str) -> str:
        """Build a prompt for summarizing multiple chunks in one call."""
        chunks_text = "\n\n".join(
            f"[CHUNK {i}]\n{chunk}" for i, chunk in enumerate(chunks)
        )
        return f"""Summarize each of the following document excerpts. For each chunk:
- Remove page headers, footers, document metadata, and formatting artifacts
- Focus on content relevant to the user's query: "{query}"
- Keep each summary concise (2-4 sentences) and factual

Return a JSON array of strings, one summary per chunk in the same order.
Example: ["Summary of chunk 0", "Summary of chunk 1", ...]

{chunks_text}"""

    async def summarize_chunks(self, chunks: list[str], query: str) -> list[str]:
        """
        Summarize multiple chunks in a single API call.

        Args:
            chunks: List of chunk content strings to summarize
            query: The user's search query for context

        Returns:
            List of summarized strings in the same order as input chunks
        """
        if not chunks:
            return []

        print(f"Summarizing {len(chunks)} chunks in single batch call")

        client = self._get_client()

        try:
            response = await client.chat.completions.create(
                model=settings.azure_openai_deployment,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a technical documentation assistant. Extract and summarize relevant information concisely. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": self._build_batch_prompt(chunks, query)
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )

            content = response.choices[0].message.content or "[]"
            # Strip markdown code fences if present
            if content.startswith("```"):
                content = content.split("\n", 1)[1].rsplit("```", 1)[0]
            summaries = json.loads(content)

            if len(summaries) != len(chunks):
                print(f"Warning: got {len(summaries)} summaries for {len(chunks)} chunks")
                # Pad or truncate to match
                while len(summaries) < len(chunks):
                    summaries.append(chunks[len(summaries)])
                summaries = summaries[:len(chunks)]

            print(f"Batch summarization complete")
            return summaries

        except Exception as e:
            print(f"Error in batch summarization: {e}")
            return chunks


@lru_cache(maxsize=1)
def get_summarization_service() -> SummarizationService:
    """Get or create a singleton SummarizationService instance."""
    return SummarizationService()
