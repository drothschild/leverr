# Leverr Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete interpreter for the Leverr language — a statically-typed scripting language with Hindley-Milner type inference, pipeline operators, and first-class error handling.

**Architecture:** Five-phase pipeline: Lexer → Parser → Type Checker → Evaluator → REPL. Each phase is a clean module with distinct input/output types. TypeScript with discriminated unions for AST nodes.

**Tech Stack:** TypeScript (strict mode), Vitest (testing), tsx (running), Node.js readline (REPL)

---

## Phase 0: Project Setup

### Task 0.1: Initialize TypeScript Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

**Step 1: Initialize project**

```bash
cd /Users/davidrothschild/Projects/impressive
npm init -y
npm install --save-dev typescript vitest tsx @types/node
```

**Step 2: Configure TypeScript**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 3: Configure Vitest**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "leverr": "tsx src/index.ts"
  }
}
```

**Step 4: Create entry point**

Create `src/index.ts`:
```typescript
console.log("Leverr v0.1.0");
```

**Step 5: Verify setup**

```bash
npx tsx src/index.ts
# Expected: "Leverr v0.1.0"
npx vitest run
# Expected: no tests found (clean run)
```

**Step 6: Commit**

```bash
git add package.json tsconfig.json src/index.ts package-lock.json
git commit -m "chore: initialize TypeScript project"
```

### Task 0.2: Define Core Types — Source Spans

**Files:**
- Create: `src/span.ts`
- Create: `src/span.test.ts`

Source spans track where every token and AST node came from. They flow through every phase for error messages.

**Step 1: Write the failing test**

Create `src/span.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { Span, formatSpan } from "./span";

