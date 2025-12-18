# DevJournal API

FastAPI backend for DevJournal application.

## Setup

### Prerequisites
- Python 3.11+
- Poetry 2.0+

### Installation

```bash
# Install dependencies
poetry install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your actual values
```

## Development

### Running the server

```bash
# Development server with auto-reload
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

### Running tests

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=app tests/

# Run specific test file
poetry run pytest tests/test_example.py
```

### Code formatting and linting

```bash
# Format code with Black
poetry run black app/ tests/

# Lint with Ruff
poetry run ruff check app/ tests/

# Auto-fix linting issues
poetry run ruff check --fix app/ tests/
```

## Project Structure

```
api/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application entry point
│   ├── config.py         # Application configuration
│   ├── database.py       # Database connection and session
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API route handlers
│   │   └── health.py     # Health check endpoint
│   ├── services/         # Business logic
│   └── core/             # Core utilities
├── tests/                # Test suite
├── alembic/              # Database migrations
├── pyproject.toml        # Poetry configuration
├── .env                  # Environment variables (not in git)
└── .env.example          # Example environment variables
```

## Database Migrations

```bash
# Initialize Alembic (already done)
poetry run alembic init alembic

# Create a new migration
poetry run alembic revision --autogenerate -m "description"

# Apply migrations
poetry run alembic upgrade head

# Rollback migration
poetry run alembic downgrade -1
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)
