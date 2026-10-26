# Troubleshooting and Incident Response

## Scenario A: Trivy reports a critical vulnerability in the base image, and the team wants an immediate production deployment

**Investigation and risk assessment**
- Read the finding: CVE, package, installed and fixed versions, and which layer it comes from.
- Check whether the component is even needed at runtime. Base images often ship unused package managers and tools.
- Assess exposure (internet-facing? before authentication?), reachability (is the vulnerable feature used?), and active exploitation (CISA KEV, public exploit, EPSS).
- Check production: if it already runs the same vulnerable image, the priority is shipping a *patched* image quickly, not blocking it.

**Likely root causes:** a newly published CVE; a base image not updated since upstream patched it; unnecessary packages in the image; no automated base-image updates.

**Corrective actions**
- **Remediate:** rebuild on the patched base image, or remove the vulnerable component, and ship it through the normal pipeline.
- **If no fix exists:** apply compensating controls (disable the feature, WAF/virtual patch, reduce exposure, monitor) and raise a **time-boxed exception** with an owner and an expiry.
- **Exceptions:** approved by **security** (plus the service owner for a Critical), never by the requesting team alone.
- **Release authorisation:** the release still needs the normal production approval. **The pipeline is never bypassed**; if the business insists on shipping, an accountable owner signs a documented risk acceptance.
- **Prevent recurrence:** automated base-image updates, minimal images, and regular rescans of running images.

## Scenario B: An ECS Fargate task can't retrieve a secret from AWS Secrets Manager

**Key point:** secrets in the task definition's `secrets` block are fetched by the **task execution role** (the ECS agent, before the container starts), **not** the **task role** (the application at runtime).

**Investigation steps**
1. **ECS task events:** the stopped reason (`aws ecs describe-tasks … --query 'tasks[].stoppedReason'`). `AccessDeniedException` points to IAM or KMS; a timeout points to the network.
2. **Execution role:** the task definition sets `executionRoleArn`, and *that* role allows `secretsmanager:GetSecretValue` on the secret.
3. **Secrets Manager resource:** the full ARN, region and JSON key (`<secret-arn>:<key>::`) are correct; the secret isn't deleted or pending deletion; its resource policy doesn't deny the role.
4. **KMS:** with a customer-managed key, the execution role has `kms:Decrypt` and the key policy allows it.
5. **Network:** private subnets need VPC endpoints for Secrets Manager and KMS (private DNS on, security groups allowing 443) or a NAT gateway; public subnets need a public IP.
6. **CloudTrail and CloudWatch:** an `AccessDenied` event names the exact principal and resource. Empty container logs confirm the failure happens before the app starts.

**Likely root causes:** the permission was put on the task role; the wrong secret ARN or key; missing KMS permission; no network path to Secrets Manager or KMS; a deleted secret.

**Isolating it without broad administrator permissions:** use a read-only role; test the exact action against the exact ARN with `aws iam simulate-principal-policy`; read CloudTrail; then fix one thing at a time through a reviewed infrastructure-as-code change. Never grant `*` or `AdministratorAccess` "to see if it works".

## Scenario C: CloudTrail shows unexpected API calls from the deployment pipeline's IAM principal

**Immediate containment** (assume compromise)
- **Access keys:** deactivate the key (keep it as evidence), attach an explicit `Deny *`, and check the user for other keys or a console password.
- **IAM role:** revoke active sessions (this denies tokens issued before now), attach an explicit `Deny *`, and lock the trust policy.
- **Pipeline:** disable the pipeline jobs that use the principal, and remove the credentials from CI/CD variables.
- **Persistence:** look for new IAM users, keys, roles or policies, and rotate any secrets the principal could read.

**Investigation**
- **Scope:** query CloudTrail for every event by the key or role session, **in all regions**: event names, source IPs, user agents, and `AccessDenied` bursts.
- **Source:** compare the activity with CI runner activity. Was it a pipeline run, or the key used from elsewhere?
- **How it happened:** a key leaked in code or logs, a compromised CI action or dependency, a malicious pipeline change, over-broad permissions, or a compromised developer account.
- **Blast radius:** everything created, changed, read or deleted. Correlate with GuardDuty, VPC Flow Logs and the CI/CD audit log.
- **Audit evidence:** validate log integrity (`aws cloudtrail validate-logs`), export the logs to restricted storage, and keep suspicious resources.

**Recovery**
- Remove unauthorised changes, and redeploy from known-good, reviewed builds.
- Delete the compromised key, and **replace long-lived keys with short-lived credentials** (OIDC to an IAM role).
- Apply least privilege and a narrow trust policy, add alerts on unusual pipeline-principal activity, and hold a blameless post-incident review.
