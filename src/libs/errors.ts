export type AppErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "PERMISSION_DENIED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_BALANCE"
  | "PAYMENT_FAILED"
  | "PAYMENT_REQUIRED"
  | "REFUND_FAILED"
  | "WALLET_ERROR"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export type AppError = {
  code: AppErrorCode;
  message: string;
  technicalMessage?: string;
  cause?: unknown;
};

const SAFE_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: "Please sign in to continue.",
  AUTH_INVALID: "Your session could not be verified. Please sign in again.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  VALIDATION_ERROR: "Please check the information provided and try again.",
  NOT_FOUND: "The requested information could not be found.",
  CONFLICT: "This action could not be completed because the information has changed.",
  INSUFFICIENT_BALANCE: "Your wallet balance is insufficient for this transaction.",
  PAYMENT_FAILED: "Payment could not be completed. Please try again.",
  PAYMENT_REQUIRED: "Please complete payment before continuing.",
  REFUND_FAILED: "The refund could not be processed. Please try again.",
  WALLET_ERROR: "There was a problem with your wallet. Please try again.",
  NETWORK_ERROR: "A network error occurred. Please check your connection and try again.",
  SERVER_ERROR: "Something went wrong on our server. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

const TECHNICAL_PATTERNS: Array<{
  code: AppErrorCode;
  patterns: string[];
}> = [
  {
    code: "AUTH_INVALID",
    patterns: [
      "jwt",
      "invalid jwt",
      "invalid token",
      "token expired",
      "session not found",
      "refresh token",
      "authentication",
      "unauthorized",
    ],
  },
  {
    code: "PERMISSION_DENIED",
    patterns: [
      "permission denied",
      "not allowed",
      "forbidden",
      "row-level security",
      "rls",
      "insufficient privileges",
    ],
  },
  {
    code: "INSUFFICIENT_BALANCE",
    patterns: [
      "insufficient balance",
      "insufficient funds",
      "wallet balance",
      "not enough balance",
    ],
  },
  {
    code: "PAYMENT_FAILED",
    patterns: [
      "payment failed",
      "payment could not",
      "transaction failed",
      "charge failed",
      "flutterwave",
      "payment provider",
    ],
  },
  {
    code: "PAYMENT_REQUIRED",
    patterns: [
      "payment required",
      "order is unpaid",
      "unpaid order",
      "payment not completed",
    ],
  },
  {
    code: "REFUND_FAILED",
    patterns: [
      "refund failed",
      "refund could not",
      "refund_error",
      "refund error",
      "refund processing",
      "refund",
    ],
  },
  {
    code: "WALLET_ERROR",
    patterns: [
      "wallet error",
      "wallet not found",
      "wallet inactive",
      "wallet transaction",
      "customer wallet",
    ],
  },
  {
    code: "NOT_FOUND",
    patterns: [
      "not found",
      "does not exist",
      "could not be found",
      "no rows",
    ],
  },
  {
    code: "CONFLICT",
    patterns: [
      "duplicate",
      "already exists",
      "unique constraint",
      "conflict",
      "already completed",
      "already processed",
    ],
  },
  {
    code: "VALIDATION_ERROR",
    patterns: [
      "invalid",
      "required",
      "must be",
      "validation",
      "check constraint",
      "violates check",
      "invalid input",
    ],
  },
  {
    code: "NETWORK_ERROR",
    patterns: [
      "failed to fetch",
      "network error",
      "network request failed",
      "fetch failed",
      "connection",
      "timeout",
    ],
  },
  {
    code: "SERVER_ERROR",
    patterns: [
      "edge function returned",
      "edge function error",
      "internal server error",
      "internal error",
      "server error",
      "database error",
      "postgres",
      "supabase",
    ],
  },
];

function extractTechnicalMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object"
  ) {
    const value = error as Record<string, unknown>;

    if (typeof value.message === "string") {
      return value.message;
    }

    if (typeof value.error === "string") {
      return value.error;
    }

    if (typeof value.details === "string") {
      return value.details;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown application error.";
    }
  }

  return "Unknown application error.";
}

function findErrorCode(
  technicalMessage: string,
): AppErrorCode {
  const normalized =
    technicalMessage.toLowerCase();

  for (const entry of TECHNICAL_PATTERNS) {
    if (
      entry.patterns.some((pattern) =>
        normalized.includes(pattern),
      )
    ) {
      return entry.code;
    }
  }

  return "UNKNOWN_ERROR";
}

export function createAppError(
  error: unknown,
  fallbackCode: AppErrorCode = "UNKNOWN_ERROR",
): AppError {
  const technicalMessage =
    extractTechnicalMessage(error);

  const detectedCode =
    findErrorCode(technicalMessage);

  const code =
    detectedCode !== "UNKNOWN_ERROR"
      ? detectedCode
      : fallbackCode;

  return {
    code,
    message: SAFE_MESSAGES[code],
    technicalMessage,
    cause: error,
  };
}

export function getSafeErrorMessage(
  error: unknown,
  fallbackCode: AppErrorCode = "UNKNOWN_ERROR",
): string {
  return createAppError(
    error,
    fallbackCode,
  ).message;
}

export function getErrorCode(
  error: unknown,
  fallbackCode: AppErrorCode = "UNKNOWN_ERROR",
): AppErrorCode {
  return createAppError(
    error,
    fallbackCode,
  ).code;
}

export function logAppError(
  context: string,
  error: unknown,
): AppError {
  const appError =
    createAppError(error);

  console.error(
    `[IyanjuWorld] ${context}`,
    {
      code: appError.code,
      technicalMessage:
        appError.technicalMessage,
      error: appError.cause,
    },
  );

  return appError;
}

export function handleAppError(
  context: string,
  error: unknown,
  fallbackCode: AppErrorCode = "UNKNOWN_ERROR",
): string {
  const appError =
    createAppError(
      error,
      fallbackCode,
    );

  console.error(
    `[IyanjuWorld] ${context}`,
    {
      code: appError.code,
      technicalMessage:
        appError.technicalMessage,
      error: appError.cause,
    },
  );

  return appError.message;
}
