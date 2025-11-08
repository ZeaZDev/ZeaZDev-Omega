# GitHub Repository Setup Guide

This guide walks you through setting up the ZeaZDev-Omega GitHub repository with all necessary configurations, secrets, and workflows.

---

## 📋 Initial Repository Setup

### 1. Create Repository

```bash
# Via GitHub CLI
gh repo create ZeaZDev/ZeaZDev-Omega --public --description "ZeaZDev FiGaTect Super-App - Production-Grade DeFi, GameFi & FinTech Integration"

# Or via GitHub web interface
# https://github.com/new
```

### 2. Push Initial Code

```bash
git init
git add .
git commit -m "feat: initial Omega scaffolding"
git branch -M main
git remote add origin https://github.com/ZeaZDev/ZeaZDev-Omega.git
git push -u origin main
```

---

## 🔐 Repository Secrets

### Required Secrets

Navigate to: `Settings → Secrets and variables → Actions → New repository secret`

#### Blockchain Secrets
```
RPC_URL=https://mainnet.optimism.io
PRIVATE_KEY=0x...your_deployment_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Database Secrets
```
POSTGRES_USER=zeazdev
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=zeazdev
DATABASE_URL=postgresql://zeazdev:password@localhost:5432/zeazdev
REDIS_PASSWORD=redis_password_here
```

#### API Secrets
```
JWT_SECRET=your_jwt_secret_min_32_chars
WLD_APP_ID=app_your_worldcoin_app_id
WLD_ACTION_ID=your_action_id
WORLD_ID_VERIFIER_ADDRESS=0x...verifier_contract_address
```

#### FinTech Secrets
```
FINTECH_API_KEY=your_marqeta_or_stripe_key
MARQETA_API_KEY=your_marqeta_key
THAI_BANK_API_KEY=your_thai_bank_key
```

#### Deployment Secrets
```
VERCEL_TOKEN=your_vercel_token (if using Vercel)
DOCKER_USERNAME=your_docker_hub_username
DOCKER_PASSWORD=your_docker_hub_password
```

---

## 🌿 Branch Protection Rules

### Main Branch Protection

Navigate to: `Settings → Branches → Add branch protection rule`

**Branch name pattern**: `main`

**Protect matching branches**:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 2
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `build`
    - `test`
    - `lint`
    - `security-scan`
- ✅ Require conversation resolution before merging
- ✅ Require signed commits
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
  - Allow: Maintainers only

### Development Branch Protection

**Branch name pattern**: `develop`

**Protect matching branches**:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass before merging

---

## 🤖 GitHub Actions Workflows

### CI/CD Pipeline

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd packages/contracts && pnpm test

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd apps/backend && pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm audit --audit-level=moderate
```

### Deploy to Production

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy-contracts:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: pnpm install
      - run: cd packages/contracts && pnpm hardhat run scripts/deploy.ts --network optimism
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          RPC_URL: ${{ secrets.RPC_URL }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          push: true
          tags: zeazdev/backend:latest
```

---

## 👥 Team & Permissions

### Collaborator Roles

Navigate to: `Settings → Collaborators and teams`

**Recommended Structure**:
- **Maintainers** (Admin): 2-3 core developers
- **Developers** (Write): Active contributors
- **Reviewers** (Triage): Code reviewers
- **Community** (Read): Public access

### CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Global owners
* @ZeaZDev/maintainers

# Smart contracts require specialized review
/packages/contracts/ @ZeaZDev/blockchain-team

# Backend API
/apps/backend/ @ZeaZDev/backend-team

# Frontend
/apps/frontend-miniapp/ @ZeaZDev/frontend-team

# Documentation
*.md @ZeaZDev/docs-team
```

---

## 🏷️ Labels

### Issue Labels

Navigate to: `Issues → Labels`

**Priority**:
- `priority: critical` (red)
- `priority: high` (orange)
- `priority: medium` (yellow)
- `priority: low` (green)

**Type**:
- `type: bug` (red)
- `type: feature` (blue)
- `type: enhancement` (purple)
- `type: documentation` (gray)
- `type: security` (dark red)

**Component**:
- `component: contracts`
- `component: backend`
- `component: frontend`
- `component: game`
- `component: fintech`

**Status**:
- `status: needs-triage`
- `status: in-progress`
- `status: blocked`
- `status: ready-for-review`

---

## 📊 Project Boards

### Create Projects

Navigate to: `Projects → New project`

**1. Development Board**
- Columns: Backlog, Todo, In Progress, Review, Done
- Track: Features, Bugs, Enhancements

**2. Release Planning**
- Columns: Next Release, Future, Icebox
- Track: Roadmap items

---

## 🔔 Notifications & Webhooks

### Discord Integration (Optional)

1. Create Discord webhook
2. Go to `Settings → Webhooks → Add webhook`
3. Configure:
   - Payload URL: Discord webhook URL
   - Content type: `application/json`
   - Events: Select all or customize

### Slack Integration (Optional)

1. Install GitHub app in Slack
2. `/github subscribe ZeaZDev/ZeaZDev-Omega`
3. Configure notifications

---

## 📝 Templates

### Issue Template

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'type: bug, status: needs-triage'
assignees: ''
---

**Describe the bug**
A clear and concise description.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
```

### PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

---

## 🔒 Security

### Security Policy

Create `SECURITY.md`:

```markdown
# Security Policy

## Reporting a Vulnerability

**DO NOT** open public issues for security vulnerabilities.

Email: security@zeazdev.com

We will respond within 48 hours.
```

### Dependabot

Enable: `Settings → Security & analysis → Dependabot`

- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Dependabot version updates

---

## 📦 Releases

### Release Strategy

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

**Creating a Release**:

```bash
# 1. Update version in package.json
# 2. Create git tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. GitHub will auto-create release
# 4. Add release notes
```

**Release Notes Template**:
```markdown
## What's Changed
- Feature 1
- Feature 2
- Bug fixes

## Breaking Changes
- None

## Full Changelog
https://github.com/ZeaZDev/ZeaZDev-Omega/compare/v0.9.0...v1.0.0
```

---

## ✅ Setup Checklist

- [ ] Repository created
- [ ] Initial code pushed
- [ ] All secrets configured
- [ ] Branch protection enabled
- [ ] CI/CD workflows added
- [ ] Team members added
- [ ] CODEOWNERS file created
- [ ] Labels configured
- [ ] Project boards created
- [ ] Issue templates added
- [ ] PR template added
- [ ] Security policy added
- [ ] Dependabot enabled
- [ ] First release tagged

---

**Setup Complete!** Your ZeaZDev repository is now production-ready. 🚀

**Last Updated**: 2025-11-08
**Version**: 1.0.0
