.PHONY: build-document-ingestion publish-document-ingestion run-document-ingestion

ACR_NAME ?= $(shell cd infrastructure && terraform output -raw container_registry_name 2>/dev/null)
IMAGE_TAG ?= latest

build-document-ingestion:
	docker build -f jobs/document-ingestion/Dockerfile -t document-ingestion:$(IMAGE_TAG) .

publish-document-ingestion: build-document-ingestion
	@if [ -z "$(ACR_NAME)" ]; then echo "Error: Could not get ACR name from Terraform. Run 'terraform apply' first or set ACR_NAME manually." && exit 1; fi
	az acr login --name $(ACR_NAME)
	docker tag document-ingestion:$(IMAGE_TAG) $(ACR_NAME).azurecr.io/document-ingestion:$(IMAGE_TAG)
	docker push $(ACR_NAME).azurecr.io/document-ingestion:$(IMAGE_TAG)

run-document-ingestion:
	cd jobs/document-ingestion/; uv run --env-file=.env main.py