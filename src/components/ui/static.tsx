import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../base/alert";

export function AlertKeyPairMismatch() {
  return (
    <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <AlertTriangleIcon />
      <AlertTitle>鍵のペアが一致していません</AlertTitle>
      <AlertDescription>
        この公開鍵で暗号化したファイルを、この秘密鍵で復号化は出来ないことに注意してください
      </AlertDescription>
    </Alert>
  );
}
export function AlertStreamNotSupported() {
  return (
    <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <AlertTriangleIcon />
      <AlertTitle>
        このブラウザはストリームダウンロードをサポートしていません
      </AlertTitle>
      <AlertDescription>
        扱うことができるファイルサイズが制限されています
      </AlertDescription>
    </Alert>
  );
}
