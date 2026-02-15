import { describe, it, expect, beforeEach } from "vitest";
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
