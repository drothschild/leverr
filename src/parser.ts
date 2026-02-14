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

  spanFrom(start: Span): Span {
    const prev = this.tokens[this.pos - 1] || this.peek();
    return { start: start.start, end: prev.span.end };
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
        let expr: Expr = { kind: "Ident", name: token.lexeme, span: token.span };
        // Handle function call: ident followed by (
        while (this.at(TokenKind.LParen)) {
          expr = this.parseCallArgs(expr);
        }
        return expr;
      }
      // Let binding
      case TokenKind.Let: {
        return this.parseLet();
      }
      // Function literal
      case TokenKind.Fn: {
        return this.parseFn();
      }
      // Unary operators
      case TokenKind.Bang: {
        this.advance();
        const expr = this.parseExpr(PREFIX_BP);
        return { kind: "UnaryOp", op: "!", expr, span: this.spanFrom(token.span) };
      }
      case TokenKind.Minus: {
        this.advance();
        const expr = this.parseExpr(PREFIX_BP);
        return { kind: "UnaryOp", op: "-", expr, span: this.spanFrom(token.span) };
      }
      // Parenthesized expression
      case TokenKind.LParen: {
        this.advance();
        const expr = this.parseExpr(0);
        this.expect(TokenKind.RParen);
        return expr;
      }
      default:
        throw new Error(`Unexpected token ${token.kind} ("${token.lexeme}") at line ${token.span.start.line}, col ${token.span.start.col}`);
    }
  }

  parseLet(): Expr {
    const letToken = this.expect(TokenKind.Let);
    const rec = !!this.eat(TokenKind.Rec);
    const nameToken = this.expect(TokenKind.Ident);
    this.expect(TokenKind.Eq);
    const value = this.parseExpr(0);
    this.expect(TokenKind.In);
    const body = this.parseExpr(0);
    return {
      kind: "Let",
      name: nameToken.lexeme,
      value,
      body,
      rec,
      span: { start: letToken.span.start, end: body.span.end },
    };
  }

  parseFn(): Expr {
    const fnToken = this.expect(TokenKind.Fn);
    this.expect(TokenKind.LParen);
    const params: string[] = [];
    if (!this.at(TokenKind.RParen)) {
      params.push(this.expect(TokenKind.Ident).lexeme);
      while (this.eat(TokenKind.Comma)) {
        params.push(this.expect(TokenKind.Ident).lexeme);
      }
    }
    this.expect(TokenKind.RParen);
    this.expect(TokenKind.Arrow);
    const body = this.parseExpr(0);

    // Desugar multi-param into nested Fn nodes (right to left)
    let result: Expr = body;
    for (let i = params.length - 1; i >= 1; i--) {
      result = {
        kind: "Fn",
        param: params[i],
        body: result,
        span: { start: fnToken.span.start, end: body.span.end },
      };
    }
    return {
      kind: "Fn",
      param: params[0] || "_",
      body: result,
      span: { start: fnToken.span.start, end: body.span.end },
    };
  }

  parseCallArgs(fn: Expr): Expr {
    this.expect(TokenKind.LParen);
    const args: Expr[] = [];
    if (!this.at(TokenKind.RParen)) {
      args.push(this.parseExpr(0));
      while (this.eat(TokenKind.Comma)) {
        args.push(this.parseExpr(0));
      }
    }
    const rparen = this.expect(TokenKind.RParen);

    // Desugar multi-arg call into nested Call nodes
    let result: Expr = fn;
    for (const arg of args) {
      result = {
        kind: "Call",
        fn: result,
        arg,
        span: { start: fn.span.start, end: rparen.span.end },
      };
    }
    return result;
  }

  led(left: Expr, bp: [number, number]): Expr {
    const opToken = this.advance();
    const op = tokenToOp(opToken.kind);
    const right = this.parseExpr(bp[1]);
    return {
      kind: "BinOp",
      op,
      left,
      right,
      span: { start: left.span.start, end: right.span.end },
    };
  }
}

const PREFIX_BP = 80;

// Returns [left binding power, right binding power]
// Left < right means left-associative
function infixBp(kind: TokenKind): [number, number] | null {
  switch (kind) {
    case TokenKind.PipePipe: return [10, 11];
    case TokenKind.AmpAmp: return [20, 21];
    case TokenKind.EqEq:
    case TokenKind.BangEq: return [30, 31];
    case TokenKind.Lt:
    case TokenKind.Gt:
    case TokenKind.LtEq:
    case TokenKind.GtEq: return [40, 41];
    case TokenKind.PlusPlus: return [50, 51];
    case TokenKind.Plus:
    case TokenKind.Minus: return [60, 61];
    case TokenKind.Star:
    case TokenKind.Slash:
    case TokenKind.Percent: return [70, 71];
    default: return null;
  }
}

function tokenToOp(kind: TokenKind): string {
  switch (kind) {
    case TokenKind.Plus: return "+";
    case TokenKind.Minus: return "-";
    case TokenKind.Star: return "*";
    case TokenKind.Slash: return "/";
    case TokenKind.Percent: return "%";
    case TokenKind.PlusPlus: return "++";
    case TokenKind.EqEq: return "==";
    case TokenKind.BangEq: return "!=";
    case TokenKind.Lt: return "<";
    case TokenKind.Gt: return ">";
    case TokenKind.LtEq: return "<=";
    case TokenKind.GtEq: return ">=";
    case TokenKind.AmpAmp: return "&&";
    case TokenKind.PipePipe: return "||";
    default: throw new Error(`Unknown operator token: ${kind}`);
  }
}
