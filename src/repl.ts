import { lex } from "./lexer";
import { parse } from "./parser";
import { evaluate } from "./evaluator";
import { infer } from "./typechecker";
import { prettyPrint, Value } from "./values";
import { prettyType, Type, resetTypeVarCounter } from "./types";
import { createPrelude } from "./prelude";
import { TokenKind } from "./token";

interface ReplResult {
  output?: string;
  error?: string;
}

export class ReplSession {
  private valueEnv: Map<string, Value>;
  private typeEnv: Map<string, { vars: number[]; type: Type }>;

  constructor() {
    this.valueEnv = createPrelude();
    this.typeEnv = new Map();
  }

  eval(input: string): ReplResult {
    const trimmed = input.trim();

    // Handle commands
    if (trimmed.startsWith(":")) return this.handleCommand(trimmed);

    try {
      // Check if this is a top-level let binding (without `in`)
      const tokens = lex(trimmed);
      if (tokens.length > 0 && tokens[0].kind === TokenKind.Let) {
        return this.handleLetBinding(trimmed, tokens);
      }

      // Regular expression
      const ast = parse(tokens);
      // Type check (best-effort — skip if bindings are missing from type env)
      try {
        resetTypeVarCounter();
        infer(ast, new Map(this.typeEnv), trimmed);
      } catch (e: any) {
        // If it's a real type error (not just missing binding), report it
        if (e.message && !e.message.startsWith("Undefined variable")) {
          return { error: e.message };
        }
      }
      const result = evaluate(ast, new Map(this.valueEnv));
      return { output: prettyPrint(result) };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  private handleLetBinding(input: string, tokens: import("./token").Token[]): ReplResult {
    // Check if there's an `in` keyword — if so, treat as normal expression
    const hasIn = tokens.some(t => t.kind === TokenKind.In);
    if (hasIn) {
      const ast = parse(tokens);
      resetTypeVarCounter();
      infer(ast, undefined, input);
      const result = evaluate(ast, new Map(this.valueEnv));
      return { output: prettyPrint(result) };
    }

    // Top-level let: parse `let [rec] name = value`
    let i = 1; // skip 'let'
    let rec = false;
    if (tokens[i]?.kind === TokenKind.Rec) {
      rec = true;
      i++;
    }
    const name = tokens[i]?.lexeme;
    if (!name) return { error: "Expected variable name after let" };

    // Construct `let name = value in name` so the existing parser works
    const augmented = `${input} in ${name}`;
    const ast = parse(lex(augmented));
    resetTypeVarCounter();
    const type = infer(ast, undefined, augmented);
    const result = evaluate(ast, new Map(this.valueEnv));

    this.valueEnv.set(name, result);
    this.typeEnv.set(name, { vars: [], type });

    return { output: `${name} = ${prettyPrint(result)}` };
  }

  private handleCommand(input: string): ReplResult {
    const parts = input.split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case ":type": {
        const name = parts[1];
        if (!name) return { error: "Usage: :type <name>" };
        const scheme = this.typeEnv.get(name);
        if (!scheme) {
          // Try inferring from a lookup
          const val = this.valueEnv.get(name);
          if (!val) return { error: `Unknown binding: ${name}` };
          return { output: val.kind };
        }
        return { output: prettyType(scheme.type) };
      }

      case ":env": {
        const entries: string[] = [];
        for (const [name, scheme] of this.typeEnv) {
          entries.push(`${name} : ${prettyType(scheme.type)}`);
        }
        return { output: entries.join("\n") || "(empty)" };
      }

      case ":quit":
      case ":q":
        return { output: "Goodbye!" };

      default:
        return { error: `Unknown command: ${cmd}` };
    }
  }
}
