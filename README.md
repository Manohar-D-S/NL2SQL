# NL→SQL Translator Backend

FastAPI-based backend for translating natural language queries to SQL with execution sandboxing and query optimization.

## Features

### Core
- **NL→SQL Translation** - OpenAI GPT-3.5 or local T5 model
- **SQL Execution** - Read-only sandbox with timeout protection
- **Query Validation** - Detects unsafe operations (DELETE, DROP, etc.)
- **Query Explanation** - EXPLAIN plan analysis and metrics
- **Query Optimization** - Rule-based suggestions (7 rules)
- **Feedback Collection** - Stores feedback for model improvement
- **Monitoring** - Prometheus metrics and observability

### Speech-to-Text (Milestone 4)
- **Whisper Integration** - Audio transcription via OpenAI API
- **Multiple Formats** - MP3, WAV, OGG, FLAC, M4A support
- **Async Processing** - Non-blocking transcription

### Local Models (Milestone 4)
- **T5-Small** - Offline NL→SQL translation (CPU-friendly)
- **Pluggable Design** - Easy model swapping

## Quick Start

### Docker Compose

\`\`\`bash
git clone <repo-url>
cd nl-sql-backend
cp .env.example .env
export OPENAI_API_KEY=sk-...
docker-compose up
\`\`\`

Backend: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Local Development

\`\`\`bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://postgres:password@localhost:5432/appdb
export OPENAI_API_KEY=sk-...

uvicorn app.main:app --reload
\`\`\`

## API Endpoints

### Health & Monitoring
- `GET /api/health` - Health check
- `GET /metrics` - Prometheus metrics

### Schema
- `GET /api/schema` - List databases
- `GET /api/schema/{database}` - Get database schema

### Query Operations
- `POST /api/translate` - NL → SQL translation
- `POST /api/execute` - Execute SQL (read-only)
- `POST /api/validate` - Validate SQL safety
- `POST /api/explain` - Explain query execution
- `POST /api/optimize` - Get optimization suggestions
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/stats` - Feedback statistics

### Speech-to-Text (New)
- `POST /api/speech/transcribe` - Transcribe audio to text

Example:
\`\`\`bash
curl -X POST http://localhost:8000/api/speech/transcribe \
  -F "file=@audio.mp3"

# Response:
{
  "text": "Show all students with marks above 80",
  "language": "en",
  "confidence": 0.9
}
\`\`\`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string (required) |
| `MODEL_MODE` | `openai` | LLM mode: `openai` or `local` |
| `OPENAI_API_KEY` | - | OpenAI API key (required for openai mode) |
| `MODEL_PATH` | `./models/t5-small` | Local T5 model path |
| `MAX_EXECUTION_MS` | `10000` | Query timeout in milliseconds |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection (optional) |
| `CORS_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `LOG_LEVEL` | `INFO` | Logging level |

### Model Modes

**OpenAI Mode** (default, recommended)
- Requires: `OPENAI_API_KEY`
- Performance: Fast (~500ms per translation)
- Cost: ~$0.001 per translation
- Quality: High accuracy with fine-tuned models

**Local Mode** (offline)
- Requires: CUDA GPU (optional, slower on CPU)
- Performance: ~2-5 seconds per translation (CPU), ~500ms (GPU)
- Cost: Zero per translation
- Quality: Lower accuracy, good for testing