describe("Span", () => {
  it("creates a span with line, column, and offset", () => {
    const span: Span = { start: { line: 1, col: 5, offset: 4 }, end: { line: 1, col: 10, offset: 9 } };
    expect(span.start.line).toBe(1);
    expect(span.start.col).toBe(5);
    expect(span.end.col).toBe(10);
  });

  it("formats a span for error messages", () => {
    const span: Span = { start: { line: 3, col: 12, offset: 40 }, end: { line: 3, col: 17, offset: 45 } };
    expect(formatSpan(span)).toBe("line 3, col 12");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/span.test.ts
```
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/span.ts`:
```typescript
export interface Position {
  line: number;
  col: number;
  offset: number;
}

export interface Span {
  start: Position;
  end: Position;
}

export function formatSpan(span: Span): string {
  return `line ${span.start.line}, col ${span.start.col}`;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/span.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/span.ts src/span.test.ts
git commit -m "feat: add source span types for error tracking"
```

### Task 0.3: Define Core Types — Tokens

**Files:**
- Create: `src/token.ts`
- Create: `src/token.test.ts`

**Step 1: Write the failing test**

Create `src/token.test.ts`:
```typescript
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

  it("has all required token kinds for Leverr", () => {
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/token.test.ts
```

**Step 3: Write minimal implementation**

Create `src/token.ts`:
```typescript
import { Span } from "./span";

export enum TokenKind {
  // Literals
  Int = "Int",
  Float = "Float",
  String = "String",
  True = "True",
  False = "False",

  // Keywords
  Let = "Let",
  Rec = "Rec",
  Fn = "Fn",
  Match = "Match",
  Catch = "Catch",
  In = "In",
  If = "If",

  // Identifiers
  Ident = "Ident",
  UpperIdent = "UpperIdent",

  // Operators
  Plus = "Plus",
  Minus = "Minus",
  Star = "Star",
  Slash = "Slash",
  Percent = "Percent",
  PlusPlus = "PlusPlus",
  Eq = "Eq",
  EqEq = "EqEq",
  BangEq = "BangEq",
  Lt = "Lt",
  Gt = "Gt",
  LtEq = "LtEq",
  GtEq = "GtEq",
  AmpAmp = "AmpAmp",
  PipePipe = "PipePipe",
  Bang = "Bang",
  Arrow = "Arrow",
  Pipe = "Pipe",
  Question = "Question",

  // Delimiters
  LParen = "LParen",
  RParen = "RParen",
  LBrace = "LBrace",
  RBrace = "RBrace",
  LBracket = "LBracket",
  RBracket = "RBracket",
  Comma = "Comma",
  Dot = "Dot",
  Colon = "Colon",
  Underscore = "Underscore",

  // Special
  EOF = "EOF",
}

export interface Token {
  kind: TokenKind;
  lexeme: string;
  span: Span;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/token.test.ts
```

**Step 5: Commit**

```bash
git add src/token.ts src/token.test.ts
git commit -m "feat: define token kinds for Leverr lexer"
```

### Task 0.4: Define Core Types — AST (Untyped)

**Files:**
- Create: `src/ast.ts`
- Create: `src/ast.test.ts`

The untyped AST is the parser's output. Every node carries a Span. We use TypeScript discriminated unions (`kind` field).

**Step 1: Write the failing test**

Create `src/ast.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/ast.test.ts
```

**Step 3: Write minimal implementation**

Create `src/ast.ts`:
```typescript
import { Span } from "./span";

// ── Expressions ──────────────────────────────────────────

export type Expr =
  | IntLit
  | FloatLit
  | StringLit
  | BoolLit
  | UnitLit
  | Ident
  | Let
  | Fn
  | Call
  | BinOp
  | UnaryOp
  | Pipe
  | Try
  | Catch
  | Match
  | If
  | List
  | Tuple
  | Record
  | FieldAccess
  | Tag;

export interface IntLit { kind: "IntLit"; value: number; span: Span }
export interface FloatLit { kind: "FloatLit"; value: number; span: Span }
export interface StringLit { kind: "StringLit"; value: string; span: Span }
export interface BoolLit { kind: "BoolLit"; value: boolean; span: Span }
export interface UnitLit { kind: "UnitLit"; span: Span }
export interface Ident { kind: "Ident"; name: string; span: Span }

export interface Let {
  kind: "Let";
  name: string;
  value: Expr;
  body: Expr;
  rec: boolean;
  span: Span;
}

export interface Fn {
  kind: "Fn";
  param: string;
  body: Expr;
  span: Span;
}

export interface Call {
  kind: "Call";
  fn: Expr;
  arg: Expr;
  span: Span;
}

export interface BinOp {
  kind: "BinOp";
  op: string;
  left: Expr;
  right: Expr;
  span: Span;
}

export interface UnaryOp {
  kind: "UnaryOp";
  op: string;
  expr: Expr;
  span: Span;
}

export interface Pipe {
  kind: "Pipe";
  left: Expr;
  right: Expr;
  span: Span;
}

export interface Try {
  kind: "Try";
  expr: Expr;
  span: Span;
}

export interface Catch {
  kind: "Catch";
  expr: Expr;
  errorName: string;
  fallback: Expr;
  span: Span;
}

export interface Match {
  kind: "Match";
  subject: Expr;
  cases: MatchCase[];
  span: Span;
}

export interface MatchCase {
  pattern: Pattern;
  body: Expr;
}

export interface If {
  kind: "If";
  cond: Expr;
  then: Expr;
  else_: Expr;
  span: Span;
}

export interface List {
  kind: "List";
  elements: Expr[];
  span: Span;
}

export interface Tuple {
  kind: "Tuple";
  elements: Expr[];
  span: Span;
}

export interface Record {
  kind: "Record";
  fields: { name: string; value: Expr }[];
  span: Span;
}

export interface FieldAccess {
  kind: "FieldAccess";
  expr: Expr;
  field: string;
  span: Span;
}

export interface Tag {
  kind: "Tag";
  tag: string;
  args: Expr[];
  span: Span;
}

// ── Patterns ─────────────────────────────────────────────

export type Pattern =
  | IntPat
  | FloatPat
  | StringPat
  | BoolPat
  | WildcardPat
  | IdentPat
  | TagPat
  | TuplePat
  | RecordPat;

export interface IntPat { kind: "IntPat"; value: number }
export interface FloatPat { kind: "FloatPat"; value: number }
export interface StringPat { kind: "StringPat"; value: string }
export interface BoolPat { kind: "BoolPat"; value: boolean }
export interface WildcardPat { kind: "WildcardPat" }
export interface IdentPat { kind: "IdentPat"; name: string }
export interface TagPat { kind: "TagPat"; tag: string; args: Pattern[] }
export interface TuplePat { kind: "TuplePat"; elements: Pattern[] }
export interface RecordPat { kind: "RecordPat"; fields: { name: string; pattern: Pattern }[] }
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/ast.test.ts
```

**Step 5: Commit**

```bash
git add src/ast.ts src/ast.test.ts
git commit -m "feat: define untyped AST types with patterns"
```

---

## Phase 1: Lexer

### Task 1.1: Lex Single Tokens — Literals and Operators

**Files:**
- Create: `src/lexer.ts`
- Create: `src/lexer.test.ts`

**Step 1: Write the failing test**

Create `src/lexer.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lexer.test.ts
```

**Step 3: Write minimal implementation**

Create `src/lexer.ts`: A function `lex(source: string): Token[]` that scans character by character, tracks position (line/col/offset), and emits tokens. Use a `switch` on the current character for single-char tokens, lookahead for multi-char tokens (`==`, `|>`, `++`, `->`, `<=`, `>=`, `!=`, `&&`, `||`), and a keyword lookup table for `let`/`fn`/`match`/etc. Skip `--` to end of line for comments.

Implementation should be ~150-200 lines. Key details:
- Track `line`, `col`, `offset` — increment `line` and reset `col` on `\n`
- For numbers: consume digits, check for `.` followed by digit for floats
- For strings: consume until closing `"`
- For identifiers: consume while alphanumeric or `_`, then check keyword table
- If first char is uppercase → `UpperIdent`, else check keywords, else `Ident`

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lexer.test.ts
```

**Step 5: Commit**

```bash
git add src/lexer.ts src/lexer.test.ts
git commit -m "feat: implement lexer for all Leverr tokens"
```

### Task 1.2: Lexer Source Spans and Error Handling

**Files:**
- Modify: `src/lexer.test.ts`
- Modify: `src/lexer.ts`

**Step 1: Write the failing test**

Add to `src/lexer.test.ts`:
```typescript
describe("source spans", () => {
  it("tracks token positions", () => {
    const tokens = lex("let x = 42");
    const let_ = tokens[0];
    expect(let_.span.start).toEqual({ line: 1, col: 1, offset: 0 });
    expect(let_.span.end).toEqual({ line: 1, col: 4, offset: 3 });

    const x = tokens[1];
    expect(x.span.start).toEqual({ line: 1, col: 5, offset: 4 });

    const num = tokens[3];
    expect(num.span.start).toEqual({ line: 1, col: 9, offset: 8 });
    expect(num.span.end).toEqual({ line: 1, col: 11, offset: 10 });
  });

  it("tracks positions across lines", () => {
    const tokens = lex("let x = 1\nlet y = 2");
    const y = tokens.find((t) => t.lexeme === "y")!;
    expect(y.span.start.line).toBe(2);
    expect(y.span.start.col).toBe(5);
  });
});

describe("lexer errors", () => {
  it("reports unexpected characters with position", () => {
    expect(() => lex("let x = @")).toThrow();
    try {
      lex("let x = @");
    } catch (e: any) {
      expect(e.message).toContain("line 1");
      expect(e.message).toContain("col 9");
    }
  });

  it("reports unterminated strings", () => {
    expect(() => lex('"hello')).toThrow();
    try {
      lex('"hello');
    } catch (e: any) {
      expect(e.message).toContain("unterminated string");
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lexer.test.ts
```

**Step 3: Update lexer to handle spans and errors correctly**

Ensure the lexer:
- Sets `start` position before consuming each token
- Sets `end` position after consuming each token
- Throws `LeverrError` with span info for unexpected chars and unterminated strings

Create `src/errors.ts`:
```typescript
import { Span, formatSpan } from "./span";

export class LeverrError extends Error {
  constructor(
    public msg: string,
    public span: Span,
    public source: string,
  ) {
    super(formatError(msg, span, source));
  }
}

export function formatError(msg: string, span: Span, source: string): string {
  const lines = source.split("\n");
  const line = lines[span.start.line - 1] || "";
  const pointer = " ".repeat(span.start.col - 1) + "^".repeat(Math.max(1, span.end.col - span.start.col));

  return [
    `Error at ${formatSpan(span)}:`,
    `  ${line}`,
    `  ${pointer}`,
    `  ${msg}`,
  ].join("\n");
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lexer.test.ts
```

**Step 5: Commit**

```bash
git add src/lexer.ts src/lexer.test.ts src/errors.ts
git commit -m "feat: add source spans and error reporting to lexer"
```

### Task 1.3: Lex Complete Leverr Programs

**Files:**
- Modify: `src/lexer.test.ts`

**Step 1: Write the failing test**

Add to `src/lexer.test.ts`:
```typescript
describe("complete programs", () => {
  it("lexes a let binding with function", () => {
    const tokens = lex("let add = fn(a, b) -> a + b");
    const expected = [
      TokenKind.Let, TokenKind.Ident, TokenKind.Eq, TokenKind.Fn,
      TokenKind.LParen, TokenKind.Ident, TokenKind.Comma, TokenKind.Ident,
      TokenKind.RParen, TokenKind.Arrow, TokenKind.Ident, TokenKind.Plus,
      TokenKind.Ident, TokenKind.EOF,
    ];
    expect(kinds("let add = fn(a, b) -> a + b")).toEqual(expected);
  });

  it("lexes a pipeline with ? operator", () => {
    expect(kinds('input |> parse_int? |> catch e -> 0')).toEqual([
      TokenKind.Ident, TokenKind.Pipe, TokenKind.Ident, TokenKind.Question,
      TokenKind.Pipe, TokenKind.Catch, TokenKind.Ident, TokenKind.Arrow,
      TokenKind.Int, TokenKind.EOF,
    ]);
  });

  it("lexes a record literal", () => {
    expect(kinds('{ name: "Alice", age: 30 }')).toEqual([
      TokenKind.LBrace, TokenKind.Ident, TokenKind.Colon, TokenKind.String,
      TokenKind.Comma, TokenKind.Ident, TokenKind.Colon, TokenKind.Int,
      TokenKind.RBrace, TokenKind.EOF,
    ]);
  });

  it("lexes a match expression with tags", () => {
    expect(kinds("match s { Circle(r) -> r }")).toEqual([
      TokenKind.Match, TokenKind.Ident, TokenKind.LBrace,
      TokenKind.UpperIdent, TokenKind.LParen, TokenKind.Ident, TokenKind.RParen,
      TokenKind.Arrow, TokenKind.Ident, TokenKind.RBrace, TokenKind.EOF,
    ]);
  });
});
```

**Step 2: Run test — should pass if lexer is correct from 1.1**

```bash
npx vitest run src/lexer.test.ts
```

If any fail, fix the lexer. Then commit:

```bash
git add src/lexer.test.ts
git commit -m "test: add integration tests for lexing complete Leverr programs"
```

---

## Phase 2: Parser

### Task 2.1: Parse Literals and Identifiers

**Files:**
- Create: `src/parser.ts`
- Create: `src/parser.test.ts`

The parser uses Pratt parsing (precedence climbing) for expressions. It consumes a `Token[]` and produces an `Expr`.

**Step 1: Write the failing test**

Create `src/parser.test.ts`:
```typescript
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
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Write minimal parser**

Create `src/parser.ts`: A Pratt parser with:
- `parse(tokens: Token[]): Expr` — entry point
- `parseExpr(bp: number): Expr` — core Pratt loop
- `nud(token: Token): Expr` — prefix/atom parsing (null denotation)
- `led(left: Expr, op: Token): Expr` — infix parsing (left denotation)
- `bp(kind: TokenKind): number` — binding power table

Start with just literals and identifiers in `nud`.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse literals and identifiers"
```

### Task 2.2: Parse Binary and Unary Operators

**Files:**
- Modify: `src/parser.test.ts`
- Modify: `src/parser.ts`

**Step 1: Write the failing test**

Add to `src/parser.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Implement operator parsing**

Add to parser:
- Binding power table:
  - `||`: 10
  - `&&`: 20
  - `==`, `!=`: 30
  - `<`, `>`, `<=`, `>=`: 40
  - `++`: 50
  - `+`, `-`: 60
  - `*`, `/`, `%`: 70
  - Unary `-`, `!`: 80 (prefix)
  - `|>`: 5 (very low, left-assoc)
- Add `led` cases for each binary operator
- Add `nud` cases for `-` and `!` (prefix)
- Add `nud` case for `(` (grouping)

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse binary and unary operators with precedence"
```

### Task 2.3: Parse Let Bindings and Functions

**Files:**
- Modify: `src/parser.test.ts`
- Modify: `src/parser.ts`

**Step 1: Write the failing test**

Add to `src/parser.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Implement**

In `nud`:
- `Let`: consume `let`, optionally `rec`, then ident, `=`, expr, `in`, expr. Return `Let` node.
- `Fn`: consume `fn`, `(`, comma-separated params, `)`, `->`, body. Desugar multi-param into nested `Fn` nodes.

In `led` or as postfix in `nud`:
- Call: when an ident/expr is followed by `(`, parse argument list, desugar multi-arg into nested `Call` nodes.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse let bindings, functions, and calls with currying"
```

### Task 2.4: Parse Pipes, Try (?), and Catch

**Files:**
- Modify: `src/parser.test.ts`
- Modify: `src/parser.ts`

**Step 1: Write the failing test**

Add to `src/parser.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Implement**

- `|>` in `led` at binding power 5, left-associative. Creates `Pipe` node.
- `?` as postfix: after parsing an atom/call, check for `?` token. If present, wrap in `Try` node.
- `catch` in `nud`: consume `catch`, ident, `->`, expr. Creates `Catch` node. In a pipe context, `catch` appears on the right side.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse pipes, try operator, and catch expressions"
```

### Task 2.5: Parse Match Expressions and Patterns

**Files:**
- Modify: `src/parser.test.ts`
- Modify: `src/parser.ts`

**Step 1: Write the failing test**

Add to `src/parser.test.ts`:
```typescript
describe("match expressions", () => {
  it("parses match on literals", () => {
    const ast = parseExpr("match x { 1 -> true, 2 -> false }");
    expect(ast).toMatchObject({
      kind: "Match",
      subject: { kind: "Ident", name: "x" },
      cases: [
        { pattern: { kind: "IntPat", value: 1 }, body: { kind: "BoolLit", value: true } },
        { pattern: { kind: "IntPat", value: 2 }, body: { kind: "BoolLit", value: false } },
      ],
    });
  });

  it("parses match with wildcard", () => {
    const ast = parseExpr("match x { 1 -> true, _ -> false }");
    expect(ast.kind).toBe("Match");
    if (ast.kind === "Match") {
      expect(ast.cases[1].pattern.kind).toBe("WildcardPat");
    }
  });

  it("parses match with tag patterns", () => {
    const ast = parseExpr("match s { Circle(r) -> r, Rect(w, h) -> w }");
    expect(ast).toMatchObject({
      kind: "Match",
      cases: [
        { pattern: { kind: "TagPat", tag: "Circle", args: [{ kind: "IdentPat", name: "r" }] } },
        { pattern: { kind: "TagPat", tag: "Rect", args: [{ kind: "IdentPat", name: "w" }, { kind: "IdentPat", name: "h" }] } },
      ],
    });
  });

  it("parses match with identifier patterns (binding)", () => {
    const ast = parseExpr("match x { n -> n + 1 }");
    expect(ast).toMatchObject({
      kind: "Match",
      cases: [{ pattern: { kind: "IdentPat", name: "n" } }],
    });
  });

  it("parses match with boolean patterns", () => {
    const ast = parseExpr("match b { true -> 1, false -> 0 }");
    expect(ast).toMatchObject({
      kind: "Match",
      cases: [
        { pattern: { kind: "BoolPat", value: true } },
        { pattern: { kind: "BoolPat", value: false } },
      ],
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Implement**

In `nud` for `Match`:
- Consume `match`, parse subject expression, consume `{`
- Parse comma-separated cases until `}`
- Each case: parse pattern, consume `->`, parse body expression

Pattern parser:
- `IntPat`: integer literal
- `FloatPat`: float literal
- `StringPat`: string literal
- `BoolPat`: `true` / `false`
- `WildcardPat`: `_`
- `TagPat`: UpperIdent optionally followed by `(` patterns `)`
- `IdentPat`: lowercase identifier
- `TuplePat`: `(` patterns `)`
- `RecordPat`: `{` name: pattern, ... `}`

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse match expressions and pattern matching"
```

### Task 2.6: Parse Data Structures — Lists, Tuples, Records, Tags

**Files:**
- Modify: `src/parser.test.ts`
- Modify: `src/parser.ts`

**Step 1: Write the failing test**

Add to `src/parser.test.ts`:
```typescript
describe("data structures", () => {
  it("parses list literals", () => {
    const ast = parseExpr("[1, 2, 3]");
    expect(ast).toMatchObject({
      kind: "List",
      elements: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });
  });

  it("parses empty list", () => {
    const ast = parseExpr("[]");
    expect(ast).toMatchObject({ kind: "List", elements: [] });
  });

  it("parses tuples", () => {
    const ast = parseExpr('(1, "hello")');
    expect(ast).toMatchObject({
      kind: "Tuple",
      elements: [{ kind: "IntLit", value: 1 }, { kind: "StringLit", value: "hello" }],
    });
  });

  it("parses record literals", () => {
    const ast = parseExpr('{ name: "Alice", age: 30 }');
    expect(ast).toMatchObject({
      kind: "Record",
      fields: [
        { name: "name", value: { kind: "StringLit", value: "Alice" } },
        { name: "age", value: { kind: "IntLit", value: 30 } },
      ],
    });
  });

  it("parses field access", () => {
    const ast = parseExpr("user.name");
    expect(ast).toMatchObject({
      kind: "FieldAccess",
      expr: { kind: "Ident", name: "user" },
      field: "name",
    });
  });

  it("parses tagged values", () => {
    const ast = parseExpr("Ok(42)");
    expect(ast).toMatchObject({
      kind: "Tag",
      tag: "Ok",
      args: [{ kind: "IntLit", value: 42 }],
    });
  });

  it("parses tags with no args", () => {
    const ast = parseExpr("None");
    expect(ast).toMatchObject({ kind: "Tag", tag: "None", args: [] });
  });

  it("parses nested tags", () => {
    const ast = parseExpr("Ok(Some(5))");
    expect(ast).toMatchObject({
      kind: "Tag", tag: "Ok",
      args: [{ kind: "Tag", tag: "Some", args: [{ kind: "IntLit", value: 5 }] }],
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/parser.test.ts
```

**Step 3: Implement**

In `nud`:
- `[`: parse comma-separated exprs until `]`. Return `List` or empty `List`.
- `(`: if contains `,`, it's a `Tuple`; otherwise it's grouping. Parse accordingly.
- `{`: parse `name: expr, ...` until `}`. Return `Record`.
- `UpperIdent`: parse as `Tag`. If followed by `(`, parse args. Otherwise, empty args.

In `led`:
- `.`: parse field access. Left-associative at high binding power (90+).

Note on tuples vs grouping: Parse inside `(...)`. If there's exactly one expr and no comma, it's grouping. If there's a comma, it's a `Tuple`.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/parser.test.ts
```

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: parse lists, tuples, records, tags, and field access"
```

### Task 2.7: Parse Complete Programs

**Files:**
- Modify: `src/parser.test.ts`

Integration tests that parse full Leverr programs end-to-end.

**Step 1: Write the test**

Add to `src/parser.test.ts`:
```typescript
describe("complete programs", () => {
  it("parses a pipeline with error handling", () => {
    const ast = parseExpr(`
      let process = fn(input) ->
        input
        |> parse_int?
        |> fn n -> n * 2
        |> catch e -> 0
      in process("42")
    `);
    expect(ast.kind).toBe("Let");
  });

  it("parses a match on tagged unions", () => {
    const ast = parseExpr(`
      let area = fn(s) -> match s {
        Circle(r) -> 3.14 * r * r,
        Rect(w, h) -> w * h
      }
      in area(Circle(5.0))
    `);
    expect(ast.kind).toBe("Let");
  });

  it("parses nested function calls with partial application", () => {
    const ast = parseExpr(`
      let result = [1, 2, 3, 4, 5]
        |> filter(fn(x) -> x > 2)
        |> map(fn(x) -> x * 10)
      in result
    `);
    expect(ast.kind).toBe("Let");
  });

  it("parses record operations", () => {
    const ast = parseExpr(`
      let user = { name: "Alice", age: 30 }
      in user.name
    `);
    expect(ast).toMatchObject({
      kind: "Let",
      body: { kind: "FieldAccess", field: "name" },
    });
  });
});
```

**Step 2: Run test — should pass**

```bash
npx vitest run src/parser.test.ts
```

Fix any failures, then commit:

```bash
git add src/parser.test.ts
git commit -m "test: add integration tests for parsing complete Leverr programs"
```

---

## Phase 3: Evaluator (Before Type Checker)

Building the evaluator before the type checker lets us run programs immediately and iterate on language feel. The type checker comes next and catches errors statically.

### Task 3.1: Define Runtime Values

**Files:**
- Create: `src/values.ts`
- Create: `src/values.test.ts`

**Step 1: Write the failing test**

Create `src/values.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { Value, prettyPrint } from "./values";

describe("Values", () => {
  it("represents primitives", () => {
    const v: Value = { kind: "Int", value: 42 };
    expect(prettyPrint(v)).toBe("42");
  });

  it("represents strings", () => {
    expect(prettyPrint({ kind: "String", value: "hello" })).toBe('"hello"');
  });

  it("represents lists", () => {
    expect(prettyPrint({
      kind: "List",
      elements: [{ kind: "Int", value: 1 }, { kind: "Int", value: 2 }],
    })).toBe("[1, 2]");
  });

  it("represents records", () => {
    expect(prettyPrint({
      kind: "Record",
      fields: new Map([["name", { kind: "String", value: "Alice" }]]),
    })).toBe('{ name: "Alice" }');
  });

  it("represents tagged values", () => {
    expect(prettyPrint({
      kind: "Tag",
      tag: "Ok",
      args: [{ kind: "Int", value: 42 }],
    })).toBe("Ok(42)");
  });

  it("represents closures", () => {
    expect(prettyPrint({ kind: "Closure", param: "x", body: {} as any, env: new Map() })).toBe("<fn>");
  });

  it("represents unit", () => {
    expect(prettyPrint({ kind: "Unit" })).toBe("()");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/values.test.ts
```

**Step 3: Write minimal implementation**

Create `src/values.ts`:
```typescript
import { Expr } from "./ast";

export type Value =
  | { kind: "Int"; value: number }
  | { kind: "Float"; value: number }
  | { kind: "String"; value: string }
  | { kind: "Bool"; value: boolean }
  | { kind: "Unit" }
  | { kind: "List"; elements: Value[] }
  | { kind: "Tuple"; elements: Value[] }
  | { kind: "Record"; fields: Map<string, Value> }
  | { kind: "Tag"; tag: string; args: Value[] }
  | { kind: "Closure"; param: string; body: Expr; env: Map<string, Value> }
  | { kind: "BuiltinFn"; name: string; arity: number; applied: Value[]; fn: (args: Value[]) => Value };

export function prettyPrint(v: Value): string {
  switch (v.kind) {
    case "Int": return String(v.value);
    case "Float": return String(v.value);
    case "String": return `"${v.value}"`;
    case "Bool": return String(v.value);
    case "Unit": return "()";
    case "List": return `[${v.elements.map(prettyPrint).join(", ")}]`;
    case "Tuple": return `(${v.elements.map(prettyPrint).join(", ")})`;
    case "Record": {
      const fields = [...v.fields.entries()]
        .map(([k, val]) => `${k}: ${prettyPrint(val)}`)
        .join(", ");
      return `{ ${fields} }`;
    }
    case "Tag":
      return v.args.length === 0
        ? v.tag
        : `${v.tag}(${v.args.map(prettyPrint).join(", ")})`;
    case "Closure": return "<fn>";
    case "BuiltinFn": return `<builtin:${v.name}>`;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/values.test.ts
```

**Step 5: Commit**

```bash
git add src/values.ts src/values.test.ts
git commit -m "feat: define runtime value types with pretty printing"
```

### Task 3.2: Evaluate Literals and Binary Operators

**Files:**
- Create: `src/evaluator.ts`
- Create: `src/evaluator.test.ts`

**Step 1: Write the failing test**

Create `src/evaluator.test.ts`:
```typescript
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
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 3: Write minimal evaluator**

Create `src/evaluator.ts`: A tree-walking evaluator.
- `evaluate(expr: Expr, env?: Map<string, Value>): Value`
- Switch on `expr.kind`
- For `BinOp`: evaluate both sides, then apply operator
- For `UnaryOp`: evaluate operand, then apply operator
- Integer division for `Int / Int`

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 5: Commit**

```bash
git add src/evaluator.ts src/evaluator.test.ts
git commit -m "feat: evaluate literals, arithmetic, comparison, and logical operators"
```

### Task 3.3: Evaluate Let Bindings, Functions, and Calls

**Files:**
- Modify: `src/evaluator.test.ts`
- Modify: `src/evaluator.ts`

**Step 1: Write the failing test**

Add to `src/evaluator.test.ts`:
```typescript
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 3: Implement**

In evaluator:
- `Let`: evaluate value, extend env with binding, evaluate body in new env. For `rec`, the closure's env must include itself.
- `Fn`: return `Closure` value capturing current env.
- `Call`: evaluate fn and arg. If fn is `Closure`, extend closure's env with param → arg, evaluate body. If fn is `BuiltinFn`, apply arg to the builtin. Multi-arg calls are already desugared to nested `Call` by parser.

For auto-currying: `BuiltinFn` tracks `arity` and `applied` args. When called with one arg, if `applied.length + 1 < arity`, return new `BuiltinFn` with arg added to `applied`. When all args are present, call `fn`.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 5: Commit**

```bash
git add src/evaluator.ts src/evaluator.test.ts
git commit -m "feat: evaluate let bindings, closures, currying, and recursion"
```

### Task 3.4: Evaluate Pipes, Match, and Data Structures

**Files:**
- Modify: `src/evaluator.test.ts`
- Modify: `src/evaluator.ts`

**Step 1: Write the failing test**

Add to `src/evaluator.test.ts`:
```typescript
describe("pipes", () => {
  it("pipes a value into a function", () => {
    expect(runPrint("let double = fn(x) -> x * 2 in 5 |> double")).toBe("10");
  });

  it("chains pipes", () => {
    expect(runPrint(`
      let double = fn(x) -> x * 2
      in let inc = fn(x) -> x + 1
      in 5 |> double |> inc
    `)).toBe("11");
  });
});

describe("match", () => {
  it("matches integer literals", () => {
    expect(runPrint("match 1 { 1 -> true, 2 -> false }")).toBe("true");
  });

  it("matches wildcards", () => {
    expect(runPrint("match 99 { 1 -> false, _ -> true }")).toBe("true");
  });

  it("matches and binds identifiers", () => {
    expect(runPrint("match 5 { n -> n + 1 }")).toBe("6");
  });

  it("matches tagged values", () => {
    expect(runPrint("match Ok(42) { Ok(n) -> n, Err(e) -> 0 }")).toBe("42");
  });

  it("matches booleans", () => {
    expect(runPrint("match true { true -> 1, false -> 0 }")).toBe("1");
  });
});

describe("data structures", () => {
  it("evaluates lists", () => {
    expect(runPrint("[1, 2, 3]")).toBe("[1, 2, 3]");
  });

  it("evaluates tuples", () => {
    expect(runPrint('(1, "hello")')).toBe('(1, "hello")');
  });

  it("evaluates records", () => {
    expect(runPrint('{ name: "Alice", age: 30 }')).toContain("name");
  });

  it("evaluates field access", () => {
    expect(runPrint('let user = { name: "Alice" } in user.name')).toBe('"Alice"');
  });

  it("evaluates tagged values", () => {
    expect(runPrint("Ok(42)")).toBe("Ok(42)");
    expect(runPrint("None")).toBe("None");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 3: Implement**

In evaluator:
- `Pipe`: evaluate left, evaluate right, then call right(left). `right` should evaluate to a function.
- `Match`: evaluate subject, then try each case's pattern. Pattern matching returns bindings on success.
  - `matchPattern(pattern, value): Map<string, Value> | null`
  - `IntPat/FloatPat/StringPat/BoolPat`: compare values
  - `WildcardPat`: always matches, no bindings
  - `IdentPat`: always matches, binds name → value
  - `TagPat`: check tag name matches, recursively match args
- `List`, `Tuple`, `Record`: evaluate elements/fields
- `FieldAccess`: evaluate expr, assert Record, return field
- `Tag`: evaluate args, return Tag value

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 5: Commit**

```bash
git add src/evaluator.ts src/evaluator.test.ts
git commit -m "feat: evaluate pipes, match, lists, records, tuples, and tags"
```

### Task 3.5: Evaluate Error Handling — Try (?) and Catch

**Files:**
- Modify: `src/evaluator.test.ts`
- Modify: `src/evaluator.ts`

**Step 1: Write the failing test**

Add to `src/evaluator.test.ts`:
```typescript
describe("error handling", () => {
  it("? unwraps Ok", () => {
    expect(runPrint("let x = Ok(42) in x?")).toBe("42");
  });

  it("? short-circuits on Err", () => {
    const result = run('let x = Err("bad") in x?');
    expect(result).toMatchObject({ kind: "Tag", tag: "Err" });
  });

  it("catch recovers from Err", () => {
    expect(runPrint('let x = Err("bad") in x |> catch e -> 0')).toBe("0");
  });

  it("catch passes through Ok", () => {
    expect(runPrint("let x = Ok(42) in x |> catch e -> 0")).toBe("42");
  });

  it("pipeline with ? and catch", () => {
    expect(runPrint(`
      let parse = fn(s) -> match s {
        "42" -> Ok(42),
        _ -> Err("bad")
      }
      in "42" |> parse? |> fn n -> n * 2 |> catch e -> 0
    `)).toBe("84");
  });

  it("pipeline with ? short-circuiting", () => {
    expect(runPrint(`
      let parse = fn(s) -> match s {
        "42" -> Ok(42),
        _ -> Err("bad")
      }
      in "bad" |> parse? |> fn n -> n * 2 |> catch e -> 0
    `)).toBe("0");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 3: Implement**

The `?` operator is the trickiest part. Options:
1. **Exception-based**: `Try` throws a special `EarlyReturn` exception caught by enclosing function/catch. Simple and effective for tree-walking.
2. **Result-threading**: Check every intermediate value. More pure but complex.

Use option 1 (exception-based):
- `Try`: evaluate expr. If it's `Tag("Ok", [v])`, return `v`. If it's `Tag("Err", [e])`, throw `EarlyReturn(Err value)`.
- `Fn` evaluation: wrap body evaluation in try/catch for `EarlyReturn`. If caught, return the Err value.
- `Catch`: evaluate expr. If it's `Tag("Err", [e])`, bind error name → e, evaluate fallback. If it's `Tag("Ok", [v])`, return `v`. If it's neither (plain value from a caught pipeline), return it directly.
- In pipe context when `?` short-circuits: the `EarlyReturn` propagates up through pipe evaluations until caught by a `Catch` or the enclosing function.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/evaluator.test.ts
```

**Step 5: Commit**

```bash
git add src/evaluator.ts src/evaluator.test.ts
git commit -m "feat: evaluate try (?) and catch for error handling"
```

### Task 3.6: Add Prelude (Built-in Functions)

**Files:**
- Create: `src/prelude.ts`
- Create: `src/prelude.test.ts`

**Step 1: Write the failing test**

Create `src/prelude.test.ts`:
```typescript
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

describe("Prelude", () => {
  describe("map", () => {
    it("maps over a list", () => {
      expect(runPrint("map(fn(x) -> x * 2, [1, 2, 3])")).toBe("[2, 4, 6]");
    });

    it("works with pipes", () => {
      expect(runPrint("[1, 2, 3] |> map(fn(x) -> x * 2)")).toBe("[2, 4, 6]");
    });
  });

  describe("filter", () => {
    it("filters a list", () => {
      expect(runPrint("filter(fn(x) -> x > 2, [1, 2, 3, 4])")).toBe("[3, 4]");
    });

    it("works with pipes", () => {
      expect(runPrint("[1, 2, 3, 4] |> filter(fn(x) -> x > 2)")).toBe("[3, 4]");
    });
  });

  describe("fold", () => {
    it("folds a list", () => {
      expect(runPrint("fold(0, fn(acc, x) -> acc + x, [1, 2, 3])")).toBe("6");
    });

    it("works with pipes", () => {
      expect(runPrint("[1, 2, 3] |> fold(0, fn(acc, x) -> acc + x)")).toBe("6");
    });
  });

  describe("length", () => {
    it("returns list length", () => {
      expect(runPrint("length([1, 2, 3])")).toBe("3");
    });

    it("returns string length", () => {
      expect(runPrint('length("hello")')).toBe("5");
    });
  });

  describe("head and tail", () => {
    it("head returns Ok of first element", () => {
      expect(runPrint("head([1, 2, 3])")).toBe("Ok(1)");
    });

    it("head returns Err on empty list", () => {
      expect(runPrint("head([])")).toBe('Err("empty list")');
    });

    it("tail returns Ok of rest", () => {
      expect(runPrint("tail([1, 2, 3])")).toBe("Ok([2, 3])");
    });

    it("tail returns Err on empty list", () => {
      expect(runPrint("tail([])")).toBe('Err("empty list")');
    });
  });

  describe("to_string", () => {
    it("converts int to string", () => {
      expect(runPrint("to_string(42)")).toBe('"42"');
    });
  });

  describe("pipeline composition", () => {
    it("chains filter, map, and fold", () => {
      expect(runPrint(`
        [1, 2, 3, 4, 5]
        |> filter(fn(x) -> x > 2)
        |> map(fn(x) -> x * 10)
        |> fold(0, fn(acc, x) -> acc + x)
      `)).toBe("120");
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/prelude.test.ts
```

**Step 3: Write minimal implementation**

Create `src/prelude.ts`:
```typescript
import { Value } from "./values";

export function createPrelude(): Map<string, Value> {
  const env = new Map<string, Value>();

  // map(f, list) — curried, arity 2
  env.set("map", builtin("map", 2, ([f, list]) => {
    assertList(list);
    return { kind: "List", elements: list.elements.map((el) => applyFn(f, el)) };
  }));

  // filter(f, list)
  env.set("filter", builtin("filter", 2, ([f, list]) => {
    assertList(list);
    return { kind: "List", elements: list.elements.filter((el) => {
      const result = applyFn(f, el);
      assertBool(result);
      return result.value;
    })};
  }));

  // fold(init, f, list)
  env.set("fold", builtin("fold", 3, ([init, f, list]) => {
    assertList(list);
    return list.elements.reduce((acc, el) => applyFn(applyFn(f, acc), el), init);
  }));

  // length(v) — works on lists and strings
  env.set("length", builtin("length", 1, ([v]) => {
    if (v.kind === "List") return { kind: "Int", value: v.elements.length };
    if (v.kind === "String") return { kind: "Int", value: v.value.length };
    throw new Error("length expects List or String");
  }));

  // head(list)
  env.set("head", builtin("head", 1, ([list]) => {
    assertList(list);
    if (list.elements.length === 0) return { kind: "Tag", tag: "Err", args: [{ kind: "String", value: "empty list" }] };
    return { kind: "Tag", tag: "Ok", args: [list.elements[0]] };
  }));

  // tail(list)
  env.set("tail", builtin("tail", 1, ([list]) => {
    assertList(list);
    if (list.elements.length === 0) return { kind: "Tag", tag: "Err", args: [{ kind: "String", value: "empty list" }] };
    return { kind: "Tag", tag: "Ok", args: [{ kind: "List", elements: list.elements.slice(1) }] };
  }));

  // to_string(v)
  env.set("to_string", builtin("to_string", 1, ([v]) => {
    if (v.kind === "Int") return { kind: "String", value: String(v.value) };
    if (v.kind === "Float") return { kind: "String", value: String(v.value) };
    if (v.kind === "Bool") return { kind: "String", value: String(v.value) };
    if (v.kind === "String") return v;
    return { kind: "String", value: "<value>" };
  }));

  // print(v)
  env.set("print", builtin("print", 1, ([v]) => {
    // Actual printing happens via side effect
    if (v.kind === "String") console.log(v.value);
    else console.log(prettyPrint(v));
    return { kind: "Unit" };
  }));

  // concat(a, b)
  env.set("concat", builtin("concat", 2, ([a, b]) => {
    assertString(a); assertString(b);
    return { kind: "String", value: a.value + b.value };
  }));

  // each(f, list)
  env.set("each", builtin("each", 2, ([f, list]) => {
    assertList(list);
    list.elements.forEach((el) => applyFn(f, el));
    return { kind: "Unit" };
  }));

  return env;
}
```

Note: `builtin()`, `applyFn()`, `assertList()`, etc. are helper functions. `applyFn` needs to call back into the evaluator for closures — use a callback or import evaluate.

The evaluator's default env should be initialized from `createPrelude()`.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/prelude.test.ts
```

**Step 5: Commit**

```bash
git add src/prelude.ts src/prelude.test.ts src/evaluator.ts
git commit -m "feat: add prelude with map, filter, fold, head, tail, and more"
```

---

## Phase 4: Type Checker

### Task 4.1: Define Type Representations

**Files:**
- Create: `src/types.ts`
- Create: `src/types.test.ts`

**Step 1: Write the failing test**

Create `src/types.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { Type, prettyType, freshTypeVar } from "./types";

describe("Types", () => {
  it("represents primitive types", () => {
    const t: Type = { kind: "TCon", name: "Int" };
    expect(prettyType(t)).toBe("Int");
  });

  it("represents function types", () => {
    const t: Type = {
      kind: "TFn",
      param: { kind: "TCon", name: "Int" },
      ret: { kind: "TCon", name: "Bool" },
    };
    expect(prettyType(t)).toBe("Int -> Bool");
  });

  it("represents type variables", () => {
    const t = freshTypeVar();
    expect(t.kind).toBe("TVar");
    expect(prettyType(t)).toMatch(/^[a-z]/);
  });

  it("generates unique type variable names", () => {
    const a = freshTypeVar();
    const b = freshTypeVar();
    expect(a).not.toEqual(b);
  });

  it("represents list types", () => {
    const t: Type = { kind: "TList", element: { kind: "TCon", name: "Int" } };
    expect(prettyType(t)).toBe("List(Int)");
  });

  it("represents tuple types", () => {
    const t: Type = {
      kind: "TTuple",
      elements: [{ kind: "TCon", name: "Int" }, { kind: "TCon", name: "String" }],
    };
    expect(prettyType(t)).toBe("(Int, String)");
  });

  it("represents record types", () => {
    const t: Type = {
      kind: "TRecord",
      fields: new Map([["name", { kind: "TCon", name: "String" }]]),
      rest: null,
    };
    expect(prettyType(t)).toBe("{ name: String }");
  });

  it("represents Result types", () => {
    const t: Type = {
      kind: "TResult",
      ok: { kind: "TCon", name: "Int" },
    };
    expect(prettyType(t)).toBe("Result(Int, String)");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/types.test.ts
```

**Step 3: Write minimal implementation**

Create `src/types.ts`:
```typescript
export type Type =
  | { kind: "TCon"; name: string }         // Int, Bool, String, Float, Unit
  | { kind: "TVar"; id: number }           // Type variable for inference
  | { kind: "TFn"; param: Type; ret: Type } // Function type
  | { kind: "TList"; element: Type }       // List(a)
  | { kind: "TTuple"; elements: Type[] }   // (a, b, ...)
  | { kind: "TRecord"; fields: Map<string, Type>; rest: Type | null } // { name: String | r }
  | { kind: "TResult"; ok: Type }          // Result(a, String) — error is always String in v1
  | { kind: "TTag"; tag: string; args: Type[] }; // Tagged union variant

let _nextId = 0;
export function freshTypeVar(): Type {
  return { kind: "TVar", id: _nextId++ };
}

export function resetTypeVarCounter(): void {
  _nextId = 0;
}

export function prettyType(t: Type): string {
  switch (t.kind) {
    case "TCon": return t.name;
    case "TVar": return String.fromCharCode(97 + (t.id % 26));
    case "TFn": {
      const param = t.param.kind === "TFn" ? `(${prettyType(t.param)})` : prettyType(t.param);
      return `${param} -> ${prettyType(t.ret)}`;
    }
    case "TList": return `List(${prettyType(t.element)})`;
    case "TTuple": return `(${t.elements.map(prettyType).join(", ")})`;
    case "TRecord": {
      const fields = [...t.fields.entries()].map(([k, v]) => `${k}: ${prettyType(v)}`).join(", ");
      return t.rest ? `{ ${fields} | ${prettyType(t.rest)} }` : `{ ${fields} }`;
    }
    case "TResult": return `Result(${prettyType(t.ok)}, String)`;
    case "TTag": return t.args.length === 0 ? t.tag : `${t.tag}(${t.args.map(prettyType).join(", ")})`;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/types.test.ts
```

**Step 5: Commit**

```bash
git add src/types.ts src/types.test.ts
git commit -m "feat: define type representations for HM inference"
```

### Task 4.2: Implement Unification

**Files:**
- Create: `src/unify.ts`
- Create: `src/unify.test.ts`

Unification is the core engine of type inference. Given two types, it finds a substitution that makes them equal, or reports a type error.

**Step 1: Write the failing test**

Create `src/unify.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { unify, Substitution, applySubst } from "./unify";
import { Type, freshTypeVar, resetTypeVarCounter } from "./types";

describe("Unification", () => {
  beforeEach(() => resetTypeVarCounter());

  it("unifies identical concrete types", () => {
    const subst = unify({ kind: "TCon", name: "Int" }, { kind: "TCon", name: "Int" });
    expect(subst.size).toBe(0);
  });

  it("fails on different concrete types", () => {
    expect(() => unify({ kind: "TCon", name: "Int" }, { kind: "TCon", name: "String" }))
      .toThrow("Int");
  });

  it("unifies a type variable with a concrete type", () => {
    const a = freshTypeVar() as { kind: "TVar"; id: number };
    const subst = unify(a, { kind: "TCon", name: "Int" });
    expect(applySubst(subst, a)).toEqual({ kind: "TCon", name: "Int" });
  });

  it("unifies two type variables", () => {
    const a = freshTypeVar();
    const b = freshTypeVar();
    const subst = unify(a, b);
    expect(applySubst(subst, a)).toEqual(applySubst(subst, b));
  });

  it("unifies function types", () => {
    const a = freshTypeVar();
    const t1: Type = { kind: "TFn", param: a, ret: { kind: "TCon", name: "Int" } };
    const t2: Type = { kind: "TFn", param: { kind: "TCon", name: "String" }, ret: { kind: "TCon", name: "Int" } };
    const subst = unify(t1, t2);
    expect(applySubst(subst, a)).toEqual({ kind: "TCon", name: "String" });
  });

  it("unifies list types", () => {
    const a = freshTypeVar();
    const subst = unify(
      { kind: "TList", element: a },
      { kind: "TList", element: { kind: "TCon", name: "Int" } },
    );
    expect(applySubst(subst, a)).toEqual({ kind: "TCon", name: "Int" });
  });

  it("performs occurs check", () => {
    const a = freshTypeVar();
    expect(() => unify(a, { kind: "TList", element: a })).toThrow("infinite");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/unify.test.ts
```

**Step 3: Write minimal implementation**

Create `src/unify.ts`:
```typescript
import { Type } from "./types";

export type Substitution = Map<number, Type>;

export function unify(t1: Type, t2: Type, subst: Substitution = new Map()): Substitution {
  t1 = applySubst(subst, t1);
  t2 = applySubst(subst, t2);

  if (t1.kind === "TVar") return bindVar(t1.id, t2, subst);
  if (t2.kind === "TVar") return bindVar(t2.id, t1, subst);

  if (t1.kind === "TCon" && t2.kind === "TCon") {
    if (t1.name !== t2.name) throw new TypeError(`Cannot unify ${t1.name} with ${t2.name}`);
    return subst;
  }

  if (t1.kind === "TFn" && t2.kind === "TFn") {
    subst = unify(t1.param, t2.param, subst);
    return unify(t1.ret, t2.ret, subst);
  }

  if (t1.kind === "TList" && t2.kind === "TList") {
    return unify(t1.element, t2.element, subst);
  }

  if (t1.kind === "TTuple" && t2.kind === "TTuple") {
    if (t1.elements.length !== t2.elements.length) throw new TypeError("Tuple length mismatch");
    for (let i = 0; i < t1.elements.length; i++) {
      subst = unify(t1.elements[i], t2.elements[i], subst);
    }
    return subst;
  }

  if (t1.kind === "TResult" && t2.kind === "TResult") {
    return unify(t1.ok, t2.ok, subst);
  }

  throw new TypeError(`Cannot unify ${t1.kind} with ${t2.kind}`);
}

function bindVar(id: number, t: Type, subst: Substitution): Substitution {
  if (t.kind === "TVar" && t.id === id) return subst;
  if (occursIn(id, t, subst)) throw new TypeError("infinite type");
  subst.set(id, t);
  return subst;
}

function occursIn(id: number, t: Type, subst: Substitution): boolean {
  t = applySubst(subst, t);
  if (t.kind === "TVar") return t.id === id;
  if (t.kind === "TFn") return occursIn(id, t.param, subst) || occursIn(id, t.ret, subst);
  if (t.kind === "TList") return occursIn(id, t.element, subst);
  if (t.kind === "TTuple") return t.elements.some((el) => occursIn(id, el, subst));
  if (t.kind === "TResult") return occursIn(id, t.ok, subst);
  return false;
}

export function applySubst(subst: Substitution, t: Type): Type {
  switch (t.kind) {
    case "TVar": return subst.has(t.id) ? applySubst(subst, subst.get(t.id)!) : t;
    case "TCon": return t;
    case "TFn": return { kind: "TFn", param: applySubst(subst, t.param), ret: applySubst(subst, t.ret) };
    case "TList": return { kind: "TList", element: applySubst(subst, t.element) };
    case "TTuple": return { kind: "TTuple", elements: t.elements.map((el) => applySubst(subst, el)) };
    case "TRecord": return {
      kind: "TRecord",
      fields: new Map([...t.fields.entries()].map(([k, v]) => [k, applySubst(subst, v)])),
      rest: t.rest ? applySubst(subst, t.rest) : null,
    };
    case "TResult": return { kind: "TResult", ok: applySubst(subst, t.ok) };
    case "TTag": return { kind: "TTag", tag: t.tag, args: t.args.map((a) => applySubst(subst, a)) };
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/unify.test.ts
```

**Step 5: Commit**

```bash
git add src/unify.ts src/unify.test.ts
git commit -m "feat: implement unification with occurs check"
```

### Task 4.3: Implement Type Inference — Literals, Operators, Let, Functions

**Files:**
- Create: `src/typechecker.ts`
- Create: `src/typechecker.test.ts`

This is the core Algorithm W implementation.

**Step 1: Write the failing test**

Create `src/typechecker.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
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
      expect(typeOf("fn(a, b) -> a + b")).toBe("Int -> Int -> Int");
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 3: Implement Algorithm W**

Create `src/typechecker.ts`:
- `infer(expr: Expr, env?: TypeEnv): Type` — entry point
- `inferExpr(expr: Expr, env: TypeEnv, subst: Substitution): [Type, Substitution]`
- Switch on expr.kind:
  - `IntLit` → `TCon("Int")`
  - `StringLit` → `TCon("String")`
  - `BoolLit` → `TCon("Bool")`
  - `FloatLit` → `TCon("Float")`
  - `Ident` → lookup in env, instantiate (replace bound type vars with fresh)
  - `BinOp` → infer left and right, unify with operator constraints
  - `Let` → infer value type, **generalize** (quantify free vars), add to env, infer body
  - `Fn` → create fresh type var for param, extend env, infer body, return `TFn(paramType, bodyType)`
  - `Call` → infer fn type, infer arg type, create fresh return var, unify fn with `TFn(argType, retVar)`, return retVar

Key concepts:
- **Generalize**: find type vars not free in environment, make them polymorphic
- **Instantiate**: replace polymorphic vars with fresh vars at each use site
- This is what enables `let id = fn(x) -> x in (id(5), id("hi"))`

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 5: Commit**

```bash
git add src/typechecker.ts src/typechecker.test.ts
git commit -m "feat: implement Algorithm W type inference for core expressions"
```

### Task 4.4: Type Inference — Data Structures and Pipes

**Files:**
- Modify: `src/typechecker.test.ts`
- Modify: `src/typechecker.ts`

**Step 1: Write the failing test**

Add to `src/typechecker.test.ts`:
```typescript
describe("data structures", () => {
  it("infers list type", () => {
    expect(typeOf("[1, 2, 3]")).toBe("List(Int)");
  });

  it("rejects heterogeneous lists", () => {
    expect(() => typeOf('[1, "two"]')).toThrow();
  });

  it("infers tuple type", () => {
    expect(typeOf('(1, "hello")')).toBe("(Int, String)");
  });

  it("infers record type", () => {
    const t = typeOf('{ name: "Alice", age: 30 }');
    expect(t).toContain("name: String");
    expect(t).toContain("age: Int");
  });

  it("infers field access type", () => {
    expect(typeOf('let r = { name: "Alice" } in r.name')).toBe("String");
  });

  it("infers tagged value type", () => {
    expect(typeOf("Ok(42)")).toBe("Result(Int, String)");
  });
});

describe("pipes", () => {
  it("infers pipe type", () => {
    expect(typeOf("let f = fn(x) -> x + 1 in 5 |> f")).toBe("Int");
  });

  it("rejects type mismatch in pipe", () => {
    expect(() => typeOf('let f = fn(x) -> x + 1 in "hi" |> f')).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 3: Implement**

Add to type checker:
- `List`: infer element types, unify all elements together
- `Tuple`: infer each element, return `TTuple`
- `Record`: infer each field value, return `TRecord`
- `FieldAccess`: infer record type, check field exists (or create fresh vars for row poly), return field type
- `Tag`: special-case `Ok`/`Err` to return `TResult`. Other tags return `TTag`.
- `Pipe`: desugar `a |> f` to `Call(f, a)` for type checking purposes

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 5: Commit**

```bash
git add src/typechecker.ts src/typechecker.test.ts
git commit -m "feat: type inference for lists, tuples, records, tags, and pipes"
```

### Task 4.5: Type Inference — Try (?), Catch, and Match

**Files:**
- Modify: `src/typechecker.test.ts`
- Modify: `src/typechecker.ts`

**Step 1: Write the failing test**

Add to `src/typechecker.test.ts`:
```typescript
describe("error handling types", () => {
  it("infers ? unwraps Result", () => {
    expect(typeOf("let x = Ok(42) in x?")).toBe("Int");
  });

  it("rejects ? on non-Result", () => {
    expect(() => typeOf("let x = 42 in x?")).toThrow();
  });

  it("infers catch collapses Result", () => {
    expect(typeOf("let x = Ok(42) in x |> catch e -> 0")).toBe("Int");
  });
});

describe("pattern matching types", () => {
  it("infers match on booleans", () => {
    expect(typeOf("match true { true -> 1, false -> 0 }")).toBe("Int");
  });

  it("rejects inconsistent branch types", () => {
    expect(() => typeOf('match true { true -> 1, false -> "no" }')).toThrow();
  });

  it("infers match with tag patterns", () => {
    expect(typeOf("match Ok(5) { Ok(n) -> n + 1, Err(e) -> 0 }")).toBe("Int");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 3: Implement**

Add to type checker:
- `Try`: infer expr type, unify with `TResult(fresh)`, return the `ok` type
- `Catch`: infer expr type, if it's a `TResult`, return the `ok` type. Infer fallback type, unify with `ok` type.
- `Match`: infer subject type. For each case, infer pattern type (unify with subject), infer body type, unify all body types together. Return unified body type.

Pattern typing:
- `IntPat` → `TCon("Int")`
- `BoolPat` → `TCon("Bool")`
- `IdentPat` → fresh type var (added to env in that branch)
- `TagPat` → appropriate tag type
- `WildcardPat` → subject type

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/typechecker.test.ts
```

**Step 5: Commit**

```bash
git add src/typechecker.ts src/typechecker.test.ts
git commit -m "feat: type inference for try, catch, and pattern matching"
```

### Task 4.6: Error Messages with Source Locations

**Files:**
- Modify: `src/typechecker.test.ts`
- Modify: `src/typechecker.ts`
- Modify: `src/errors.ts`

**Step 1: Write the failing test**

Add to `src/typechecker.test.ts`:
```typescript
describe("error messages", () => {
  it("includes source location in type error", () => {
    try {
      infer(parse(lex('5 + "hello"')), undefined, '5 + "hello"');
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toContain("line 1");
      expect(e.message).toContain("Int");
      expect(e.message).toContain("String");
    }
  });

  it("includes helpful message for ? on non-Result", () => {
    try {
      infer(parse(lex("5?")), undefined, "5?");
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toContain("Result");
    }
  });
});
```

**Step 2: Run test, implement, commit**

Update the type checker to pass source text through and use `LeverrError` with span info from AST nodes when reporting errors. Use the `formatError` function from `errors.ts`.

```bash
npx vitest run src/typechecker.test.ts
git add src/typechecker.ts src/typechecker.test.ts src/errors.ts
git commit -m "feat: type error messages with source locations"
```

---

## Phase 5: REPL and CLI

### Task 5.1: Build the REPL

**Files:**
- Create: `src/repl.ts`
- Create: `src/repl.test.ts`
- Modify: `src/index.ts`

**Step 1: Write the failing test**

Create `src/repl.test.ts`:
```typescript
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
    expect(result.output).toBe("Int -> Int");
  });

  it("shows environment with :env", () => {
    const session = new ReplSession();
    session.eval("let x = 42");
    const result = session.eval(":env");
    expect(result.output).toContain("x : Int");
  });

  it("reports errors without crashing", () => {
    const session = new ReplSession();
    const result = session.eval('5 + "hello"');
    expect(result.error).toBeTruthy();
    // Session still works after error
    const result2 = session.eval("1 + 2");
    expect(result2.output).toBe("3");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/repl.test.ts
```

**Step 3: Implement**

Create `src/repl.ts`:
- `ReplSession` class with persistent `env` (values) and `typeEnv` (types)
- `eval(input: string): { output?: string; error?: string }` method
- Handle `:type`, `:env`, `:quit` commands
- For expressions: lex → parse → type check → evaluate → pretty print
- For `let` bindings at top level (without `in`): add to persistent env
- Wrap evaluation in try/catch to recover from errors

Modify `src/index.ts`:
- If no args: start REPL with Node readline
- If `leverr run <file>`: read file, run through pipeline

Note for REPL: top-level `let x = 5` (without `in`) needs special handling in the parser. Either:
- The REPL wraps it as `let x = 5 in <next-input>` implicitly
- Or add a `Statement` AST node for top-level declarations

Recommend: treat REPL input as either an expression or a `let` declaration (no `in` required). If input starts with `let`, parse as declaration and add to env.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/repl.test.ts
```

**Step 5: Commit**

```bash
git add src/repl.ts src/repl.test.ts src/index.ts
git commit -m "feat: implement REPL with persistent bindings and commands"
```

### Task 5.2: File Runner

**Files:**
- Modify: `src/index.ts`
- Create: `src/runner.ts`
- Create: `src/runner.test.ts`

**Step 1: Write the failing test**

Create `src/runner.test.ts`:
```typescript
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
    expect(result.error).toContain("type");
  });

  it("runs pipeline with error handling", () => {
    const result = runSource(`
      let parse = fn(s) -> match s {
        "42" -> Ok(42),
        _ -> Err("bad")
      }
      in "42" |> parse? |> fn n -> n * 2
    `);
    expect(result.output).toBe("Ok(84)");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/runner.test.ts
```

**Step 3: Implement**

Create `src/runner.ts`:
- `runSource(source: string): { output?: string; error?: string }`
- Pipeline: lex → parse → type check → evaluate → pretty print
- Type check first — if it fails, return error without evaluating

Update `src/index.ts`:
- `leverr run <file>` reads file and calls `runSource`
- `leverr` (no args) starts REPL

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/runner.test.ts
```

**Step 5: Commit**

```bash
git add src/runner.ts src/runner.test.ts src/index.ts
git commit -m "feat: add file runner with type checking before evaluation"
```

---

## Phase 6: Integration and Polish

### Task 6.1: End-to-End Integration Tests

**Files:**
- Create: `tests/integration.test.ts`

Write tests that exercise the full pipeline on realistic Leverr programs.

**Step 1: Write the test**

Create `tests/integration.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { runSource } from "../src/runner";

describe("End-to-end: Leverr programs", () => {
  it("fibonacci", () => {
    const result = runSource(`
      let rec fib = fn(n) ->
        match n <= 1 {
          true -> n,
          false -> fib(n - 1) + fib(n - 2)
        }
      in fib(10)
    `);
    expect(result.output).toBe("55");
  });

  it("pipeline with map, filter, fold", () => {
    const result = runSource(`
      [1, 2, 3, 4, 5]
      |> filter(fn(x) -> x > 2)
      |> map(fn(x) -> x * 10)
      |> fold(0, fn(acc, x) -> acc + x)
    `);
    expect(result.output).toBe("120");
  });

  it("error handling pipeline", () => {
    const result = runSource(`
      let parse = fn(s) -> match s {
        "1" -> Ok(1),
        "2" -> Ok(2),
        _ -> Err("bad: " ++ s)
      }
      in let process = fn(s) ->
        s |> parse? |> fn n -> n * 10
      in process("2")
    `);
    expect(result.output).toBe("Ok(20)");
  });

  it("error handling with catch", () => {
    const result = runSource(`
      let parse = fn(s) -> match s {
        "1" -> Ok(1),
        _ -> Err("bad")
      }
      in "bad" |> parse? |> fn n -> n * 2 |> catch e -> 0
    `);
    expect(result.output).toBe("0");
  });

  it("records and field access", () => {
    const result = runSource(`
      let user = { name: "Alice", age: 30 }
      in let get_name = fn(r) -> r.name
      in get_name(user)
    `);
    expect(result.output).toBe('"Alice"');
  });

  it("tagged unions with pattern matching", () => {
    const result = runSource(`
      let area = fn(s) -> match s {
        Circle(r) -> r * r * 3,
        Rect(w, h) -> w * h
      }
      in area(Rect(3, 4))
    `);
    expect(result.output).toBe("12");
  });

  it("partial application with pipes", () => {
    const result = runSource(`
      let add = fn(a, b) -> a + b
      in [1, 2, 3] |> map(add(10))
    `);
    expect(result.output).toBe("[11, 12, 13]");
  });

  it("head and tail with error handling", () => {
    const result = runSource(`
      let first = head([1, 2, 3])?
      in first + 10
    `);
    expect(result.output).toContain("11");
  });
});
```

**Step 2: Run tests**

```bash
npx vitest run tests/integration.test.ts
```

Fix any failures — these are integration bugs.

**Step 3: Commit**

```bash
git add tests/integration.test.ts
git commit -m "test: add end-to-end integration tests for Leverr programs"
```

### Task 6.2: Add npm bin entry and README

**Files:**
- Modify: `package.json`
- Create: `README.md`

**Step 1: Add bin entry**

Add to `package.json`:
```json
{
  "bin": {
    "leverr": "./dist/index.js"
  }
}
```

Add a shebang to `src/index.ts`:
```typescript
#!/usr/bin/env node
```

**Step 2: Build and verify CLI works**

```bash
npm run build
node dist/index.js
# Should start REPL
```

**Step 3: Write README**

The README should cover:
- What Leverr is (2-3 sentences)
- Quick example showing pipes and `?` operator
- Installation and usage (`leverr` for REPL, `leverr run file.lv`)
- Language reference (link to design doc or inline summary)
- Architecture overview (the 5-phase pipeline)
- Design decisions and tradeoffs
- Known limitations and what you'd add next

**Step 4: Commit**

```bash
git add package.json src/index.ts README.md
git commit -m "feat: add CLI binary entry and README"
```

---

## Task Dependencies

```
Phase 0 (Setup, Spans, Tokens, AST)
  └── Phase 1 (Lexer)
       └── Phase 2 (Parser)
            ├── Phase 3 (Evaluator) ←── can run programs without types
            └── Phase 4 (Type Checker) ←── adds static checking
                 └── Phase 5 (REPL + CLI)
                      └── Phase 6 (Integration + Polish)
```

Phases 3 and 4 could be developed in parallel since they both consume the AST independently. Building the evaluator first gives faster feedback loops.

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 0 | 4 tasks | Project setup, core types (Span, Token, AST) |
| 1 | 3 tasks | Complete lexer with error reporting |
| 2 | 7 tasks | Full Pratt parser for all Leverr syntax |
| 3 | 6 tasks | Tree-walking evaluator with prelude |
| 4 | 6 tasks | HM type inference with unification |
| 5 | 2 tasks | REPL and file runner |
| 6 | 2 tasks | Integration tests and polish |
| **Total** | **30 tasks** | **Complete Leverr interpreter** |
