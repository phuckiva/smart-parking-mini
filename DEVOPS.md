# 🚀 Cơ sở hạ tầng DevOps Smart Parking

Thiết lập DevOps toàn diện cho hệ thống Smart Parking Mini với tự động hóa CI/CD, containerization, giám sát và quản lý cơ sở hạ tầng đám mây.

## 📋 Tổng quan

Cơ sở hạ tầng DevOps này bao gồm:
- **CI/CD Pipeline**: GitHub Actions với tự động kiểm thử, xây dựng và triển khai
- **Containerization**: Docker containers với multi-stage builds
- **Điều phối**: Kubernetes deployment với auto-scaling
- **Giám sát**: Prometheus + Grafana + Loki stack
- **Infrastructure as Code**: Terraform cho AWS EKS
- **Bảo mật**: Tự động quét lỗ hổng và kiểm tra tuân thủ

## 🏗️ Kiến trúc Cơ sở hạ tầng

```
┌─────────────────────────────────────────────────────────────────┐
│                        Môi trường Production                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │     ALB     │  │   Route53   │  │  CloudFront │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│           │               │               │                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EKS Cluster                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   Frontend  │  │   Backend   │  │    Redis    │    │   │
│  │  │  (React)    │  │ (Node.js)   │  │   (Cache)   │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │               │               │                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Supabase  │  │   Giám sát  │  │   Logging   │            │
│  │ (Database)  │  │(Prometheus) │  │    (Loki)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline

### Kích hoạt Workflow
- **Push to main**: Tự động triển khai production
- **Push to develop**: Tự động triển khai staging  
- **Pull Requests**: Chạy kiểm thử và quét bảo mật
- **Thủ công**: Triển khai thủ công với lựa chọn môi trường

### Các giai đoạn Pipeline
1. **Chất lượng Code**: Linting, kiểm tra định dạng
2. **Quét Bảo mật**: Đánh giá lỗ hổng bảo mật
3. **Kiểm thử**: Unit tests, integration tests
4. **Xây dựng**: Tạo Docker image
5. **Registry**: Push images lên container registry
6. **Triển khai**: Deploy lên môi trường mục tiêu
7. **Xác minh**: Health checks và smoke tests
8. **Thông báo**: Slack/email notifications

## 🐳 Chiến lược Container

### Multi-stage Docker Builds
- **Backend**: Node.js Alpine với tăng cường bảo mật
- **Frontend**: Nginx Alpine với tối ưu static assets
- **Tối ưu kích thước**: Multi-stage builds giảm image size 70%
- **Bảo mật**: Non-root users, minimal base images

### Điều phối Container
- **Development**: Docker Compose với hot-reload
- **Production**: Kubernetes với auto-scaling
- **Service Mesh**: Istio cho quản lý traffic nâng cao

## 📊 Giám sát & Quan sát

### Thu thập Metrics (Prometheus)
- **Application Metrics**: Tốc độ request, thời gian phản hồi, tỷ lệ lỗi
- **Infrastructure Metrics**: CPU, memory, disk, network
- **Business Metrics**: Đặt chỗ đang hoạt động, tận dụng bãi đỗ
- **Custom Metrics**: Hành vi người dùng, mẫu sử dụng API

### Trực quan hóa (Grafana)
- **System Overview Dashboard**: Sức khỏe hạ tầng
- **Application Dashboard**: Hiệu suất API, hoạt động người dùng
- **Business Dashboard**: Phân tích đỗ xe, metrics doanh thu
- **Alert Dashboard**: Theo dõi sự cố thời gian thực

### Logging (Loki + Promtail)
- **Centralized Logging**: Tất cả logs ứng dụng và hạ tầng
- **Log Aggregation**: Structured logging với correlation IDs
- **Tìm kiếm & Phân tích**: Full-text search và log analytics
- **Retention**: Lưu trữ 30 ngày với archival to S3

### Cảnh báo (AlertManager)
- **Critical Alerts**: Service down, tỷ lệ lỗi cao
- **Warning Alerts**: Sử dụng tài nguyên cao, phản hồi chậm
- **Business Alerts**: Thất bại đặt chỗ cao
- **Escalation**: Tích hợp PagerDuty cho hỗ trợ 24/7

## ☁️ Cơ sở hạ tầng Đám mây

### Thiết lập AWS EKS
- **Multi-AZ Deployment**: Khả dụng cao trên 3 AZs
- **Auto Scaling**: Horizontal Pod Autoscaler + Cluster Autoscaler
- **Bảo mật**: Pod Security Standards, Network Policies
- **Tối ưu chi phí**: Spot instances cho workloads không quan trọng

### Kiến trúc Mạng
- **VPC**: Mạng ảo cô lập với private/public subnets
- **NAT Gateways**: Truy cập internet outbound an toàn
- **ALB**: Application Load Balancer với SSL termination
- **Route53**: Quản lý DNS với health checks

### Chiến lược Database
- **Primary**: Supabase PostgreSQL cho dữ liệu production
- **Cache**: Redis cluster cho quản lý session
- **Backup**: Sao lưu tự động hàng ngày với point-in-time recovery
- **Read Replicas**: Horizontal scaling cho read operations

## 🔒 Triển khai Bảo mật

### Container Security
- **Base Image Scanning**: Đánh giá lỗ hổng Trivy
- **Runtime Security**: Phát hiện mối đe dọa runtime Falco
- **Network Policies**: Phân đoạn mạng Kubernetes
- **Pod Security**: Non-root containers, read-only filesystems

### Application Security
- **HTTPS Everywhere**: Mã hóa TLS 1.3
- **JWT Security**: Xử lý token an toàn
- **Input Validation**: Kiểm tra đầu vào toàn diện
- **Rate Limiting**: Giới hạn tốc độ API và bảo vệ DDoS

### Infrastructure Security
- **IAM**: Kiểm soát truy cập ít nhất
- **VPC Security**: Private subnets, security groups
- **Secrets Management**: AWS Secrets Manager
- **Compliance**: Giám sát tuân thủ SOC2, GDPR

## 🚀 Chiến lược Triển khai

### Blue-Green Deployment
- **Zero Downtime**: Triển khai production không gian đoạn
- **Quick Rollback**: Khả năng rollback tức thời
- **Testing**: Môi trường kiểm thử giống production
- **Risk Mitigation**: Giảm thiểu rủi ro triển khai

### Canary Deployment
- **Gradual Rollout**: Chuyển traffic dần dần
- **Risk Reduction**: Phát hiện sớm vấn đề
- **Automated Rollback**: Tự động rollback khi có lỗi
- **Monitoring**: Giám sát tăng cường trong quá trình rollout

## 📈 Tối ưu hóa Hiệu suất

### Hiệu suất Ứng dụng
- **Chiến lược Caching**: Caching nhiều lớp (Redis, CDN)
- **Tối ưu Database**: Tối ưu query, indexing
- **Tối ưu Assets**: Nén ảnh, minification
- **Code Splitting**: Lazy loading cho frontend

### Hiệu suất Hạ tầng
- **Auto Scaling**: Horizontal và vertical scaling
- **Load Balancing**: Phân phối traffic thông minh
- **CDN**: Phân phối nội dung toàn cầu
- **Resource Limits**: Phân bổ tài nguyên hợp lý

## 🛠️ Hướng dẫn Bắt đầu Nhanh

### Yêu cầu tiên quyết
```bash
# Cài đặt các công cụ cần thiết
- Docker & Docker Compose
- kubectl
- terraform
- helm
- aws-cli
```

### Thiết lập Development
```bash
# Clone và setup
git clone https://github.com/phuckiva/smart-parking-mini.git
cd smart-parking-mini

