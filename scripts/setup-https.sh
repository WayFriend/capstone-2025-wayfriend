#!/bin/bash
# EC2 HTTPS 설정 자동화 스크립트
# 사용법: sudo bash scripts/setup-https.sh [도메인]

set -e

DOMAIN=${1:-""}
IP="34.239.248.132"

echo "🚀 EC2 HTTPS 설정 시작..."

# 1. Nginx 설치
echo "📦 Nginx 설치 중..."
sudo apt update
sudo apt install nginx -y

# 2. Nginx 설정 파일 복사
echo "📝 Nginx 설정 파일 생성 중..."
sudo cp nginx/backend.conf /etc/nginx/sites-available/backend

# 도메인이 있으면 설정 파일 수정
if [ -n "$DOMAIN" ]; then
    echo "🌐 도메인 설정: $DOMAIN"
    sudo sed -i "s/34.239.248.132/$DOMAIN/g" /etc/nginx/sites-available/backend
fi

# 3. Nginx 설정 활성화
echo "🔗 Nginx 설정 활성화 중..."
sudo ln -sf /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Nginx 설정 테스트
echo "✅ Nginx 설정 테스트 중..."
sudo nginx -t

# 5. SSL 인증서 발급
if [ -n "$DOMAIN" ]; then
    echo "🔐 Let's Encrypt SSL 인증서 발급 중..."
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@example.com
else
    echo "⚠️  도메인이 없어 자체 서명 인증서를 생성합니다..."
    sudo mkdir -p /etc/nginx/ssl
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/self-signed.key \
        -out /etc/nginx/ssl/self-signed.crt \
        -subj "/C=KR/ST=Seoul/L=Seoul/O=WayFriend/CN=$IP"
    sudo chmod 600 /etc/nginx/ssl/self-signed.key
    sudo chmod 644 /etc/nginx/ssl/self-signed.crt

    # Nginx 설정에서 자체 서명 인증서 경로로 변경
    sudo sed -i 's|/etc/letsencrypt/live/.*/fullchain.pem|/etc/nginx/ssl/self-signed.crt|g' /etc/nginx/sites-available/backend
    sudo sed -i 's|/etc/letsencrypt/live/.*/privkey.pem|/etc/nginx/ssl/self-signed.key|g' /etc/nginx/sites-available/backend
fi

# 6. 방화벽 설정
echo "🔥 방화벽 설정 중..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8000/tcp
sudo ufw --force enable

# 7. Nginx 재시작
echo "🔄 Nginx 재시작 중..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 8. 설정 확인
echo "✅ 설정 완료!"
echo ""
echo "📋 확인 사항:"
echo "  - HTTPS URL: https://${DOMAIN:-$IP}"
echo "  - Nginx 상태: sudo systemctl status nginx"
if [ -z "$DOMAIN" ]; then
    echo "  - ⚠️  자체 서명 인증서 사용 중 (브라우저 경고 발생)"
    echo "  - 브라우저에서 '고급' → '안전하지 않음으로 이동' 클릭 필요"
else
    echo "  - SSL 인증서: sudo certbot certificates"
fi
echo ""
echo "🧪 테스트:"
echo "  curl -k https://${DOMAIN:-$IP}/health"
echo ""
echo "🌐 브라우저 테스트:"
echo "  https://${DOMAIN:-$IP}/health 접속 후 경고 화면에서 '고급' 클릭"

