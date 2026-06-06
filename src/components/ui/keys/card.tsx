import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/base/card";
import type { useCryptoKeys } from "@/hooks/useCryptoKeys";
import {
  Download,
  Edit2Icon,
  InfoIcon,
  KeyRound,
  MoreHorizontal,
  TrashIcon,
  Upload,
} from "lucide-react";
import { GenerateKeyAction } from "./generate";
import { Button } from "@/components/base/button";
import { downloadText } from "@/lib/download";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/base/dropdown-menu";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/base/input-group";
import { InputKey } from "./load";
import { useDialog } from "@/hooks/useDialog";
function Menu() {
  return (
    <DropdownMenuTrigger
      render={
        <InputGroupButton
          className="border-0"
          variant="ghost"
          aria-label="More"
          size="icon-xs"
        >
          <MoreHorizontal />
        </InputGroupButton>
      }
    />
  );
}
function PublicKeyView(props: {
  thumbprint: string;
  deleteCallback: () => void;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const editDialog = useDialog();
  return (
    <InputGroup>
      <InputGroupInput readOnly disabled value={props.thumbprint} />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <Menu />
          <DropdownMenuContent align="end" sideOffset={8} alignOffset={-4}>
            <DropdownMenuItem>
              <InfoIcon />
              Info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editDialog.setOpen(true)}>
              <Edit2Icon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={"destructive"}
              onClick={props.deleteCallback}
            >
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
      {editDialog.isOpen ? (
        <InputKey
          title="Edit Public Key"
          keyType={"public"}
          callback={props.keys.importPublicJwk}
          dialog={editDialog}
        />
      ) : null}
    </InputGroup>
  );
}

function PrivateKeyView(props: {
  thumbprint: string;
  deleteCallback: () => void;
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  const editDialog = useDialog();
  return (
    <InputGroup>
      <InputGroupInput readOnly disabled value={props.thumbprint} />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <Menu />
          <DropdownMenuContent align="end" sideOffset={8} alignOffset={-4}>
            <DropdownMenuItem onClick={() => editDialog.setOpen(true)}>
              <Edit2Icon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={"destructive"}
              onClick={props.deleteCallback}
            >
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
      {editDialog.isOpen ? (
        <InputKey
          title="Edit Private Key"
          keyType={"private"}
          callback={props.keys.importPrivateJwk}
          dialog={editDialog}
        />
      ) : null}
    </InputGroup>
  );
}
export function KeyControlCard(props: {
  keys: ReturnType<typeof useCryptoKeys>;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound aria-hidden="true" className="size-4" />
          Keys
        </CardTitle>
        <CardDescription>JWK import/export</CardDescription>
        <CardAction>
          <GenerateKeyAction keys={props.keys} />
          <Button
            onClick={props.keys.generateKeys}
            disabled={props.keys.isGenerating}
          >
            <KeyRound aria-hidden="true" />
            {props.keys.isGenerating ? "Generating" : "Generate"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Public key</span>
            <PublicKeyView
              thumbprint={props.keys.publicKeyThumbprint}
              deleteCallback={props.keys.clearPublicKey}
              keys={props.keys}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Private key</span>
            <PrivateKeyView
              thumbprint={props.keys.privateKeyThumbprint}
              deleteCallback={props.keys.clearPrivateKey}
              keys={props.keys}
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline">
            <Upload aria-hidden="true" />
            Load public
          </Button>
          <Button variant="outline">
            <Upload aria-hidden="true" />
            Load private
          </Button>
          <Button
            variant="outline"
            disabled={!props.keys.publicKeyText}
            onClick={() => {
              downloadText(
                props.keys.publicKeyText,
                "lockbox-public-key.jwk.json",
              );
            }}
          >
            <Download aria-hidden="true" />
            Public JWK
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
