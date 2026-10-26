#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

cat >"$WORKDIR/main.tf" <<'EOF'
variable "db_password" {
  type      = string
  sensitive = true
}

resource "terraform_data" "database" {
  input = {
    username = "app_admin"
    password = var.db_password
  }
}

output "password" {
  value     = terraform_data.database.input.password
  sensitive = true
}
EOF

export TF_VAR_db_password="demo-$(openssl rand -hex 8)"
export TF_IN_AUTOMATION=1

cd "$WORKDIR"
terraform init -input=false >/dev/null
terraform apply -auto-approve -input=false >/dev/null

printf '\n== terraform output (CLI masks the value)\n'
terraform output

printf '\n== terraform show (masking is not guaranteed for nested values)\n'
terraform show -no-color | grep -E 'password' | sed -E "s/${TF_VAR_db_password}/${TF_VAR_db_password:0:9}<redacted-in-evidence>/" || true

printf '\n== raw terraform.tfstate (value stored in plaintext)\n'
if grep -q "$TF_VAR_db_password" terraform.tfstate; then
  grep -n '"password"' terraform.tfstate | sed -E "s/${TF_VAR_db_password}/${TF_VAR_db_password:0:9}<redacted-in-evidence>/"
  echo "RESULT: plaintext secret found in state despite sensitive = true"
else
  echo "RESULT: secret not found in state"
fi
