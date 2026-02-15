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
