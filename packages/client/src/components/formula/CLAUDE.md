# src/formula/

## What's Here

Recursive-descent formula parser, evaluator, dependency graph, function implementations. Pure module — no DOM, no side effects.

## Patterns to Follow

- All functions are pure — input → output, no side effects
- Wrap formulajs calls in try/catch, map errors to #VALUE!, #NAME? etc.
- Add new functions to the FUNCTION_MAP registry
- Test every function with unit tests

## Do NOT

- Import from server/ — frontend and backend are separate
- Access DOM or React state from formula code
- Use eval() or new Function() for formula evaluation
