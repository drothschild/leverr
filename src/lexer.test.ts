import { describe, it, expect } from "vitest";
import { lex } from "./lexer";
import { TokenKind } from "./token";

function kinds(source: string): TokenKind[] {
  return lex(source).map((t) => t.kind);
}

function lexemes(source: string): string[] {
  return lex(source).filter((t) => t.kind !== TokenKind.EOF).map((t) => t.lexeme);
}

describe("Lexer", () => {
  describe("literals", () => {
    it("lexes integers", () => {
      expect(kinds("42")).toEqual([TokenKind.Int, TokenKind.EOF]);
      expect(lexemes("42")).toEqual(["42"]);
    });

    it("lexes floats", () => {
      expect(kinds("3.14")).toEqual([TokenKind.Float, TokenKind.EOF]);
    });

    it("lexes strings", () => {
      expect(kinds('"hello"')).toEqual([TokenKind.String, TokenKind.EOF]);
      expect(lexemes('"hello"')).toEqual(['"hello"']);
    });

    it("lexes booleans", () => {
      expect(kinds("true false")).toEqual([TokenKind.True, TokenKind.False, TokenKind.EOF]);
    });

    it("lexes unit", () => {
      expect(kinds("()")).toEqual([TokenKind.LParen, TokenKind.RParen, TokenKind.EOF]);
    });
  });

  describe("identifiers and keywords", () => {
    it("lexes identifiers", () => {
      expect(kinds("foo bar_baz")).toEqual([TokenKind.Ident, TokenKind.Ident, TokenKind.EOF]);
    });

    it("lexes keywords", () => {
      expect(kinds("let rec fn match catch in")).toEqual([
        TokenKind.Let, TokenKind.Rec, TokenKind.Fn, TokenKind.Match,
        TokenKind.Catch, TokenKind.In, TokenKind.EOF,
      ]);
    });

    it("lexes uppercase identifiers as UpperIdent", () => {
      expect(kinds("Ok Err Circle")).toEqual([
        TokenKind.UpperIdent, TokenKind.UpperIdent, TokenKind.UpperIdent, TokenKind.EOF,
      ]);
    });
  });

  describe("operators", () => {
    it("lexes arithmetic operators", () => {
      expect(kinds("+ - * / %")).toEqual([
        TokenKind.Plus, TokenKind.Minus, TokenKind.Star,
        TokenKind.Slash, TokenKind.Percent, TokenKind.EOF,
      ]);
    });

    it("lexes comparison operators", () => {
      expect(kinds("== != < > <= >=")).toEqual([
        TokenKind.EqEq, TokenKind.BangEq, TokenKind.Lt, TokenKind.Gt,
        TokenKind.LtEq, TokenKind.GtEq, TokenKind.EOF,
      ]);
    });

    it("lexes logical operators", () => {
      expect(kinds("&& || !")).toEqual([
        TokenKind.AmpAmp, TokenKind.PipePipe, TokenKind.Bang, TokenKind.EOF,
      ]);
    });

    it("lexes Leverr-specific operators", () => {
      expect(kinds("|> ++ -> ?")).toEqual([
        TokenKind.Pipe, TokenKind.PlusPlus, TokenKind.Arrow, TokenKind.Question, TokenKind.EOF,
      ]);
    });

    it("lexes = vs ==", () => {
      expect(kinds("= ==")).toEqual([TokenKind.Eq, TokenKind.EqEq, TokenKind.EOF]);
    });
  });

  describe("delimiters", () => {
    it("lexes all delimiters", () => {
      expect(kinds("( ) { } [ ] , . : _")).toEqual([
        TokenKind.LParen, TokenKind.RParen, TokenKind.LBrace, TokenKind.RBrace,
        TokenKind.LBracket, TokenKind.RBracket, TokenKind.Comma, TokenKind.Dot,
        TokenKind.Colon, TokenKind.Underscore, TokenKind.EOF,
      ]);
    });
  });

  describe("comments", () => {
    it("skips line comments", () => {
      expect(kinds("42 -- this is a comment\n5")).toEqual([
        TokenKind.Int, TokenKind.Int, TokenKind.EOF,
      ]);
    });
  });

  describe("whitespace", () => {
    it("skips whitespace", () => {
      expect(kinds("  42   5  ")).toEqual([TokenKind.Int, TokenKind.Int, TokenKind.EOF]);
    });
  });
});
