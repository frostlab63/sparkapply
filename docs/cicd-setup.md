# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline implemented for the SparkApply platform.

## 🏗️ Pipeline Overview

The CI/CD pipeline is built using GitHub Actions and consists of two main workflows:

1. **CI Pipeline** (`ci.yml`) - Automated testing, security scanning, and building
2. **Production Deployment** (`deploy-production.yml`) - Production deployment with blue-green strategy

## 🔄 CI Pipeline (`ci.yml`)

### Triggers
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop` branches

### Jobs

#### 1. Test & Code Quality
- **Matrix Strategy**: Tests across Node.js 18.x and 20.x for all services
- **Services**: PostgreSQL 15 and Redis 7 for testing
- **Coverage**: Uploads coverage reports to Codecov
- **Linting**: Runs ESLint on all services

#### 2. Security Scanning
- **Trivy**: Vulnerability scanning for filesystem and dependencies
- **npm audit**: Security audit for all packages
- **SARIF Upload**: Security results uploaded to GitHub Security tab

#### 3. Build Docker Images
- **Multi-service**: Builds images for user-service, job-service, application-service, and web
- **Registry**: Pushes to GitHub Container Registry (ghcr.io)
- **Caching**: Uses GitHub Actions cache for faster builds
- **Tagging**: Automatic tagging based on branch and commit SHA

#### 4. Deploy to Staging
- **Trigger**: Only on `develop` branch pushes
- **Environment**: Uses GitHub Environments for approval gates
- **Kubernetes**: Deploys to staging cluster using kubectl
- **Health Checks**: Validates deployment success

#### 5. Performance Testing
- **Tool**: k6 for load testing
- **Scope**: Tests critical endpoints and user flows
- **Artifacts**: Uploads performance results

#### 6. Notifications
- **Success/Failure**: Notifies on pipeline completion
- **Slack Integration**: (Optional) Can be configured for team notifications

## 🚀 Production Deployment (`deploy-production.yml`)

### Triggers
- Git tags matching `v*` pattern
- Manual workflow dispatch with version input

### Jobs

#### 1. Pre-deployment Checks
- **File Validation**: Ensures all required deployment files exist
- **Image Availability**: Verifies Docker images are built and available
- **Dependency Check**: Validates all prerequisites

#### 2. Database Migration
- **Environment**: Production database
- **Safety**: Runs migrations before deployment
- **Rollback**: Can be rolled back if issues occur

#### 3. Blue-Green Deployment
- **Strategy**: Zero-downtime deployment using Kubernetes
- **Rollout**: Gradual rollout with health checks
- **Load Balancer**: Updates ingress configuration
- **Monitoring**: Continuous health monitoring

#### 4. Smoke Tests
- **Critical Paths**: Tests essential user journeys
- **API Validation**: Verifies all endpoints are responding
- **User Flow**: Tests registration and authentication

#### 5. Performance Validation
- **Production Load**: Lightweight performance testing
- **Thresholds**: Validates response times and error rates
- **Monitoring**: Integrates with production monitoring

#### 6. Rollback on Failure
- **Automatic**: Triggers on any job failure
- **Fast Recovery**: Quick rollback to previous version
- **Notification**: Alerts team of rollback

#### 7. Post-deployment
- **Status Update**: Records successful deployment
- **Stakeholder Notification**: Notifies relevant parties
- **Monitoring**: Enables enhanced monitoring

## 🔧 Configuration

### Required Secrets

#### GitHub Repository Secrets
```bash
# Kubernetes Configuration
KUBE_CONFIG_STAGING=<base64-encoded-kubeconfig>
KUBE_CONFIG_PRODUCTION=<base64-encoded-kubeconfig>

# Database
PROD_DATABASE_URL=postgresql://user:pass@host:port/db

# Container Registry (automatically provided by GitHub)
GITHUB_TOKEN=<automatically-provided>
```

#### Kubernetes Secrets
```yaml
# In sparkapply-prod namespace
apiVersion: v1
kind: Secret
metadata:
  name: sparkapply-secrets
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  jwt-secret: <base64-encoded-jwt-secret>
  jwt-refresh-secret: <base64-encoded-jwt-refresh-secret>
