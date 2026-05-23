variable "aws_region" {
  description = "AWS Region to deploy to"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}
