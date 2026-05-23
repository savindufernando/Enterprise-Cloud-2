terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # backend "s3" {
  #   bucket = "aerolink-terraform-state-prod"
  #   key    = "infrastructure/state"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC ---
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.0"

  name = "aerolink-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
  create_database_subnet_group = true

  enable_nat_gateway = true
  single_nat_gateway = true # For cost savings

  tags = {
    Environment = var.environment
    Project     = "AeroLink"
  }
}

# --- EKS Cluster ---
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "aerolink-cluster-${var.environment}"
  cluster_version = "1.30"
  enable_cluster_creator_admin_permissions = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.public_subnets

  node_security_group_additional_rules = {
    ingress_istio_webhook = {
      description                   = "Allow control plane to hit Istio webhook"
      protocol                      = "tcp"
      from_port                     = 15017
      to_port                       = 15017
      type                          = "ingress"
      source_cluster_security_group = true
    }
  }

  eks_managed_node_groups = {
    worker = {
      instance_types = ["t3.small"]
      min_size       = 1
      max_size       = 4
      desired_size   = 3
    }
  }
  
  cluster_endpoint_public_access = true

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "db" {
  name        = "aerolink-db-sg"
  vpc_id      = module.vpc.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# --- Standard RDS PostgreSQL (Free Tier Eligible) ---
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier           = "aerolink-postgres"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  
  db_name              = "aerolink_db"
  username             = "aerolink_admin"
  manage_master_user_password = true 

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  family                 = "postgres15"
  major_engine_version   = "15"
}

# --- DynamoDB (Baggage Service) ---
resource "aws_dynamodb_table" "baggage_table" {
  name           = "aerolink-baggage-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "baggage_id"

  attribute {
    name = "baggage_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

# Removed MSK Kafka to save $20 budget. Kafka will be deployed into EKS.

# Note: ArgoCD will be installed via kubectl instead of Terraform to ensure EKS is fully booted first.
