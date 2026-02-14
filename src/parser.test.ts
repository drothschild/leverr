import { describe, it, expect } from "vitest";
import { parse } from "./parser";
import { lex } from "./lexer";

function parseExpr(source: string) {
  return parse(lex(source));
}

describe("Parser", () => {
  describe("literals", () => {
    it("parses integers", () => {
      const ast = parseExpr("42");
      expect(ast).toMatchObject({ kind: "IntLit", value: 42 });
    });

    it("parses floats", () => {
      const ast = parseExpr("3.14");
      expect(ast).toMatchObject({ kind: "FloatLit", value: 3.14 });
    });

    it("parses strings", () => {
      const ast = parseExpr('"hello"');
      expect(ast).toMatchObject({ kind: "StringLit", value: "hello" });
    });

    it("parses booleans", () => {
      expect(parseExpr("true")).toMatchObject({ kind: "BoolLit", value: true });
      expect(parseExpr("false")).toMatchObject({ kind: "BoolLit", value: false });
    });

    it("parses identifiers", () => {
      const ast = parseExpr("foo");
      expect(ast).toMatchObject({ kind: "Ident", name: "foo" });
    });
  });

  describe("operators", () => {
    it("parses arithmetic", () => {
      const ast = parseExpr("1 + 2");
      expect(ast).toMatchObject({
        kind: "BinOp", op: "+",
        left: { kind: "IntLit", value: 1 },
        right: { kind: "IntLit", value: 2 },
      });
    });

    it("respects precedence: * binds tighter than +", () => {
      const ast = parseExpr("1 + 2 * 3");
      expect(ast).toMatchObject({
        kind: "BinOp", op: "+",
        left: { kind: "IntLit", value: 1 },
        right: { kind: "BinOp", op: "*", left: { value: 2 }, right: { value: 3 } },
      });
    });

    it("parses comparison operators", () => {
      const ast = parseExpr("a == b");
      expect(ast).toMatchObject({ kind: "BinOp", op: "==" });
    });

    it("parses logical operators", () => {
      const ast = parseExpr("a && b || c");
      expect(ast).toMatchObject({
        kind: "BinOp", op: "||",
        left: { kind: "BinOp", op: "&&" },
        right: { kind: "Ident", name: "c" },
      });
    });

    it("parses string concatenation", () => {
      const ast = parseExpr('"a" ++ "b"');
      expect(ast).toMatchObject({ kind: "BinOp", op: "++" });
    });

    it("parses unary negation", () => {
      const ast = parseExpr("!true");
      expect(ast).toMatchObject({ kind: "UnaryOp", op: "!", expr: { kind: "BoolLit", value: true } });
    });

    it("parses unary minus", () => {
      const ast = parseExpr("-5");
      expect(ast).toMatchObject({ kind: "UnaryOp", op: "-", expr: { kind: "IntLit", value: 5 } });
    });

    it("parses parenthesized expressions", () => {
      const ast = parseExpr("(1 + 2) * 3");
      expect(ast).toMatchObject({
        kind: "BinOp", op: "*",
        left: { kind: "BinOp", op: "+" },
        right: { kind: "IntLit", value: 3 },
      });
    });
  });

  describe("let bindings", () => {
    it("parses let binding", () => {
      const ast = parseExpr("let x = 5 in x + 1");
      expect(ast).toMatchObject({
        kind: "Let", name: "x", rec: false,
        value: { kind: "IntLit", value: 5 },
        body: { kind: "BinOp", op: "+" },
      });
    });

    it("parses let rec", () => {
      const ast = parseExpr("let rec f = fn(n) -> n in f(5)");
      expect(ast).toMatchObject({ kind: "Let", name: "f", rec: true });
    });
  });

  describe("functions", () => {
    it("parses single-param function", () => {
      const ast = parseExpr("fn(x) -> x + 1");
      expect(ast).toMatchObject({
        kind: "Fn", param: "x",
        body: { kind: "BinOp", op: "+" },
      });
    });

    it("parses multi-param function as curried", () => {
      // fn(a, b) -> a + b  desugars to  fn(a) -> fn(b) -> a + b
      const ast = parseExpr("fn(a, b) -> a + b");
      expect(ast).toMatchObject({
        kind: "Fn", param: "a",
        body: { kind: "Fn", param: "b", body: { kind: "BinOp", op: "+" } },
      });
    });

    it("parses function calls", () => {
      const ast = parseExpr("f(5)");
      expect(ast).toMatchObject({
        kind: "Call",
        fn: { kind: "Ident", name: "f" },
        arg: { kind: "IntLit", value: 5 },
      });
    });

    it("parses multi-arg calls as curried application", () => {
      // f(a, b) desugars to f(a)(b)
      const ast = parseExpr("f(1, 2)");
      expect(ast).toMatchObject({
        kind: "Call",
        fn: { kind: "Call", fn: { kind: "Ident", name: "f" }, arg: { kind: "IntLit", value: 1 } },
        arg: { kind: "IntLit", value: 2 },
      });
    });
  });

  describe("pipes", () => {
    it("parses pipe operator", () => {
      const ast = parseExpr("5 |> double");
      expect(ast).toMatchObject({
        kind: "Pipe",
        left: { kind: "IntLit", value: 5 },
        right: { kind: "Ident", name: "double" },
      });
    });

    it("chains pipes left-to-right", () => {
      const ast = parseExpr("5 |> double |> print");
      expect(ast).toMatchObject({
        kind: "Pipe",
        left: { kind: "Pipe", left: { value: 5 }, right: { name: "double" } },
        right: { kind: "Ident", name: "print" },
      });
    });

    it("parses pipe into partial application", () => {
      const ast = parseExpr('[1, 2] |> map(fn(x) -> x * 2)');
      expect(ast).toMatchObject({
        kind: "Pipe",
        left: { kind: "List" },
        right: { kind: "Call" },
      });
    });
  });

  describe("try operator (?)", () => {
    it("parses ? as postfix", () => {
      const ast = parseExpr("parse_int(x)?");
      expect(ast).toMatchObject({
        kind: "Try",
        expr: { kind: "Call" },
      });
    });

    it("parses ? in pipeline", () => {
      const ast = parseExpr("x |> parse?");
      expect(ast).toMatchObject({
        kind: "Pipe",
        right: { kind: "Try", expr: { kind: "Ident", name: "parse" } },
      });
    });
  });

  describe("catch", () => {
    it("parses catch expression", () => {
      const ast = parseExpr("x |> parse? |> catch e -> 0");
      expect(ast).toMatchObject({
        kind: "Pipe",
        left: { kind: "Pipe" },
        right: { kind: "Catch", errorName: "e", fallback: { kind: "IntLit", value: 0 } },
      });
    });
  });
});
