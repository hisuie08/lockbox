import { Button } from "@/components/base/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import { Input } from "@/components/base/input";
import { Spinner } from "@/components/base/spinner";
import { useFileDecrypt, useFileEncrypt } from "@/hooks/useFileCryptoStream";
import { useStreamSupport } from "@/hooks/useStreamSupport";
import { formatBytes } from "@/lib/unit";
import { Check, LockKeyhole } from "lucide-react";

export function Header(props: {
  maxFileSize: number;
  fileName: string | null;
  children: React.ReactNode[];
  useKey: string;
}) {
  const supported = useStreamSupport();
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {props.children.map((v) => v)}
        {supported ? null : (
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            Max file size: {formatBytes(props.maxFileSize)}
          </span>
        )}
      </CardTitle>
      <CardDescription>
        <strong>{props.useKey}</strong>を使用します
      </CardDescription>
    </CardHeader>
  );
}

export function ActionButton(props: {
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  cryptoKey: CryptoKey | null;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      disabled={
        !props.files.fileToProcess ||
        !props.cryptoKey ||
        props.files.progress != 0
      }
      onClick={props.onClick}
    >
      {props.files.progress == 0 ? (
        <LockKeyhole aria-hidden="true" />
      ) : props.files.isProcessing || !props.files.saved ? (
        <Spinner aria-hidden="true" />
      ) : (
        <Check aria-hidden="true" />
      )}
      {props.files.progress == 0
        ? props.label + "開始"
        : props.files.isProcessing
          ? props.label + "中..."
          : !props.files.saved
            ? "保存中..."
            : "完了"}
    </Button>
  );
}

export function FileInput(props: {
  files: ReturnType<typeof useFileEncrypt> | ReturnType<typeof useFileDecrypt>;
  cryptoKey: CryptoKey | null;
  callback: (
    maxFileSize: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <Input
      type="file"
      disabled={
        !(
          props.cryptoKey != null &&
          (props.files.progress == 0 ||
            (props.files.progress == 1 && props.files.saved))
        )
      }
      onChange={(event) => {
        props.callback(props.files.maxFileSize, event);
      }}
    />
  );
}
