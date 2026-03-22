const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const PYTHON_SERVICE_SECRET = process.env.PYTHON_SERVICE_SECRET || "";

interface PythonClientOptions {
  timeout?: number;
}

class PythonClient {
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = PYTHON_SERVICE_URL;
    this.secret = PYTHON_SERVICE_SECRET;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: PythonClientOptions = {},
  ): Promise<T> {
    const { timeout = 30000 } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": this.secret,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `Python service error: ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, options?: PythonClientOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body: unknown, options?: PythonClientOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }
}

export const pythonClient = new PythonClient();
