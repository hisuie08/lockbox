import {
  Copy,
  Download,
  KeyRound,
  LockKeyhole,
  Trash2,
  UnlockKeyhole,
  Upload,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/base/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";
import { Input } from "@/components/base/input";
import { Toaster } from "@/components/base/sonner";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { useFileCrypto } from "@/hooks/useFileCrypto";
import { downloadText } from "@/lib/download";
import { Header } from "./components/ui/header";
import { Algorithmns } from "./components/ui/algorithms";

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Clipboard permission was blocked.");
  }
}

function ResultDownload(props: {
  href: string;
  filename: string;
  label: string;
}) {
  return (
    <a
      className={buttonVariants({
        variant: "outline",
        className: "w-full justify-between",
      })}
      href={props.href}
      download={props.filename}
    >
      <span className="truncate">{props.label}</span>
      <Download aria-hidden="true" />
    </a>
  );
}

function App() {
  const keys = useCryptoKeys();
  const files = useFileCrypto();
  const errors = [keys.error, files.error].filter(
    (error): error is string => Boolean(error),
  );

  useEffect(() => {
    if (keys.error) {
      toast.error(keys.error);
    }
  }, [keys.error]);

  useEffect(() => {
    if (files.error) {
      toast.error(files.error);
    }
  }, [files.error]);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Header privateKey={keys.privateKey} publicKey={keys.publicKey} />

        {errors.length > 0 ? (
          <div className="grid gap-2">
            {errors.map((error) => (
              <div
                className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                key={error}
              >
                {error}
              </div>
            ))}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound aria-hidden="true" className="size-4" />
                Keys
              </CardTitle>
              <CardDescription>JWK import/export</CardDescription>
              <CardAction>
                <Button
                  onClick={keys.generateKeys}
                  disabled={keys.isGenerating}
                >
                  <KeyRound aria-hidden="true" />
                  {keys.isGenerating ? "Generating" : "Generate"}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Public key</span>
                  <textarea
                    className="min-h-52 resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    spellCheck={false}
                    value={keys.publicKeyText}
                    onChange={(event) =>
                      keys.setPublicKeyText(event.target.value)
                    }
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Private key</span>
                  <textarea
                    className="min-h-52 resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    spellCheck={false}
                    value={keys.privateKeyText}
                    onChange={(event) => {
                      keys.setPrivateKeyText(event.target.value);
                    }}
                    onFocus={(event) => {
                      event.target.select();
                    }}
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" onClick={keys.importPublicKeyText}>
                  <Upload aria-hidden="true" />
                  Load public
                </Button>
                <Button variant="outline" onClick={keys.importPrivateKeyText}>
                  <Upload aria-hidden="true" />
                  Load private
                </Button>
                <Button
                  variant="outline"
                  disabled={!keys.publicKeyText}
                  onClick={() =>
                    downloadText(
                      keys.publicKeyText,
                      "lockbox-public-key.jwk.json",
                    )
                  }
                >
                  <Download aria-hidden="true" />
                  Public JWK
                </Button>
                <Button
                  variant="outline"
                  disabled={!keys.privateKeyText}
                  onClick={() =>
                    downloadText(
                      keys.privateKeyText,
                      "lockbox-private-key.jwk.json",
                    )
                  }
                >
                  <Download aria-hidden="true" />
                  Private JWK
                </Button>
                <Button
                  variant="ghost"
                  disabled={!keys.publicKeyText}
                  onClick={() => copyText(keys.publicKeyText, "Public key")}
                >
                  <Copy aria-hidden="true" />
                  Copy public
                </Button>
                <Button
                  variant="ghost"
                  disabled={!keys.privateKeyText}
                  onClick={() => copyText(keys.privateKeyText, "Private key")}
                >
                  <Copy aria-hidden="true" />
                  Copy private
                </Button>
                <Button
                  variant="destructive"
                  disabled={!keys.privateKey && !keys.privateKeyText}
                  onClick={keys.clearPrivateKey}
                >
                  <Trash2 aria-hidden="true" />
                  Clear private
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole aria-hidden="true" className="size-4" />
                  Encrypt
                </CardTitle>
                <CardDescription>
                  {files.fileToEncrypt?.name ?? "No file selected"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Input
                  type="file"
                  onChange={(event) => {
                    files.setFileToEncrypt(event.target.files?.[0] ?? null);
                  }}
                />
                {files.fileToEncrypt ? (
                  <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="truncate">{files.fileToEncrypt.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatBytes(files.fileToEncrypt.size)}
                    </span>
                  </div>
                ) : null}
                <Button
                  disabled={
                    !files.fileToEncrypt ||
                    !keys.publicKey ||
                    files.isEncrypting
                  }
                  onClick={() => files.encryptSelectedFile(keys.publicKey)}
                >
                  <LockKeyhole aria-hidden="true" />
                  {files.isEncrypting ? "Encrypting" : "Encrypt file"}
                </Button>
                {files.encryptedResult ? (
                  <ResultDownload
                    href={files.encryptedResult.url}
                    filename={files.encryptedResult.filename}
                    label={files.encryptedResult.filename}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UnlockKeyhole aria-hidden="true" className="size-4" />
                  Decrypt
                </CardTitle>
                <CardDescription>
                  {files.fileToDecrypt?.name ?? "No file selected"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Input
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    files.setFileToDecrypt(event.target.files?.[0] ?? null);
                  }}
                />
                {files.fileToDecrypt ? (
                  <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="truncate">{files.fileToDecrypt.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatBytes(files.fileToDecrypt.size)}
                    </span>
                  </div>
                ) : null}
                <Button
                  disabled={
                    !files.fileToDecrypt ||
                    !keys.privateKey ||
                    files.isDecrypting
                  }
                  onClick={() => files.decryptSelectedFile(keys.privateKey)}
                >
                  <UnlockKeyhole aria-hidden="true" />
                  {files.isDecrypting ? "Decrypting" : "Decrypt file"}
                </Button>
                {files.decryptedResult ? (
                  <ResultDownload
                    href={files.decryptedResult.url}
                    filename={files.decryptedResult.filename}
                    label={files.decryptedResult.filename}
                  />
                ) : null}
              </CardContent>
            </Card>
            <Algorithmns />
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}

export default App;
