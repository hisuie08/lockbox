import { ALGORITHMS, DEFAULT_CHUNK_SIZE } from "../constants";
import {
  InputReadError,
  OutputWriteError,
  UnexpectedCryptoError,
} from "../errors";
import { getJwkThumbprint } from "../key/validate";
import { createHeader, writeHeader } from "./header";
import { encryptChunk, writeChunk } from "./chunk";

export abstract class EncryptionError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.cause = cause;
  }
}

// X25519-HKDF: 鍵交換
//AES-GCM: ファイル本体暗号化鍵

export async function encryptFileToStream(input: {
  filename: string;
  filetype: string;
  fileSize: number;
  source: ReadableStream<Uint8Array>;
  publicKey: CryptoKey;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  onProgress: (progress: number) => void;
  onSaved: (saved: boolean) => void;
  createdAt?: string;
}): Promise<void> {
  try {
    const chunkSize = DEFAULT_CHUNK_SIZE;
    let processedBytes = 0;

    // 暗号化ヘッダーを生成して先頭へ書き込む
    const publicJwk = await crypto.subtle.exportKey("jwk", input.publicKey);
    const { aesKey, header } = await createHeader({
      ...input,
      recipientPublicKey: input.publicKey,
      recipientThumbprint: await getJwkThumbprint(publicJwk),
      algorithm: ALGORITHMS,
      chunkSize,
    });

    await writeHeader(input.writer, header);

    const reader = input.source.getReader();

    // reader.read()は勝手なサイズで返してくる
    // そこでストリームをチャンクサイズに合わせて自分で切りそろえる
    // チャンク境界をまたぐ端数データを保持する
    let pending = new Uint8Array(0);

    // 入力ストリームを順次読み込みながら暗号化する
    while (true) {
      let result;

      try {
        result = await reader.read();
      } catch (error) {
        throw new InputReadError("Failed to read input file.", error);
      }

      const { done, value } = result;

      if (done) {
        break;
      }

      processedBytes += value.length;
      input.onProgress(processedBytes / input.fileSize);

      // 前回の端数と今回読み込んだデータを結合する
      const merged = new Uint8Array(pending.length + value.length);

      merged.set(pending);
      merged.set(value, pending.length);

      let offset = 0;

      // 完全なチャンク単位で暗号化して出力する
      while (merged.length - offset >= chunkSize) {
        const chunk = merged.slice(offset, offset + chunkSize);

        const encrypted = await encryptChunk(chunk, aesKey);

        await writeChunk(input.writer, encrypted);

        offset += chunkSize;
      }

      // 次回処理する端数を保持する
      pending = merged.slice(offset);
    }

    // 最後に残った端数を暗号化する。
    // 空ファイルでも完全性保護のため空チャンクを1つ保存する。
    if (pending.length > 0 || processedBytes === 0) {
      const encrypted = await encryptChunk(pending, aesKey);
      await writeChunk(input.writer, encrypted);
    }

    // 出力ストリームを正常終了する
    input.onProgress(1);
    try {
      await input.writer.close();
    } catch (error) {
      await input.writer.abort(error);
      throw new OutputWriteError("Failed to write encrypted output.", error);
    }
    input.onSaved(true);
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }

    throw new UnexpectedCryptoError(error);
  }
}
