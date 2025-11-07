# 저장된 경로 페이지 퍼블리싱 가이드

## 현재 상태
- `SavedRoutes.tsx` 페이지는 이미 구현되어 있습니다
- `App.tsx`에서 라우팅이 설정되어 있습니다 (`/saved` 경로)
- 헤더 네비게이션에서 "Saved Routes" 메뉴를 통해 접근 가능합니다

## 퍼블리싱 방법

### 방법 1: 개발 환경에서 실행 (로컬 테스트)

```bash
# frontend 디렉토리로 이동
cd frontend

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.
헤더에서 "Saved Routes" 메뉴를 클릭하면 저장된 경로 페이지를 확인할 수 있습니다.

### 방법 2: 프로덕션 빌드 (정적 파일 생성)

```bash
# frontend 디렉토리로 이동
cd frontend

# 프로덕션 빌드 실행
npm run build
```

빌드가 완료되면 `frontend/dist` 폴더에 최적화된 정적 파일들이 생성됩니다.

### 방법 3: 빌드 결과물 미리보기

```bash
# frontend 디렉토리에서
npm run preview
```

이 명령어는 빌드된 결과물을 로컬에서 미리볼 수 있게 해줍니다.

### 방법 4: 정적 파일 서버로 배포

빌드된 `dist` 폴더의 내용을 다음 중 하나의 방법으로 배포할 수 있습니다:

#### 4-1. Nginx 사용
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4-2. GitHub Pages 배포
```bash
# gh-pages 패키지 설치
npm install --save-dev gh-pages

# package.json에 추가
# "scripts": {
#   "deploy": "gh-pages -d dist"
# }

# 배포 실행
npm run deploy
```

#### 4-3. Netlify/Vercel 배포
- Netlify 또는 Vercel에 프로젝트 연결
- Build command: `npm run build`
- Publish directory: `dist`

### 방법 5: Docker를 사용한 배포

프론트엔드를 위한 Dockerfile을 생성할 수 있습니다:

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 저장된 경로 페이지 접근 방법

애플리케이션 실행 후:
1. 헤더의 "Saved Routes" 메뉴 클릭
2. 또는 URL에 직접 `/saved` 경로로 접근 (SPA 라우팅)

## 참고사항

- 현재 `SavedRoutes.tsx`는 하드코딩된 더미 데이터를 사용하고 있습니다
- 실제 백엔드 API와 연동하려면 API 호출 로직을 추가해야 합니다
- 백엔드 API 엔드포인트: `http://localhost:8000` (기본값)

