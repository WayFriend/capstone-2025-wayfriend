# Vercel 배포 가이드

이 가이드는 WayFriend 프론트엔드를 Vercel에 배포하는 방법을 설명합니다.

## 사전 준비

1. [Vercel 계정](https://vercel.com) 생성
2. GitHub/GitLab/Bitbucket에 프로젝트가 푸시되어 있어야 합니다

## 배포 방법

### 방법 1: Vercel 웹 대시보드 사용 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com 에 로그인
   - "Add New..." → "Project" 클릭

2. **프로젝트 연결**
   - GitHub/GitLab/Bitbucket 저장소 선택
   - 프로젝트 선택

3. **프로젝트 설정**
   - **Framework Preset**: Vite (자동 감지됨)
   - **Root Directory**: `frontend` (중요!)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `dist` (자동 설정됨)
   - **Install Command**: `npm install` (자동 설정됨)

4. **환경 변수 설정**
   - "Environment Variables" 섹션에서 다음 변수 추가:
     ```
     VITE_API_URL=https://your-backend-api.com
     VITE_API_BASE_URL=https://your-backend-api.com
     VITE_NAVER_CLIENT_ID=your_naver_client_id (선택사항)
     ```
   - 각 환경(Production, Preview, Development)에 대해 설정 가능

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 배포가 완료되면 자동으로 URL이 생성됩니다

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm install -g vercel
   ```

2. **프로젝트 디렉토리로 이동**
   ```bash
   cd frontend
   ```

3. **Vercel 로그인**
   ```bash
   vercel login
   ```

4. **프로젝트 배포**
   ```bash
   vercel
   ```
   - 프롬프트에 따라 설정:
     - Link to existing project? → No (첫 배포인 경우)
     - Project name? → 원하는 프로젝트 이름 입력
     - Directory? → `.` (현재 디렉토리)
     - Override settings? → No

5. **환경 변수 설정**
   ```bash
   vercel env add VITE_API_URL
   vercel env add VITE_API_BASE_URL
   vercel env add VITE_NAVER_CLIENT_ID
   ```
   각 프롬프트에 값을 입력합니다.

6. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

## 환경 변수 설정

프로덕션 환경에서 다음 환경 변수를 설정해야 합니다:

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `VITE_API_URL` | 백엔드 API URL | 필수 |
| `VITE_API_BASE_URL` | 백엔드 API URL (대체) | 선택 |
| `VITE_NAVER_CLIENT_ID` | 네이버 지도 클라이언트 ID | 선택 |

### 환경 변수 설정 방법

#### 웹 대시보드에서:
1. 프로젝트 → Settings → Environment Variables
2. 변수 추가 후 각 환경(Production/Preview/Development) 선택
3. Save 클릭

#### CLI에서:
```bash
# 프로덕션 환경 변수 추가
vercel env add VITE_API_URL production

# 미리보기 환경 변수 추가
vercel env add VITE_API_URL preview

# 개발 환경 변수 추가
vercel env add VITE_API_URL development
```

## 배포 후 확인사항

1. **빌드 로그 확인**
   - Vercel 대시보드의 "Deployments" 탭에서 빌드 로그 확인
   - 에러가 있으면 로그를 확인하여 수정

2. **환경 변수 확인**
   - 배포된 사이트에서 브라우저 개발자 도구 → Console 확인
   - API 호출이 정상적으로 이루어지는지 확인

3. **라우팅 확인**
   - SPA 라우팅이 정상 작동하는지 확인
   - `/`, `/find`, `/saved` 등의 경로 테스트

## 커스텀 도메인 설정

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정에 따라 CNAME 또는 A 레코드 추가

## 자동 배포 설정

- GitHub에 푸시하면 자동으로 배포됩니다
- `main` 브랜치 → Production 배포
- 다른 브랜치 → Preview 배포

## 문제 해결

### 빌드 실패
- `package.json`의 빌드 스크립트 확인
- Node.js 버전 확인 (Vercel은 자동으로 감지)
- 의존성 설치 오류 확인

### 환경 변수 미적용
- 환경 변수가 올바른 환경(Production/Preview)에 설정되었는지 확인
- 배포 후 재빌드 필요할 수 있음

### 라우팅 오류 (404)
- `vercel.json`의 `rewrites` 설정 확인
- 모든 경로가 `index.html`로 리다이렉트되는지 확인

### API 연결 오류
- CORS 설정 확인 (백엔드에서 Vercel 도메인 허용)
- 환경 변수 값 확인
- 백엔드 서버가 실행 중인지 확인

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#vercel)

