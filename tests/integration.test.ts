import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
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
        _ -> Err("bad")
      }
      in "2" |> parse? |> fn n -> n * 10
    `);
    expect(result.output).toBe("20");
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
    expect(result.output).toBe("11");
  });

  it("calc expression evaluator example", () => {
    const source = readFileSync(join(__dirname, "../examples/calc.lv"), "utf-8");
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });

    const result = runSource(source);

    spy.mockRestore();

    expect(result.error).toBeUndefined();
    expect(result.output).toBe("()");
    expect(logs).toContain("=== Expression Evaluator ===");
    expect(logs).toContain("2 + 3 = 5");
    expect(logs).toContain("(2 + 3) * -(4) = -20");
    expect(logs).toContain("10 / 0 = Error: division by zero");
    expect(logs).toContain("10 / 3 = 3");
    expect(logs).toContain("=== Done! ===");
  });

  it("todo app example", () => {
    const source = readFileSync(join(__dirname, "../examples/todo.lv"), "utf-8");
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.map(String).join(" "));
    });

    const result = runSource(source);

    spy.mockRestore();

    expect(result.error).toBeUndefined();
    expect(result.output).toBe("()");
    expect(logs).toContain("=== Leverr Todo App ===");
    expect(logs).toContain("[x] Learn Leverr");
    expect(logs).toContain("[ ] Write a demo");
    expect(logs).toContain("Pending items:");
    expect(logs).toContain("  [ ] Write a demo");
    expect(logs).toContain("After completing 'Write a demo':");
    expect(logs).toContain("[x] Write a demo");
    expect(logs).toContain("=== Done! ===");
  });
});
