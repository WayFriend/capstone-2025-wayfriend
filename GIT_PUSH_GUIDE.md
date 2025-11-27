# Git 저장소에 프로젝트 푸시 가이드

이 가이드는 GitHub, GitLab, Bitbucket 등 Git 호스팅 서비스에 프로젝트를 푸시하는 방법을 설명합니다.

## 현재 상태 확인

프로젝트는 이미 Git 저장소로 초기화되어 있으며, GitHub 원격 저장소가 연결되어 있습니다:
- 원격 저장소: `https://github.com/johe00123/capstone-2025-wayfriend.git`
- 현재 브랜치: `Feat/#79`

## 기본 Git 푸시 방법

### 1. 변경사항 확인

```bash
git status
```

현재 상태를 확인하여 어떤 파일이 변경되었는지 확인합니다.

### 2. 변경사항 스테이징 (추가)

```bash
# 모든 변경사항 추가
git add .

# 또는 특정 파일만 추가
git add 파일명
git add frontend/vercel.json vercel.json VERCEL_DEPLOYMENT.md
```

### 3. 커밋 생성

```bash
git commit -m "커밋 메시지"
```

예시:
```bash
git commit -m "Vercel 배포 설정 추가"
git commit -m "feat: Vercel 배포 설정 및 문서 추가"
```

### 4. 원격 저장소에 푸시

```bash
# 현재 브랜치 푸시
git push

# 또는 원격 저장소와 브랜치 명시
git push origin 브랜치명
git push origin Feat/#79

# 처음 푸시하는 경우 (업스트림 설정)
git push -u origin 브랜치명
```

## 전체 예시 (한 번에 실행)

```bash
# 1. 상태 확인
git status

# 2. 변경사항 추가
git add .

# 3. 커밋
git commit -m "Vercel 배포 설정 추가"

# 4. 푸시
git push
```

## 새로운 저장소에 처음 푸시하는 방법

### GitHub에 새 저장소 생성 후 푸시

1. **GitHub에서 새 저장소 생성**
   - GitHub.com 로그인
   - 우측 상단 "+" → "New repository" 클릭
   - 저장소 이름 입력 (예: `capstone-2025-wayfriend`)
   - Public/Private 선택
   - "Create repository" 클릭
   - **README, .gitignore, license는 추가하지 않기** (이미 로컬에 있으므로)

2. **로컬 저장소 초기화 (아직 안 했다면)**

```bash
# Git 저장소 초기화
git init

# .gitignore 확인 (이미 있음)
# 필요시 추가 파일/폴더를 .gitignore에 추가
```

3. **원격 저장소 연결**

```bash
# 원격 저장소 추가
git remote add origin https://github.com/사용자명/저장소명.git

# 또는 SSH 사용
git remote add origin git@github.com:사용자명/저장소명.git

# 원격 저장소 확인
git remote -v
```

4. **파일 추가 및 커밋**

```bash
# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit"
```

5. **브랜치 이름 설정 및 푸시**

```bash
# 메인 브랜치 이름 확인 (main 또는 master)
git branch -M main

# 원격 저장소에 푸시
git push -u origin main
```

### GitLab에 새 저장소 생성 후 푸시

1. **GitLab에서 새 프로젝트 생성**
   - GitLab.com 로그인
   - "New project" → "Create blank project"
   - 프로젝트 이름 입력
   - Visibility 선택
   - "Create project" 클릭

2. **원격 저장소 연결 및 푸시**

```bash
# 원격 저장소 추가
git remote add origin https://gitlab.com/사용자명/프로젝트명.git

# 또는 SSH
git remote add origin git@gitlab.com:사용자명/프로젝트명.git

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit"

# 푸시
git push -u origin main
```

### Bitbucket에 새 저장소 생성 후 푸시

1. **Bitbucket에서 새 저장소 생성**
   - Bitbucket.org 로그인
   - 좌측 "+" → "Repository"
   - 저장소 이름 입력
   - "Create repository" 클릭

2. **원격 저장소 연결 및 푸시**

