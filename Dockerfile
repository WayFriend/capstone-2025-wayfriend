# 베이스 이미지
FROM python:3.11-slim

# 시스템 패키지 설치 (bcrypt/passlib 빌드용 + OpenCV 의존성)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libpq-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# libGL.so.1 더미 라이브러리 생성 (OpenCV headless 환경에서 필요)
# Debian Trixie에서는 libgl1-mesa-glx가 제거되어 더미 라이브러리 사용
# OpenCV가 필요로 하는 주요 OpenGL 함수들을 포함한 더미 라이브러리 생성
RUN mkdir -p /usr/lib/x86_64-linux-gnu && \
    printf '%s\n' \
        '/* Dummy libGL.so.1 for OpenCV headless */' \
        '#include <stdlib.h>' \
        '/* glX functions */' \
        'void* glXGetProcAddressARB(const char* name) { return NULL; }' \
        'void* glXGetProcAddress(const char* name) { return NULL; }' \
        'int glXMakeCurrent(void* dpy, void* drawable, void* ctx) { return 0; }' \
        'void* glXGetCurrentContext(void) { return NULL; }' \
        'int glXSwapBuffers(void* dpy, void* drawable) { return 0; }' \
        '/* OpenGL functions */' \
        'void glMatrixMode(unsigned int mode) {}' \
        'void glLoadIdentity(void) {}' \
        'void glLoadMatrixf(const float* m) {}' \
        'void glLoadMatrixd(const double* m) {}' \
        'void glPushMatrix(void) {}' \
        'void glPopMatrix(void) {}' \
        'void glOrtho(double left, double right, double bottom, double top, double near, double far) {}' \
        'void glTranslatef(float x, float y, float z) {}' \
        'void glRotatef(float angle, float x, float y, float z) {}' \
        'void glScalef(float x, float y, float z) {}' \
        'void glBegin(unsigned int mode) {}' \
        'void glEnd(void) {}' \
        'void glVertex2f(float x, float y) {}' \
        'void glVertex3f(float x, float y, float z) {}' \
        'void glColor3f(float r, float g, float b) {}' \
        'void glColor4f(float r, float g, float b, float a) {}' \
        'void glClear(unsigned int mask) {}' \
        'void glClearColor(float r, float g, float b, float a) {}' \
        'void glFlush(void) {}' \
        'void glFinish(void) {}' \
        > /tmp/dummy_gl.c && \
    gcc -shared -fPIC -Wl,-soname,libGL.so.1 -o /usr/lib/x86_64-linux-gnu/libGL.so.1 /tmp/dummy_gl.c -lm && \
    rm -f /tmp/dummy_gl.c && \
    echo "libGL.so.1 dummy library created successfully"

# 작업 디렉토리
WORKDIR /app

# requirements.txt 먼저 복사 (캐시 최적화)
COPY requirements.txt .

# 파이썬 패키지 설치
# PyTorch CPU 버전을 위한 extra-index-url 추가
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# 백엔드 코드 복사
COPY ./backend ./backend

# 환경 변수
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Seoul
ENV PYTHONPATH=/app/backend
# OpenCV headless 환경 설정 (libGL 우회)
ENV QT_QPA_PLATFORM=offscreen
ENV DISPLAY=:99

# 포트 노출
EXPOSE 8000

# FastAPI 실행 (운영 환경)
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "backend.main:app", "--bind", "0.0.0.0:8000", "--workers", "4"]
