# 프론트엔드 프로젝트

React + TypeScript + Vite로 구축된 현대적인 프론트엔드 프로젝트입니다.

## 🚀 기술 스택

- **React 18** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성을 위한 정적 타입 언어
- **Vite** - 빠른 개발 서버와 빌드 도구
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

### 3. 빌드

```bash
npm run build
```

### 4. 미리보기

```bash
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
│   ├── Button.tsx
│   └── Header.tsx
├── pages/         # 페이지 컴포넌트
│   ├── Home.tsx
│   └── About.tsx
├── assets/        # 이미지, 폰트 등 정적 파일
├── styles/        # 전역 스타일
│   ├── App.css
│   └── index.css
└── utils/         # 유틸리티 함수
    └── helpers.ts
```

## 🎯 주요 기능

- **컴포넌트 기반 아키텍처**: 재사용 가능한 컴포넌트로 구성
- **타입 안전성**: TypeScript로 런타임 오류 방지
- **반응형 디자인**: Tailwind CSS를 활용한 모바일 친화적 UI
- **모던 개발 환경**: Vite의 빠른 HMR과 빌드 성능

## 📝 사용 예시

### 컴포넌트 사용

```tsx
import Button from './components/Button';

<Button variant="primary" onClick={handleClick}>
  클릭하세요
</Button>
```

### 유틸리티 함수 사용

```tsx
import { capitalize, formatNumber } from './utils/helpers';

const name = capitalize('hello world'); // "Hello world"
const price = formatNumber(1234567); // "1,234,567"
```

## 📚 추가 리소스

- [React 공식 문서](https://react.dev/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Vite 공식 문서](https://vitejs.dev/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/)
