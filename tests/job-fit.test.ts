import assert from "node:assert/strict";
import test from "node:test";
import { explainSkillFit } from "../src/lib/job-fit.ts";

test("matches only explicitly listed skills without case sensitivity", () => {
  assert.deepEqual(explainSkillFit("User research, Figma", "Figma, accessibility"), {
    matched: ["Figma"],
    notListed: ["accessibility"],
  });
});

test("keeps missing profile information separate from a negative assessment", () => {
  assert.deepEqual(explainSkillFit("", "Analysis, spreadsheets"), {
    matched: [],
    notListed: ["Analysis", "spreadsheets"],
  });
});

test("does not invent synonyms or a match score", () => {
  assert.deepEqual(explainSkillFit("Customer support", "Customer success"), {
    matched: [],
    notListed: ["Customer success"],
  });
});