```

### Environment Configuration

#### Staging Environment
- **Namespace**: `sparkapply-staging`
- **Domain**: `staging.sparkapply.com`
- **Database**: Separate staging database
- **Monitoring**: Enhanced logging and debugging

#### Production Environment
- **Namespace**: `sparkapply-prod`
- **Domain**: `sparkapply.com`
- **Database**: Production database with backups
- **Monitoring**: Full monitoring and alerting

## 📊 Performance Testing

### Staging Tests (`performance-test.js`)
- **Load**: 10-20 concurrent users
- **Duration**: 16 minutes total
- **Scenarios**: Full user journey testing
- **Thresholds**: 95% requests < 500ms, <10% error rate

### Production Tests (`production-performance-test.js`)
- **Load**: 5-10 concurrent users
- **Duration**: 5 minutes total
- **Scenarios**: Critical path validation
- **Thresholds**: 95% requests < 1000ms, <5% error rate

## 🏗️ Kubernetes Deployment

### Services
- **user-service**: 3 replicas, auto-scaling 3-10
- **job-service**: 2 replicas, auto-scaling 2-8
- **application-service**: 2 replicas, auto-scaling 2-6
- **web**: 3 replicas, auto-scaling 3-12

### Resources
- **CPU**: Conservative requests with burst limits
- **Memory**: Optimized for each service type
- **Storage**: Persistent volumes for uploads

### Health Checks
- **Liveness**: Ensures pods are running
- **Readiness**: Ensures pods are ready for traffic
- **Startup**: Handles slow-starting services

## 🔒 Security

### Container Security
- **Base Images**: Official Alpine Linux images
- **Non-root**: All containers run as non-root users
- **Scanning**: Trivy vulnerability scanning
- **Updates**: Regular base image updates

### Network Security
- **Network Policies**: Restrict inter-pod communication
- **TLS**: End-to-end encryption with Let's Encrypt
- **Rate Limiting**: Nginx-based rate limiting
- **CORS**: Proper CORS configuration

### Secrets Management
- **Kubernetes Secrets**: Encrypted at rest
- **Environment Variables**: No secrets in environment
- **Rotation**: Regular secret rotation procedures

## 📈 Monitoring and Alerting

### Metrics
- **Application**: Custom metrics from each service
- **Infrastructure**: Kubernetes cluster metrics
- **Performance**: Response times and error rates
- **Business**: User engagement and conversion

### Alerting
- **Critical**: Immediate notification for outages
- **Warning**: Early warning for degraded performance
- **Info**: Deployment and maintenance notifications

### Dashboards
- **Operations**: Real-time system health
- **Business**: User metrics and KPIs
- **Performance**: Response times and throughput

## 🚀 Deployment Process

### Development to Staging
1. **Push to develop**: Triggers CI pipeline
2. **Tests Pass**: All tests and security scans pass
3. **Build Images**: Docker images built and pushed
4. **Deploy Staging**: Automatic deployment to staging
5. **Performance Test**: Automated performance validation
6. **Manual Testing**: QA team validates features

### Staging to Production
1. **Create Tag**: `git tag v1.0.0 && git push origin v1.0.0`
2. **Pre-deployment**: Validation and checks
3. **Database Migration**: Safe schema updates
4. **Blue-Green Deploy**: Zero-downtime deployment
5. **Smoke Tests**: Critical path validation
6. **Performance Check**: Production performance validation
7. **Go Live**: Traffic switched to new version

### Rollback Process
1. **Detection**: Automated or manual issue detection
2. **Trigger**: Rollback workflow triggered
3. **Database**: Database rollback if needed
4. **Application**: Kubernetes rollback to previous version
5. **Validation**: Verify rollback success
6. **Notification**: Alert team of rollback completion

## 🛠️ Maintenance

### Regular Tasks
- **Dependency Updates**: Weekly dependency updates
- **Security Patches**: Immediate security patch deployment
- **Performance Review**: Monthly performance analysis
- **Cost Optimization**: Quarterly resource optimization

### Disaster Recovery
- **Database Backups**: Daily automated backups
- **Configuration Backup**: Infrastructure as code
- **Recovery Testing**: Monthly disaster recovery tests
- **Documentation**: Updated recovery procedures

## 📚 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
gh run list --workflow=ci.yml
gh run view <run-id>

# Local debugging
docker build -t test packages/api/user-service
```

#### Deployment Failures
```bash
# Check deployment status
kubectl get deployments -n sparkapply-prod
kubectl describe deployment user-service -n sparkapply-prod

# Check pod logs
kubectl logs -l app=user-service -n sparkapply-prod
```

#### Performance Issues
```bash
# Run local performance test
k6 run scripts/performance-test.js

# Check metrics
kubectl top pods -n sparkapply-prod
```

### Support Contacts
- **DevOps Team**: devops@sparkapply.com
- **On-call**: +1-555-DEVOPS
- **Slack**: #sparkapply-devops

---

This CI/CD pipeline provides a robust, secure, and scalable deployment process for the SparkApply platform, ensuring high availability and rapid, safe deployments.
