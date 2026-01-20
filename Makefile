.PHONY: build-jobs-base publish-jobs-base
.PHONY: build-document-chunking publish-document-chunking
.PHONY: build-document-embedding publish-document-embedding
.PHONY: publish-all-jobs
.PHONY: run-chunking-job run-embedding-job
.PHONY: db-info db-migrate db-validate db-repair db-baseline db-add
.PHONY: terraform-apply
.PHONY: nextjs-run
.PHONY: api-run

ACR_NAME ?= $(shell cd infrastructure && terraform output -raw container_registry_name 2>/dev/null)
IMAGE_TAG ?= latest

# Flyway version
FLYWAY_VERSION ?= 11

# Common Flyway Docker command
FLYWAY_CMD = docker run --rm \
	--env-file database/.env \
	-v $(PWD)/database/migrations:/flyway/sql:ro \
	flyway/flyway:$(FLYWAY_VERSION)

# Base image (shared PyTorch + CUDA)
build-jobs-base:
	docker build -f jobs/base/Dockerfile -t jobs-base:$(IMAGE_TAG) .

publish-jobs-base: build-jobs-base
	@if [ -z "$(ACR_NAME)" ]; then echo "Error: Could not get ACR name from Terraform. Run 'terraform apply' first or set ACR_NAME manually." && exit 1; fi
	az acr login --name $(ACR_NAME)
	docker tag jobs-base:$(IMAGE_TAG) $(ACR_NAME).azurecr.io/jobs-base:$(IMAGE_TAG)
	docker push $(ACR_NAME).azurecr.io/jobs-base:$(IMAGE_TAG)

# Document Chunking Job
build-document-chunking:
	@if [ -z "$(ACR_NAME)" ]; then echo "Error: Could not get ACR name from Terraform. Run 'terraform apply' first or set ACR_NAME manually." && exit 1; fi
	docker build -f jobs/document-chunking/Dockerfile \
		--build-arg ACR_NAME=$(ACR_NAME) \
		-t document-chunking:$(IMAGE_TAG) .

publish-document-chunking: build-document-chunking
	az acr login --name $(ACR_NAME)
	docker tag document-chunking:$(IMAGE_TAG) $(ACR_NAME).azurecr.io/document-chunking:$(IMAGE_TAG)
	docker push $(ACR_NAME).azurecr.io/document-chunking:$(IMAGE_TAG)

# Document Embedding Job
build-document-embedding:
	@if [ -z "$(ACR_NAME)" ]; then echo "Error: Could not get ACR name from Terraform. Run 'terraform apply' first or set ACR_NAME manually." && exit 1; fi
	docker build -f jobs/document-embedding/Dockerfile \
		--build-arg ACR_NAME=$(ACR_NAME) \
		-t document-embedding:$(IMAGE_TAG) .

publish-document-embedding: build-document-embedding
	az acr login --name $(ACR_NAME)
	docker tag document-embedding:$(IMAGE_TAG) $(ACR_NAME).azurecr.io/document-embedding:$(IMAGE_TAG)
	docker push $(ACR_NAME).azurecr.io/document-embedding:$(IMAGE_TAG)

# Build and publish all (base first, then jobs)
publish-all-jobs: publish-jobs-base publish-document-chunking publish-document-embedding

# Local development
run-chunking-job:
	cd jobs/document-chunking && uv run --env-file=.env python main.py

run-embedding-job:
	cd jobs/document-embedding && uv run --env-file=.env python main.py

# Database migrations (Flyway)
db-info:
	$(FLYWAY_CMD) info

db-migrate:
	$(FLYWAY_CMD) migrate

db-validate:
	$(FLYWAY_CMD) validate

db-repair:
	$(FLYWAY_CMD) repair

db-baseline:
	$(FLYWAY_CMD) baseline -baselineVersion=1 -baselineDescription="baseline"

db-add:
	@if [ -z "$(DESC)" ]; then echo "Usage: make db-add DESC=description_here" && exit 1; fi
	docker run --rm \
		--env-file database/.env \
		-v $(PWD)/database/migrations:/flyway/sql \
		flyway/flyway:$(FLYWAY_VERSION) add -description="$(DESC)"

# IAC Terraform
terraform-apply:
	terraform -chdir=infrastructure apply --var-file=config/dev.tfvars

# Front End
nextjs-run:
	cd app/ui; npm run dev

# Back End
api-run:
	cd app/api; uv run uvicorn main:app --reload