resource "aws_security_group" "db" {
  name        = "app-db"
  description = "Application database"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "app" {
  identifier                  = "app-db"
  engine                      = "postgres"
  engine_version              = "17"
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  username                    = "app_admin"
  manage_master_user_password = true
  db_subnet_group_name        = var.public_subnet_group
  vpc_security_group_ids      = [aws_security_group.db.id]
  publicly_accessible         = true
  skip_final_snapshot         = true
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_group" {
  type = string
}
