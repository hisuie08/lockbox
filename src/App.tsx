import { Copy, Download, KeyRound, Trash2, Upload } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/base/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";
import { Toaster } from "@/components/base/sonner";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { useFileCrypto } from "@/hooks/useFileCrypto";
import { downloadText } from "@/lib/download";
import { Header } from "@/components/ui/header";
import { Algorithmns } from "@/components/ui/algorithms";
import { DecryptFileCard, EncryptFileCard } from "@/components/ui/file";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Clipboard permission was blocked.");
  }
}

function App() {
  const keys = useCryptoKeys();
  const files = useFileCrypto();
  const errors = [keys.error, files.error].filter((error): error is string =>
    Boolean(error),
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
                    onFocus={(event) => {
                      event.target.select();
                    }}
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
            <EncryptFileCard
              files={files}
              keys={keys}
              maxFileSize={MAX_FILE_SIZE}
            />
            <DecryptFileCard
              files={files}
              keys={keys}
              maxFileSize={MAX_FILE_SIZE}
            />

            <Algorithmns />
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}

export default App;
