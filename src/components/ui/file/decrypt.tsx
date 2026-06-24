import { Card, CardContent } from "@/components/base/card";
import { useCryptoKeys } from "@/hooks/useCryptoKeys";
import { formatBytes } from "@/lib/unit";
import type { useFileDecrypt } from "@/hooks/useFileCryptoStream";
import { Progress, ProgressValue } from "@/components/base/progress";
import { ActionButton, FileInput, Header } from "./common";
import { UnlockKeyhole } from "lucide-react";

export function DecryptFileCard(props: {
  files: ReturnType<typeof useFileDecrypt>;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  return (
    <Card className="rounded-lg">
      <Header
        children={[
          <UnlockKeyhole aria-hidden="true" className="size-4" />,
          "Decrypt",
        ]}
        useKey="秘密鍵"
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
          files={props.files}
          cryptoKey={props.keys.privateKey}

          callback={(_, event) => {
            props.files.setFileToDecrypt(event);
            event.target.value = "";
          }}
        />
        {props.files.fileToProcess && props.files.originFile ? (
          //TODO: 詳細な情報表示
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="truncate">{props.files.fileToProcess.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(props.files.originFile.originalSize)}
            </span>
            <span>{props.files.originFile?.originalName}</span>
          </div>
        ) : null}
        {props.files.fileToProcess ? (
          <Progress value={props.files.progress * 100} max={100} min={0}>
            <ProgressValue />
          </Progress>
        ) : null}
        <ActionButton
          files={props.files}
          cryptoKey={props.keys.privateKey}
          onClick={() => props.files.decryptSelectedFile(props.keys.privateKey)}
          label={"復号化"}
        />
      </CardContent>
    </Card>
  );
}
