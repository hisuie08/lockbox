import { Button } from "@/components/base/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import { Input } from "@/components/base/input";
import { useStreamSupport } from "@/hooks/useStreamSupport";
import { formatBytes } from "@/lib/unit";

export function Header(props: {
  maxFileSize: number;
  fileName: string | null;
  children: React.ReactNode[];
  useKey:string
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
      <CardDescription><strong>{props.useKey}</strong>を使用します</CardDescription>
    </CardHeader>
  );
}

export function ActionButton(props: {
  disabled: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <Button disabled={props.disabled} onClick={props.onClick}>
      {props.icon}
      {props.label}
    </Button>
  );
}

export function FileInput(props: {
  maxFileSize: number;
  callback: (
    maxFileSize: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <Input
      type="file"
      onChange={(event) => {
        props.callback(props.maxFileSize, event);
      }}
    />
  );
}
