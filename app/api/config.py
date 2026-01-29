from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8'
    )
    storage_account_url: str = ""
    storage_queue_url: str = ""
    chunking_queue_name: str = "document-chunking"
    embedding_queue_name: str = "document-embedding"
    database_url: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]
    azure_openai_endpoint: str = ""
    azure_openai_deployment: str = "gpt-4o-mini"
    agent_search_max_iterations: int = 4  # Max agent iterations before stopping

    # Search caching
    cache_enabled: bool = True
    cache_result_ttl_seconds: int = 604800  # 7 days
    cache_embedding_ttl_seconds: int = 2592000  # 30 days


settings = Settings()
