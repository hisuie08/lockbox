import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../base/alert";

export function AlertKeyPairMismatch(){
    return (<Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <AlertTriangleIcon />
      <AlertTitle>The thumbprints of the key pair do not match.</AlertTitle>
      <AlertDescription>Note that files encrypted with this public key cannot be decrypted with this private key.
      </AlertDescription>
    </Alert>)
}