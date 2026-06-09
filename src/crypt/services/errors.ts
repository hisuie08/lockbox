export abstract class FileCryptoError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class InputReadError extends FileCryptoError {
  constructor(message:string,cause?: unknown) {
    super(message, cause);
  }
}

export class OutputWriteError extends FileCryptoError{
  constructor(message:string,cause?: unknown) {
    super(message, cause);
  }
}

export class UnexpectedCryptoError extends FileCryptoError {
  constructor(cause?: unknown) {
    super("Unexpected cryptographic error.", cause);
  }
}
