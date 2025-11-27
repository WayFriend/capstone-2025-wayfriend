/// <reference types="@vercel/node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACKEND_URL?: string;
    }
  }

  const Buffer: {
    from(data: ArrayBuffer): Buffer;
    from(data: string, encoding?: string): Buffer;
  };

  const process: {
    env: NodeJS.ProcessEnv;
  };

  const console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
  };

  const fetch: (url: string, init?: RequestInit) => Promise<Response>;

  class Blob {
    constructor(parts?: any[], options?: any);
    arrayBuffer(): Promise<ArrayBuffer>;
  }
}

export {};

