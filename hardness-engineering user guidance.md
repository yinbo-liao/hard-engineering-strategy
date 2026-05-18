# Harness Engineering — User Guidance

## What is Harness Engineering?

Harness Engineering transforms Claude Code from an interactive coding assistant into a **managed, governable, and recoverable agent**. Instead of chatting with Claude, you submit tasks to a control plane that:

- Decomposes work into ordered tasks (DAG)
- Supplies optimized context with token budgets
- Enforces security constraints and permissions
- Evaluates results across 6 quality dimensions
- Recovers from failures with checkpointing
- Provides real-time visibility via WebSocket dashboard

**Core principle:** The system determines the upper bound of capability, not the model.

---

## Quick Start

### Prerequisites

- Python 3.11+, Node.js 22+, Docker Desktop
- PostgreSQL 16 (or use the Docker Compose setup)
- A Claude API key

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone git@github.com:yinbo-liao/hard-engineering-strategy.git
cd hard-engineering-strategy

# 2. Set up environment
cp .env.example .env
# Edit .env — set CLAUDE_API_KEY and a strong SECRET_KEY

# 3. Start the full stack
docker-compose -f docker-compose.harness.yml up -d

# 4. Verify
curl http://localhost:8000/health
# → {"status": "healthy", "app": "Harness Control Plane", "version": "1.0.0"}

# 5. Open the dashboard
# http://localhost:3000
```

### Development Setup (no Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev                  # Opens http://localhost:3000
```

---

## Core Concepts

### Task Lifecycle

```
Submitted → Queued → Running → (Evaluated) → Completed/Failed
                ↑                         ↓
                └──── Retry (max 3) ←─────┘
```

Each task goes through the Agent Loop (max 5 iterations):

```
Reason → Action → Execute → Evaluate → Feedback → (repeat or complete)
```

### Permission Levels

| Level | Can Do | Examples |
|-------|--------|----------|
| **READ** | Read files, search codebase | `read_file`, `search_code` |
| **WRITE** | Modify files, generate code | `write_file`, `generate_api` |
| **EXECUTE** | Run tests, linters, security scans | `run_tests`, `run_linter` |
| **DEPLOY** | Deploy to staging/production | `deploy_staging` (requires approval) |
| **ADMIN** | System configuration | `modify_ci_cd`, `manage_secrets` |

### Evaluation Dimensions

Each completed task is scored across 6 dimensions:

| Dimension | Tool | Threshold | Weight |
|-----------|------|-----------|--------|
| Unit Tests | pytest | ≥80% coverage, 0 failures | 25% |
| Type Safety | mypy | 0 errors | 20% |
| Code Style | ruff/black | 0 violations | 15% |
| Security | bandit/semgrep | 0 critical issues | 25% |
| Architecture | custom | No circular deps | 10% |
| Performance | benchmark | Within 10% of baseline | 5% |

**Overall pass requires**: All 3 critical dimensions pass (Tests, Security, Type Safety) AND weighted score ≥ 85%.

---

## Using the Dashboard

### Submitting a Task

1. Open http://localhost:3000
2. In the **New Task** panel, describe what you want to build:
   ```
   Add a FastAPI endpoint for user login with JWT authentication
   ```
3. Select a task type: **Code** / **Test** / **Review** / **Deploy** / **Fix**
4. Click **Submit Task** (or Ctrl+Enter)

### Monitoring Tasks

- **Task List** (left panel): All tasks with status badges and progress bars
- **Agent Loop Visualizer** (right panel, select a task): See the current phase (Reason → Action → Execute → Evaluate → Feedback) in real-time
- **Evaluation Results**: After completion, see per-dimension pass/fail and scores

### Handling Approvals

High-risk actions (deployments, configuration changes) require human approval:

1. Switch to the **Approvals** tab
2. Review the action, risk level, and parameters
3. Click **Approve** or **Reject**

Approvals time out after 5 minutes with a default deny.

### Audit Trail

The right panel shows an audit log of all actions, filterable by task. Every tool invocation, constraint violation, and approval decision is recorded with tamper-evident hashing.

---

## API Reference

### Submit a Task

```bash
curl -X POST http://localhost:8000/api/v1/harness/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "description": "Add user authentication with OAuth2 JWT tokens",
    "task_type": "code",
    "dependencies": [],
    "priority": 5,
    "timeout_seconds": 300
  }'
```

### Check Task Status

```bash
curl http://localhost:8000/api/v1/harness/tasks/task_abc123 \
  -H "Authorization: Bearer <token>"
```

### Query Audit Log

