variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-southeast-3"
}

variable "aws_account_id" {
  description = "The only AWS account this configuration may be applied to."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must be a 12-digit AWS account ID."
  }
}

variable "project" {
  description = "Project name used in resource names and tags."
  type        = string
  default     = "items-api"
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of dev, staging, prod."
  }
}

variable "owner" {
  description = "Team or person accountable for these resources."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role, as owner/name."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "image_digest" {
  description = "Immutable image digest to deploy from ECR."
  type        = string

  validation {
    condition     = can(regex("^sha256:[a-f0-9]{64}$", var.image_digest))
    error_message = "image_digest must be a sha256 digest, not a mutable tag."
  }
}

variable "desired_count" {
  description = "Number of running tasks."
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_multi_az" {
  description = "Run RDS in Multi-AZ mode."
  type        = bool
  default     = true
}

variable "jwt_secret_version" {
  description = "Increment to generate and store a new JWT signing secret."
  type        = number
  default     = 1
}
