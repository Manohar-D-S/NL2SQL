# Deployment Guide

## Overview

The NL→SQL backend can be deployed in multiple ways:

1. **Docker Compose** (Development)
2. **Docker Container** (Production)
3. **Vercel** (Serverless)
4. **Kubernetes** (Enterprise)

## Prerequisites

- Docker & Docker Compose (for container deployment)
- OpenAI API key
- PostgreSQL database (external or containerized)

## Docker Compose (Development)

\`\`\`bash
# Clone and setup
git clone <repo-url>
cd nl-sql-backend
cp .env.example .env
export OPENAI_API_KEY=sk-...

# Start all services
docker-compose up

# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Metrics: http://localhost:8000/metrics
\`\`\`

## Production Docker Deployment

### Build Production Image

\`\`\`bash
# Build multi-stage image
docker build -f Dockerfile.prod -t nl-sql-backend:latest .

# Tag for registry
docker tag nl-sql-backend:latest myregistry.azurecr.io/nl-sql-backend:latest

# Push to registry
docker push myregistry.azurecr.io/nl-sql-backend:latest
\`\`\`

### Run Production Container

\`\`\`bash
docker run \
  -e DATABASE_URL=postgresql://user:pass@postgres:5432/db \
  -e OPENAI_API_KEY=sk-... \
  -e MODEL_MODE=openai \
  -p 8000:8000 \
  myregistry.azurecr.io/nl-sql-backend:latest
\`\`\`

### Docker Compose Production

\`\`\`bash
# Use production compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend

# Scale services
docker-compose up -d --scale backend=3
\`\`\`

## Vercel Deployment

### Setup

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `MODEL_MODE=openai`

### Deploy

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel link

# Deploy to production
vercel --prod
\`\`\`

### Environment Variables

Set in Vercel dashboard:
- Development: `.env.local`
- Production: Project settings

## Kubernetes Deployment

### Create Namespace

\`\`\`bash
kubectl create namespace nl-sql
\`\`\`

### Deploy ConfigMap

\`\`\`bash
kubectl create configmap nl-sql-config \
  --from-literal=model_mode=openai \
  --from-literal=log_level=INFO \
  -n nl-sql
\`\`\`

### Create Secret

\`\`\`bash
kubectl create secret generic nl-sql-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=openai-api-key=sk-... \
  -n nl-sql
\`\`\`

### Deploy Helm Chart

\`\`\`bash
# Install Helm chart
helm install nl-sql ./helm-chart \
  --namespace nl-sql \
  --values ./helm-values.yaml

# Check deployment
kubectl get pods -n nl-sql
kubectl get svc -n nl-sql
\`\`\`

## CI/CD Pipeline

### GitHub Actions

The repository includes `.github/workflows/ci-cd.yml` which:

1. **Test Phase**: Runs linting and unit tests on all branches
2. **Build Phase**: Builds Docker image on push to main
3. **Deploy Phase**: Deploys to Vercel or Kubernetes

### Required Secrets

Set in GitHub repository settings:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Trigger Deployment

\`\`\`bash
# Automatic: Push to main branch
git push origin main

# Manual: Use GitHub Actions dispatch
# Go to Actions > CI/CD Pipeline > Run workflow
\`\`\`

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (for translation)

### Optional
- `MODEL_MODE` - `openai` (default) or `local`
- `MODEL_PATH` - Path to local T5 model (for local mode)
- `MAX_EXECUTION_MS` - Query timeout in milliseconds (default: 10000)
- `REDIS_URL` - Redis connection for caching (default: redis://redis:6379/0)
- `LOG_LEVEL` - Logging level (default: INFO)
- `CORS_ORIGINS` - Comma-separated CORS allowed origins

## Monitoring & Observability

### Health Check

\`\`\`bash
curl http://localhost:8000/api/health
\`\`\`

### Metrics

Access Prometheus metrics:

\`\`\`bash
curl http://localhost:8000/metrics
\`\`\`

### Logging

View application logs:

\`\`\`bash
# Docker
docker-compose logs -f backend

# Kubernetes
kubectl logs -f deployment/nl-sql-backend -n nl-sql
\`\`\`

## Performance Tuning

### Connection Pooling

Set `SQLALCHEMY_POOL_SIZE` and `SQLALCHEMY_MAX_OVERFLOW` for database connections.

### Caching

- Schema caching: 1 hour TTL (configurable)
- Result caching: Use Redis backend (Milestone 4+)

### Concurrency

- Uvicorn workers: `--workers 4` (adjust based on CPU cores)
- Async request handling: Up to 100s of concurrent requests

## Scaling

### Horizontal Scaling

\`\`\`bash
# Docker Compose
docker-compose up -d --scale backend=3

# Kubernetes
kubectl scale deployment nl-sql-backend --replicas=3 -n nl-sql
\`\`\`

### Load Balancing

- Docker Compose: Built-in load balancing
- Kubernetes: ClusterIP service
- Vercel: Automatic (serverless)

## Troubleshooting

### Database Connection Failed

\`\`\`bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
\`\`\`

### High Memory Usage

\`\`\`bash
# Check container memory
docker stats

# Reduce worker count or model size
# Use MODEL_MODE=openai instead of local T5
\`\`\`

### Slow Queries

\`\`\`bash
# Check metrics
curl http://localhost:8000/metrics | grep execute_latency

# Enable query logging
export LOG_LEVEL=DEBUG
\`\`\`

## Security Considerations

1. **API Keys**: Use environment variables, never commit keys
2. **HTTPS**: Enforce in production (Vercel/K8s does this)
3. **Rate Limiting**: Implement with reverse proxy (Nginx)
4. **Database**: Use read-only user for query execution
5. **Secrets Management**: Use managed services (AWS Secrets, Vercel)

## Backup & Recovery

### Database Backup

\`\`\`bash
# Backup PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
\`\`\`

### Container Images

\`\`\`bash
# Tag and save
docker save nl-sql-backend:latest | gzip > nl-sql-backend.tar.gz

# Load
zcat nl-sql-backend.tar.gz | docker load
\`\`\`

---

For more details, see README.md and the GitHub Actions workflow at `.github/workflows/ci-cd.yml`.
