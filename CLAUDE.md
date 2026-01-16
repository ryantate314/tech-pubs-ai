# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech Pubs v3 is a document management system with three main components:

- **app/ui/** - NextJS frontend for document viewing, searching, and admin uploads
- **app/api/** - Python FastAPI backend
- **jobs/document-ingestion/** - Python job for processing/ingesting documents
- **infrastructure/** - Terraform configuration for Azure (azurerm provider)

## Build Commands

### Document Ingestion Job (Python)
```bash
cd jobs/document-ingestion
# Uses uv for package management (pyproject.toml)
uv sync              # Install dependencies
uv run python main.py  # Run the job
```

Python version: 3.12 (specified in .python-version)

### Infrastructure (Terraform)
```bash
cd infrastructure
terraform init
terraform plan -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
terraform apply -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
```

## Architecture

The system follows a standard three-tier architecture:
1. **UI Layer** - NextJS app for public users (view/search documents) and admins (upload documents)
2. **API Layer** - FastAPI backend serving the UI
3. **Background Jobs** - Document ingestion processing pipeline
4. **Infrastructure** - Azure-hosted via Terraform (useast2 default region)
