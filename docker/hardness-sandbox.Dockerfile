FROM python:3.11-slim

RUN groupadd -r hardness && useradd -r -g hardness -s /bin/bash hardness && \
    mkdir -p /workspace /tmp/hardness && \
    chown -R hardness:hardness /workspace /tmp/hardness

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi==0.115.6 \
    uvicorn==0.34.0 \
    pytest==8.3.4 \
    pytest-cov==6.0.0 \
    pytest-asyncio==0.25.0 \
    mypy==1.13.0 \
    ruff==0.8.4 \
    black==24.10.0 \
    bandit==1.7.10 \
    safety==3.2.11 \
    semgrep==1.100.0 \
    httpx==0.28.1 \
    aiofiles==24.1.0

COPY docker/sandbox-policy.json /etc/hardness/policy.json
COPY --chown=hardness:hardness docker/sandbox-policy.json /etc/hardness/policy.json

WORKDIR /workspace
USER hardness

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

CMD ["python", "-m", "hardness.sandbox_worker"]
