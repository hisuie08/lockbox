export abstract class KeyPairError extends Error {
  override cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

export class KeyGenerationError extends KeyPairError {
  constructor(cause?: unknown) {
    super("key generation failed", cause);
  }
}

export class KeyImportError extends KeyPairError {
  constructor(keytype: string, cause?: unknown) {
    super(`JWK must be a valid X25519 ${keytype} key.`, cause);
  }
}

export class KeyParseError extends KeyPairError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class KeyExportError extends KeyPairError {
  constructor(cause?: unknown) {
    super("Failed to export key.", cause);
  }
}
