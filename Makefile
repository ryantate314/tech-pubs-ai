.PHONY: build-document-ingestion publish-document-ingestion run-document-ingestion
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

build-document-ingestion:
	docker build -f jobs/document-ingestion/Dockerfile -t document-ingestion:$(IMAGE_TAG) .

publish-document-ingestion: build-document-ingestion
	@if [ -z "$(ACR_NAME)" ]; then echo "Error: Could not get ACR name from Terraform. Run 'terraform apply' first or set ACR_NAME manually." && exit 1; fi
	az acr login --name $(ACR_NAME)
	docker tag document-ingestion:$(IMAGE_TAG) $(ACR_NAME).azurecr.io/document-ingestion:$(IMAGE_TAG)
	docker push $(ACR_NAME).azurecr.io/document-ingestion:$(IMAGE_TAG)

run-document-ingestion:
	cd jobs/document-ingestion/; uv run --env-file=.env main.py

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