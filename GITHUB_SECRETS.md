# 🔐 Hướng dẫn Cấu hình GitHub Secrets

Để CI/CD pipeline hoạt động đúng cách, bạn cần cấu hình các GitHub Secrets sau:

## 📋 Danh sách Secrets cần thiết

### 🐳 Docker Registry Secrets
```
DOCKER_USERNAME=your-docker-hub-username
DOCKER_PASSWORD=your-docker-hub-password
```

### 🌐 Slack Notifications (Tùy chọn)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 🛠️ Cách cấu hình GitHub Secrets

### Bước 1: Truy cập GitHub Repository Settings
1. Vào repository GitHub của bạn
2. Click vào tab **Settings**
3. Ở sidebar bên trái, click **Secrets and variables** > **Actions**

### Bước 2: Thêm Repository Secrets
1. Click nút **New repository secret**
2. Nhập **Name** và **Secret** cho từng secret
3. Click **Add secret**

### Bước 3: Cấu hình Variables (Tùy chọn)
Nếu muốn sử dụng variables thay vì secrets cho một số giá trị:

1. Click tab **Variables**
2. Thêm các variables sau:
```
PRODUCTION_BACKEND_URL=https://api.smartparking.com
PRODUCTION_FRONTEND_URL=https://app.smartparking.com
```

## 🚀 Setup Docker Hub

### Tạo Docker Hub Account
1. Đăng ký tại https://hub.docker.com
2. Tạo repository mới:
   - `your-username/smart-parking-backend`
   - `your-username/smart-parking-frontend`

### Tạo Access Token
1. Vào Docker Hub Settings > Security
2. Click **New Access Token**
3. Đặt tên token và copy token
4. Sử dụng token làm `DOCKER_PASSWORD`

## 📱 Setup Slack Notifications (Tùy chọn)

### Tạo Slack App
1. Vào https://api.slack.com/apps
2. Click **Create New App**
3. Chọn **From scratch**
4. Đặt tên app và chọn workspace

### Cấu hình Incoming Webhooks
1. Vào **Incoming Webhooks** trong app settings
2. Activate incoming webhooks
3. Click **Add New Webhook to Workspace**
4. Chọn channel để nhận notifications
5. Copy Webhook URL

## ⚡ Quick Setup Script

Tạo file `.env.secrets` (không commit vào git):

```bash
# .env.secrets - Chỉ để tham khảo, không commit file này
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

Sau đó thêm từng secret vào GitHub:

```bash
# Sử dụng GitHub CLI (gh) để thêm secrets nhanh
gh secret set DOCKER_USERNAME --body "your-docker-username"
gh secret set DOCKER_PASSWORD --body "your-docker-token"
gh secret set SLACK_WEBHOOK_URL --body "your-slack-webhook-url"
```

## 🔍 Kiểm tra Cấu hình

### Test CI/CD Pipeline
1. Push code lên branch `main` hoặc tạo Pull Request
2. Vào tab **Actions** để xem workflow chạy
3. Kiểm tra logs nếu có lỗi

### Test Docker Build
```bash
# Test local build để đảm bảo Dockerfile hoạt động
docker build -t smart-parking-backend ./backend
docker build -t smart-parking-frontend ./webapp
```

## 🚨 Troubleshooting

### Lỗi "Context access might be invalid"
- **Nguyên nhân**: Secret chưa được tạo
- **Giải pháp**: Tạo secret trong GitHub Settings

### Lỗi Docker login failed
- **Nguyên nhân**: DOCKER_USERNAME hoặc DOCKER_PASSWORD sai
- **Giải pháp**: Kiểm tra lại credentials Docker Hub

### Lỗi permission denied
- **Nguyên nhân**: Token Docker Hub không có quyền push
- **Giải pháp**: Tạo token mới với quyền Read/Write

## 📝 Lưu ý Bảo mật

1. **Không commit secrets** vào repository
2. **Sử dụng access tokens** thay vì password
3. **Rotate secrets định kỳ** (3-6 tháng)
4. **Giới hạn quyền** của tokens
5. **Monitor usage** của secrets

## 🎯 Next Steps

Sau khi setup xong secrets:

1. Test CI/CD pipeline với commit nhỏ
2. Setup monitoring cho pipeline
3. Cấu hình deployment environments
4. Thêm security scanning
5. Setup automated testing

---

**💡 Tip**: Bắt đầu với minimal setup (chỉ DOCKER_USERNAME và DOCKER_PASSWORD) và từ từ thêm các secrets khác khi cần.