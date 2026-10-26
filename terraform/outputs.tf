output "ecr_repository_url" {
  description = "ECR repository the pipeline pushes images to."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name, used by the deploy job."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name, used by the deploy job."
  value       = aws_ecs_service.api.name
}

output "gha_deploy_role_arn" {
  description = "Role assumed by the GitHub Actions production deploy job via OIDC."
  value       = aws_iam_role.gha_deploy.arn
}