```bash
# 원격 저장소 추가
git remote add origin https://bitbucket.org/사용자명/저장소명.git

# 또는 SSH
git remote add origin git@bitbucket.org:사용자명/저장소명.git

# 파일 추가 및 커밋
git add .
git commit -m "Initial commit"

# 푸시
git push -u origin main
```

## 원격 저장소 변경/추가

### 기존 원격 저장소 변경

```bash
# 원격 저장소 URL 변경
git remote set-url origin 새로운URL

# 확인
git remote -v
```

### 여러 원격 저장소 추가

```bash
# GitHub
git remote add github https://github.com/사용자명/저장소명.git

# GitLab
git remote add gitlab https://gitlab.com/사용자명/프로젝트명.git

# 각각 푸시
git push github main
git push gitlab main
```

## 인증 방법

### HTTPS 사용 (토큰 필요)

GitHub, GitLab, Bitbucket 모두 2021년부터 비밀번호 대신 Personal Access Token을 사용합니다.

1. **Personal Access Token 생성**
   - GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - GitLab: Preferences → Access Tokens
   - Bitbucket: Personal settings → App passwords

2. **토큰으로 푸시**
   ```bash
   # 사용자명: 토큰 입력
   git push
   ```

3. **자격 증명 저장 (선택사항)**
   ```bash
   # Windows
   git config --global credential.helper wincred

   # macOS
   git config --global credential.helper osxkeychain

   # Linux
   git config --global credential.helper store
   ```

### SSH 사용 (권장)

1. **SSH 키 생성 (없는 경우)**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # 또는
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. **SSH 키 복사**
   ```bash
   # Windows (PowerShell)
   cat ~/.ssh/id_ed25519.pub | clip

   # macOS
   pbcopy < ~/.ssh/id_ed25519.pub

   # Linux
   cat ~/.ssh/id_ed25519.pub
   ```

3. **호스팅 서비스에 SSH 키 추가**
   - GitHub: Settings → SSH and GPG keys → New SSH key
   - GitLab: Preferences → SSH Keys
   - Bitbucket: Personal settings → SSH keys

4. **SSH로 원격 저장소 연결**
   ```bash
   git remote set-url origin git@github.com:사용자명/저장소명.git
   ```

## 일반적인 Git 명령어

```bash
# 상태 확인
git status

# 변경사항 확인
git diff

# 커밋 히스토리 확인
git log
git log --oneline

# 브랜치 확인
git branch
git branch -a

# 브랜치 생성 및 전환
git checkout -b 새브랜치명
# 또는
git switch -c 새브랜치명

# 브랜치 전환
git checkout 브랜치명
git switch 브랜치명

# 원격 저장소 정보 가져오기
git fetch

# 원격 변경사항 병합
git pull

# 원격 저장소 목록
git remote -v

# 원격 저장소 제거
git remote remove origin
```

## 문제 해결

### 푸시 거부됨 (Push rejected)

```bash
# 원격 변경사항 먼저 가져오기
git pull origin main

# 충돌 해결 후 다시 푸시
git push
```

### 인증 오류

- Personal Access Token이 올바른지 확인
- SSH 키가 올바르게 설정되었는지 확인
- `ssh -T git@github.com` (GitHub)로 SSH 연결 테스트

### 커밋 메시지 편집기 문제

```bash
# 기본 에디터 변경
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "notepad"      # Windows 메모장
```

## 현재 프로젝트 푸시 예시

현재 프로젝트에서 새로 생성한 파일들을 푸시하려면:

```bash
# 1. 변경사항 확인
git status

# 2. 새 파일 추가
git add vercel.json frontend/vercel.json VERCEL_DEPLOYMENT.md

# 3. 커밋
git commit -m "feat: Vercel 배포 설정 및 문서 추가"

# 4. 푸시
git push
```

## 참고 자료

- [Git 공식 문서](https://git-scm.com/doc)
- [GitHub 가이드](https://docs.github.com/en/get-started)
- [GitLab 가이드](https://docs.gitlab.com/)
- [Bitbucket 가이드](https://support.atlassian.com/bitbucket-cloud/)

