import { ShieldCheck } from "lucide-react";
import { GithubIcon } from "../base/github";

function GithubLink() {
  return (
    <a href="https://github.com/hisuie08/lockbox" target="_blank">
      <GithubIcon aria-hidden="true" />
    </a>
  );
}
export function Header(props: {
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck aria-hidden="true" className="size-5" />
        </div>
        <a href="/">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Lockbox(α版)
            </h1>
            <p className="text-sm text-muted-foreground">
              X25519-HKDF + AES-GCM
            </p>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:items-center">
        <GithubLink />
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <span className="text-muted-foreground">Public</span>{" "}
          <span
            className={
              props.publicKey ? "font-medium text-emerald-700" : "font-medium"
            }
          >
            {props.publicKey ? "Loaded" : "Empty"}
          </span>
        </div>
        <div className="rounded-md border border-border bg-card px-3 py-2">
          <span className="text-muted-foreground">Private</span>{" "}
          <span
            className={
              props.privateKey ? "font-medium text-emerald-700" : "font-medium"
            }
          >
            {props.privateKey ? "Loaded" : "Empty"}
          </span>
        </div>
      </div>
    </header>
  );
}
