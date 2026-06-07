import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../base/alert";

export function ErrorView(props: { errors: Array<string> }) {
  return (
    <div>
      {props.errors.length > 0 ? (
        <div className="grid gap-2">
          {props.errors.map((error) => (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              key={error}
            >
              {error}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AlertView(props: { title: string; description?: string }) {
  return (
    <Alert className="max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <AlertTriangleIcon />
      <AlertTitle>{props.title}</AlertTitle>
      <AlertDescription>{props.description}</AlertDescription>
    </Alert>
  );
}
