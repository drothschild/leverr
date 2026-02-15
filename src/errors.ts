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
