import { describe, it, expect } from "vitest";
import { runSource } from "./runner";

describe("File Runner", () => {
  it("runs a complete program", () => {
    const result = runSource(`
      let double = fn(x) -> x * 2
      in [1, 2, 3] |> map(double)
    `);
    expect(result.output).toBe("[2, 4, 6]");
  });

  it("reports type errors before running", () => {
    const result = runSource('5 + "hello"');
    expect(result.error).toBeTruthy();
  });

  it("runs pipeline with error handling", () => {
    const result = runSource(`
      let parse = fn(s) -> match s {
        "42" -> Ok(42),
        _ -> Err("bad")
      }
      in "42" |> parse? |> fn n -> n * 2
    `);
    expect(result.output).toBe("84");
  });
});
