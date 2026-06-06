import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";
import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import { Button } from "@/components/base/button";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import type { FileResult } from "@/hooks/useFileCrypto";
import { useFileCrypto } from "@/hooks/useFileCrypto";
import { Input } from "@/components/base/input";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/base/button";
import { formatBytes } from "@/lib/unit";

function Header(props: {
  icon: React.ReactNode;
  title: string;
  maxFileSize: number;
  fileName: string | null;
}) {
  return (
    <CardHeader>
      {props.icon}
      <CardTitle className="flex items-center gap-2">
        {props.title}
        <span className="ml-auto text-sm font-normal text-muted-foreground">
          Max file size: {formatBytes(props.maxFileSize)}
        </span>
      </CardTitle>
      <CardDescription>{props.fileName ?? "No file selected"}</CardDescription>
    </CardHeader>
  );
}

function ActionButton(props: {
  isProcessing: boolean;
  disabled: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <Button disabled={props.disabled} onClick={props.onClick}>
      {props.icon}
      {props.isProcessing ? `${props.label}ing` : `${props.label} file`}
    </Button>
  );
}

export function FileInput(props: {
  maxFileSize: number;
  callback: (
    maxFileSize: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <Input
      type="file"
      onChange={(event) => {
        return props.callback(props.maxFileSize, event);
      }}
    />
  );
}

function ResultDownloadButton(props: { file: FileResult }) {
  return (
    <a
      className={buttonVariants({
        variant: "outline",
        className: "w-full justify-between",
      })}
      href={props.file.url}
      download={props.file.filename}
    >
      <span className="truncate">{props.file.filename}</span>
      <Download aria-hidden="true" />
    </a>
  );
}

export function EncryptFileCard(
  props: React.ComponentPropsWithoutRef<"input"> & {
    maxFileSize: number;
    files: ReturnType<typeof useFileCrypto>;
    keys: ReturnType<typeof useCryptoKeys>;
  },
) {
  return (
    <Card className="rounded-lg">
      <Header
        icon={<LockKeyhole aria-hidden="true" className="size-4" />}
        title={"Encrypt"}
        maxFileSize={props.maxFileSize}
        fileName={props.files.fileToEncrypt?.name ?? null}
      />
      <CardContent className="grid gap-4">
        {props.files.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {props.files.error}
          </div>
        ) : null}
        <FileInput
          maxFileSize={props.maxFileSize}
          callback={props.files.setFileToEncrypt}
        />
        {props.files.fileToEncrypt ? (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="truncate">{props.files.fileToEncrypt.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(props.files.fileToEncrypt.size)}
            </span>
          </div>
        ) : null}
        <ActionButton
          disabled={
            !props.files.fileToEncrypt ||
            !props.keys.publicKey ||
            props.files.isEncrypting
          }
          isProcessing={props.files.isEncrypting}
          icon={<LockKeyhole aria-hidden="true" />}
          onClick={() => props.files.encryptSelectedFile(props.keys.publicKey)}
          label="Encrypt"
        />
        {props.files.encryptedResult ? (
          <ResultDownloadButton file={props.files.encryptedResult} />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DecryptFileCard(
  props: React.ComponentPropsWithoutRef<"input"> & {
    maxFileSize: number;
    files: ReturnType<typeof useFileCrypto>;
    keys: ReturnType<typeof useCryptoKeys>;
  },
) {
  return (
    <Card className="rounded-lg">
      <Header
        icon={<UnlockKeyhole aria-hidden="true" className="size-4" />}
        title={"Decrypt"}
        maxFileSize={props.maxFileSize}
        fileName={props.files.fileToDecrypt?.name ?? null}
      />
      <CardContent className="grid gap-4">
        {props.files.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {props.files.error}
          </div>
        ) : null}
        <FileInput
          maxFileSize={props.maxFileSize}
          callback={props.files.setFileToDecrypt}
        />
        {props.files.fileToDecrypt ? (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="truncate">{props.files.fileToDecrypt.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(props.files.fileToDecrypt.size)}
            </span>
          </div>
        ) : null}
        <ActionButton
          disabled={
            !props.files.fileToDecrypt ||
            !props.keys.privateKey ||
            props.files.isDecrypting
          }
          isProcessing={props.files.isDecrypting}
          icon={<UnlockKeyhole aria-hidden="true" />}
          onClick={() => props.files.decryptSelectedFile(props.keys.privateKey)}
          label="Decrypt"
        />
        {props.files.decryptedResult ? (
          <ResultDownloadButton file={props.files.decryptedResult} />
        ) : null}
      </CardContent>
    </Card>
  );
}
