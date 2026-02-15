import { describe, it, expect } from "vitest";
import { Token, TokenKind } from "./token";

describe("Token", () => {
  it("creates a token with kind, lexeme, and span", () => {
    const token: Token = {
      kind: TokenKind.Int,
      lexeme: "42",
      span: { start: { line: 1, col: 1, offset: 0 }, end: { line: 1, col: 3, offset: 2 } },
    };
    expect(token.kind).toBe(TokenKind.Int);
    expect(token.lexeme).toBe("42");
  });

  it("has all required token kinds for Rill", () => {
    // Literals
    expect(TokenKind.Int).toBeDefined();
    expect(TokenKind.Float).toBeDefined();
    expect(TokenKind.String).toBeDefined();
    expect(TokenKind.True).toBeDefined();
    expect(TokenKind.False).toBeDefined();

    // Keywords
    expect(TokenKind.Let).toBeDefined();
    expect(TokenKind.Rec).toBeDefined();
    expect(TokenKind.Fn).toBeDefined();
    expect(TokenKind.Match).toBeDefined();
    expect(TokenKind.Catch).toBeDefined();

    // Operators
    expect(TokenKind.Pipe).toBeDefined();       // |>
    expect(TokenKind.Question).toBeDefined();    // ?
    expect(TokenKind.PlusPlus).toBeDefined();    // ++
    expect(TokenKind.Arrow).toBeDefined();       // ->
    expect(TokenKind.Eq).toBeDefined();          // =
    expect(TokenKind.EqEq).toBeDefined();        // ==
    expect(TokenKind.BangEq).toBeDefined();      // !=
    expect(TokenKind.AmpAmp).toBeDefined();      // &&
    expect(TokenKind.PipePipe).toBeDefined();    // ||

    // Delimiters
    expect(TokenKind.LParen).toBeDefined();
    expect(TokenKind.RParen).toBeDefined();
    expect(TokenKind.LBrace).toBeDefined();
    expect(TokenKind.RBrace).toBeDefined();
    expect(TokenKind.LBracket).toBeDefined();
    expect(TokenKind.RBracket).toBeDefined();
    expect(TokenKind.Comma).toBeDefined();
    expect(TokenKind.Dot).toBeDefined();
    expect(TokenKind.Colon).toBeDefined();

    // Special
    expect(TokenKind.Ident).toBeDefined();
    expect(TokenKind.UpperIdent).toBeDefined();  // Tag names like Ok, Err, Circle
    expect(TokenKind.EOF).toBeDefined();
  });
});
