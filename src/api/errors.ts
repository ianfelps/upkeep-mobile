export class ApiError extends Error {
  readonly status: number;
  readonly raw: unknown;

  constructor(message: string, status: number, raw?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.raw = raw;
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let message = `Erro ${response.status}`;
  let raw: unknown;
  try {
    const data = await response.json();
    raw = data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      message = data.message;
    }
  } catch {
    // swallow json parse errors
  }
  return new ApiError(message, response.status, raw);
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function getErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
