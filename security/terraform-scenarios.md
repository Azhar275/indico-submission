# Terraform Security Scenarios: Remediation Notes

The bad configurations are in [`terraform/bad-examples/`](../terraform/bad-examples/), and their scan output is in [`evidence/raw/iac-bad-examples-scans.txt`](../evidence/raw/iac-bad-examples-scans.txt).

## Scenario A: Overly permissive IAM

**Why `Action: *` on `Resource: *` is dangerous:**
- It's full administrator access. Anyone holding the role can create users and keys, read every secret, disable logging, and delete data and backups.
- A deployment role's credentials live in CI, where many people and third-party actions run code, so a leak means the whole account is compromised.
- Checkov flags it with `CKV_AWS_62` (full admin), `CKV_AWS_63` and `CKV_AWS_286` (privilege escalation).

**Safer approach** (implemented in [`terraform/main.tf`](../terraform/main.tf)):

| Consideration | Approach |
|---|---|
| Resource-level permissions | Push to **one** ECR repository and update **one** ECS service. `*` only where AWS doesn't support resource-level permissions (`ecr:GetAuthorizationToken`, `ecs:RegisterTaskDefinition`). `iam:PassRole` is limited to the two task roles and to ECS |
| Separate deployment and runtime roles | CI deploy role ≠ ECS task execution role (pulls the image and secrets) ≠ task role (application, no permissions) |
| Short-lived credentials | GitHub OIDC → STS with 1-hour sessions. No access keys exist |
| Cross-account access | One AWS account per environment (`allowed_account_ids`). The deploy role trusts only this repository's `production` environment. Any cross-account trust names the exact role ARN, plus `aws:PrincipalOrgID` or `sts:ExternalId` |

## Scenario B: Database accessible from `0.0.0.0/0`

**How the pipeline detects and blocks it:**
1. The `iac-scan` job runs on every pull request.
2. Checkov fails on `CKV_AWS_17` (`publicly_accessible = true`), and Trivy reports `AWS-0180` (HIGH). Either one fails the job.
3. The failed required check blocks the merge, and `deploy` never runs, because it depends on every job.

**Fix:** `publicly_accessible = false`; the database in private subnets; a security group that only allows `5432` from the application's security group, never a CIDR range.

## Scenario C: Password in Terraform variables and state

`sensitive = true` only hides the value in CLI output; it's still stored **in plaintext** in the state file ([proof](../evidence/raw/iac-password-in-state.txt)). Neither scanner's built-in rules detect this, so the custom policy `CKV2_ITEMS_1` ([`terraform/policies/`](../terraform/policies/)) blocks any `aws_db_instance` that receives a `password`.

| Ask | Action |
|---|---|
| **Handle the exposed credential** | Treat it as compromised and **rotate it first**. Review database and CloudTrail logs for use during the exposure window |
| **Handle the Terraform state** | Find every copy: old object versions in the S3 backend, local state files, CI logs and artifacts, Git history. Delete or restrict them, and rewrite Git history if state was committed. Rotation, not deletion, is what makes the old copies harmless |
| **Secure the secret** | `manage_master_user_password = true`: RDS generates and rotates the password in Secrets Manager, and Terraform never sees it. Other secrets use an `ephemeral` value with a write-only argument (`secret_string_wo`), which never enters plan or state |
| **Prevent further exposure** | Remote state in S3 with KMS encryption and restricted access. `*.tfstate` and `*.tfvars` git-ignored. Gitleaks and `CKV2_ITEMS_1` in the pipeline |
