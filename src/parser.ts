import { Token, TokenKind } from "./token";
import { Expr } from "./ast";
import { Span } from "./span";

export function parse(tokens: Token[]): Expr {
  const parser = new Parser(tokens);
  const expr = parser.parseExpr(0);
  parser.expect(TokenKind.EOF);
  return expr;
}

class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  peek(): Token {
    return this.tokens[this.pos];
  }

  advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  expect(kind: TokenKind): Token {
    const token = this.peek();
    if (token.kind !== kind) {
      throw new Error(`Expected ${kind} but got ${token.kind} at line ${token.span.start.line}, col ${token.span.start.col}`);
    }
    return this.advance();
  }

  at(kind: TokenKind): boolean {
    return this.peek().kind === kind;
  }

  eat(kind: TokenKind): Token | null {
    if (this.at(kind)) return this.advance();
    return null;
  }

  parseExpr(minBp: number): Expr {
    let left = this.nud();
    while (true) {
      const token = this.peek();
      const bp = infixBp(token.kind);
      if (bp === null || bp[0] < minBp) break;
      left = this.led(left, bp);
    }
    return left;
  }

  nud(): Expr {
    const token = this.peek();

    switch (token.kind) {
      case TokenKind.Int: {
        this.advance();
        return { kind: "IntLit", value: parseInt(token.lexeme, 10), span: token.span };
      }
      case TokenKind.Float: {
        this.advance();
        return { kind: "FloatLit", value: parseFloat(token.lexeme), span: token.span };
      }
      case TokenKind.String: {
        this.advance();
        // Remove surrounding quotes
        const value = token.lexeme.slice(1, -1);
        return { kind: "StringLit", value, span: token.span };
      }
      case TokenKind.True: {
        this.advance();
        return { kind: "BoolLit", value: true, span: token.span };
      }
      case TokenKind.False: {
        this.advance();
        return { kind: "BoolLit", value: false, span: token.span };
      }
      case TokenKind.Ident: {
        this.advance();
        return { kind: "Ident", name: token.lexeme, span: token.span };
      }
      default:
        throw new Error(`Unexpected token ${token.kind} ("${token.lexeme}") at line ${token.span.start.line}, col ${token.span.start.col}`);
    }
  }

  led(left: Expr, _bp: [number, number]): Expr {
    throw new Error("No infix operators implemented yet");
  }
}

function infixBp(_kind: TokenKind): [number, number] | null {
  return null;
}
