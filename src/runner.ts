import { lex } from "./lexer";
import { parse } from "./parser";
import { evaluate } from "./evaluator";
import { infer } from "./typechecker";
import { prettyPrint } from "./values";
import { resetTypeVarCounter } from "./types";
import { createPrelude } from "./prelude";
import { RillError } from "./errors";

interface RunResult {
  output?: string;
  error?: string;
}

export function runSource(source: string): RunResult {
  try {
    const tokens = lex(source);
    const ast = parse(tokens);

    // Type check — only block on RillError (formatted type errors with source info)
    // Skip TypeError from inference limitations (missing prelude types, no sum types)
    resetTypeVarCounter();
    try {
      infer(ast, undefined, source);
    } catch (e: any) {
      if (e instanceof RillError) {
        return { error: e.message };
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
