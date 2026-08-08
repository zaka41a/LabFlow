# LabFlow Azure infrastructure

This directory provisions the development deployment described in the project
requirements: one private Azure Blob container, one Azure Container Registry and
one Linux VM running the frontend and backend with Docker Compose.

## Prerequisites

- OpenTofu 1.12.5 or Terraform 1.8 or newer
- Azure CLI authenticated with `az login`
- an Azure subscription
- an SSH public key
- three BCrypt password hashes for the local test accounts
- an OpenID Connect public client and its provider endpoints

## Validate and plan

```bash
cp terraform.tfvars.example terraform.tfvars
tofu init -backend=false
tofu fmt -check
tofu validate
```

The shared deployment is executed by `.gitlab-ci.yml`. It initializes the
GitLab HTTP backend with state locking, plans automatically and waits for a
manual approval before creating billable resources. Image publication,
deployment and health verification then continue automatically.

Configure these protected GitLab CI/CD variables:

- `ARM_CLIENT_ID`, `ARM_TENANT_ID`, `ARM_SUBSCRIPTION_ID` for the federated
  Azure identity; no long lived client secret is required.
- `TF_VAR_name_suffix`, `TF_VAR_admin_source_cidr` and
  `TF_VAR_admin_ssh_public_key`.
- `TF_VAR_borrower_password_hash`, `TF_VAR_manager_password_hash` and
  `TF_VAR_technician_password_hash`.
- `TF_VAR_oidc_client_id`, `TF_VAR_oidc_public_issuer_uri`,
  `TF_VAR_oidc_authorization_uri`, `TF_VAR_oidc_token_uri`,
  `TF_VAR_oidc_jwk_set_uri` and `TF_VAR_oidc_user_info_uri`.

For a local plan with a local state, temporarily remove or override the HTTP
backend in a separate uncommitted configuration. Never commit a state file.

Review the plan before applying it. `terraform apply` creates billable Azure
resources. The SSH rule deliberately rejects `0.0.0.0/0`; use only the public
IPv4 address of the administrator with a `/32` mask.

The VM uses its system-assigned managed identity to pull images from ACR. No ACR
administrator password is enabled. Storage credentials and password hashes are
sensitive values stored in Terraform state, so the state must be kept in a
protected remote backend for a shared environment.

This reference environment exposes HTTP on port 80. Before production use, put
it behind an HTTPS endpoint and set `LABFLOW_SESSION_SECURE=true`.
