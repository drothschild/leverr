import { describe, it, expect } from "vitest";
import { ReplSession } from "./repl";

describe("REPL Session", () => {
  it("evaluates an expression", () => {
    const session = new ReplSession();
    const result = session.eval("1 + 2");
    expect(result.output).toBe("3");
  });

  it("persists let bindings across inputs", () => {
    const session = new ReplSession();
    session.eval("let x = 5");
    const result = session.eval("x + 1");
    expect(result.output).toBe("6");
  });

  it("shows type with :type command", () => {
    const session = new ReplSession();
    session.eval("let double = fn(x) -> x * 2");
    const result = session.eval(":type double");
    expect(result.output).toContain("->");
  });

  it("shows environment with :env", () => {
    const session = new ReplSession();
    session.eval("let x = 42");
    const result = session.eval(":env");
    expect(result.output).toContain("x");
  });

  it("reports errors without crashing", () => {
    const session = new ReplSession();
    const result = session.eval('5 + "hello"');
    expect(result.error).toBeTruthy();
    const result2 = session.eval("1 + 2");
    expect(result2.output).toBe("3");
  });
});
