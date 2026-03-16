# AGENTS.md

## OVERVIEW

- `tests/` is reserved for future Butler runtime verification.
- Prefer tests that validate domain rules and runtime boundaries without requiring a live SiYuan instance by default.

## STRUCTURE

- `unit/` - fast tests for domain rules and pure logic.
- `integration/` - controlled runtime/adapter integration tests.
- `fixtures/` - sample inputs, outputs, and mock payloads.

## CONVENTIONS

- Mock network and environment dependencies unless a task explicitly requires live validation.
- Keep tests aligned with Butler workflow boundaries and object contracts.

## ANTI-PATTERNS

- Do not make routine verification depend on a real SiYuan server.
- Do not test raw endpoint breadth when the Butler runtime only needs a semantic subset.
