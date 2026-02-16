# CI/CD Pipeline — My Cart App

> **Interview-Ready Guide**: This document explains the complete CI/CD pipeline,
> the concepts behind it, and common interview questions with answers.

---

## 📋 Table of Contents

1. [What is CI/CD?](#what-is-cicd)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Pipeline Stages in Detail](#pipeline-stages-in-detail)
4. [GitHub Actions Concepts](#github-actions-concepts)
5. [Secrets Management](#secrets-management)
6. [Branching Strategy & Workflows](#branching-strategy--workflows)
7. [How Deployment Works](#how-deployment-works)
8. [Interview Q&A](#interview-qa)
9. [Pipeline Flowchart](#pipeline-flowchart)

---

## What is CI/CD?

### CI — Continuous Integration
Automatically **building and testing** code every time a developer pushes changes.
Catches bugs early, ensures code compiles, and validates against linting rules.

### CD — Continuous Delivery / Deployment
Automatically **deploying** the built application to staging or production.
- **Continuous Delivery** = code is always *ready* to deploy (manual trigger)
- **Continuous Deployment** = code is *automatically* deployed on every merge to main

**Our pipeline uses Continuous Deployment** — every push to `main` auto-deploys to Netlify.

---

## Pipeline Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│   INSTALL   │────▶│    LINT      │────▶│             │────▶│                  │
│   (npm ci)  │     │ (ng lint)   │     │   BUILD     │     │   DEPLOY PROD    │
│             │────▶│             │────▶│ (ng build)  │────▶│   (Netlify)      │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────────────┘
                          │                    │                      │
                          │                    │              ┌──────────────────┐
                          │                    │              │  DEPLOY PREVIEW  │
                          │                    └─────────────▶│  (PR only)       │
                          │                                   └──────────────────┘
                          │
                     ❌ Fails? → Pipeline stops, no deploy happens
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **Lint & Build run in parallel** | Both depend only on `install`, saves ~1 min of total time |
| **Separate preview/prod deploys** | PRs get preview URLs, only `main` goes to production |
| **`npm ci` instead of `npm install`** | Deterministic installs from lockfile, faster, CI best practice |
| **Build artifacts passed via `upload-artifact`** | Build once, deploy anywhere — don't rebuild for deploy |
| **Concurrency groups** | Cancels old runs if a new push comes in on the same branch |

---

## Pipeline Stages in Detail

### Stage 1: 📦 Install Dependencies
```yaml
- name: Install dependencies
  run: npm ci
```
- **`npm ci`** vs **`npm install`**: `ci` does a clean install from `package-lock.json` exactly, doesn't modify the lockfile. Ideal for CI environments.
- **Caching**: We cache `node_modules` keyed by `package-lock.json` hash. If dependencies don't change, the next run skips installation entirely.

### Stage 2: 🔍 Lint
```yaml
- name: Run lint
  run: npm run lint
```
- Uses **Angular ESLint** (`@angular-eslint/schematics`)
- Catches: unused imports, code style issues, template errors
- Configured in `eslint.config.js` with project-specific rules
- **Warnings don't fail the build**, only errors do

### Stage 3: 🏗️ Build
```yaml
- name: Build production bundle
  run: npm run build -- --configuration=production
```
- Angular production build: tree-shaking, AOT compilation, minification
- Output saved as a **GitHub Actions artifact** (`dist/my-cart/browser`)
- Artifact is downloaded by the deploy stage — **build once, deploy once**

### Stage 4: 🚀 Deploy
Two deployment targets:

| Trigger | Deploy Type | URL |
|---------|------------|-----|
| Push to `main` | **Production** | https://my-cart-app-sandesh.netlify.app |
| Pull Request | **Preview** | Auto-generated unique URL per PR |

---

## GitHub Actions Concepts

### Workflow File
```
.github/workflows/ci-cd.yml
```
GitHub automatically detects any YAML file in `.github/workflows/` and runs it.

### Key Concepts

| Concept | What it means |
|---------|---------------|
| **Workflow** | The entire YAML file — a set of jobs triggered by events |
| **Event/Trigger** | What starts the workflow (`push`, `pull_request`, `schedule`, `workflow_dispatch`) |
| **Job** | A set of steps that run on the same runner (VM). Jobs run in parallel by default |
| **Step** | A single command or action within a job |
| **Runner** | The VM that executes the job (`ubuntu-latest`, `macos-latest`, `windows-latest`) |
| **Action** | A reusable unit of code (e.g., `actions/checkout@v4`) |
| **Artifact** | Files saved between jobs (e.g., build output) |
| **Secret** | Encrypted variables (e.g., API tokens) stored in repo settings |
| **Environment** | Named deployment target with protection rules |
| **Concurrency** | Controls parallel execution — can cancel old runs |

### Our Events
```yaml
on:
  push:
    branches: [main]       # Triggers on push to main
  pull_request:
    branches: [main]       # Triggers on PR targeting main
```

### Job Dependencies
```yaml
jobs:
  install: ...              # Runs first
  lint:
    needs: install          # Waits for install
  build:
    needs: install          # Runs in parallel with lint (both need install)
  deploy-production:
    needs: [lint, build]    # Waits for BOTH lint and build
```

---

## Secrets Management

### What are Secrets?
Encrypted environment variables stored in GitHub repository settings. They are:
- **Never exposed** in logs (auto-masked)
- **Not available** to forks (security)
- Accessed via `${{ secrets.SECRET_NAME }}`

### Our Secrets

| Secret | Purpose | Where it comes from |
|--------|---------|---------------------|
| `NETLIFY_AUTH_TOKEN` | Authenticates with Netlify API | Netlify CLI config / Personal Access Token |
| `NETLIFY_SITE_ID` | Identifies which Netlify site to deploy to | `.netlify/state.json` |

### How to Set Secrets
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```
Or via CLI:
```bash
gh secret set NETLIFY_AUTH_TOKEN --body "your-token-here"
```

---

## Branching Strategy & Workflows

### Recommended Git Flow for this project

```
main (production)
  │
  ├── feature/add-wishlist
  │     └── PR → main (triggers preview deploy + lint + build)
  │           └── Merge → main (triggers production deploy)
  │
  ├── fix/cart-bug
  │     └── PR → main
  │           └── Merge → main
  │
  └── refactor/ngrx-signals
        └── PR → main
              └── Merge → main
```

### How to Test a Feature Branch

```bash
# Create feature branch
git checkout -b feature/add-wishlist

# Make changes, commit
git add -A && git commit -m "feat: add wishlist feature"

# Push and create PR
git push -u origin feature/add-wishlist
gh pr create --title "feat: add wishlist" --body "Adds wishlist functionality"
```

This automatically:
1. ✅ Runs lint
2. ✅ Runs build
3. ✅ Deploys a **preview URL** as a PR comment
4. ✅ On merge → deploys to **production**

---

## How Deployment Works

### Netlify Configuration (`netlify.toml`)

```toml
[build]
  publish = "dist/my-cart/browser"     # What folder to deploy
  command = "npm run build ..."         # Build command (used if Netlify builds)

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200                          # SPA fallback — all routes → index.html

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"  # Cache JS forever (hashed filenames)
```

### Deploy Flow
```
GitHub Push → GitHub Actions → Build Angular → Upload Artifact
                                                    │
                                              Download Artifact
                                                    │
                                              Netlify API Deploy
                                                    │
                                              ✅ Live at production URL
```

---

## Interview Q&A

### Basic Questions

**Q: What is CI/CD and why do we use it?**
> CI (Continuous Integration) automatically builds and tests code on every commit.
> CD (Continuous Deployment) automatically deploys successful builds.
> Benefits: catches bugs early, ensures consistency, eliminates manual deploy errors,
> enables fast iteration with confidence.

**Q: What's the difference between `npm install` and `npm ci`?**
> `npm install` reads `package.json`, resolves versions, may update `package-lock.json`.
> `npm ci` does a clean install strictly from `package-lock.json`, is faster, and
> never modifies the lockfile — making it deterministic and ideal for CI.

**Q: Why do you cache `node_modules`?**
> Installing dependencies from npm takes 30-60 seconds. By caching `node_modules`
> keyed on `package-lock.json` hash, subsequent runs reuse cached modules when
> dependencies haven't changed, cutting pipeline time significantly.

**Q: What happens if the lint stage fails?**
> The deploy stage has `needs: [lint, build]`, so if lint fails, the deploy job
> never runs. The build may still run (since lint and build are parallel), but
> deployment is blocked. This is a **quality gate**.

### Intermediate Questions

**Q: Explain the difference between Continuous Delivery and Continuous Deployment.**
> Continuous Delivery: Code is always in a deployable state, but deployment requires
> manual approval (e.g., a "Deploy" button).
> Continuous Deployment: Every commit that passes all stages is automatically deployed
> to production. Our pipeline uses Continuous Deployment — push to main = live.

**Q: What are GitHub Actions artifacts and why do you use them?**
> Artifacts are files persisted between jobs in a workflow. Each job runs on a
> fresh VM, so the build output from the "build" job isn't available in the "deploy" job.
> We upload the `dist/` folder as an artifact after building, then download it
> in the deploy job. This ensures we **build once and deploy the exact same output**.

**Q: What is the concurrency setting in your pipeline?**
> ```yaml
> concurrency:
>   group: ${{ github.workflow }}-${{ github.ref }}
>   cancel-in-progress: true
> ```
> If I push commit A, then quickly push commit B on the same branch, the pipeline
> for commit A is **automatically cancelled** and only commit B runs. This saves
> runner minutes and avoids deploying an outdated build.

**Q: How do you handle secrets in CI/CD?**
> Secrets are stored as encrypted variables in GitHub repository settings. They're:
> - Never printed in logs (auto-masked)
> - Not available in forked PRs (prevents token theft)
> - Injected as environment variables at runtime via `${{ secrets.NAME }}`
> - In our case: `NETLIFY_AUTH_TOKEN` (auth) and `NETLIFY_SITE_ID` (target site)

**Q: What is a preview deployment?**
> When someone opens a PR, the CI/CD pipeline deploys the PR's code to a unique,
> temporary URL. Reviewers can test the changes in a real environment before merging.
> This is configured with `production-deploy: false` in our Netlify action.

### Advanced Questions

**Q: How would you add environment-specific configurations?**
> Angular supports environment files (`environment.ts`, `environment.prod.ts`).
> In the CI workflow, I'd use `fileReplacements` in `angular.json` or inject
> environment variables at build time:
> ```yaml
> env:
>   FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
> ```
> For sensitive values, store them as GitHub Secrets and inject during build.

**Q: How would you add tests to this pipeline?**
> Add a `test` job parallel to lint:
> ```yaml
> test:
>   needs: install
>   steps:
>     - run: npm run test -- --no-watch --browsers=ChromeHeadless --code-coverage
>   ```
> Then add `test` to deploy's `needs: [lint, build, test]`.
> Use `ChromeHeadless` since CI has no display. Upload coverage as an artifact.

**Q: How would you implement a rollback strategy?**
> Multiple approaches:
> 1. **Git revert**: `git revert HEAD && git push` → triggers new deploy of previous state
> 2. **Netlify rollback**: Netlify keeps all deploy history, one-click rollback in dashboard
> 3. **GitHub Actions re-run**: Re-run the last successful workflow
> 4. **Blue/Green**: Maintain two environments, switch traffic via DNS

**Q: What is a quality gate?**
> A checkpoint that code must pass before proceeding. In our pipeline:
> - **Gate 1**: Lint must pass (no errors)
> - **Gate 2**: Build must succeed (no compilation errors)
> - Only if both pass → deploy happens
> Could add more: test coverage threshold, security scanning (Snyk/Dependabot),
> bundle size limits, Lighthouse scores.

**Q: How would you secure the pipeline further?**
> 1. **Branch protection rules**: Require PR reviews, status checks before merge
> 2. **CODEOWNERS file**: Require specific reviewers for critical files
> 3. **Dependabot**: Auto-update dependencies, security alerts
> 4. **Environment protection**: Add manual approval for production deploys
> 5. **OIDC tokens**: Use OpenID Connect instead of long-lived tokens
> 6. **Minimal permissions**: `permissions:` block in workflow to limit token scope

---

## Pipeline Flowchart

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DEVELOPER PUSHES CODE                            │
│                    git push origin main                               │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   GITHUB DETECTS PUSH EVENT                          │
│               Reads .github/workflows/ci-cd.yml                      │
│               Checks: branch matches 'main'? ✅                      │
│               Cancels any in-progress run for same branch            │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    📦 INSTALL JOB                                     │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  1. Checkout code (actions/checkout@v4)                     │    │
│   │  2. Setup Node.js 18 (actions/setup-node@v4)               │    │
│   │  3. npm ci (clean install from package-lock.json)          │    │
│   │  4. Cache node_modules (keyed on lockfile hash)            │    │
│   └─────────────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│   🔍 LINT JOB     │  │  🏗️ BUILD JOB    │     ← Run in PARALLEL
│                  │  │                  │
│  1. Checkout     │  │  1. Checkout     │
│  2. Setup Node   │  │  2. Setup Node   │
│  3. Restore cache│  │  3. Restore cache│
│  4. npm run lint │  │  4. ng build     │
│                  │  │  5. Upload dist/ │
│  ❌ Fails?       │  │     as artifact  │
│  → Block deploy  │  │                  │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └────────┬────────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │  Both passed? ✅         │
    │                         │
    │  Push to main?          │
    │  ├── Yes → DEPLOY PROD  │
    │  └── PR?  → DEPLOY      │
    │           PREVIEW        │
    └─────────┬───────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    🚀 DEPLOY PRODUCTION                               │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  1. Download build artifact (dist/)                        │    │
│   │  2. Deploy to Netlify via API                              │    │
│   │     - Uses NETLIFY_AUTH_TOKEN (secret)                     │    │
│   │     - Uses NETLIFY_SITE_ID (secret)                        │    │
│   │     - production-deploy: true                              │    │
│   │  3. Post commit comment with deploy URL                    │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ✅ Live at: https://my-cart-app-sandesh.netlify.app                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | GitHub Actions pipeline (4 stages) |
| `netlify.toml` | Netlify build config, SPA redirects, security headers |
| `eslint.config.js` | ESLint rules for Angular (lint stage) |
| `CI_CD.md` | This documentation |

---

## Quick Commands

```bash
# Check pipeline status
gh run list

# Watch a running pipeline
gh run watch

# View pipeline logs
gh run view --log

# Re-run a failed pipeline
gh run rerun <run-id>

# Trigger pipeline manually (if workflow_dispatch is added)
gh workflow run ci-cd.yml
```
