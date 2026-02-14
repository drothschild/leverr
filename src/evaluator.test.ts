import { describe, it, expect } from "vitest";
import { evaluate } from "./evaluator";
import { parse } from "./parser";
import { lex } from "./lexer";
import { prettyPrint, Value } from "./values";

function run(source: string): Value {
  return evaluate(parse(lex(source)));
}

function runPrint(source: string): string {
  return prettyPrint(run(source));
}

describe("Evaluator", () => {
  describe("literals", () => {
    it("evaluates integers", () => expect(runPrint("42")).toBe("42"));
    it("evaluates floats", () => expect(runPrint("3.14")).toBe("3.14"));
    it("evaluates strings", () => expect(runPrint('"hello"')).toBe('"hello"'));
    it("evaluates booleans", () => expect(runPrint("true")).toBe("true"));
  });

  describe("arithmetic", () => {
    it("adds integers", () => expect(runPrint("1 + 2")).toBe("3"));
    it("multiplies", () => expect(runPrint("3 * 4")).toBe("12"));
    it("respects precedence", () => expect(runPrint("2 + 3 * 4")).toBe("14"));
    it("subtracts", () => expect(runPrint("10 - 3")).toBe("7"));
    it("divides", () => expect(runPrint("10 / 3")).toBe("3"));
    it("modulo", () => expect(runPrint("10 % 3")).toBe("1"));
  });

  describe("comparison", () => {
    it("equal", () => expect(runPrint("1 == 1")).toBe("true"));
    it("not equal", () => expect(runPrint("1 != 2")).toBe("true"));
    it("less than", () => expect(runPrint("1 < 2")).toBe("true"));
    it("greater than", () => expect(runPrint("2 > 1")).toBe("true"));
  });

  describe("logical", () => {
    it("and", () => expect(runPrint("true && false")).toBe("false"));
    it("or", () => expect(runPrint("false || true")).toBe("true"));
    it("not", () => expect(runPrint("!true")).toBe("false"));
  });

  describe("strings", () => {
    it("concatenates", () => expect(runPrint('"hello" ++ " world"')).toBe('"hello world"'));
  });

  describe("let bindings", () => {
    it("binds and uses a value", () => {
      expect(runPrint("let x = 5 in x + 1")).toBe("6");
    });

    it("supports nested let bindings", () => {
      expect(runPrint("let x = 5 in let y = 10 in x + y")).toBe("15");
    });
  });

  describe("functions", () => {
    it("defines and calls a function", () => {
      expect(runPrint("let double = fn(x) -> x * 2 in double(5)")).toBe("10");
    });

    it("supports closures", () => {
      expect(runPrint("let add = fn(a, b) -> a + b in let add5 = add(5) in add5(3)")).toBe("8");
    });

    it("supports recursion with let rec", () => {
      expect(runPrint(`
        let rec factorial = fn(n) ->
          match n <= 1 { true -> 1, false -> n * factorial(n - 1) }
        in factorial(5)
      `)).toBe("120");
    });
  });
});
