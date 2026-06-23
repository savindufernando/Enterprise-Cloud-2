output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = module.db.db_instance_endpoint
}

output "dynamodb_baggage_table" {
  value = aws_dynamodb_table.baggage_table.name
}

output "rds_secret_arn" {
  value = module.db.db_instance_master_user_secret_arn
}

