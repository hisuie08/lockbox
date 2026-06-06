import { Button } from "@/components/base/button";
import { Label } from "@/components/base/label";
import { RadioGroup, RadioGroupItem } from "@/components/base/radio-group";
import { Textarea } from "@/components/base/textarea";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { FileInput } from "../file";
import { type LockBoxJwk } from "@/crypt/services";
import { useKeyLoad, type TypeKeyFor } from "@/hooks/useKeyLoad";

export function InputKey(props: {
  keyType: TypeKeyFor;
  callback: (_: LockBoxJwk) => void;
}) {
  const [method, setMethod] = useState<string>("file");
  const { validJwk, isValid, error, loadKeyFile, loadKeyString } =
    useKeyLoad(props.keyType);
  return (
    <div className="grid gap-3">
      <RadioGroup value={method} className="w-fit" onValueChange={setMethod}>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="file" id="r1" />
          <Label htmlFor="r1">Upload file</Label>
        </div>
        <div className="flex items-center gap-3 w-fit">
          <RadioGroupItem value="paste" id="r2" />
          <Label htmlFor="r2">Paste key</Label>
        </div>
      </RadioGroup>
      {method == "file" ? (
        <FileInput
          maxFileSize={1024 * 1024 * 1024}
          callback={(_, event) => {
            loadKeyFile(event);
          }}
        />
      ) : null}
      {method == "paste" ? (
        <Textarea
          className="max-h-56"
          placeholder="paste key"
          onChange={(event) => {
            loadKeyString(event)
          }}
        ></Textarea>
      ) : null}
      {error ? (
        <div className="grid gap-2">
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            key={error}
          >
            {error}
          </div>
        </div>
      ) : null}
      <Button
        type={"submit"}
        disabled={!isValid}
        onClick={() => {
          props.callback(validJwk!);
        }}
      >
        <CheckIcon />
        Load
      </Button>
    </div>
  );
}
