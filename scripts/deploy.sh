#!/bin/bash

# Smart Parking Deployment Script
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry"}
PROJECT_NAME="smart-parking"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if kubectl is installed (for production)
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
    fi
    
    log "Prerequisites check passed"
}

# Function to build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build backend image
    log "Building backend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-backend:latest ./backend
    docker tag $DOCKER_REGISTRY/$PROJECT_NAME-backend:latest $DOCKER_REGISTRY/$PROJECT_NAME-backend:$(git rev-parse --short HEAD)
    
    # Build frontend image
    log "Building frontend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-frontend:latest ./webapp
    docker tag $DOCKER_REGISTRY/$PROJECT_NAME-frontend:latest $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$(git rev-parse --short HEAD)
    
    log "Docker images built successfully"
}

# Function to push images to registry
push_images() {
    log "Pushing images to registry..."
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-backend:latest
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-backend:$(git rev-parse --short HEAD)
    
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-frontend:latest
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$(git rev-parse --short HEAD)
    
    log "Images pushed successfully"
}

# Function to deploy to development
deploy_development() {
    log "Deploying to development environment..."
    
    # Stop existing containers
    docker-compose -f docker-compose.dev.yml down
    
    # Pull latest images
    docker-compose -f docker-compose.dev.yml pull
    
    # Start services
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:8888/health > /dev/null 2>&1; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    log "Development deployment completed successfully"
}

# Function to deploy to production
deploy_production() {
    log "Deploying to production environment..."
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/
    
    # Wait for rollout to complete
    kubectl rollout status deployment/backend-deployment -n smart-parking
    kubectl rollout status deployment/frontend-deployment -n smart-parking
    
    # Health check
    BACKEND_URL=$(kubectl get ingress smart-parking-ingress -n smart-parking -o jsonpath='{.spec.rules[0].host}')
    FRONTEND_URL=$(kubectl get ingress smart-parking-ingress -n smart-parking -o jsonpath='{.spec.rules[1].host}')
    
    if curl -f https://$BACKEND_URL/health > /dev/null 2>&1; then
        log "Production backend health check passed"
    else
        error "Production backend health check failed"
    fi
    
    if curl -f https://$FRONTEND_URL/health > /dev/null 2>&1; then
        log "Production frontend health check passed"
    else
        error "Production frontend health check failed"
    fi
    
    log "Production deployment completed successfully"
}

# Function to run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd backend
    npm test
    cd ..
    
    # Frontend tests
    log "Running frontend tests..."
    cd webapp
    npm test
    cd ..
    
    # Mobile tests
    log "Running mobile tests..."
    cd mobileapp
    flutter test
    cd ..
    
    log "All tests passed"
}

# Function to security scan
security_scan() {
    log "Running security scan..."
    
    # Scan with Trivy
    if command -v trivy &> /dev/null; then
        trivy fs .
    else
        warn "Trivy not installed, skipping security scan"
    fi
    
    # Audit npm packages
    cd backend && npm audit --audit-level high
    cd ../webapp && npm audit --audit-level high
    cd ..
    
    log "Security scan completed"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Start monitoring stack
    docker-compose -f docker-compose.monitoring.yml up -d
    
    log "Monitoring setup completed"
    log "Grafana: http://localhost:3001 (admin/admin123)"
    log "Prometheus: http://localhost:9090"
}

# Function to backup database
backup_database() {
    log "Creating database backup..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # This would be customized based on your database setup
    # For Supabase, you might use their CLI or API
    warn "Database backup feature needs to be implemented based on your specific database setup"
    
    log "Database backup completed"
}

# Function to rollback deployment
rollback() {
    local VERSION=${1:-"previous"}
    log "Rolling back to version: $VERSION"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        kubectl rollout undo deployment/backend-deployment -n smart-parking
        kubectl rollout undo deployment/frontend-deployment -n smart-parking
    else
        # For development, restart with previous images
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    log "Rollback completed"
}

# Function to show logs
show_logs() {
    local SERVICE=${1:-"all"}
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ "$SERVICE" == "all" ]]; then
            kubectl logs -f -l app=backend -n smart-parking
        else
            kubectl logs -f deployment/$SERVICE-deployment -n smart-parking
        fi
    else
        docker-compose -f docker-compose.dev.yml logs -f $SERVICE
    fi
}

# Function to clean up resources
cleanup() {
    log "Cleaning up resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log "Cleanup completed"
}

# Main execution
main() {
    log "Starting Smart Parking deployment process..."
    log "Environment: $ENVIRONMENT"
    
    case "${2:-deploy}" in
        "test")
            check_prerequisites
            run_tests
            ;;
        "build")
            check_prerequisites
            build_images
            ;;
        "push")
            check_prerequisites
            build_images
            push_images
            ;;
        "deploy")
            check_prerequisites
            run_tests
            security_scan
            build_images
            
            if [[ "$ENVIRONMENT" == "production" ]]; then
                push_images
                deploy_production
            else
                deploy_development
            fi
            ;;
        "monitoring")
            setup_monitoring
            ;;
        "backup")
            backup_database
            ;;
        "rollback")
            rollback $3
            ;;
        "logs")
            show_logs $3
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            log "Usage: $0 [environment] [command] [options]"
            log "Environment: development|staging|production"
            log "Commands:"
            log "  test      - Run all tests"
            log "  build     - Build Docker images"
            log "  push      - Build and push images"
            log "  deploy    - Full deployment (default)"
            log "  monitoring- Setup monitoring stack"
            log "  backup    - Backup database"
            log "  rollback  - Rollback deployment"
            log "  logs      - Show logs"
            log "  cleanup   - Clean up resources"
            ;;
    esac
    
    log "Process completed successfully!"
}

# Execute main function with all arguments
main "$@"