# Khởi động môi trường development
.\scripts\deploy.sh development deploy

# Thiết lập giám sát
.\scripts\deploy.sh development monitoring
```

### Triển khai Production
```bash
# Thiết lập hạ tầng
cd infrastructure
terraform init
terraform plan
terraform apply

# Triển khai ứng dụng
.\scripts\deploy.sh production deploy

# Xác minh triển khai
kubectl get pods -n smart-parking
```

## 📚 Sổ tay Vận hành

### Vận hành hàng ngày
- [ ] Kiểm tra Grafana dashboards tìm bất thường
- [ ] Xem xét error logs tìm patterns
- [ ] Giám sát sử dụng tài nguyên
- [ ] Xác minh hoàn thành backup

### Vận hành hàng tuần
- [ ] Đánh giá security patch
- [ ] Đánh giá hiệu suất
- [ ] Đánh giá tối ưu chi phí
- [ ] Lập kế hoạch capacity

### Vận hành hàng tháng
- [ ] Kiểm thử disaster recovery
- [ ] Kiểm toán tuân thủ bảo mật
- [ ] Đánh giá chi phí hạ tầng
- [ ] Benchmark hiệu suất

## 🚨 Phản ứng Sự cố

### Mức độ Nghiêm trọng
- **P1 (Nghiêm trọng)**: Service hoàn toàn down
- **P2 (Cao)**: Chức năng chính bị ảnh hưởng  
- **P3 (Trung bình)**: Chức năng phụ bị ảnh hưởng
- **P4 (Thấp)**: Vấn đề gào diện

### Quy trình Phản ứng
1. **Phát hiện**: Cảnh báo tự động qua PagerDuty
2. **Đánh giá**: Đánh giá tác động ban đầu
3. **Phản ứng**: Hành động giảm thiểu ngay lập tức
4. **Giải quyết**: Phân tích nguyên nhân gốc và sửa chữa
5. **Postmortem**: Đánh giá sự cố và cải tiến

## 📊 URLs Giám sát

### Môi trường Development
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Ứng dụng**: http://localhost:3000
- **API**: http://localhost:8888

### Môi trường Production
- **Grafana**: https://monitoring.smartparking.com
- **Ứng dụng**: https://app.smartparking.com
- **API**: https://api.smartparking.com

## 🤝 Đóng góp cho DevOps

### Thêm Giám sát Mới
1. Thêm Prometheus metrics vào ứng dụng
2. Tạo Grafana dashboard
3. Thiết lập alerting rules
4. Cập nhật tài liệu

### Thay đổi Hạ tầng
1. Cập nhật Terraform configurations
2. Kiểm thử trong môi trường staging
3. Áp dụng qua CI/CD pipeline
4. Giám sát rollout

### Cập nhật Bảo mật
1. Quét lỗ hổng
2. Cập nhật base images
3. Kiểm thử trong development
4. Triển khai qua automated pipeline

## 📞 Hỗ trợ & Khắc phục Sự cố

### Vấn đề Thường gặp
- **Sử dụng Memory Cao**: Kiểm tra memory leaks, điều chỉnh limits
- **Thời gian Phản hồi Chậm**: Xem xét database queries, kiểm tra caching
- **Triển khai Thất bại**: Kiểm tra logs, xác minh configurations
- **Certificate Hết hạn**: Tự động gia hạn qua cert-manager

### Nhận Hỗ trợ
- **Tài liệu**: Kiểm tra README này và component docs
- **Logs**: Sử dụng `.\scripts\deploy.sh development logs [service]`
- **Giám sát**: Kiểm tra Grafana dashboards
- **Hỗ trợ**: Liên hệ DevOps team qua Slack #smart-parking-ops

---

## 📝 Các bước Tiếp theo

1. **Tăng cường Bảo mật**: Triển khai service mesh (Istio)
2. **Giám sát Nâng cao**: Thêm distributed tracing (Jaeger)
3. **Tối ưu Chi phí**: Triển khai spot instances
4. **Disaster Recovery**: Thiết lập multi-region
5. **Compliance**: Quy trình chứng nhận SOC2