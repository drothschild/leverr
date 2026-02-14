import { Expr } from "./ast";
import { Value } from "./values";

export function evaluate(expr: Expr, env: Map<string, Value> = new Map()): Value {
  switch (expr.kind) {
    case "IntLit":
      return { kind: "Int", value: expr.value };
    case "FloatLit":
      return { kind: "Float", value: expr.value };
    case "StringLit":
      return { kind: "String", value: expr.value };
    case "BoolLit":
      return { kind: "Bool", value: expr.value };
    case "UnitLit":
      return { kind: "Unit" };

    case "Ident": {
      const val = env.get(expr.name);
      if (val === undefined) throw new Error(`Undefined variable: ${expr.name}`);
      return val;
    }

    case "BinOp": {
      const left = evaluate(expr.left, env);
      const right = evaluate(expr.right, env);
      return evalBinOp(expr.op, left, right);
    }

    case "UnaryOp": {
      const operand = evaluate(expr.expr, env);
      return evalUnaryOp(expr.op, operand);
    }

    default:
      throw new Error(`Cannot evaluate ${expr.kind} yet`);
  }
}

function evalBinOp(op: string, left: Value, right: Value): Value {
  // Arithmetic (Int)
  if (left.kind === "Int" && right.kind === "Int") {
    switch (op) {
      case "+": return { kind: "Int", value: left.value + right.value };
      case "-": return { kind: "Int", value: left.value - right.value };
      case "*": return { kind: "Int", value: left.value * right.value };
      case "/": return { kind: "Int", value: Math.trunc(left.value / right.value) };
      case "%": return { kind: "Int", value: left.value % right.value };
      case "==": return { kind: "Bool", value: left.value === right.value };
      case "!=": return { kind: "Bool", value: left.value !== right.value };
      case "<": return { kind: "Bool", value: left.value < right.value };
      case ">": return { kind: "Bool", value: left.value > right.value };
      case "<=": return { kind: "Bool", value: left.value <= right.value };
      case ">=": return { kind: "Bool", value: left.value >= right.value };
    }
  }

  // Arithmetic (Float)
  if (left.kind === "Float" && right.kind === "Float") {
    switch (op) {
      case "+": return { kind: "Float", value: left.value + right.value };
      case "-": return { kind: "Float", value: left.value - right.value };
      case "*": return { kind: "Float", value: left.value * right.value };
      case "/": return { kind: "Float", value: left.value / right.value };
      case "==": return { kind: "Bool", value: left.value === right.value };
      case "!=": return { kind: "Bool", value: left.value !== right.value };
      case "<": return { kind: "Bool", value: left.value < right.value };
      case ">": return { kind: "Bool", value: left.value > right.value };
    }
  }

  // Mixed Int/Float
  if ((left.kind === "Int" || left.kind === "Float") && (right.kind === "Int" || right.kind === "Float")) {
    const l = left.value;
    const r = right.value;
    switch (op) {
      case "+": return { kind: "Float", value: l + r };
      case "-": return { kind: "Float", value: l - r };
      case "*": return { kind: "Float", value: l * r };
      case "/": return { kind: "Float", value: l / r };
      case "<": return { kind: "Bool", value: l < r };
      case ">": return { kind: "Bool", value: l > r };
      case "<=": return { kind: "Bool", value: l <= r };
      case ">=": return { kind: "Bool", value: l >= r };
    }
  }

  // String concatenation
  if (left.kind === "String" && right.kind === "String" && op === "++") {
    return { kind: "String", value: left.value + right.value };
  }

  // String equality
  if (left.kind === "String" && right.kind === "String") {
    switch (op) {
      case "==": return { kind: "Bool", value: left.value === right.value };
      case "!=": return { kind: "Bool", value: left.value !== right.value };
    }
  }

  // Boolean logic
  if (left.kind === "Bool" && right.kind === "Bool") {
    switch (op) {
      case "&&": return { kind: "Bool", value: left.value && right.value };
      case "||": return { kind: "Bool", value: left.value || right.value };
      case "==": return { kind: "Bool", value: left.value === right.value };
      case "!=": return { kind: "Bool", value: left.value !== right.value };
    }
  }

  throw new Error(`Cannot apply operator ${op} to ${left.kind} and ${right.kind}`);
}

function evalUnaryOp(op: string, operand: Value): Value {
  if (op === "!" && operand.kind === "Bool") {
    return { kind: "Bool", value: !operand.value };
  }
  if (op === "-" && operand.kind === "Int") {
    return { kind: "Int", value: -operand.value };
  }
  if (op === "-" && operand.kind === "Float") {
    return { kind: "Float", value: -operand.value };
  }
  throw new Error(`Cannot apply unary ${op} to ${operand.kind}`);
}
