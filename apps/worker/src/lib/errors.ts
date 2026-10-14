export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.') {
        super('RATE_LIMITED', message, 429);
    }
}

export class QuotaExceededError extends AppError {
    constructor(message: string = 'Hạn mức câu hỏi trong ngày đã hết. Hẹn bạn ngày mai nhé!') {
        super('QUOTA_EXCEEDED', message, 429);
    }
}

export class AuthError extends AppError {
    constructor(message: string = 'Yêu cầu đăng nhập để thực hiện thao tác này.') {
        super('UNAUTHORIZED', message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Bạn không có quyền thực hiện thao tác này.') {
        super('FORBIDDEN', message, 403);
    }
}

export function appErrorHandler(err: unknown, c: any) {
    if (err instanceof AppError || (typeof err === 'object' && err !== null && 'statusCode' in err)) {
        const appErr = err as AppError;
        return c.json({ error: { code: appErr.code, message: appErr.message } }, appErr.statusCode);
    }
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống.' } }, 500);
}
