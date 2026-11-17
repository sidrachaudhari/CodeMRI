# CodeMRI database starter

This starter uses Neon PostgreSQL, SQLAlchemy 2.x, Alembic and pgvector.

## Ownership and authentication

- A repository belongs directly to `users.id`.
- `users` stores an external identity (`auth_provider`, `provider_user_id`), not passwords.
- On every authenticated API request, validate the external provider's token, resolve the provider subject to a local `users` row, and use that local UUID as the owner ID.
- Never trust a client-supplied `user_id` for authorization. Scope every repository/analysis query to the authenticated user's ID.

## Source storage

`source_files.content` stores the ingested file text. `code_chunks.content` stores semantically bounded chunks for retrieval. Do not store binary files, build outputs, `.git` internals, secrets, or arbitrary large assets in PostgreSQL. Enforce file-size and repository-size limits during ingestion.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Initialize Alembic in the backend root if not already initialized:
   `alembic init alembic`
4. In `alembic/env.py`, import `Base` from `app.models.models` and set:
   `target_metadata = Base.metadata`
5. Ensure `alembic/env.py` loads `DATABASE_URL` from environment and uses the psycopg SQLAlchemy URL.
6. Add this to the first migration's `upgrade()` before creating tables:
   `op.execute("CREATE EXTENSION IF NOT EXISTS vector")`
7. Generate the migration:
   `alembic revision --autogenerate -m "initial CodeMRI schema"`
8. Inspect the generated migration carefully, then apply:
   `alembic upgrade head`

Do not use `Base.metadata.create_all()` in production; Alembic owns schema evolution.

## Embedding dimension

The model currently declares `Vector(768)` as a placeholder dimension. Verify the exact output dimension of the embedding model you select. Change `Vector(768)` and the `dimensions` default together before the first migration if needed. Changing dimensions later requires a planned migration/re-embedding strategy.

## First migration review checklist

- `vector` extension is created before the `code_embeddings` table/index.
- `users` has unique `(auth_provider, provider_user_id)`.
- `repositories.user_id` references `users.id` with `ON DELETE CASCADE`.
- `analyses.repository_id` references `repositories.id`.
- Every analysis-derived table references `analyses.id`.
- HNSW index uses `vector_cosine_ops`.
- All indexes and check constraints are present.
- No secrets or repository credentials are persisted in source metadata.

## Recommended migration rollout

Migration 001: users, repositories, analyses.
Migration 002: source_files, code_entities, dependencies.
Migration 003: findings, analysis_metrics, analysis_summaries.
Migration 004: code_chunks, code_embeddings and pgvector HNSW index.
Migration 005: ai_interactions, recommendations, analysis_jobs, audit_logs.

For a first local prototype, a single reviewed initial migration is also acceptable. The staged sequence is preferable once multiple developers or deployed environments depend on the schema.
