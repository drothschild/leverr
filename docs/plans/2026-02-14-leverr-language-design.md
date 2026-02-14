# Leverr Language Design

A statically-typed scripting language with Hindley-Milner type inference and first-class error handling. Built as a TypeScript interpreter.

## Identity

Leverr's signature is pipeline-friendly error propagation. The `?` operator and pipe `|>` make error handling ergonomic — code reads left-to-right, happy-path-first. No type annotations required; the compiler infers everything.

File extension: `.lv`

---

## Primitives

Types: `Int`, `Float`, `Bool`, `String`, `Unit`

```
42
3.14
true
"hello"
()
```

## Bindings

Immutable. No mutation.

```
let name = "leverr"
let age = 1
```

## Functions

`fn` keyword. Implicit return — everything is an expression. All functions are auto-curried.

```
let add = fn(a, b) -> a + b
let greet = fn(name) -> "hello " ++ name

-- Partial application (auto-currying)
let add5 = add(5)
add5(3)              -- 8
```

Under the hood, `fn(a, b) -> a + b` is sugar for `fn(a) -> fn(b) -> a + b`. The type of `add` is `Int -> Int -> Int`.

Recursive functions use `let rec`:

```
let rec factorial = fn(n) ->
  match n <= 1 {
    true  -> 1
    false -> n * factorial(n - 1)
  }
```

## Pipes

Left-to-right data flow. The `|>` operator passes the left side as the last argument to the right side.

```
"world" |> greet |> print
-- equivalent to: print(greet("world"))

[1, 2, 3] |> map(fn(x) -> x * 2) |> filter(fn(x) -> x > 2)
-- equivalent to: filter(fn(x) -> x > 2, map(fn(x) -> x * 2, [1, 2, 3]))
```

Pipes and auto-currying work together: `map(fn(x) -> x * 2)` partially applies `map`, returning a function that takes a list. The pipe feeds the list in.

## Records

Structural types with dot access and row polymorphism.

```
let user = { name: "Alice", age: 30 }
user.name    -- "Alice"

-- Works on any record with a .name field
let get_name = fn(r) -> r.name

get_name({ name: "Bob", age: 25 })         -- "Bob"
get_name({ name: "Widget", color: "red" })  -- "Widget"
```

The type of `get_name` is `{ name: a | r } -> a` — any record with at least a `name` field, regardless of other fields.

Destructuring:

```
let { name, age } = user
```

## Tagged Unions

For modeling variants. Tags are uppercase.

```
let shape = Circle(5.0)
let other = Rect(3.0, 4.0)
```

## Pattern Matching

Works on tagged unions, records, primitives, and tuples. Exhaustiveness checking warns on missing cases.

```
let area = fn(s) -> match s {
  Circle(r)   -> 3.14159 * r * r
  Rect(w, h)  -> w * h
}

-- Compiler warns if a case is missing:
let describe = fn(s) -> match s {
  Circle(r) -> "circle"
  -- Warning: non-exhaustive match, missing Rect
}
```

## Tuples

```
let pair = (1, "hello")
let (a, b) = pair
```

## Lists

Homogeneous, built-in.

```
let nums = [1, 2, 3, 4, 5]
let empty = []
let bad = [1, "two"]   -- type error: Int vs String
```

## Error Handling

Leverr's signature feature. Functions that can fail return `Result(a, String)` — either `Ok(value)` or `Err(message)`. Error messages are always `String` in v1.

### The `?` Operator

Unwraps `Ok` or short-circuits on `Err`. Any function using `?` automatically returns a `Result`.

```
let parse_int = fn(s) -> match s {
  "0" -> Ok(0)
  "1" -> Ok(1)
  _   -> Err("not a number: " ++ s)
}

let process = fn(input) ->
  input
  |> parse_int?
  |> fn n -> n * 2
  |> fn n -> match n > 0 {
    true  -> Ok(n)
    false -> Err("must be positive")
  }?

process("1")     -- Ok(2)
process("abc")   -- Err("not a number: abc")
```

### `catch` Expressions

Recover from errors inline. Collapses the `Result` — return type becomes the inner type.

```
let safe_process = fn(input) ->
  input
  |> parse_int?
  |> fn n -> n * 2
  |> catch e -> 0

safe_process("1")     -- 2
safe_process("abc")   -- 0
```

### Type Inference Implications

- `parse_int` has type `String -> Result(Int, String)`
- Inside a pipeline with `?`, the checker unwraps `Result` and tracks that the enclosing function must return `Result`
- `catch` collapses the `Result` — the return type becomes the inner type

## Prelude

Available without import.

### List Operations

