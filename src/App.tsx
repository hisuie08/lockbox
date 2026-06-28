import { Toaster } from "@/components/base/sonner";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { Header } from "@/components/ui/header";
import { Algorithmns } from "@/components/ui/algorithms";
import { KeyControlCard } from "./components/ui/keys/card";
import { useStreamSupport } from "./hooks/useStreamSupport";
import { AlertStreamNotSupported } from "./components/ui/static";
import { EncryptFileCard } from "@/components/ui/file/encrypt";
import { useFileDecrypt, useFileEncrypt } from "./hooks/useFileCryptoStream";
import { DecryptFileCard } from "./components/ui/file/decrypt";
import { useShareLink } from "./hooks/useShareLink";

const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024;
const WARNING_FILE_SIZE = 500 * 1024 * 1024;

function App() {
  const keys = useCryptoKeys();

  const streamSupported = useStreamSupport();
  const option = {
    streamSupport: streamSupported,
    maxFileSize: MAX_FILE_SIZE,
    warnFileSize: WARNING_FILE_SIZE,
  };
  const enc = useFileEncrypt(option);
  const dec = useFileDecrypt(option);
  const { loadLink } = useShareLink();

  // 公開鍵共有URL形式を読み込む
  // ?kty=OKP&crv=X25519&x=ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
  onload = async () => {
    const publicJwk = loadLink();
    if (publicJwk != null) await keys.importPublicJwk(publicJwk);
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <Header privateKey={keys.privateKey} publicKey={keys.publicKey} />
        {streamSupported.isSupported ? null : <AlertStreamNotSupported />}
        <section className="grid gap-6 lg:grid-cols-[0.3fr_0.9fr]">
          <KeyControlCard keys={keys} />

          <div className="grid gap-6">
            <EncryptFileCard files={enc} keys={keys} />
            <DecryptFileCard files={dec} keys={keys} />

            <Algorithmns />
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" />
    </main>
  );
}

export default App;
