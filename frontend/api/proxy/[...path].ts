import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://34.239.248.132:8000';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  // 쿼리 문자열 처리
  const queryString = req.url?.includes('?')
    ? req.url.substring(req.url.indexOf('?'))
    : '';

  const url = `${BACKEND_URL}/${pathString}${queryString}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Authorization 헤더 전달
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' && req.body
        ? JSON.stringify(req.body)
        : undefined,
    });

    const data = await response.json().catch(() => ({}));

    // 응답 헤더 복사
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error?.message || 'Unknown error'
    });
  }
}

