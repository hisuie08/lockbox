import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { Button } from "@/components/base/button";
import { Dialog, DialogContent } from "@/components/base/dialog";
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
import { DownloadPrivKey, DownloadPubKey } from "./save";
import type { LockBoxJwk } from "@/crypt";
import { useDialog } from "@/hooks/useDialog";

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
          className="text-ellipsis"
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

export function GenerateKeyAction(props: {
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const { isOpen, setOpen } = useDialog();
  const [pubKey, setPubKey] = useState<LockBoxJwk | null>(null);
  const [privKey, setPrivKey] = useState<LockBoxJwk | null>(null);
  const { setPubSaved, setPrivSaved, closable, init } = useSafeSave();
  async function generate() {
    const { publicJwk, privateJwk } = await props.keys.generateKeys();
    setPubKey(publicJwk);
    setPrivKey(privateJwk);
  }
  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setOpen}>
      <Button
        onClick={() => {
          setOpen(true);
          init();
          generate();
        }}
        disabled={props.keys.isGenerating}
      >
        <KeyRound aria-hidden="true" />
        {props.keys.isGenerating ? "作成中" : "新規鍵ペア"}
      </Button>
      <DialogContent
        showCloseButton={false}
        className="h-auto max-h-[90vh] w-full sm:w-[500px]"
      >
        <CardTitle>新しい鍵ペアの作成</CardTitle>
        <CardContent className="grid gap-5">
          <div className="grid gap-3">
            <div className="grid gap-3">
              <CopyableKeyView
                generating={props.keys.isGenerating}
                keyText={JSON.stringify(pubKey)}
                keyLabel="公開鍵"
                callback={() => setPubSaved(true)}
              />
              <CopyableKeyView
                generating={props.keys.isGenerating}
                keyText={JSON.stringify(privKey)}
                keyLabel="秘密鍵"
                asSecret
                callback={() => {
                  setPrivSaved(true);
                }}
              />
              <span className="text-destructive">
                秘密鍵は決して他人に共有しないでください
              </span>
              <span className="text-destructive">
                これらの鍵ペアは今しか表示されません。確実に保存してください
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <DownloadPubKey
              keyText={JSON.stringify(pubKey)}
              callbackSaved={setPubSaved}
              isGenerating={props.keys.isGenerating}
            />
            <DownloadPrivKey
              keyText={JSON.stringify(privKey)}
              callbackSaved={setPrivSaved}
              isGenerating={props.keys.isGenerating}
            />
          </div>
          <Button
            disabled={!closable}
            onClick={() => {
              props.keys.importPublicJwk(pubKey!);
              props.keys.importPrivateJwk(privKey!);
              setOpen(false);
            }}
          >
            {closable
              ? "鍵ペアを使用する"
              : "2つの鍵を 保存 または コピー してください"}
          </Button>
          <Button variant={"outline"} onClick={() => setOpen(false)}>
            キャンセル
          </Button>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
