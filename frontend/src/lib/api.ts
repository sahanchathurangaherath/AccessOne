export type ProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  code?: string;
  reference?: string;
  fieldErrors?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? "Request failed");
    this.name = "ApiError";
  }

  get status() { return this.problem.status; }
  get fieldErrors() { return this.problem.fieldErrors; }
}

/** Spring writes XSRF-TOKEN as a readable cookie; we echo it in a header. */
function csrfToken(): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, method = "GET", ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const token = csrfToken();
    if (token) finalHeaders["X-XSRF-TOKEN"] = token;
  }

  const response = await fetch(`/api/v1${path}`, {
    ...rest,
    method,
    headers: finalHeaders,
    // Same-origin thanks to the Next.js rewrite proxy — no CORS anywhere.
    credentials: "same-origin",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    let problem: ProblemDetail = { status: response.status };
    try {
      problem = { ...problem, ...(await response.json()) };
    } catch {
      problem.detail = response.statusText;
    }
    throw new ApiError(problem);
  }

  return (await response.json()) as T;
}

export const http = {
  get:   <T>(path: string) => api<T>(path),
  post:  <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body }),
  put:   <T>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body }),
  del:   <T>(path: string) => api<T>(path, { method: "DELETE" }),
};
