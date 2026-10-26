# Scan Results and Evidence

Raw outputs are in [`raw/`](raw/). Every pipeline run also uploads its reports as artifacts (`secret-scan-report`, `sast-report`, `sca-report`, `iac-report`, `container-report`, `dast-report`).

## 1. Pipeline runs

| Run | Trigger | Result | Link | Screenshot |
|---|---|---|---|---|
| 1. Vulnerable baseline | Push to `main` (commit `Initial commit`) | ❌ SCA, ❌ container scan, ❌ DAST · ✅ source validation, secrets, SAST, IaC · deploy skipped | [CI/CD pipeline #1](https://github.com/Azhar275/indico-submission/actions/workflows/ci-cd.yml) | [run-1.png](screenshots/run-1.png) |
| 2. Fixes | Push to `main` (the five fix commits) | ✅ all seven gates · deploy paused for the required reviewer on `production`, approved, then ran (simulated) | [CI/CD pipeline #2](https://github.com/Azhar275/indico-submission/actions/workflows/ci-cd.yml) | [run-2-post-fix.png](screenshots/run-2-post-fix.png), [run-2-deploy-to-production.png](screenshots/run-2-deploy-to-production.png) |
| 3. Scenario B: public database | [Pull request #1](https://github.com/Azhar275/indico-submission/pull/1) (closed, not merged) | ❌ IaC scanning only: Checkov `CKV_AWS_17`, Trivy `AWS-0180` · deploy skipped | [PR #1 checks](https://github.com/Azhar275/indico-submission/pull/1/checks) | [run-3-public-db-check.png](screenshots/run-3-public-db-check.png) |
| 4. Hard-coded secret | [Pull request #2](https://github.com/Azhar275/indico-submission/pull/2) (closed, not merged) | ❌ secret scanning only: Gitleaks `generic-api-key` (random, fake key) · deploy skipped | [PR #2 checks](https://github.com/Azhar275/indico-submission/pull/2/checks) | [run-4-hardcoded-secrets.png](screenshots/run-4-hardcoded-secrets.png) |

Runs 1 and 2 are the first two runs listed on the workflow page.

## 2. Before and after, per gate

| Gate | Vulnerable baseline | After fixes | Raw evidence |
|---|---|---|---|
| Unit tests | 12/12 pass | 15/15 pass | [`source-validation-unit-tests.txt`](raw/source-validation-unit-tests.txt) |
| ESLint | 0 errors, 2 warnings (false positives, see §4) | same | [`source-validation-eslint.txt`](raw/source-validation-eslint.txt) |
| SCA: Trivy `fs` | ❌ fast-jwt 6.2.4: **1 CRITICAL** (CVE-2026-107722), 3 HIGH, 2 MEDIUM | ✅ 0 | [`sca-trivy-vulnerable.txt`](raw/sca-trivy-vulnerable.txt), [`sca-trivy-fixed.txt`](raw/sca-trivy-fixed.txt) |
| SCA: npm audit | 1 critical package (6 advisories) | 0 vulnerabilities | [`sca-npm-audit-vulnerable.txt`](raw/sca-npm-audit-vulnerable.txt), [`sca-npm-audit-fixed.txt`](raw/sca-npm-audit-fixed.txt) |
| Container: Trivy `image` | ❌ OS: 1 MEDIUM, 2 UNKNOWN (Alpine 3.24.2); app: fast-jwt CRITICAL + HIGH; secrets: 0 | ✅ 0 (Alpine 3.24.3, fast-jwt 6.3.5) | [`container-trivy-image-vulnerable.txt`](raw/container-trivy-image-vulnerable.txt), [`container-trivy-image-fixed.txt`](raw/container-trivy-image-fixed.txt) |
| Container: Node.js runtime gate | ❌ 24.22.0, missed security release 24.22.1 (CVE-2026-111497) | ✅ 24.22.1 | [`container-node-runtime-gate.txt`](raw/container-node-runtime-gate.txt) |
| Container: Dockerfile | 0 misconfigurations | same | [`container-trivy-dockerfile.txt`](raw/container-trivy-dockerfile.txt) |
| Container: secrets in layers | none (Trivy secret scan, `docker history`) | same | [`container-docker-history.txt`](raw/container-docker-history.txt) |
| SAST: SonarQube | quality gate OK, 0 security issues, 0 hotspots (SQL injection **not** detected, see §3) | same | [`sast-sonarqube.txt`](raw/sast-sonarqube.txt) |
| IaC: Checkov | 137 passed, 0 failed, 3 skipped (accepted risks AR-001 to AR-003) | same | [`iac-checkov.txt`](raw/iac-checkov.txt) |
| IaC: Trivy `config` | 0 HIGH/CRITICAL; 1 MEDIUM tracked (VPC flow logs, AR-001) | same | [`iac-trivy-config.txt`](raw/iac-trivy-config.txt) |
| IaC: `terraform fmt` / `validate` | OK | same | [`iac-terraform-validate.txt`](raw/iac-terraform-validate.txt) |
| DAST: ZAP | ❌ **SQL Injection [40018]** on `GET /items/search?q=`; WARN: server error 500, XSS-in-JSON | ✅ 0 FAIL; 1 WARN (XSS-in-JSON false positive); 119 rules passed | [`dast-zap-vulnerable.txt`](raw/dast-zap-vulnerable.txt), [`dast-zap-fixed.txt`](raw/dast-zap-fixed.txt) |

### Task 3 scenarios (bad examples)

| Scenario | Failed checks | Key finding | Evidence |
|---|---|---|---|
| A: `Action: *`, `Resource: *` | 9 | Checkov `CKV_AWS_62` (full admin), `CKV_AWS_63`, `CKV_AWS_286` (privilege escalation)… | [`iac-bad-examples-scans.txt`](raw/iac-bad-examples-scans.txt) |
| B: public database | 11 | Checkov `CKV_AWS_17`, Trivy `AWS-0180` (HIGH) | same |
| C: password in Terraform variables | 10 | custom `CKV2_ITEMS_1` | same |
| C: proof that `sensitive = true` still stores the password in state | — | plaintext found in `terraform.tfstate` | [`iac-password-in-state.txt`](raw/iac-password-in-state.txt) |

## 3. Scanner gaps we found (and how we covered them)

| Gap | What happened | Covered by |
|---|---|---|
| **SonarQube Community has no taint analysis** | Didn't flag the SQL injection in 4 test variants, including user input concatenated directly into `pool.query()` | DAST (ZAP) found it. Evidence: [`sast-sonarqube-sqli-detection-test.txt`](raw/sast-sonarqube-sqli-detection-test.txt) |
| **Trivy doesn't inventory the Node.js binary** in official images | No finding for CVE-2026-111497 on Node 24.22.0 | `scripts/check-node-runtime.mjs` checks `nodejs.org/dist/index.json` for missed security releases |
| **Vulnerability databases lag** | `is-my-node-vulnerable` reported "ALL GOOD" for 24.22.0, five days after disclosure | Same runtime gate. Evidence: [`container-is-my-node-vulnerable.txt`](raw/container-is-my-node-vulnerable.txt) |
| **Built-in IaC rules missed Scenario C** | Neither Checkov nor Trivy flags a DB password passed through a Terraform variable | Custom policy `terraform/policies/rds_instance_no_plaintext_password.yaml` |
| **A scanner "passed" without scanning** | Gitleaks in a container couldn't read the repo (git "dubious ownership") and reported "~0 bytes scanned, no leaks" with exit code 0 | `safe.directory` set in the pipeline; now scans every commit |

## 4. False positives and how they were handled

| Finding | Why it's a false positive | Handling |
|---|---|---|
| Gitleaks `generic-api-key` on a test JWT secret in `app/test/app.test.js` | Test-only value | Removed the pattern: the secret is generated at runtime with `randomBytes` |
| Gitleaks `curl-auth-user` on SonarQube's factory default `admin:admin` | Public default for a throwaway CI container | Removed the pattern: credentials moved into a variable |
| ESLint `security/detect-object-injection` and `detect-non-literal-fs-filename` in `app/src/config.js` | The key comes from a constant list; the file path comes from operator config, not users | Left as non-blocking warnings, documented here |
| ZAP *Cross Site Scripting Weakness (Persistent in JSON Response)* | The API only returns `application/json` with `X-Content-Type-Options: nosniff`, so browsers don't render it | XSS rules set to WARN for this JSON-only API (`.zap/rules.tsv`) |

## 5. Base image: why npm was removed

The stock `node:24.22.0-alpine` image ships npm with its own dependencies: 15 known vulnerabilities, 5 HIGH, one with no fix available (`http-cache-semantics`). The application never runs npm in production, so the Dockerfile deletes npm, npx, corepack and yarn from the runtime image, and all 15 findings disappear. Evidence: [`container-trivy-base-image-before-npm-removal.txt`](raw/container-trivy-base-image-before-npm-removal.txt).
