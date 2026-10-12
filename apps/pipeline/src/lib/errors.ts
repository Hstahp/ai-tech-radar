export class BaseError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SourceFetchError extends BaseError {
  constructor(sourceKey: string, message: string) {
    super(`[${sourceKey}] ${message}`, "SOURCE_FETCH_ERROR");
  }
}

export class LlmValidationError extends BaseError {
  constructor(message: string) {
    super(message, "LLM_VALIDATION_ERROR");
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string) {
    super(message, "DATABASE_ERROR");
  }
}
