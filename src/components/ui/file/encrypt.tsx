import { Card, CardContent } from "@/components/base/card";
import { Check, LockKeyhole } from "lucide-react";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { formatBytes } from "@/lib/unit";
import type { useFileEncrypt } from "@/hooks/useFileCryptoStream";
import { Progress, ProgressValue } from "@/components/base/progress";
import { ActionButton, FileInput, Header } from "./common";

export function EncryptFileCard(props: {
  files: ReturnType<typeof useFileEncrypt>;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  return (
    <Card className="rounded-lg">
      <Header
        children={[
          <LockKeyhole aria-hidden="true" className="size-4" />,
          "Encrypt",
        ]}
        maxFileSize={props.files.maxFileSize}
        fileName={props.files.fileToProcess?.name ?? null}
      />
      <CardContent className="grid gap-4">
        {props.files.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {props.files.error}
          </div>
        ) : null}
        <FileInput
          maxFileSize={props.files.maxFileSize}
          callback={(_, event) => {
            props.files.setFileToEncrypt(event);
            event.target.value = "";
          }}
        />
        {props.files.fileToProcess ? (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="truncate">{props.files.fileToProcess.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(props.files.fileToProcess.size)}
            </span>
          </div>
        ) : null}
        {props.files.fileToProcess ? (
          <Progress value={props.files.progress*100} max={100} min={0}>
            <ProgressValue />
          </Progress>
        ) : null}
        <ActionButton
          disabled={
            !props.files.fileToProcess ||
            !props.keys.publicKey ||
            props.files.isProcessing ||
            props.files.isDone
          }
          icon={
            props.files.isDone ? (
              <Check aria-hidden="true" />
            ) : (
              <LockKeyhole aria-hidden="true" />
            )
          }
          onClick={() => props.files.encryptSelectedFile(props.keys.publicKey)}
          label={
            props.files.isProcessing
              ? "Encrypting"
              : props.files.isDone
                ? "Done"
                : "Encrypt"
          }
        />
      </CardContent>
    </Card>
  );
}
