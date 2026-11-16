// ENCFILE2 v4 のチャンク認証に使う AAD (Additional Authenticated Data)。
//
// AAD はファイルには保存されない。暗号化側と復号側が、それぞれの知る
// 文脈（ヘッダーバイト列、チャンクの位置、最終チャンクかどうか）から
// 同じバイト列を組み立て、AES-GCM の additionalData として渡す。
// 文脈が少しでも食い違えばタグ検証が落ちるため、チャンクの入れ替え・
// 並べ替え・切り捨てと、ヘッダーの改竄を検出できる。

const AAD_DOMAIN = "ENCFILE2-v4-chunk";
const domainBytes = new TextEncoder().encode(AAD_DOMAIN);

export const HEADER_HASH_LENGTH = 32;
const CHUNK_INDEX_LENGTH = 8;
const FINAL_FLAG_LENGTH = 1;

export const AAD_LENGTH =
  domainBytes.length +
  HEADER_HASH_LENGTH +
  CHUNK_INDEX_LENGTH +
  FINAL_FLAG_LENGTH;

// ヘッダーバイト列（プリアンブルの直後に置かれた JSON の生バイト列）の
// SHA-256 ハッシュ。暗号化側は書き込んだバイト列に対して、復号側は
// 読み取ったバイト列に対して計算する。再シリアライズした JSON では
// なく、生バイト列をそのままハッシュすること。
export async function hashHeaderBytes(
  headerBytes: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    headerBytes as BufferSource,
  );
  return new Uint8Array(digest);
}

// チャンク1つ分の AAD を組み立てる。
// レイアウト（全58バイト）:
//   ドメイン文字列 "ENCFILE2-v4-chunk" (17)
//   || ヘッダーハッシュ (32)
//   || チャンク番号 (uint64 ビッグエンディアン)
//   || 最終フラグ (最終チャンクなら 0x01、それ以外は 0x00)
export function buildChunkAad(
  headerHash: Uint8Array,
  chunkIndex: number,
  isFinal: boolean,
): Uint8Array<ArrayBuffer> {
  if (headerHash.length !== HEADER_HASH_LENGTH) {
    throw new RangeError(
      `headerHash must be ${HEADER_HASH_LENGTH} bytes, got ${headerHash.length}`,
    );
  }
  if (!Number.isSafeInteger(chunkIndex) || chunkIndex < 0) {
    throw new RangeError(
      `chunkIndex must be a non-negative safe integer, got ${chunkIndex}`,
    );
  }

  const aad = new Uint8Array(AAD_LENGTH);
  const view = new DataView(aad.buffer);
  let offset = 0;
  aad.set(domainBytes, offset);
  offset += domainBytes.length;
  aad.set(headerHash, offset);
  offset += HEADER_HASH_LENGTH;
  view.setBigUint64(offset, BigInt(chunkIndex), false);
  offset += CHUNK_INDEX_LENGTH;
  aad[offset] = isFinal ? 0x01 : 0x00;
  return aad;
}
