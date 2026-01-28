"""Pydantic AI agent for intelligent semantic search."""

from .agent import get_search_agent, SearchAgentOutput, PassageResult
from .dependencies import SearchAgentDeps

__all__ = [
    "get_search_agent",
    "SearchAgentOutput",
    "PassageResult",
    "SearchAgentDeps",
]
