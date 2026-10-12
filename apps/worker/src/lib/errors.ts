export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.") {
    super("RATE_LIMITED", message, 429);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = "Hạn mức câu hỏi trong ngày đã hết. Hẹn bạn ngày mai nhé!") {
    super("QUOTA_EXCEEDED", message, 429);
  }
}
