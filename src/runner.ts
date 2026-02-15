import { lex } from "./lexer";
import { parse } from "./parser";
import { evaluate } from "./evaluator";
import { infer } from "./typechecker";
import { prettyPrint } from "./values";
import { resetTypeVarCounter } from "./types";
import { createPrelude } from "./prelude";

interface RunResult {
  output?: string;
  error?: string;
}

export function runSource(source: string): RunResult {
  try {
    const tokens = lex(source);
    const ast = parse(tokens);

    // Type check — block on real type errors, skip undefined variable errors (prelude)
    resetTypeVarCounter();
    try {
      infer(ast, undefined, source);
    } catch (e: any) {
      const msg = e.message || "";
      if (!msg.includes("Undefined variable")) {
        return { error: msg };
      }
    }

    // Evaluate
    const env = createPrelude();
    const result = evaluate(ast, env);
    return { output: prettyPrint(result) };
  } catch (e: any) {
    return { error: e.message };
  }
}
