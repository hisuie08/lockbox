import { FileKey2 } from "lucide-react";
import { Card, CardContent } from "../base/card";

export function Algorithmns() {
  return (
    <Card className="rounded-lg" size="sm">
      <CardContent className="grid gap-3 pt-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileKey2 aria-hidden="true" className="size-4" />
          暗号化アルゴリズム
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted px-3 py-2">
            X25519-HKDF-SHA-256
          </div>
          <div className="rounded-md bg-muted px-3 py-2">AES-GCM-256</div>
        </div>
      </CardContent>
    </Card>
  );
}
