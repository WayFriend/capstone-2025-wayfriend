// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://34.239.248.132:8000';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 함수가 호출되었는지 확인하는 로그
  console.log('[Proxy] 함수가 호출되었습니다!', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers
  });

  // 모든 HTTP 메서드 허용
  if (req.method === 'OPTIONS') {
    // CORS preflight 처리
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  // 쿼리 문자열 처리
  const queryString = req.url?.includes('?')
    ? req.url.substring(req.url.indexOf('?'))
    : '';

  // 경로가 비어있으면 에러 반환
  if (!pathString) {
    console.error('[Proxy] 경로가 비어있습니다:', { path, query: req.query, url: req.url });
    res.status(400).json({
      error: 'Invalid path',
      message: 'Path is required',
      received: { path, query: req.query, url: req.url }
    });
    return;
  }

  const url = `${BACKEND_URL}/${pathString}${queryString}`;

  console.log(`[Proxy] ${req.method} ${req.url}`);
  console.log(`[Proxy] Path:`, path);
  console.log(`[Proxy] PathString:`, pathString);
  console.log(`[Proxy] Backend URL:`, url);
  console.log(`[Proxy] Body:`, req.body);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Authorization 헤더 전달
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }

    // 요청 본문 처리
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, {
      method: req.method || 'GET',
      headers,
      body,
    });

    const contentType = response.headers.get('content-type');

    // 응답 헤더 복사 (CORS 관련 제외)
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        res.setHeader(key, value);
      }
    });

    // Content-Type에 따라 응답 처리
    if (contentType?.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      res.status(response.status).json(data);
    } else if (contentType?.includes('text/')) {
      const text = await response.text().catch(() => '');
      res.status(response.status).send(text);
    } else {
      // 기타 타입은 blob으로 처리
      const blob = await response.blob().catch(() => new Blob());
      const buffer = await blob.arrayBuffer();
      // Node.js Buffer 사용 (Vercel 환경에서 사용 가능)
      res.status(response.status).send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error?.message || 'Unknown error',
      url: url
    });
  }
}



