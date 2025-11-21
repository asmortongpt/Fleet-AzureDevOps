# Docker Base Image Versions

This document tracks all Docker base images used in this project. All images are pinned to specific versions with SHA256 digests to prevent supply chain attacks.

## Why Pin Images?

Using `:latest` or unpinned image tags creates security vulnerabilities:
- **Supply chain attacks**: Attackers can push malicious images that get pulled automatically
- **Non-reproducible builds**: Different builds may use different image versions
- **Breaking changes**: Automatic updates can introduce breaking changes in production
- **Audit compliance**: SOC2, FedRAMP, and other frameworks require pinned dependencies

## Current Base Images

| Image | Version | SHA256 Digest | Last Updated | Update Command |
|-------|---------|---------------|--------------|----------------|
| node | 20-alpine | `sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435` | 2025-11-21 | `docker pull node:20-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine` |
| postgres | 15-alpine | `sha256:aa7b1ef595e165f0b780162e3a41edd0a7ed3ea672eb8a0f81615ba725e62bc5` | 2025-11-21 | `docker pull postgres:15-alpine && docker inspect --format='{{index .RepoDigests 0}}' postgres:15-alpine` |
| redis | 7-alpine | `sha256:ee64a64eaab618d88051c3ade8f6352d11531fcf79d9a4818b9b183d8c1d18ba` | 2025-11-21 | `docker pull redis:7-alpine && docker inspect --format='{{index .RepoDigests 0}}' redis:7-alpine` |

## Custom ACR Images

Custom images built by CI/CD use semantic versioning tags (e.g., `v1.0.0`) instead of `:latest`:

| Image | Registry | Current Version |
|-------|----------|-----------------|
| fleet-frontend | fleetappregistry.azurecr.io | v1.0.0 |
| fleet-test-orchestrator | fleetappregistry.azurecr.io | v1.0.0 |
| fleet-rag-indexer | fleetappregistry.azurecr.io | v1.0.0 |
| fleet-playwright-runner | fleetappregistry.azurecr.io | v1.0.0 |

## Files Using These Images

### node:20-alpine
- `/api/Dockerfile` (builder and production stages)
- `/api/Dockerfile.production`
- `/api/api/Dockerfile.production` (builder and production stages)

### postgres:15-alpine
- `/api/arcgis-migration-job.yaml`
- `/k8s/postgres-deployment.yaml`

### redis:7-alpine
- `/k8s/redis-deployment.yaml`

### Custom ACR Images
- `/k8s/frontend-deployment.yaml` (fleet-frontend)
- `/k8s/python-services-deployment.yaml` (test-orchestrator, rag-indexer, playwright-runner)

## Updating Base Images

### Step 1: Pull and Get New Digest
```bash
# For Node.js
docker pull node:20-alpine
docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine

# For PostgreSQL
docker pull postgres:15-alpine
docker inspect --format='{{index .RepoDigests 0}}' postgres:15-alpine
```

### Step 2: Update Dockerfiles
Replace the old digest with the new one in all relevant files.

### Step 3: Test Builds
```bash
# Build and test locally
docker build -t fleet-api:test .
docker run --rm fleet-api:test npm test
```

### Step 4: Update This Document
Update the table above with:
- New SHA256 digest
- Updated date
- Any version changes

### Step 5: Commit Changes
```bash
git add Dockerfile* arcgis-migration-job.yaml docs/DOCKER_BASE_IMAGE_VERSIONS.md
git commit -m "chore(security): update Docker base image digests to latest versions"
```

## Security Scanning

We recommend scanning base images for vulnerabilities before updating:

```bash
# Using Trivy (recommended)
trivy image node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435

# Using Docker Scout
docker scout cves node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435
```

## Update Schedule

Base images should be reviewed and updated:
- **Monthly**: Check for security patches
- **Quarterly**: Evaluate minor version updates
- **Annually**: Evaluate major version updates

## CI/CD Integration

The CI pipeline includes a check that fails if any `:latest` tags are detected:
- See `scripts/check-docker-tags.sh`
- This runs on every pull request

## References

- [Docker Image Digests](https://docs.docker.com/engine/reference/commandline/images/#digests)
- [Container Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [NIST Container Security Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf)
