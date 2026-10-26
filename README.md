# DevSecOps Home Test

A small Node.js API ("items-api") for AWS ECS Fargate, protected by a GitHub Actions pipeline that blocks unsafe releases.

The application was **intentionally shipped with three vulnerabilities** so the security gates had something real to catch. They were then fixed, and the evidence of both states is kept:

| Planted issue | Caught by | Fixed by |
|---|---|---|
| fast-jwt 6.2.4, CVE-2026-107722 (Critical) | SCA and container scan (Trivy) | Upgrade to 6.3.5 |
| Node.js 24.22.0 base image, CVE-2026-111497 (High) | Node.js runtime security-release gate | Base image 24.22.1 |
| SQL injection in `GET /items/search` | DAST (OWASP ZAP) | Parameterized query |

## Architecture overview

![Architecture](architecture/architecture-diagram.png)

- Internet → **AWS WAF** → **ALB** (HTTPS only) → **ECS Fargate** tasks in private subnets → **RDS PostgreSQL** in isolated subnets.
- Tasks have no internet egress; they reach ECR, Secrets Manager, CloudWatch Logs and KMS through **VPC endpoints**.
- Secrets live in **Secrets Manager** and are injected at task start by the ECS execution role. Everything at rest is encrypted with **KMS**.
- GitHub Actions deploys with **OIDC** (short-lived credentials, no stored keys), only from the approved `production` environment.

Details: [`architecture/security-design.md`](architecture/security-design.md).

## Prerequisites and execution

- Docker. Node.js 24+ is only needed to run the tests outside Docker.
- Every security tool runs as a container image pinned by digest, so nothing else needs to be installed.

Create a local, git-ignored `.env` containing `DB_PASSWORD=<any value>` and `JWT_SECRET=<at least 32 characters>`. Then:

```bash
docker compose up -d --build
cd app && npm ci && npm test && npm run lint
```

The first command starts PostgreSQL and the API container on `127.0.0.1:3000`; the second runs the unit tests and lint.

## CI/CD workflow and security gates

[`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) runs on every pull request and every push to `main`.

| Stage | Job | Tool | Fails the pipeline on |
|---|---|---|---|
| Source validation | `source-validation` | `npm ci`, ESLint, unit tests | Lockfile mismatch, lint error, failed test |
| SAST | `sast` | SonarQube Community (temporary container in the job) | Any vulnerability or unreviewed security hotspot |
| SCA | `sca` | Trivy on `package-lock.json` | Any CRITICAL; any HIGH with a fix available |
| Secret scanning | `secret-scan` | Gitleaks, full Git history | Any finding |
| IaC scanning | `iac-scan` | `terraform validate`, Checkov, Trivy | Any failed Checkov check; any HIGH/CRITICAL misconfiguration |
| Image build and container scan | `image` | Docker build, Trivy (vulnerabilities + secrets), Node.js runtime gate | Same severity rule as SCA; any secret; a missed Node.js security release |
| DAST | `dast` | OWASP ZAP, authenticated, against a temporary container | Injection-class alerts (`.zap/rules.tsv`) |
| Deployment | `deploy` | GitHub Environment `production` + OIDC | Runs only on `main`, only after **every** job passed and a reviewer approved. Simulated |

- **Evidence:** every job uploads its report as a pipeline artifact.
- **Lower-severity findings** (Medium, Low) don't block. They're tracked under the [vulnerability policy](security/vulnerability-policy.md).
- **Least privilege and no secrets in logs:**
  - the default token is read-only, and only `deploy` can request AWS credentials;
  - actions and scanner images are pinned;
  - per-run SonarQube credentials are masked.
- **Required repository settings:**
  - branch protection on `main`, requiring all seven checks above;
  - a `production` environment with a required reviewer, deploying from `main` only.

False positives and accepted risks: [vulnerability policy](security/vulnerability-policy.md) §2 and §4, with real examples in [`evidence/scan-results.md`](evidence/scan-results.md).

## Validate Terraform and scan the container

From the repository root:

```bash
docker run --rm -v "$PWD/terraform:/tf" -w /tf hashicorp/terraform:1.17.0 init -backend=false
docker run --rm -v "$PWD/terraform:/tf" -w /tf hashicorp/terraform:1.17.0 validate
docker run --rm -v "$PWD:/work" -w /work/terraform bridgecrew/checkov:3.3.30 --config-file .checkov.yaml
TRIVY_IMAGE=aquasec/trivy:0.76.1 ./scripts/trivy-gate.sh config terraform iac-trivy
```

```bash
docker build -t items-api:local app
docker save -o image.tar items-api:local
TRIVY_IMAGE=aquasec/trivy:0.76.1 ./scripts/trivy-gate.sh image image.tar image
docker run --rm --entrypoint node -v "$PWD/scripts:/scripts:ro" items-api:local /scripts/check-node-runtime.mjs
```

## Security decisions

| Decision | Why |
|---|---|
| GitHub OIDC instead of AWS keys in CI | Nothing long-lived to leak; the role only trusts this repo's `production` environment |
| Separate deploy, task-execution and task roles | Least privilege; the application's own role has no permissions |
| RDS-managed DB password and a write-only JWT secret | Secrets never appear in Terraform variables or state |
| No internet egress (VPC endpoints) | A compromised task can't download tools or exfiltrate data |
| Minimal, pinned, non-root container without npm | Smaller attack surface; removed 15 inherited vulnerabilities |
| Node.js runtime security-release gate | Trivy doesn't detect vulnerabilities in the Node.js runtime itself |

## Assumptions

- Deployment is **simulated**: Terraform is validated and scanned but not applied, and AWS account IDs are placeholders.
- Each environment has its own AWS account; Terraform state is stored remotely in S3 with KMS encryption.
- The Terraform is the minimal deployment Task 3 asks for. The ALB, WAF, CloudTrail and GuardDuty in the diagram are the target design.
- Single region (`ap-southeast-3`).

## Known limitations and remaining risks

- SonarQube Community has no taint analysis and didn't detect the SQL injection; DAST covers it.
- As deployed by this Terraform, the service has no public entry point (no ALB/WAF).
- Accepted risks: no VPC flow logs, no RDS enhanced monitoring, manual JWT secret rotation.
- The application connects as the RDS master user; a dedicated least-privilege database role is the next step.

## Evidence of tests and scans

[`evidence/scan-results.md`](evidence/scan-results.md) has the pipeline run links, before/after results for every gate, the Task 3 scenario scans and the false-positive handling. Raw outputs are in [`evidence/raw/`](evidence/raw/).

Other deliverables:
- [`security/vulnerability-policy.md`](security/vulnerability-policy.md) (Task 4)
- [`security/terraform-scenarios.md`](security/terraform-scenarios.md) (Task 3)
- [`security/incident-response.md`](security/incident-response.md) (Task 5)
- [`security/dast-and-owasp.md`](security/dast-and-owasp.md) (Task 6)
