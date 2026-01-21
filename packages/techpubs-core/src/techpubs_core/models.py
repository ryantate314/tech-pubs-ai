from datetime import datetime
from typing import Optional
from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AircraftModel(Base):
    __tablename__ = "aircraft_models"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    documents: Mapped[list["Document"]] = relationship(back_populates="aircraft_model")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    documents: Mapped[list["Document"]] = relationship(back_populates="category")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    guid: Mapped[UUID] = mapped_column(nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    aircraft_model_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("aircraft_models.id"), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    aircraft_model: Mapped[Optional["AircraftModel"]] = relationship(back_populates="documents")
    category: Mapped[Optional["Category"]] = relationship(back_populates="documents")
    versions: Mapped[list["DocumentVersion"]] = relationship(back_populates="document")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    guid: Mapped[UUID] = mapped_column(nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("documents.id"), nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    blob_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    document: Mapped["Document"] = relationship(back_populates="versions")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document_version")
    jobs: Mapped[list["DocumentJob"]] = relationship(back_populates="document_version")


class DocumentJob(Base):
    __tablename__ = "document_jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    document_version_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("document_versions.id"), nullable=False)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)

    # For split chunking/embedding jobs
    parent_job_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("document_jobs.id"), nullable=True)
    chunk_start_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_end_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    document_version: Mapped["DocumentVersion"] = relationship(back_populates="jobs")
    parent_job: Mapped[Optional["DocumentJob"]] = relationship(
        back_populates="child_jobs",
        remote_side=[id],
    )
    child_jobs: Mapped[list["DocumentJob"]] = relationship(back_populates="parent_job")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    document_version_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("document_versions.id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(768), nullable=True)  # BAAI/bge-base-en-v1.5 dimension
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chapter_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)

    document_version: Mapped["DocumentVersion"] = relationship(back_populates="chunks")
