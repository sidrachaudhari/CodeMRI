
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector


# ---------------------------------------------------------
# BASE
# ---------------------------------------------------------

class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )


# ---------------------------------------------------------
# 1. USERS
# External authentication identities
# ---------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        UniqueConstraint(
            "auth_provider",
            "auth_subject",
            name="uq_users_provider_subject",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    auth_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    auth_subject: Mapped[str] = mapped_column(String(255), nullable=False)

    email: Mapped[Optional[str]] = mapped_column(String(320))
    display_name: Mapped[Optional[str]] = mapped_column(String(150))
    avatar_url: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------
# 2. WORKSPACES
# ---------------------------------------------------------

class Workspace(Base, TimestampMixin):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    members: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )

    repositories: Mapped[list["Repository"]] = relationship(
        back_populates="workspace"
    )


# ---------------------------------------------------------
# 3. WORKSPACE MEMBERS
# ---------------------------------------------------------

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    __table_args__ = (
        UniqueConstraint(
            "workspace_id", "user_id",
            name="uq_workspace_member"
        ),
        CheckConstraint(
            "role IN ('owner', 'admin', 'member', 'viewer')",
            name="ck_workspace_member_role"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="member"
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    workspace: Mapped["Workspace"] = relationship(
        back_populates="members"
    )

    user: Mapped["User"] = relationship(
        back_populates="workspace_memberships"
    )


# ---------------------------------------------------------
# 4. REPOSITORIES
# A repository belongs to a workspace, not a user.
# ---------------------------------------------------------

class Repository(Base, TimestampMixin):
    __tablename__ = "repositories"

    __table_args__ = (
        Index("ix_repositories_workspace", "workspace_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    source_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="github"
    )

    source_url: Mapped[Optional[str]] = mapped_column(Text)
    default_branch: Mapped[Optional[str]] = mapped_column(String(255))

    primary_language: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Java"
    )

    build_tool: Mapped[Optional[str]] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="active"
    )

    workspace: Mapped["Workspace"] = relationship(
        back_populates="repositories"
    )

    analyses: Mapped[list["Analysis"]] = relationship(
        back_populates="repository", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------
# 5. ANALYSES
# One repository can have multiple analysis runs.
# ---------------------------------------------------------

class Analysis(Base):
    __tablename__ = "analyses"

    __table_args__ = (
        Index("ix_analyses_repository_created", "repository_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    repository_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False
    )

    triggered_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL")
    )

    commit_sha: Mapped[Optional[str]] = mapped_column(String(64))
    branch_name: Mapped[Optional[str]] = mapped_column(String(255))

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="queued"
    )

    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    error_message: Mapped[Optional[str]] = mapped_column(Text)
    analyzer_version: Mapped[Optional[str]] = mapped_column(String(50))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    repository: Mapped["Repository"] = relationship(
        back_populates="analyses"
    )


# ---------------------------------------------------------
# 6. SOURCE FILES
# Source code is stored in PostgreSQL.
# ---------------------------------------------------------

class SourceFile(Base):
    __tablename__ = "source_files"

    __table_args__ = (
        UniqueConstraint(
            "analysis_id", "file_path",
            name="uq_source_file_analysis_path"
        ),
        Index("ix_source_files_analysis", "analysis_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    extension: Mapped[Optional[str]] = mapped_column(String(30))

    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    language: Mapped[Optional[str]] = mapped_column(String(50))

    is_binary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 7. CODE ENTITIES
# Java classes, interfaces, methods, fields, etc.
# ---------------------------------------------------------

class CodeEntity(Base):
    __tablename__ = "code_entities"

    __table_args__ = (
        Index("ix_code_entities_analysis", "analysis_id"),
        Index("ix_code_entities_qualified_name", "qualified_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    source_file_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("source_files.id", ondelete="CASCADE"),
        nullable=False
    )

    parent_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="SET NULL")
    )

    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    qualified_name: Mapped[str] = mapped_column(Text, nullable=False)

    start_line: Mapped[Optional[int]] = mapped_column(Integer)
    end_line: Mapped[Optional[int]] = mapped_column(Integer)

    signature: Mapped[Optional[str]] = mapped_column(Text)
    visibility: Mapped[Optional[str]] = mapped_column(String(20))

    modifiers: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    extra_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 8. DEPENDENCIES
# Relationships between code entities.
# ---------------------------------------------------------

class Dependency(Base):
    __tablename__ = "dependencies"

    __table_args__ = (
        Index("ix_dependencies_analysis", "analysis_id"),
        Index("ix_dependencies_source", "source_entity_id"),
        Index("ix_dependencies_target", "target_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="CASCADE"),
        nullable=False
    )

    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="CASCADE"),
        nullable=False
    )

    dependency_type: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float)

    extra_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 9. FINDINGS
# Bugs, vulnerabilities, code smells, etc.
# ---------------------------------------------------------

