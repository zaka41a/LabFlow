variable "location" {
  description = "Azure region for all LabFlow resources."
  type        = string
  default     = "germanywestcentral"
}

variable "environment" {
  description = "Short environment identifier."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z0-9]{2,8}$", var.environment))
    error_message = "environment must contain 2 to 8 lowercase letters or digits."
  }
}

variable "name_suffix" {
  description = "Globally unique lowercase suffix used for Azure resource names."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{4,10}$", var.name_suffix))
    error_message = "name_suffix must contain 4 to 10 lowercase letters or digits."
  }
}

variable "admin_username" {
  description = "Administrator account created on the Linux VM."
  type        = string
  default     = "labflowadmin"
}

variable "admin_ssh_public_key" {
  description = "OpenSSH public key used to access the VM."
  type        = string
  sensitive   = true
}

variable "admin_source_cidr" {
  description = "Single trusted CIDR allowed to connect to SSH, for example 203.0.113.10/32."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_source_cidr, 0)) && var.admin_source_cidr != "0.0.0.0/0"
    error_message = "Use a valid restricted CIDR. Public SSH access from 0.0.0.0/0 is not allowed."
  }
}

variable "vm_size" {
  description = "Azure VM size used for the Docker host."
  type        = string
  default     = "Standard_B2ats_v2"
}

variable "borrower_password_hash" {
  description = "BCrypt hash for the local Borrower test account."
  type        = string
  sensitive   = true
}

variable "manager_password_hash" {
  description = "BCrypt hash for the local Lab Manager test account."
  type        = string
  sensitive   = true
}

variable "technician_password_hash" {
  description = "BCrypt hash for the local Technician test account."
  type        = string
  sensitive   = true
}

variable "oidc_client_id" {
  description = "Client identifier of the confidential GitLab OpenID Connect application."
  type        = string
}

variable "oidc_client_secret" {
  description = "Client secret of the confidential GitLab OpenID Connect application."
  type        = string
  sensitive   = true
}

variable "oidc_client_authentication_method" {
  description = "OAuth client authentication method used at the token endpoint."
  type        = string
  default     = "client_secret_post"

  validation {
    condition = contains([
      "client_secret_basic",
      "client_secret_post"
    ], var.oidc_client_authentication_method)
    error_message = "Use client_secret_basic or client_secret_post."
  }
}

variable "oidc_public_issuer_uri" {
  description = "Issuer URI contained in and validated against OpenID Connect ID tokens."
  type        = string
  default     = "https://git-ce.rwth-aachen.de"
}

variable "oidc_authorization_uri" {
  description = "Browser-accessible OpenID Connect authorization endpoint."
  type        = string
  default     = "https://git-ce.rwth-aachen.de/oauth/authorize"
}

variable "oidc_token_uri" {
  description = "OpenID Connect token endpoint accessible from the backend container."
  type        = string
  default     = "https://git-ce.rwth-aachen.de/oauth/token"
}

variable "oidc_jwk_set_uri" {
  description = "OpenID Connect JSON Web Key Set endpoint accessible from the backend container."
  type        = string
  default     = "https://git-ce.rwth-aachen.de/oauth/discovery/keys"
}

variable "oidc_user_info_uri" {
  description = "OpenID Connect UserInfo endpoint accessible from the backend container."
  type        = string
  default     = "https://git-ce.rwth-aachen.de/oauth/userinfo"
}

variable "oidc_borrower_identities" {
  description = "GitLab usernames or group paths allowed to use LabFlow as Borrowers."
  type        = list(string)
  default = [
    "zaka41a",
    "lsit-2026/roles/labflow/borrower"
  ]
}

variable "oidc_manager_identities" {
  description = "GitLab usernames or group paths allowed to use LabFlow as Lab Managers."
  type        = list(string)
  default = [
    "SaadFihi",
    "lsit-2026/roles/labflow/lab-manager"
  ]
}

variable "oidc_technician_identities" {
  description = "GitLab usernames or group paths allowed to use LabFlow as Technicians."
  type        = list(string)
  default = [
    "othmane022-jj",
    "lsit-2026/roles/labflow/technician"
  ]
}
