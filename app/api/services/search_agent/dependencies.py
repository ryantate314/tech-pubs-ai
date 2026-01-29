"""Dependencies for the search agent."""

from dataclasses import dataclass
from sqlalchemy.orm import Session


@dataclass
class SearchAgentDeps:
    """Dependencies passed to the search agent."""

    session: Session
    original_query: str
    min_similarity: float = 0.5
    max_results: int = 10
