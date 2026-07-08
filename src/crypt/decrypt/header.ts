import { BufferedReader } from "../bufferio/bufferReader";
import { BYTE_LENGTHS, FILE_SIGNATURE, FORMAT_VERSION } from "../constants";
import type { EncryptedFileHeader } from "../types";
import {
  InvalidFileSignatureError,
  InvalidHeaderError,
  UnsupportedVersionError,
} from "./errors";

const decoder = new TextDecoder();

export async function readHeader(
  reader: BufferedReader,
): Promise<EncryptedFileHeader> {
  const signature = decoder.decode(
    await reader.readBytes(BYTE_LENGTHS.FILE_SIGNATURE),
  );

  if (signature !== FILE_SIGNATURE) {
    throw new InvalidFileSignatureError();
  }

  const version = (await reader.readBytes(BYTE_LENGTHS.FORMAT_VERSION))[0];

  if (version !== FORMAT_VERSION) {
    throw new UnsupportedVersionError(version);
  }

  const headerLengthBytes = await reader.readBytes(BYTE_LENGTHS.HEADER_LENGTH);

  const headerLength = new DataView(headerLengthBytes.buffer).getUint32(0);

  const headerBytes = await reader.readBytes(headerLength);

  try {
    return JSON.parse(decoder.decode(headerBytes)) as EncryptedFileHeader;
  } catch (error) {
    throw new InvalidHeaderError(error);
  }
}
