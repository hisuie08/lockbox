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
