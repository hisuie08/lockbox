import { Button } from "@/components/base/button";
import { downloadText } from "@/lib/download";
import { Download } from "lucide-react";

export function DownloadPubKey(props: {
  keyText: string;
  isGenerating: boolean;
  callbackSaved: (_: boolean) => void;
}) {
  return (
    <Button
      variant="outline"
      disabled={!props.keyText || props.isGenerating}
      onClick={() => {
        downloadText(props.keyText, "lockbox-public-key.jwk.json");
        props.callbackSaved(true);
      }}
    >
      <Download aria-hidden="true" />
      Public Key
    </Button>
  );
}

export function DownloadPrivKey(props: {
  keyText: string;
  isGenerating: boolean;
  callbackSaved: (_: boolean) => void;
}) {
  return (
    <Button
      variant="outline"
      disabled={!props.keyText || props.isGenerating}
      onClick={() => {
        downloadText(props.keyText, "lockbox-private-key.jwk.json");
        props.callbackSaved(true);
      }}
    >
      <Download aria-hidden="true" />
      Private Key
    </Button>
  );
}
