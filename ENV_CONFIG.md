# Backend Environment Configuration

This file shows the environment variables needed to run the backend server.

## Configuration Options

### Model Mode
```bash
# Set to "local" to use BART model (no API key needed)
MODEL_MODE=local

# Or set to "openai" to use OpenAI API
MODEL_MODE=openai
OPENAI_API_KEY=your_api_key_here
```

### Database
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/nl2sql_db
READ_ONLY_DB_USER=true
```

### Execution & Performance
```bash
MAX_EXECUTION_MS=10000
LOG_LEVEL=INFO
```

### Redis (Optional - for caching)
```bash
REDIS_URL=redis://localhost:6379/0
```

## Usage

Create a `.env` file in the root directory with your configuration:

```bash
# For local BART model (recommended to start)
MODEL_MODE=local
DATABASE_URL=postgresql://postgres:password@localhost:5432/nl2sql_db
READ_ONLY_DB_USER=true
MAX_EXECUTION_MS=10000
LOG_LEVEL=INFO
```
