"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "DevJournal API"
    app_env: str = "development"
    debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Database
    database_url: str
    db_echo: bool = False

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str | None = None

    # GitHub
    github_token: str | None = None

    # Claude AI
    anthropic_api_key: str | None = None

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Logging
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
