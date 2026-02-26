# GridSpace — GCP Cloud Run Auto-Deploy Setup

> **Project ID:** `sarath-personal-471604`
> **Project Number:** `876802621972`
> Every push to `main` auto-deploys the full app to Cloud Run.

## Architecture

```
GitHub (push to main)
        │
        ▼
Cloud Build (trigger)
        │
        ├── Build Docker image
        ├── Push to Artifact Registry
        └── Deploy to Cloud Run
                │
                ├── Frontend (Vite static served by Express)
                ├── Backend (Express API + Socket.io)
                │
                ├── Cloud SQL (PostgreSQL 16)
                ├── Memorystore (Redis 7)
                └── Cloud Run URL: https://gridspace-xxx.run.app
```

## One-Time GCP Setup (Run These Commands Once)

### Step 0: Install & Auth

```bash
# Install gcloud CLI if not already
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud config set project sarath-personal-471604
```

### Step 1: Enable Required APIs

```bash
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
```

### Step 2: Create Artifact Registry (Docker image storage)

```bash
gcloud artifacts repositories create gridspace \
  --repository-format=docker \
  --location=us-central1 \
  --description="GridSpace Docker images"
```

### Step 3: Create VPC Connector (Cloud Run ↔ Redis/SQL private network)

```bash
# First, allocate an IP range for private services
gcloud compute addresses create google-managed-services \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --network=default

# Create the private connection
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services \
  --network=default

# Create the VPC connector
gcloud compute networks vpc-access connectors create gridspace-connector \
  --region=us-central1 \
  --range=10.8.0.0/28
```

### Step 4: Create Cloud SQL (PostgreSQL)

```bash
# Create instance (db-f1-micro is cheapest — upgrade later for production)
gcloud sql instances create gridspace-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-auto-increase \
  --availability-type=zonal \
  --network=default \
  --no-assign-ip

# Create database
gcloud sql databases create gridspace --instance=gridspace-db

# Set password (change this!)
gcloud sql users set-password postgres \
  --instance=gridspace-db \
  --password="GridSpace2026!SecurePass"
```

