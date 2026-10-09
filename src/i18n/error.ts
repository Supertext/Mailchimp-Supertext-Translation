// Shared by the server and the browser (no server-only code here).

export type MessageParams = Record<string, string | number>;

/**
 * An error whose English `message` goes to logs, while `code` and `params`
 * let the UI show it in the merchant's admin language (`error.<code>` in the
 * message files). `detail` is extra text from Supertext or Wix; it is
 * shown as it is, untranslated.
 */
export class LocalizedError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly params: MessageParams = {},
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "LocalizedError";
  }
}

/** An error in a form the UI can translate: plain data, so it survives JSON and the database. */
export interface ErrorInfo {
  message: string;
  code?: string;
  params?: MessageParams;
  detail?: string;
}

export function errorInfo(error: unknown): ErrorInfo {
  if (error instanceof LocalizedError) {
    return {
      message: error.message,
      code: error.code,
      params: error.params,
      ...(error.detail ? { detail: error.detail } : {}),
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}
