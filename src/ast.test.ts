import { describe, it, expect } from "vitest";
import { Expr } from "./ast";

describe("AST", () => {
  const dummySpan = { start: { line: 1, col: 1, offset: 0 }, end: { line: 1, col: 1, offset: 0 } };

  it("represents an integer literal", () => {
    const node: Expr = { kind: "IntLit", value: 42, span: dummySpan };
    expect(node.kind).toBe("IntLit");
  });

  it("represents a let binding", () => {
    const node: Expr = {
      kind: "Let",
      name: "x",
      value: { kind: "IntLit", value: 5, span: dummySpan },
      body: { kind: "Ident", name: "x", span: dummySpan },
      rec: false,
      span: dummySpan,
    };
    expect(node.kind).toBe("Let");
  });

  it("represents a function with curried params", () => {
    const node: Expr = {
      kind: "Fn",
      param: "x",
      body: { kind: "Ident", name: "x", span: dummySpan },
      span: dummySpan,
    };
    expect(node.kind).toBe("Fn");
  });

  it("represents a pipe expression", () => {
    const node: Expr = {
      kind: "Pipe",
      left: { kind: "IntLit", value: 5, span: dummySpan },
      right: { kind: "Ident", name: "double", span: dummySpan },
      span: dummySpan,
    };
    expect(node.kind).toBe("Pipe");
  });

  it("represents the ? operator", () => {
    const node: Expr = {
      kind: "Try",
      expr: { kind: "Call", fn: { kind: "Ident", name: "parse", span: dummySpan }, arg: { kind: "StringLit", value: "42", span: dummySpan }, span: dummySpan },
      span: dummySpan,
    };
    expect(node.kind).toBe("Try");
  });

  it("represents a match expression", () => {
    const node: Expr = {
      kind: "Match",
      subject: { kind: "Ident", name: "x", span: dummySpan },
      cases: [
        { pattern: { kind: "IntPat", value: 1 }, body: { kind: "StringLit", value: "one", span: dummySpan } },
        { pattern: { kind: "WildcardPat" }, body: { kind: "StringLit", value: "other", span: dummySpan } },
      ],
      span: dummySpan,
    };
    expect(node.kind).toBe("Match");
  });

  it("represents a record literal", () => {
    const node: Expr = {
      kind: "Record",
      fields: [
        { name: "x", value: { kind: "IntLit", value: 1, span: dummySpan } },
        { name: "y", value: { kind: "IntLit", value: 2, span: dummySpan } },
      ],
      span: dummySpan,
    };
    expect(node.kind).toBe("Record");
  });

  it("represents a tagged value", () => {
    const node: Expr = {
      kind: "Tag",
      tag: "Ok",
      args: [{ kind: "IntLit", value: 42, span: dummySpan }],
      span: dummySpan,
    };
    expect(node.kind).toBe("Tag");
  });
});