Get the private IP (you'll need it):

```bash
gcloud sql instances describe gridspace-db --format="value(ipAddresses[0].ipAddress)"
# Example output: 10.XX.XX.XX — save this
```

### Step 5: Create Memorystore Redis

```bash
gcloud redis instances create gridspace-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --network=default \
  --tier=basic
```

Get the Redis IP:

```bash
gcloud redis instances describe gridspace-redis --region=us-central1 --format="value(host)"
# Example output: 10.XX.XX.XX — save this
```

### Step 6: Store Secrets in Secret Manager

```bash
# JWT Secret (generate a random one)
echo -n "$(openssl rand -base64 48)" | \
  gcloud secrets create jwt-secret --data-file=- --replication-policy=automatic

# JWT Refresh Secret
echo -n "$(openssl rand -base64 48)" | \
  gcloud secrets create jwt-refresh-secret --data-file=- --replication-policy=automatic

# Database URL (replace 10.XX.XX.XX with your Cloud SQL private IP)
echo -n "postgresql://postgres:GridSpace2026!SecurePass@10.XX.XX.XX:5432/gridspace" | \
  gcloud secrets create database-url --data-file=- --replication-policy=automatic

# Redis URL (replace 10.XX.XX.XX with your Memorystore IP)
echo -n "redis://10.XX.XX.XX:6379" | \
  gcloud secrets create redis-url --data-file=- --replication-policy=automatic

# Google OAuth (add these when you have credentials)
# echo -n "your-google-client-id" | gcloud secrets create google-client-id --data-file=-
# echo -n "your-google-client-secret" | gcloud secrets create google-client-secret --data-file=-

# GitHub OAuth
# echo -n "your-github-client-id" | gcloud secrets create github-client-id --data-file=-
# echo -n "your-github-client-secret" | gcloud secrets create github-client-secret --data-file=-
```

### Step 7: Grant Permissions to Cloud Build & Cloud Run

```bash
PROJECT_NUMBER=876802621972

# Cloud Build service account needs these roles:
gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run service account needs secret access:
gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding sarath-personal-471604 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Step 8: Connect GitHub Repo to Cloud Build

```bash
# This opens a browser to authorize GitHub:
gcloud builds triggers create github \
  --name="gridspace-deploy" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --repo-name="grid-space" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-central1
```

**OR do it in the Console (easier for first time):**

1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=sarath-personal-471604
2. Click "Connect Repository" → GitHub → Authorize → Select `grid-space` repo
3. Click "Create Trigger":
   - Name: `gridspace-deploy`
   - Event: Push to branch
   - Branch: `^main$`
   - Configuration: Cloud Build config file → `cloudbuild.yaml`
4. Save

### Step 9: First Deploy (manual — to initialize Cloud Run service)

After adding all config files to your repo (see below), run:

```bash
gcloud builds submit --config=cloudbuild.yaml --region=us-central1
```

### Step 10: Run Initial Database Migration

```bash
# Get the Cloud Run URL
gcloud run services describe gridspace --region=us-central1 --format="value(status.url)"

# SSH into a temporary Cloud Build to run migrations
# (or add migration step to cloudbuild.yaml — already included below)
```

---

## Files to Add to Your Repo

Copy these files into your `grid-space/` repository root. All files are provided below.

### File List:

```
grid-space/
├── Dockerfile                 ← Multi-stage build (client + server)
├── cloudbuild.yaml            ← Cloud Build pipeline
├── .dockerignore              ← Exclude unnecessary files
├── packages/
│   ├── client/
│   │   └── vite.config.ts     ← Update API proxy for production
│   └── server/
│       └── src/
│           └── app.ts         ← Serve static frontend in production
└── nginx.conf                 ← (not needed — Express serves everything)
```

---

## Accessing Your App

After first deploy:

```bash
# Get the URL
gcloud run services describe gridspace --region=us-central1 --format="value(status.url)"
# → https://gridspace-XXXXX-uc.a.run.app

# Map a custom domain (optional)
gcloud run domain-mappings create \
  --service=gridspace \
  --domain=gridspace.yourdomain.com \
  --region=us-central1
```

## Cost Estimates (USD/month)

| Service           | Config                    | Est. Cost         |
| ----------------- | ------------------------- | ----------------- |
| Cloud Run         | 1 instance, 1 vCPU, 512MB | ~$5-15            |
| Cloud SQL         | db-f1-micro               | ~$8               |
| Memorystore Redis | 1GB Basic                 | ~$35              |
| Artifact Registry | < 1GB                     | ~$0.10            |
| Cloud Build       | 120 min free/day          | $0                |
| **Total**         |                           | **~$48-58/month** |

💡 **Cost tip:** Memorystore is the biggest cost. For early development, you can skip Redis and use in-memory Socket.io adapter (single instance only). Add Redis when you need multi-instance scaling.

## Monitoring & Logs

```bash
# View Cloud Run logs
gcloud run services logs read gridspace --region=us-central1 --limit=50

# Stream logs live
gcloud run services logs tail gridspace --region=us-central1

# View in Console
# https://console.cloud.google.com/run/detail/us-central1/gridspace/logs?project=sarath-personal-471604
```

## Troubleshooting

| Issue                            | Fix                                                        |
| -------------------------------- | ---------------------------------------------------------- |
| Build fails on `prisma generate` | Ensure `prisma` is in `dependencies` not `devDependencies` |
| WebSocket won't connect          | Check Cloud Run session affinity is ON                     |
| Database connection refused      | Check VPC connector + Cloud SQL private IP                 |
| Redis connection refused         | Check VPC connector + Memorystore IP                       |
| Cold start slow                  | Set `--min-instances=1` (costs more)                       |
| 502 errors                       | Check Cloud Run logs — usually app crash on startup        |
