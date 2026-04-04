#!/bin/bash

# This script safely deletes only the GridSpace-specific GCP resources

# Set the project ID
PROJECT_ID="your_project_id"

# Set resource names (update these with actual names)
CLOUD_RUN_SERVICE_NAME="your-cloud-run-service"
CLOUD_SQL_INSTANCE_NAME="your-cloud-sql-instance"
MEMORYSTORE_REDIS_NAME="your-memorystore-redis"
ARTIFACT_REGISTRY_REPO="your-artifact-repository"
VPC_CONNECTOR_NAME="your-vpc-connector"
SECRETS_NAME="your-secrets-name"

# Delete Cloud Run service
if gcloud run services delete $CLOUD_RUN_SERVICE_NAME --project=$PROJECT_ID --quiet; then
    echo "Deleted Cloud Run service: $CLOUD_RUN_SERVICE_NAME"
else
    echo "Failed to delete Cloud Run service: $CLOUD_RUN_SERVICE_NAME"
fi

# Delete Cloud SQL instance
if gcloud sql instances delete $CLOUD_SQL_INSTANCE_NAME --project=$PROJECT_ID --quiet; then
    echo "Deleted Cloud SQL instance: $CLOUD_SQL_INSTANCE_NAME"
else
    echo "Failed to delete Cloud SQL instance: $CLOUD_SQL_INSTANCE_NAME"
fi

# Delete Memorystore Redis
if gcloud redis instances delete $MEMORYSTORE_REDIS_NAME --project=$PROJECT_ID --quiet; then
    echo "Deleted Memorystore Redis instance: $MEMORYSTORE_REDIS_NAME"
else
    echo "Failed to delete Memorystore Redis instance: $MEMORYSTORE_REDIS_NAME"
fi

# Delete Artifact Registry repository
if gcloud artifacts repositories delete $ARTIFACT_REGISTRY_REPO --project=$PROJECT_ID --quiet; then
    echo "Deleted Artifact Registry repository: $ARTIFACT_REGISTRY_REPO"
else
    echo "Failed to delete Artifact Registry repository: $ARTIFACT_REGISTRY_REPO"
fi

# Delete VPC Connector
if gcloud compute networks vpc-access connectors delete $VPC_CONNECTOR_NAME --project=$PROJECT_ID --quiet; then
    echo "Deleted VPC Connector: $VPC_CONNECTOR_NAME"
else
    echo "Failed to delete VPC Connector: $VPC_CONNECTOR_NAME"
fi

# Delete Secrets
if gcloud secrets delete $SECRETS_NAME --project=$PROJECT_ID --quiet; then
    echo "Deleted Secrets: $SECRETS_NAME"
else
    echo "Failed to delete Secrets: $SECRETS_NAME"
fi

# End of script
