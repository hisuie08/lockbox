import { describe, expect, test } from "vitest";
import { formatBytes } from "./unit";

describe("unit format", () => {
  test.each([
    [0, "0 B"],
    [10, "10 B"],
    [100, "100 B"],
    [1000, "1000 B"],
    [1024, "1.0 KB"],
    [1024 * 1.5, "1.5 KB"],
    [1024 * 1024, "1.0 MB"],
    [100 * 1024 * 1024, "100 MB"],
    [1024 * 1024 * 1024, "1.0 GB"],
    [1024 * 1024 * 1024 * 1024, "1024 GB"],
  ])("", (size, expectValue) => {
    const result = formatBytes(size);
    expect(result).toStrictEqual(expectValue);
  });
});
