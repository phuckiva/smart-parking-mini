terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  backend "s3" {
    bucket = "smart-parking-terraform-state"
    key    = "smart-parking/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "smart_parking_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "smart-parking-vpc"
    Environment = var.environment
    Project     = "smart-parking"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "smart_parking_igw" {
  vpc_id = aws_vpc.smart_parking_vpc.id

  tags = {
    Name        = "smart-parking-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.smart_parking_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "smart-parking-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.smart_parking_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "smart-parking-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.smart_parking_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.smart_parking_igw.id
  }

  tags = {
    Name        = "smart-parking-public-rt"
    Environment = var.environment
  }
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "public_rta" {
  count          = length(aws_subnet.public_subnets)
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# NAT Gateways
resource "aws_eip" "nat_eips" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "smart-parking-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "nat_gateways" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat_eips[count.index].id
  subnet_id     = aws_subnet.public_subnets[count.index].id

  tags = {
    Name        = "smart-parking-nat-gateway-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables for Private Subnets
resource "aws_route_table" "private_rts" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.smart_parking_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateways[count.index].id
  }

  tags = {
    Name        = "smart-parking-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Associate Private Subnets with Route Tables
resource "aws_route_table_association" "private_rtas" {
  count          = length(aws_subnet.private_subnets)
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rts[count.index].id
}

# EKS Cluster
resource "aws_eks_cluster" "smart_parking_cluster" {
  name     = "smart-parking-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.27"

  vpc_config {
    subnet_ids              = concat(aws_subnet.public_subnets[*].id, aws_subnet.private_subnets[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_key.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = {
    Name        = "smart-parking-cluster"
    Environment = var.environment
  }
}

# EKS Node Group
resource "aws_eks_node_group" "smart_parking_nodes" {
  cluster_name    = aws_eks_cluster.smart_parking_cluster.name
  node_group_name = "smart-parking-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private_subnets[*].id

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  instance_types = ["t3.medium"]
  ami_type       = "AL2_x86_64"
  capacity_type  = "ON_DEMAND"
  disk_size      = 20

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name        = "smart-parking-nodes"
    Environment = var.environment
  }
}

# RDS Database
resource "aws_db_subnet_group" "smart_parking_db_subnet_group" {
  name       = "smart-parking-db-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = {
    Name        = "smart-parking-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_sg" {
  name_prefix = "smart-parking-rds-"
  vpc_id      = aws_vpc.smart_parking_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.smart_parking_vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "smart-parking-rds-sg"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_security_group" "alb_sg" {
  name_prefix = "smart-parking-alb-"
  vpc_id      = aws_vpc.smart_parking_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "smart-parking-alb-sg"
    Environment = var.environment
  }
}

resource "aws_lb" "smart_parking_alb" {
  name               = "smart-parking-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "smart-parking-alb"
    Environment = var.environment
  }
}

# KMS Key for encryption
resource "aws_kms_key" "eks_key" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7

  tags = {
    Name        = "smart-parking-eks-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "eks_key_alias" {
  name          = "alias/smart-parking-eks-key"
  target_key_id = aws_kms_key.eks_key.key_id
}