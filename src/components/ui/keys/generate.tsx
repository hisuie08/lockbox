import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { Button } from "@/components/base/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/base/dialog";
import { Check, Copy, KeyRound } from "lucide-react";
import { CardContent, CardTitle } from "../../base/card";
import { useCopyText } from "@/hooks/useClipboard";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../base/input-group";
import { useMemo, useState } from "react";
import {
  canonicalizeRsaJwk,
  exportPrivateKey,
} from "@/crypt/services/genKeyPair";
import { DownloadPrivKey, DownloadPubKey } from "./save";

function useSafeSave() {
  const [isPubSaved, setPubSaved] = useState<boolean>(false);
  const [isPrivSaved, setPrivSaved] = useState<boolean>(false);
  function init() {
    setPrivSaved(false);
    setPubSaved(false);
  }
  const closable = useMemo<boolean>(
    () => isPubSaved && isPrivSaved,
    [isPubSaved, isPrivSaved],
  );
  return {
    init,
    isPubSaved,
    isPrivSaved,
    setPubSaved,
    setPrivSaved,
    closable,
  };
}

function CopyableKeyView(props: {
  generating: boolean;
  keyLabel: string;
  keyText: string;
  asSecret?: boolean;
  callback: (value: boolean) => void;
}) {
  const { copy, copied } = useCopyText();
  const inputType = props.asSecret ? "password" : "text";
  const value = !props.generating ? props.keyText : "Generating...";
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{props.keyLabel}</span>
      <InputGroup>
        <InputGroupInput
          className="overflow-ellipsis"
          readOnly
          value={value}
          type={inputType}
          disabled={!props.keyText}
          onFocus={(event) => {
            event.target.select();
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            className="border-0"
            aria-label="Copy"
            title="Copy"
            size="icon-xs"
            onClick={() => {
              copy(props.keyText, props.keyLabel);
              props.callback(true);
            }}
          >
            {!copied ? (
              <Copy aria-hidden="true" />
            ) : (
              <Check aria-hidden="true" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </label>
  );
}

function ModalContent(props: {
  keys: ReturnType<typeof useCryptoKeys>;
  safeSave: ReturnType<typeof useSafeSave>;
}) {
  const { setPubSaved, setPrivSaved, closable } = props.safeSave;
  return (
    <DialogContent
      showCloseButton={false}
      className="h-auto max-h-[90vh] w-full sm:w-[500px]"
    >
      <CardTitle>New KeyPair</CardTitle>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">FingerPrint</span>
          </label>
          <div className="grid gap-3">
            <CopyableKeyView
              generating={props.keys.isGenerating}
              keyText={props.keys.publicKeyText}
              keyLabel="Public Key"
              callback={() => setPubSaved(true)}
            />
            <CopyableKeyView
              generating={props.keys.isGenerating}
              keyText={props.keys.privateKeyText}
              keyLabel="Private Key"
              asSecret
              callback={() => {
                setPrivSaved(true);
              }}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <DownloadPubKey
            keyText={props.keys.publicKeyText}
            callbackSaved={setPubSaved}
            isGenerating={props.keys.isGenerating}
          />
          <DownloadPrivKey
            keyText={props.keys.privateKeyText}
            callbackSaved={setPrivSaved}
            isGenerating={props.keys.isGenerating}
          />
        </div>
        {closable ? (
          <DialogClose>Close</DialogClose>
        ) : (
          <Button variant={"outline"} disabled={!closable} className="border-0">
            Save both keys before close
          </Button>
        )}
      </CardContent>
    </DialogContent>
  );
}

export function GenerateKeyAction(props: {
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const safeSave = useSafeSave();
  const protectKey = async (open: boolean) => {
    if (!open) {
      if (props.keys.privateKey) {
        const jwk = await exportPrivateKey(props.keys.privateKey);
        props.keys.setPrivateKeyText(canonicalizeRsaJwk(jwk));
      }
    }
  };

  return (
    <Dialog
      modal={true}
      disablePointerDismissal={true}
      onOpenChangeComplete={(open) => {
        protectKey(open);
      }}
    >
      <DialogTrigger>
        <Button
          onClick={() => {
            safeSave.init();
            props.keys.generateKeys();
          }}
          disabled={props.keys.isGenerating}
        >
          <KeyRound aria-hidden="true" />
          {props.keys.isGenerating ? "Generating" : "Generate"}
        </Button>
      </DialogTrigger>
      <ModalContent keys={props.keys} safeSave={safeSave} />
    </Dialog>
  );
}
