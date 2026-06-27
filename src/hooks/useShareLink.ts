export function useShareLink() {
  function genLink(publicJwk: JsonWebKey | null): string {
    const url = new URL(document.baseURI);
    if (publicJwk == null) {
      return url.toString();
    }
    url.searchParams.set("kty", publicJwk.kty!);
    url.searchParams.set("crv", publicJwk.crv!);
    url.searchParams.set("x", publicJwk.x!);
    return url.toString();
  }

  function loadLink(): JsonWebKey | null {
    const url = new URL(document.URL);
    const keyData = {
      kty: url.searchParams.get("kty"),
      crv: url.searchParams.get("crv"),
      x: url.searchParams.get("x"),
    };
    if (keyData.crv != null && keyData.kty != null && keyData.x != null) {
      const publicJwk: JsonWebKey = {
        crv: keyData.crv,
        kty: keyData.kty,
        x: keyData.x,
      };
      return publicJwk;
    } else {
      return null;
    }
  }
  return { genLink, loadLink };
}
