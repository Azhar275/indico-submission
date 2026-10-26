variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "app" {
  identifier          = "app-db"
  engine              = "postgres"
  engine_version      = "17"
  instance_class      = "db.t4g.micro"
  allocated_storage   = 20
  username            = "app_admin"
  password            = var.db_password
  storage_encrypted   = true
  publicly_accessible = false
  skip_final_snapshot = true
}
