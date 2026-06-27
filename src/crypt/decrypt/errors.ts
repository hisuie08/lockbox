export abstract class DecryptionError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class InvalidPrivateKeyError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The private key does not match this file.", cause);
  }
}

export class CorruptedFileError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The encrypted file is corrupted or has been modified.", cause);
  }
}

export class InvalidFileSignatureError extends DecryptionError {
  constructor() {
    super("The file is not a supported encrypted file.");
  }
}

export class UnsupportedVersionError extends DecryptionError {
  constructor(version: number) {
    super(`Unsupported file format version: ${version}`);
  }
}



export class InvalidHeaderError extends DecryptionError {
  constructor(cause?: unknown) {
    super("The file header is invalid.", cause);
  }
}
