import { YouTubeMcpErrorCode } from "./codes.js";

export interface QuotaSummary {
  used: number;
  budget: number;
  remaining: number;
  resetAt: string;
  warningLevel: "ok" | "warn" | "critical";
  costOfThisCall: number;
}

export interface ApiErrorDetail {
  status: number;
  reason: string;
  domain: string;
}

export interface McpErrorResponse {
  success: false;
  error: {
    code: YouTubeMcpErrorCode;
    message: string;
    detail?: string;
    suggestedFix?: string;
    retryable: boolean;
    retryAfterMs?: number;
    docsUrl?: string;
    apiError?: ApiErrorDetail;
  };
  quota: QuotaSummary;
}

export interface McpSuccessResponse<T> {
  success: true;
  data: T;
  quota: QuotaSummary;
}

export class YouTubeMcpError extends Error {
  readonly code: YouTubeMcpErrorCode;
  readonly retryable: boolean;
  readonly suggestedFix?: string;
  readonly retryAfterMs?: number;
  readonly docsUrl?: string;
  readonly apiError?: ApiErrorDetail;

  constructor(
    code: YouTubeMcpErrorCode,
    message: string,
    options?: {
      retryable?: boolean;
      suggestedFix?: string;
      retryAfterMs?: number;
      docsUrl?: string;
      apiError?: ApiErrorDetail;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "YouTubeMcpError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.suggestedFix = options?.suggestedFix;
    this.retryAfterMs = options?.retryAfterMs;
    this.docsUrl = options?.docsUrl;
    this.apiError = options?.apiError;
  }
}
