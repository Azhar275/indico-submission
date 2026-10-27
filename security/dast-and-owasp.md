# DAST and OWASP Top 10

DAST runs in the `dast` job of `.github/workflows/ci-cd.yml` through [`scripts/dast-scan.sh`](../scripts/dast-scan.sh). It uses OWASP ZAP's API scan (`zaproxy/zap-stable`, pinned by digest).

## 1. How the application is made available in a safe test environment

- The job downloads the **exact image built earlier in the same run**, so DAST tests what would be deployed.
- `docker compose` starts that image plus a fresh PostgreSQL on an **isolated Docker network** inside the CI runner. The API port is bound to `127.0.0.1` only.
- The DB password, JWT secret and test-user password are **random per run** and masked in the logs. The only data is a synthetic seeded user (`dast@example.com`).
- Everything is destroyed when the job ends (`docker compose down -v`), whether the scan passed or failed.

## 2. Which DAST checks run automatically

- ZAP imports [`app/openapi.yaml`](../app/openapi.yaml), so it knows every endpoint and parameter, including `/items/search?q=`, which a crawler would never find.
- **Passive scan:** inspects every response for missing security headers, information leaks, cookie flags, server errors and similar issues.
- **Active scan:** sends attack payloads to every parameter: SQL injection (generic and PostgreSQL time-based), XSS, OS command injection, path traversal, remote file inclusion, server-side template injection, XXE, and more. On the fixed code, 119 rules passed.

## 3. How authentication is handled during testing

1. The script logs in as the seeded test user via `POST /auth/login` and receives a JWT.
2. The token is passed to ZAP with `ZAP_AUTH_HEADER=Authorization` and `ZAP_AUTH_HEADER_VALUE=Bearer <token>`. ZAP adds this header to **every** request, so the protected `/items` endpoints are actually tested, rather than only returning 401.
3. The token is valid for 60 minutes in the test environment only (`JWT_EXPIRES_IN_MS`). It's masked in logs and never written to the reports.

## 4. Which findings block a release

[`.zap/rules.tsv`](../.zap/rules.tsv) sets the gate. `zap-api-scan.py -c rules.tsv -I` fails the job only on rules marked `FAIL`.

| Result | Alerts | Reason |
|---|---|---|
| **FAIL** (blocks) | SQL injection (all variants), OS command injection, server-side code and template injection, path traversal, remote file inclusion, server-side include, XXE | Exploitable injection: data theft or code execution |
| **WARN** (reported, not blocking) | Everything else, including XSS for this JSON-only API, server errors and missing headers | Tracked under the vulnerability policy |

**False positive example.** On the first run ZAP raised *"Cross Site Scripting Weakness (Persistent in JSON Response)"* (Low risk, Low confidence). It had stored `<script>alert(1);</script>` as an item name and read it back in JSON. The API only returns `application/json` with `X-Content-Type-Options: nosniff`, so a browser never renders it as HTML. Output encoding is the responsibility of whatever front-end displays the data, and that front-end would get its own DAST scan. We therefore set the XSS rules (40012, 40014) to **WARN** for this API. They are still reported, just not blocking.

**Results:**
- **Vulnerable baseline:** `FAIL-NEW: SQL Injection [40018]` on `GET /items/search?q='`, so the job fails and `deploy` never runs. Evidence: [`evidence/raw/dast-zap-vulnerable.txt`](../evidence/raw/dast-zap-vulnerable.txt).
- **DAST also found a robustness bug:** a NUL byte (`%00`) in `q` or in an item name made PostgreSQL reject the input, and the app returned **HTTP 500** (*"A Server Error response code was returned"*, WARN). It wasn't exploitable, but user input should never cause a server error (OWASP 2025 **A10 Mishandling of Exceptional Conditions**). Fixed with input validation that returns 400.
- **After the fixes** (parameterized query + NUL validation): 0 FAIL, 1 WARN (the XSS-in-JSON false positive above), 119 rules passed. Evidence: [`evidence/raw/dast-zap-fixed.txt`](../evidence/raw/dast-zap-fixed.txt).

## 5. How security testing is kept away from production

- The target is hard-coded to the ephemeral container (`http://app:3000` on the job's private Docker network). No production URL exists in the job or the script.
- The `dast` job has **no AWS credentials**: only the `deploy` job has `id-token: write`, and the deploy role trusts only the `production` environment.
- Test data and credentials are synthetic and random per run.
- DAST runs **before** deployment, and `deploy` depends on it.
- Authorized scope: we only scan our own application in our own runner. Scanning production, or anything we don't own, would need written approval and a test window.

## 6. OWASP Top 10 (2025) risks for this application

The brief asks for at least three. These are the three most relevant to this application:

| OWASP 2025 | How it applies here | Detect | Mitigate |
|---|---|---|---|
| **A05 Injection** | `GET /items/search?q=` builds SQL by string concatenation (planted flaw) | ZAP active scan (40018) found it. SonarQube Community did **not** (no taint analysis; see `evidence/raw/sast-sonarqube-sqli-detection-test.txt`) | Parameterized queries (`$1`) everywhere; input validation with zod; a WAF SQLi rule set as a second layer (target architecture). Next step: a least-privilege DB role instead of the master user |
| **A01 Broken Access Control** | Users must only see their own items (no IDOR/BOLA) | Unit test *"users cannot read items owned by someone else"*; code review | Every query filters by `owner_id` taken from the verified JWT, never from the request; another user's item returns 404 |
| **A03 Software Supply Chain Failures** | fast-jwt 6.2.4 (CVE-2026-107722, Critical) and Node.js 24.22.0 (CVE-2026-111497) | Trivy SCA/image gates; Node.js runtime security-release gate | Upgrade (fast-jwt 6.3.5, Node 24.22.1); lockfile + `npm ci --ignore-scripts`; base image pinned by digest; actions pinned by SHA; npm removed from the runtime image |
