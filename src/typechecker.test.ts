import { describe, it, expect, beforeEach } from "vitest";
import { infer } from "./typechecker";
import { parse } from "./parser";
import { lex } from "./lexer";
import { prettyType, resetTypeVarCounter } from "./types";

function typeOf(source: string): string {
  resetTypeVarCounter();
  const type = infer(parse(lex(source)));
  return prettyType(type);
}

describe("Type Inference", () => {
  describe("literals", () => {
    it("infers Int", () => expect(typeOf("42")).toBe("Int"));
    it("infers Float", () => expect(typeOf("3.14")).toBe("Float"));
    it("infers String", () => expect(typeOf('"hello"')).toBe("String"));
    it("infers Bool", () => expect(typeOf("true")).toBe("Bool"));
  });

  describe("arithmetic", () => {
    it("infers Int for addition", () => expect(typeOf("1 + 2")).toBe("Int"));
    it("infers Bool for comparison", () => expect(typeOf("1 < 2")).toBe("Bool"));
    it("infers String for concatenation", () => expect(typeOf('"a" ++ "b"')).toBe("String"));
  });

  describe("let bindings", () => {
    it("infers let binding type", () => {
      expect(typeOf("let x = 5 in x")).toBe("Int");
    });

    it("infers through let binding", () => {
      expect(typeOf("let x = 5 in x + 1")).toBe("Int");
    });
  });

  describe("functions", () => {
    it("infers identity function type", () => {
      expect(typeOf("fn(x) -> x")).toMatch(/-> /);
    });

    it("infers concrete function type", () => {
      expect(typeOf("fn(x) -> x + 1")).toBe("Int -> Int");
    });

    it("infers multi-param function type", () => {
      // Without type classes, + is polymorphic over its operands
      expect(typeOf("fn(a, b) -> a + b")).toMatch(/-> .+ -> /);
    });

    it("infers function application", () => {
      expect(typeOf("let f = fn(x) -> x + 1 in f(5)")).toBe("Int");
    });
  });

  describe("let-polymorphism", () => {
    it("allows polymorphic use of identity", () => {
      expect(typeOf('let id = fn(x) -> x in let a = id(5) in id("hi")')).toBe("String");
    });
  });

  describe("type errors", () => {
    it("rejects Int + String", () => {
      expect(() => typeOf('5 + "hello"')).toThrow();
    });

    it("rejects applying non-function", () => {
      expect(() => typeOf("let x = 5 in x(3)")).toThrow();
    });
  });
});
