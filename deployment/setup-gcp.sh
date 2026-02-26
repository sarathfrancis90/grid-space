#!/bin/bash
# ============================================
# GridSpace — GCP Infrastructure Setup Script
# Run ONCE to provision all cloud resources
# ============================================
# Usage: chmod +x setup-gcp.sh && ./setup-gcp.sh
# ============================================

set -euo pipefail

PROJECT_ID="sarath-personal-471604"
PROJECT_NUMBER="876802621972"
REGION="us-central1"
DB_PASSWORD="GridSpace2026!SecurePass"  # ⚠️ CHANGE THIS

echo "═══════════════════════════════════════════"
echo "  GridSpace GCP Setup"
echo "  Project: ${PROJECT_ID}"
echo "═══════════════════════════════════════════"

# ---- Set project ----
echo ""
echo "▶ Setting project..."
gcloud config set project ${PROJECT_ID}

# ---- Enable APIs ----
echo ""
echo "▶ Enabling APIs (this takes ~60 seconds)..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  servicenetworking.googleapis.com \
  compute.googleapis.com

# ---- Artifact Registry ----
echo ""
echo "▶ Creating Artifact Registry..."
gcloud artifacts repositories create gridspace \
  --repository-format=docker \
  --location=${REGION} \
  --description="GridSpace Docker images" \
  2>/dev/null || echo "  (already exists)"

# ---- VPC Connector ----
echo ""
echo "▶ Setting up VPC networking..."

# Allocate IP range for private services
gcloud compute addresses create google-managed-services \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default \
  2>/dev/null || echo "  (IP range already exists)"

# Create peering connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services \
  --network=default \
  2>/dev/null || echo "  (peering already exists)"

# Create VPC connector
gcloud compute networks vpc-access connectors create gridspace-connector \
  --region=${REGION} \
  --range=10.8.0.0/28 \
  2>/dev/null || echo "  (connector already exists)"

# ---- Cloud SQL (PostgreSQL) ----
echo ""
echo "▶ Creating Cloud SQL instance (this takes ~5 minutes)..."
gcloud sql instances create gridspace-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=zonal \
  --network=default \
  --no-assign-ip \
  2>/dev/null || echo "  (instance already exists)"

gcloud sql databases create gridspace --instance=gridspace-db \
  2>/dev/null || echo "  (database already exists)"

gcloud sql users set-password postgres \
  --instance=gridspace-db \
  --password="${DB_PASSWORD}"

DB_IP=$(gcloud sql instances describe gridspace-db --format="value(ipAddresses[0].ipAddress)")
echo "  Cloud SQL Private IP: ${DB_IP}"

# ---- Memorystore Redis ----
echo ""
echo "▶ Creating Memorystore Redis (this takes ~5 minutes)..."
gcloud redis instances create gridspace-redis \
  --size=1 \
  --region=${REGION} \
  --redis-version=redis_7_0 \
  --network=default \
  --tier=basic \
  2>/dev/null || echo "  (instance already exists)"

REDIS_IP=$(gcloud redis instances describe gridspace-redis --region=${REGION} --format="value(host)")
echo "  Redis IP: ${REDIS_IP}"

# ---- Secrets ----
echo ""
echo "▶ Creating secrets in Secret Manager..."

create_secret() {
  local name=$1
  local value=$2
  echo -n "${value}" | gcloud secrets create ${name} --data-file=- --replication-policy=automatic 2>/dev/null || \
  echo -n "${value}" | gcloud secrets versions add ${name} --data-file=- 2>/dev/null
  echo "  ✓ ${name}"
}

JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)

create_secret "jwt-secret" "${JWT_SECRET}"
create_secret "jwt-refresh-secret" "${JWT_REFRESH_SECRET}"
create_secret "database-url" "postgresql://postgres:${DB_PASSWORD}@${DB_IP}:5432/gridspace"
create_secret "redis-url" "redis://${REDIS_IP}:6379"

# ---- IAM Permissions ----
echo ""
echo "▶ Setting IAM permissions..."

for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="${ROLE}" \
    --quiet 2>/dev/null
  echo "  ✓ Cloud Build → ${ROLE}"
done

for ROLE in roles/secretmanager.secretAccessor roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="${ROLE}" \
    --quiet 2>/dev/null
  echo "  ✓ Cloud Run → ${ROLE}"
done

# ---- Summary ----
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ GCP Infrastructure Ready!"
echo "═══════════════════════════════════════════"
echo ""
echo "  Cloud SQL IP:  ${DB_IP}"
echo "  Redis IP:      ${REDIS_IP}"
echo "  Region:        ${REGION}"
echo ""
echo "  Next steps:"
echo "  1. Connect your GitHub repo to Cloud Build:"
echo "     → https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT_ID}"
echo "     → Connect Repository → GitHub → Select grid-space"
echo "     → Create Trigger: name=gridspace-deploy, branch=^main$, config=cloudbuild.yaml"
echo ""
echo "  2. Add these files to your repo:"
echo "     → Dockerfile"
echo "     → cloudbuild.yaml"
echo "     → .dockerignore"
echo ""
echo "  3. Push to main → auto-deploy starts!"
echo ""
echo "  4. Get your app URL after first deploy:"
echo "     gcloud run services describe gridspace --region=${REGION} --format='value(status.url)'"
echo ""