class Finding(Base):
    __tablename__ = "findings"

    __table_args__ = (
        Index("ix_findings_analysis_severity", "analysis_id", "severity"),
        Index("ix_findings_category", "category"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    source_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("source_files.id", ondelete="SET NULL")
    )

    code_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="SET NULL")
    )

    category: Mapped[str] = mapped_column(String(50), nullable=False)
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))
    severity: Mapped[str] = mapped_column(String(20), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[str]] = mapped_column(Text)

    start_line: Mapped[Optional[int]] = mapped_column(Integer)
    end_line: Mapped[Optional[int]] = mapped_column(Integer)

    detector: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_id: Mapped[Optional[str]] = mapped_column(String(150))
    confidence: Mapped[Optional[float]] = mapped_column(Float)

    root_cause_status: Mapped[Optional[str]] = mapped_column(String(30))
    root_cause: Mapped[Optional[str]] = mapped_column(Text)
    impact: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 10. ANALYSIS METRICS
# ---------------------------------------------------------

class AnalysisMetric(Base):
    __tablename__ = "analysis_metrics"

    __table_args__ = (
        Index("ix_metrics_analysis_name", "analysis_id", "metric_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    metric_unit: Mapped[Optional[str]] = mapped_column(String(30))
    scope: Mapped[str] = mapped_column(String(30), nullable=False)

    source_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="SET NULL")
    )

    extra_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 11. ANALYSIS SUMMARIES
# ---------------------------------------------------------

class AnalysisSummary(Base):
    __tablename__ = "analysis_summaries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    overall_score: Mapped[Optional[float]] = mapped_column(Float)
    code_quality_score: Mapped[Optional[float]] = mapped_column(Float)
    architecture_score: Mapped[Optional[float]] = mapped_column(Float)
    security_score: Mapped[Optional[float]] = mapped_column(Float)
    maintainability_score: Mapped[Optional[float]] = mapped_column(Float)
    reliability_score: Mapped[Optional[float]] = mapped_column(Float)

    summary: Mapped[Optional[str]] = mapped_column(Text)

    score_metadata: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 12. RECOMMENDATIONS
# ---------------------------------------------------------

class Recommendation(Base):
    __tablename__ = "recommendations"

    __table_args__ = (
        Index("ix_recommendations_analysis", "analysis_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    finding_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("findings.id", ondelete="SET NULL")
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)
    suggested_action: Mapped[Optional[str]] = mapped_column(Text)
    estimated_effort: Mapped[Optional[str]] = mapped_column(String(30))

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="open"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 13. CODE CHUNKS
# RAG retrieval units.
# ---------------------------------------------------------

class CodeChunk(Base):
    __tablename__ = "code_chunks"

    __table_args__ = (
        UniqueConstraint(
            "analysis_id", "source_file_id", "chunk_index",
            name="uq_code_chunk_position"
        ),
        Index("ix_code_chunks_analysis", "analysis_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    source_file_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("source_files.id", ondelete="CASCADE"),
        nullable=False
    )

    code_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_entities.id", ondelete="SET NULL")
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    start_line: Mapped[Optional[int]] = mapped_column(Integer)
    end_line: Mapped[Optional[int]] = mapped_column(Integer)

    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    extra_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 14. CODE EMBEDDINGS
# pgvector stores semantic vectors.
# ---------------------------------------------------------

class CodeEmbedding(Base):
    __tablename__ = "code_embeddings"

    __table_args__ = (
        UniqueConstraint(
            "code_chunk_id", "embedding_model",
            name="uq_chunk_embedding_model"
        ),
        Index("ix_code_embeddings_model", "embedding_model"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    code_chunk_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("code_chunks.id", ondelete="CASCADE"),
        nullable=False
    )

    embedding_model: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    # Dimension is intentionally not fixed until the embedding model
    # is selected. pgvector stores the vector; dimensions records its size.
    embedding: Mapped[list[float]] = mapped_column(
        Vector(), nullable=False
    )

    dimensions: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 15. AI INTERACTIONS
# ---------------------------------------------------------

class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    __table_args__ = (
        Index("ix_ai_interactions_analysis", "analysis_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False
    )

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text)

    model_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)

    retrieved_context: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    token_usage: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 16. ANALYSIS JOBS
# ---------------------------------------------------------

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    __table_args__ = (
        Index("ix_analysis_jobs_status", "status"),
        Index("ix_analysis_jobs_analysis", "analysis_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )

    job_type: Mapped[str] = mapped_column(String(50), nullable=False)

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="queued"
    )

    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    error_message: Mapped[Optional[str]] = mapped_column(Text)

    extra_metadata: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------
# 17. AUDIT LOGS
# ---------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    __table_args__ = (
        Index("ix_audit_logs_workspace_created", "workspace_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL")
    )

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True))

    details: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    ip_address: Mapped[Optional[str]] = mapped_column(INET)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
