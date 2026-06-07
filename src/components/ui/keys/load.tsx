import { Button } from "@/components/base/button";
import { Label } from "@/components/base/label";
import { RadioGroup, RadioGroupItem } from "@/components/base/radio-group";
import { Textarea } from "@/components/base/textarea";
import { useState } from "react";
import { useKeyLoad, type TypeKeyFor } from "@/hooks/useKeyLoad";
import { Dialog, DialogContent, DialogTitle } from "@/components/base/dialog";
import { useDialog } from "@/hooks/useDialog";
import { Check } from "lucide-react";
import { Input } from "@/components/base/input";
import { Field } from "@/components/base/field";
import { Checkbox } from "@/components/base/checkbox";
import { ErrorView } from "../alerts";
import type { useCryptoKeys } from "@/hooks/useCryptoKeys";

function SelectMethod(props: { value: string; callback: (_: string) => void }) {
  return (
    <RadioGroup
      value={props.value}
      className="w-fit"
      onValueChange={props.callback}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="file" id="r1" />
        <Label htmlFor="r1">Upload file</Label>
      </div>
      <div className="flex items-center gap-3 w-fit">
        <RadioGroupItem value="paste" id="r2" />
        <Label htmlFor="r2">Paste key</Label>
      </div>
    </RadioGroup>
  );
}

function KeyInputField(props: {
  keyType: TypeKeyFor;
  method: string;
  keyLoad: ReturnType<typeof useKeyLoad>;
}) {
  const { error, loadKeyFile, loadKeyString, isValid } = props.keyLoad;
  return (
    <div>
      {error ? <ErrorView errors={[error]} /> : null}
      {props.method == "file" ? (
        <Input type="file" onChange={loadKeyFile} />
      ) : null}
      {props.method == "paste" ? (
        <Textarea
          className="max-h-30"
          placeholder="paste key"
          onChange={loadKeyString}
        ></Textarea>
      ) : null}
      {isValid ? (
        <div className="flex text-green-700">
          <Check size={16} className="mr-1" color="green" />
          <span color="green">Valid {props.keyType} key</span>
        </div>
      ) : null}
    </div>
  );
}

export function InputPublicKey(props: {
  dialog: ReturnType<typeof useDialog>;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const keyType: TypeKeyFor = "public";
  const [method, setMethod] = useState<string>("file");
  const keyload = useKeyLoad(keyType);
  const { isValid, validJwk } = keyload;
  return (
    <Dialog open={props.dialog.isOpen} onOpenChange={props.dialog.setOpen}>
      <DialogContent>
        <DialogTitle>Edit Public Key</DialogTitle>
        <div className="grid gap-3">
          <SelectMethod value={method} callback={setMethod} />
          <KeyInputField keyType={keyType} method={method} keyLoad={keyload} />
          <Button
            type={"submit"}
            disabled={!isValid}
            onClick={() => {
              props.keys.importPublicJwk(validJwk!);
              props.dialog.setOpen(false);
            }}
          >
            Load
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InputPrivateKey(props: {
  dialog: ReturnType<typeof useDialog>;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const keyType: TypeKeyFor = "private";
  const [method, setMethod] = useState<string>("file");
  const keyload = useKeyLoad(keyType);
  const { isValid, validJwk } = keyload;
  const [checked, setChecked] = useState(false);
  return (
    <Dialog open={props.dialog.isOpen} onOpenChange={props.dialog.setOpen}>
      <DialogContent>
        <DialogTitle>Edit Private Key</DialogTitle>
        <div className="grid gap-3">
          <SelectMethod value={method} callback={setMethod} />
          <Field orientation="horizontal">
            <Checkbox
              id="with-pub"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <Label htmlFor="with-pub">Load public key from private key</Label>
          </Field>
          <KeyInputField keyType={keyType} method={method} keyLoad={keyload} />
          <Button
            type={"submit"}
            disabled={!isValid}
            onClick={() => {
              if (checked) {
                props.keys.importBothJwk(validJwk!);
              }
              props.keys.importPrivateJwk(validJwk!);
              props.dialog.setOpen(false);
            }}
          >
            Load
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