```
map(fn(x) -> x * 2, [1, 2, 3])              -- [2, 4, 6]
filter(fn(x) -> x > 2, [1, 2, 3, 4])        -- [3, 4]
fold(0, fn(acc, x) -> acc + x, [1, 2, 3])   -- 6
length([1, 2, 3])                             -- 3
head([1, 2, 3])                               -- Ok(1)
tail([1, 2, 3])                               -- Ok([2, 3])
head([])                                      -- Err("empty list")
each(fn(x) -> print(x), [1, 2, 3])          -- Unit (side effects)
```

All prelude functions work with pipes via partial application:

```
[1, 2, 3, 4, 5]
|> filter(fn(x) -> x > 2)
|> map(fn(x) -> x * 10)
|> fold(0, fn(acc, x) -> acc + x)
-- 120
```

### IO and Strings

```
print("hello")              -- prints to stdout, returns Unit
to_string(42)               -- "42"
concat("hello", " world")   -- "hello world"
length("hello")              -- 5 (overloaded with list length)
```

## Comments

```
-- This is a line comment
```

## Operators

```
-- Arithmetic
+  -  *  /  %

-- Comparison
==  !=  <  >  <=  >=

-- Logical
&&  ||  !

-- String concatenation
++

-- Pipe
|>

-- Error propagation
?
```

---

## REPL

```
$ leverr
Leverr v0.1.0
> 1 + 2
3

> let double = fn(x) -> x * 2
double : Int -> Int

> [1, 2, 3] |> map(double)
[2, 4, 6]

> :type map
(a -> b) -> List(a) -> List(b)

> :type double
Int -> Int

> :env
double : Int -> Int

> :quit
```

- Expressions are evaluated and printed with their type
- `let` bindings persist across inputs
- `:type <expr>` shows inferred type without evaluating
- `:env` shows all bindings and their types
- Multi-line input: opening `{`, `(`, or `[` continues to next line

Running files:

```
$ leverr run program.lv
```

---

## Error Messages

Every error includes source location, context, and a helpful explanation.

### Type Errors

```
> let x = 5 + "hello"

Error at line 1, col 9:
  let x = 5 + "hello"
              ^^^^^^^
  Type mismatch in (+):
    Left:  Int
    Right: String
  Both arguments to (+) must be the same numeric type.
```

### Exhaustiveness Warnings

```
> let f = fn(s) -> match s {
    Circle(r) -> r
  }

Warning at line 1:
  Non-exhaustive match. Missing cases:
    - Rect(_, _)
```

### Pipeline Type Errors

```
> "hello" |> map(fn(x) -> x * 2)

Error at line 1, col 14:
  "hello" |> map(fn(x) -> x * 2)
             ^^^
  map expects List(a) but received String

  Hint: (|>) passes the left side as the last argument
```

### `?` Operator Errors

```
> let x = 5?

Error at line 1, col 10:
  let x = 5?
           ^
  The (?) operator requires a Result type.
    Found: Int
    Expected: Result(a, String)
```

---

## Architecture

```
Source Code (.lv)
    |
    v
+----------+
|  Lexer   |  -> Token stream (with source spans)
+----------+
    |
    v
+----------+
|  Parser  |  -> Untyped AST (with source spans, error recovery)
+----------+
    |
    v
+------------------+
|  Type Checker /  |  -> Typed AST + diagnostics
|  Type Inference  |     (Hindley-Milner, Algorithm W)
+------------------+     (Unification, row polymorphism)
    |
    v
+------------------+
|  Evaluator       |  -> Values + side effects
|  (tree-walker)   |
+------------------+
    |
    v
+----------+
|   REPL   |  -> Interactive session with persistent state
+----------+
```

Each phase is a clean module with defined input/output types. The AST types for "parsed" and "type-checked" are distinct, enforcing phase contracts at the type level.

## Implementation Language

TypeScript. Discriminated unions for AST nodes. Strict mode.

## Type System Implementation Notes

- **Algorithm W** for Hindley-Milner inference
- **Unification** engine: pattern-match on type pairs, substitution maps
- **Occurs check**: prevents infinite types like `a = List(a)`
- **Let-polymorphism**: generalize type variables at `let` bindings, instantiate fresh variables at use sites
- **Row polymorphism**: records carry a "rest" type variable for remaining fields
- **Result/? interaction**: `?` transforms `Result(a, String) -> a` in the type checker and marks the enclosing function as returning `Result`

## Testing Strategy

- **Snapshot tests**: input source -> AST, input source -> types, input source -> evaluated output
- **Negative tests**: programs that should fail, with assertions on error messages and locations
- **Property-based tests**: well-typed programs don't get stuck during evaluation
- **Round-trip tests**: pretty-print AST -> re-parse -> same AST

## Scope Boundaries (v1)

**In scope:**
- Everything described above
- Tail-call optimization for recursion

**Out of scope (future):**
- Modules / imports
- Typed errors (error type is always String)
- Mutation / mutable references
- Standard library beyond prelude
- Compilation to bytecode
- Concurrency