```bash
curl "http://localhost:8000/api/v1/harness/audit?session_id=session_abc&limit=50" \
  -H "Authorization: Bearer <token>"
```

### List Pending Approvals

```bash
curl http://localhost:8000/api/v1/harness/approvals \
  -H "Authorization: Bearer <token>"
```

### Approve / Deny

```bash
curl -X POST http://localhost:8000/api/v1/harness/approvals/apr_xyz/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"comment": "Reviewed and approved", "approver": "admin"}'
```

All errors follow RFC 7807 Problem Details format with `type`, `title`, `status`, `detail`, and `instance` fields.

---

## Security Constraints

The system enforces these rules — violations block task execution:

| Rule | Severity | What it Checks |
|------|----------|---------------|
| No raw SQL | CRITICAL | String concatenation in queries |
| No hardcoded secrets | CRITICAL | Passwords, API keys, tokens in code |
| No blocking I/O | HIGH | `requests.get`, `open()`, `time.sleep` in async |
| Type safety | MEDIUM | Missing type hints on functions |
| Test coverage | HIGH | New code must have test files |
| No circular imports | MEDIUM | Module dependency cycles |

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v          # All 155 tests
python -m pytest tests/test_planner.py -v   # Single module
python -m pytest tests/ -q --tb=short      # Quiet with short tracebacks
```

---

## Production Deployment

```bash
# Production stack includes Prometheus, Grafana, Alertmanager
docker-compose -f docker-compose.harness.yml -f docker-compose.prod.yml up -d

# Access services:
# Dashboard:    https://your-host  (HTTP redirects to HTTPS)
# Grafana:      http://your-host:3001  (admin/admin)
# Prometheus:   http://your-host:9090  (internal only)
# API:          https://your-host/api/v1/harness/...
```

### Monitoring

- **Grafana dashboard**: Pre-configured with task metrics, agent loop iterations, cost tracking, approval queue depth
- **Alertmanager**: Routes critical alerts to Slack, all alerts to the harness webhook endpoint
- **Metrics endpoint**: `/metrics` exposes Prometheus-format metrics
- **Health check**: `/health` for load balancer readiness

### Backups

The `BackupManager` in `backend/app/harness/backup.py` provides:

```python
from backend.app.harness.backup import BackupManager

backup = BackupManager()

# Create a full backup
result = await backup.create_full_backup(label="pre-deploy")
# → /data/backups/harness_backup_pre-deploy_20260518_120000.sql.gz

# Clean up backups older than 7 days
removed = await backup.cleanup_old_backups(keep_days=7)

# List recent backups
backups = await backup.list_backups()
```

### Security Audit

```python
from backend.app.harness.security_audit import SecurityAuditor

auditor = SecurityAuditor(root_path=".")
report = await auditor.run_all()

print(f"Findings: {report.summary['total']}")
print(f"Critical: {report.summary['critical']}")
print(f"Passed: {report.passed}")
```

---

## Troubleshooting

### Task stuck in "running" state

1. Check the Agent Loop Visualizer for the current phase
2. Review the task's error log via `GET /api/v1/harness/tasks/{task_id}`
3. If at max iterations (5), the task will auto-fail — submit a new task with more specific instructions
4. For sandbox issues, check Docker logs: `docker logs harness-sandbox`

### WebSocket disconnects

The dashboard automatically reconnects with exponential backoff (up to 5 attempts). If persistent:
1. Check the orchestrator is running: `docker logs harness-orchestrator`
2. Verify the WebSocket URL in `.env` matches: `VITE_WS_URL=ws://localhost:8000`

### Tests are failing

1. Verify Python version: `python --version` (needs 3.11+)
2. Install all dependencies: `pip install -r backend/requirements.txt`
3. Run from the `backend/` directory
4. Check for import errors in individual test files

### Permission denied errors

1. Verify the JWT token includes the required permission level
2. Check the RBAC middleware exempt paths in `backend/app/main.py`
3. For development, set `DEBUG=true` in `.env` to expose `/docs` endpoint

---

## Architecture at a Glance

```
User Request → [Task Planner: DAG decomposition]
                    ↓
              [Context Manager: 4-layer context assembly]
                    ↓
              [Orchestrator: Agent Loop]
                    ↓
         ┌─────────┼─────────┐
         ↓         ↓         ↓
    [MCP Client] [Tool Registry] [Evaluator]
         ↓         ↓         ↓
    Claude Code   Sandbox   6-dimension
                 (Docker)    scoring
                    ↓
              [Governance: constraints + audit]
                    ↓
              [State Store: checkpoint + recovery]
```

---

*Document version: 1.0 — Last updated: 2026-05-18*
