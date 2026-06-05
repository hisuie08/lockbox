import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { Button } from "@/components/base/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/base/dialog";
import { Check, Copy, Download, KeyRound } from "lucide-react";
import { CardContent, CardTitle } from "../../base/card";
import { downloadText } from "@/lib/download";
import { useCopyText } from "@/hooks/useClipboard";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../base/input-group";
import { useMemo, useState } from "react";

function useSafeSave() {
  const [isPubSaved, setPubSaved] = useState<boolean>(false);
  const [isPrivSaved, setPrivSaved] = useState<boolean>(false);
  const closable = useMemo<boolean>(
    () => isPubSaved && isPrivSaved,
    [isPubSaved, isPrivSaved],
  );
  return {
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

function ModalContent(props: { keys: ReturnType<typeof useCryptoKeys> }) {
  const { closable, setPubSaved, setPrivSaved } = useSafeSave();

  return (
    <DialogContent
      showCloseButton={false}
      className="h-auto max-h-[90vh] w-full sm:w-[500px]"
    >
      <CardTitle>New KeyPair</CardTitle>
      <CardContent className="grid gap-5">
        <span className="text-sm font-medium">FingerPrint</span>
        {!props.keys.isGenerating ? (
          <span>{props.keys.publicKeyThumbprint}</span>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
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
          <Button
            variant="outline"
            disabled={!props.keys.publicKeyText}
            onClick={() => {
              downloadText(
                props.keys.publicKeyText,
                "lockbox-public-key.jwk.json",
              );
              setPubSaved(true);
            }}
          >
            <Download aria-hidden="true" />
            Public Key
          </Button>
          <Button
            variant="outline"
            disabled={!props.keys.privateKeyText}
            onClick={() => {
              downloadText(
                props.keys.privateKeyText,
                "lockbox-private-key.jwk.json",
              );
              setPrivSaved(true);
            }}
          >
            <Download aria-hidden="true" />
            Private Key
          </Button>
        </div>
        <DialogClose>
          <Button variant={"ghost"} disabled={!closable}>
            {closable ? "Close" : "Save both keys before close"}
          </Button>
        </DialogClose>
      </CardContent>
    </DialogContent>
  );
}

export function GenerateKeyAction(props: {
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  return (
    <Dialog modal={true} disablePointerDismissal={true}>
      <DialogTrigger>
        <Button
          onClick={props.keys.generateKeys}
          disabled={props.keys.isGenerating}
        >
          <KeyRound aria-hidden="true" />
          {props.keys.isGenerating ? "Generating" : "Generate"}
        </Button>
      </DialogTrigger>
      <ModalContent keys={props.keys} />
    </Dialog>
  );
}
