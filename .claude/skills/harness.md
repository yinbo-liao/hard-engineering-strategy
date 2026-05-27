# Harness Engineering Skill

Use Harness Engineering to enforce code quality, governance compliance,
and structured task planning within Claude Code sessions.

## When to Apply

- After writing or editing any Python, TypeScript, JavaScript, or SQL file
- Before committing or sharing generated code
- When decomposing complex multi-step tasks into manageable subtasks
- When token budget is approaching context limits

## Slash Commands

| Command | Purpose |
|---|---|
| `/harness:check` | Run governance constraint checks on changed files |
| `/harness:evaluate` | Multi-dimensional quality evaluation of generated code |
| `/harness:plan` | Decompose a complex task into DAG execution steps |
| `/harness:init` | Initialize `.harness/config.yaml` for a project |
| `/harness:bench` | Run performance benchmarks on core modules |

## Governance Rules (automatically enforced via hooks)

1. **no_raw_sql** — No string concatenation or f-strings in SQL queries
2. **no_eval_exec** — No `eval()` or `exec()` calls
3. **no_hardcoded_secrets** — No passwords, API keys, or tokens in code
4. **no_blocking_io_in_async** — No blocking I/O in async functions
5. **type_safety** — All Python functions must have type hints
6. **test_coverage** — Generated code must include tests
7. **no_circular_imports** — No circular import dependencies

The `governance.py` module enforces rules 1-4 deterministically (regex/pattern matching).
Rules 5-7 are checked via the evaluator's static analysis.

## Hook Automations

PostToolUse hooks automatically run `harness check --files <file>` on every Write/Edit.
PreToolUse hooks run security scans before `git push`.
No manual invocation needed for standard workflows.

## Project Configuration

```bash
# Initialize per-project settings
harness init --scope api

# Check current project
harness check --path .

# Evaluate code quality
harness evaluate --path src/

# Plan a complex task
harness plan "Add user authentication with JWT and refresh tokens"
```

Per-project settings at `.harness/config.yaml` control:
- `governance.forbidden_patterns` — which rules to enforce
- `evaluation.test_coverage_min` — minimum test coverage threshold
- `tools.disabled` — which tools to disable
