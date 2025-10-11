# GitHub Workflows Setup

Due to GitHub security restrictions, workflow files cannot be created automatically via API. Please follow these steps to set up the CI/CD pipeline:

## 🔧 Manual Setup Required

### Step 1: Create Workflow Directory
In your GitHub repository, create the following directory structure:
```
.github/
└── workflows/
```

### Step 2: Copy Workflow Files
Copy the following files from `docs/github-workflows/` to `.github/workflows/`:

1. **`ci.yml`** - Main CI/CD pipeline for testing, building, and staging deployment
2. **`deploy-production.yml`** - Production deployment workflow with blue-green strategy

### Step 3: Configure Repository Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Required Secrets
```
KUBE_CONFIG_STAGING=<base64-encoded-kubeconfig-for-staging>
KUBE_CONFIG_PRODUCTION=<base64-encoded-kubeconfig-for-production>
PROD_DATABASE_URL=postgresql://user:pass@host:port/database
```

#### Optional Secrets (for enhanced features)
```
CODECOV_TOKEN=<codecov-token-for-coverage-reports>
SLACK_WEBHOOK_URL=<slack-webhook-for-notifications>
```

### Step 4: Enable GitHub Container Registry
1. Go to your GitHub profile → Settings → Developer settings → Personal access tokens
2. Create a token with `write:packages` permission
3. The workflows will automatically use `GITHUB_TOKEN` for registry access

### Step 5: Set Up Environments
1. Go to your repository → Settings → Environments
2. Create two environments:
   - **staging** - For staging deployments
   - **production** - For production deployments (add required reviewers)

### Step 6: Configure Branch Protection
1. Go to Settings → Branches
2. Add protection rules for `master` and `develop` branches:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators in restrictions

## 🚀 Usage

### Automatic Triggers
- **Push to `develop`**: Runs full CI pipeline + staging deployment
- **Push to `master`**: Runs full CI pipeline + builds images
- **Pull Request**: Runs tests and security scans only
- **Git Tag `v*`**: Triggers production deployment

### Manual Triggers
- Go to Actions tab → Select "Production Deployment" → "Run workflow"
- Specify version to deploy

### Monitoring
- **Actions Tab**: View all workflow runs
- **Security Tab**: View security scan results
- **Packages**: View built Docker images

## 📊 Pipeline Status

Once set up, you'll have:
- ✅ Automated testing across Node.js 18.x and 20.x
- ✅ Security scanning with Trivy and npm audit
- ✅ Docker image building and registry push
- ✅ Automated staging deployment
- ✅ Performance testing with k6
- ✅ Production deployment with blue-green strategy
- ✅ Automatic rollback on failure

## 🔍 Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure `GITHUB_TOKEN` has package write permissions
2. **Kubernetes Connection**: Verify `KUBE_CONFIG_*` secrets are valid base64
3. **Database Connection**: Check `PROD_DATABASE_URL` format and credentials

### Getting Help
- Check the [CI/CD Setup Documentation](../cicd-setup.md)
- Review workflow logs in the Actions tab
- Contact DevOps team for Kubernetes access

---

**Note**: After copying the workflow files to `.github/workflows/`, commit and push them to activate the CI/CD pipeline.
