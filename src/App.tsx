import { useEffect } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/base/sonner";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { useFileCrypto } from "@/hooks/useFileCrypto";
import { Header } from "@/components/ui/header";
import { Algorithmns } from "@/components/ui/algorithms";
import { DecryptFileCard, EncryptFileCard } from "@/components/ui/file";
import { KeyControlCard } from "./components/ui/keys/card";
import { ErrorView } from "./components/ui/error";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024;

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

        <ErrorView errors={errors} />

        <section className="grid gap-6 lg:grid-cols-[0.3fr_0.9fr]">
          <KeyControlCard keys={keys} />

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
