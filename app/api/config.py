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
    azure_openai_deployment: str = "gpt-4o"
    agent_search_max_iterations: int = 2  # Keep latency under 5s


settings = Settings()