Set model mode:
\`\`\`bash
export MODEL_MODE=local  # Switch to local T5
\`\`\`

## Milestones

### Milestone 1 ✓
Project skeleton, Docker setup, health/schema endpoints

### Milestone 2 ✓
OpenAI translation, read-only execution, validation, caching

### Milestone 3 ✓
Query explanation, optimization suggestions, feedback, metrics

### Milestone 4 ✓
- [x] Local T5 adapter with Hugging Face Transformers
- [x] Whisper speech-to-text proxy
- [x] OpenAPI documentation (auto-generated)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Production Docker images (multi-stage build)
- [x] Deployment guide (Docker, Kubernetes, Vercel)

## Deployment

See `DEPLOYMENT.md` for detailed instructions:

- **Docker Compose** - Development and testing
- **Docker Container** - Production with multi-stage build
- **Kubernetes** - Enterprise scaling
- **Vercel** - Serverless deployment
- **GitHub Actions** - Automated CI/CD

Quick start:
\`\`\`bash
# Production Docker build
docker build -f Dockerfile.prod -t nl-sql-backend:latest .

# Run
docker run -e DATABASE_URL=... -e OPENAI_API_KEY=... -p 8000:8000 nl-sql-backend:latest

# Deploy to Vercel
vercel --prod
\`\`\`

## Testing

\`\`\`bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Specific test file
pytest tests/test_integration.py -v

# Run with database
DATABASE_URL=postgresql://... pytest tests/ -v
\`\`\`

## CI/CD Pipeline

GitHub Actions workflow in `.github/workflows/ci-cd.yml`:

1. **Test Phase** - Linting, unit tests, coverage
2. **Build Phase** - Docker image build and push
3. **Deploy Phase** - Deploy to Vercel or Kubernetes

Required secrets:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Automatic triggers:
- Push to `main` - Full CI/CD pipeline
- Push to `develop` - Tests only
- Pull requests - Tests only

## Project Structure

\`\`\`
.
├── app/
│   ├── main.py                      # FastAPI app
│   ├── core/
│   │   ├── config.py               # Configuration
│   │   └── logger.py               # Logging
│   ├── db/
│   │   ├── database.py             # Database connection
│   │   └── models.py               # SQLAlchemy models
│   ├── services/
│   │   ├── llm_translator.py       # OpenAI translator
│   │   ├── local_t5_translator.py  # <NEW> Local T5 model
│   │   ├── sql_executor.py         # SQL execution sandbox
│   │   ├── validator.py            # SQL validation
│   │   ├── cache_service.py        # Caching
│   │   ├── schema_service.py       # Schema extraction
│   │   ├── query_explainer.py      # Query explanation
│   │   ├── query_optimizer.py      # Optimization suggestions
│   │   ├── feedback_service.py     # Feedback storage
│   │   ├── whisper_service.py      # <NEW> Whisper STT
│   │   └── metrics.py              # Prometheus metrics
│   └── api/
│       └── routes/
│           ├── health.py
│           ├── schema.py
│           ├── translate.py
│           ├── execute.py
│           ├── validate.py
│           ├── explain.py
│           ├── optimize.py
│           ├── feedback.py
│           ├── metrics.py
│           └── speech.py            # <NEW> Speech endpoint
├── tests/
├── scripts/
├── .github/workflows/               # <NEW> CI/CD pipeline
│   └── ci-cd.yml
├── docker-compose.yml
├── Dockerfile                       # Development
├── Dockerfile.prod                  # <NEW> Production
├── .dockerignore                    # <NEW> Docker ignore
├── .flake8                          # <NEW> Linting config
├── pyproject.toml                   # <NEW> Tool configs
├── requirements.txt
├── pytest.ini
├── DEPLOYMENT.md                    # <NEW> Deployment guide
└── README.md
\`\`\`

## Performance

- **Translation**: ~200-500ms (OpenAI), ~2-5s (Local T5)
- **Execution**: ~10-100ms (depends on query complexity)
- **Explanation**: ~50-200ms (EXPLAIN + parsing)
- **Concurrency**: 100+ concurrent requests supported

## Security

- Read-only database user
- Query validation before execution
- HTTPS in production (Vercel/K8s enforced)
- Environment variable secrets (no hardcoded keys)
- Rate limiting (implement in reverse proxy)

## Troubleshooting

### OpenAI API key invalid
\`\`\`bash
# Check key format
echo $OPENAI_API_KEY

# Verify with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
\`\`\`

### Local T5 model fails to load
\`\`\`bash
# Ensure CUDA/PyTorch installed
python -c "import torch; print(torch.cuda.is_available())"

# Download model manually
python -c "from transformers import T5Tokenizer, T5ForConditionalGeneration; T5Tokenizer.from_pretrained('t5-small')"
\`\`\`

### Whisper transcription fails
\`\`\`bash
# Check audio file format
file audio.mp3

# Test with curl
curl -X POST http://localhost:8000/api/speech/transcribe \
  -F "file=@audio.mp3"
\`\`\`

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Submit pull request

## License

MIT

---

**Project Status**: ✓ Complete (4/4 Milestones)
- Milestone 1: Project skeleton ✓
- Milestone 2: Core translation & execution ✓
- Milestone 3: Advanced features & monitoring ✓
- Milestone 4: Local models & deployment ✓
