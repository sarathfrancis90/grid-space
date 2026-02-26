# Formula Engine

## Parser: Recursive Descent

```
Expression → Comparison
Comparison → Addition (("=" | "<>" | "<" | ">" | "<=" | ">=") Addition)*
Addition   → Multiplication (("+" | "-") Multiplication)*
Multiplication → Unary (("*" | "/") Unary)*
Unary      → ("-" | "+")? Power
Power      → Postfix ("^" Postfix)*
Postfix    → Primary ("%" )?
Primary    → NUMBER | STRING | BOOLEAN | CellRef | Range | FunctionCall | "(" Expression ")"
```

## Cell Reference Types

| Type        | Example   | Behavior on copy          |
| ----------- | --------- | ------------------------- |
| Relative    | A1        | Adjusts row and column    |
| Absolute    | $A$1      | Never adjusts             |
| Mixed       | $A1       | Column fixed, row adjusts |
| Mixed       | A$1       | Row fixed, column adjusts |
| Range       | A1:B5     | Both corners adjust       |
| Cross-sheet | Sheet2!A1 | Sheet name preserved      |

## Dependency Graph

- Directed acyclic graph (DAG): cell → cells it depends on
- On edit: mark cell dirty → topological sort dependents → recalculate in order
- Circular reference: detect during graph build → set #REF! error
- Store as Map<cellId, Set<cellId>> (dependsOn) and Map<cellId, Set<cellId>> (dependents)

## Function Categories (80+)

| Category    | Functions                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Math        | SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS, SQRT, POWER, MOD, CEILING, FLOOR, LOG, EXP, PI, RAND                         |
| Text        | CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, PROPER, SUBSTITUTE, FIND, SEARCH, TEXT, VALUE, REPT, CHAR, CODE |
| Logical     | IF, IFS, SWITCH, AND, OR, NOT, XOR, IFERROR, IFNA                                                                       |
| Lookup      | VLOOKUP, HLOOKUP, INDEX, MATCH, XLOOKUP, OFFSET, INDIRECT, CHOOSE                                                       |
| Conditional | SUMIF, COUNTIF, AVERAGEIF, SUMIFS, COUNTIFS, AVERAGEIFS                                                                 |
| Date        | TODAY, NOW, DATE, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, DATEDIF, EDATE, EOMONTH, WEEKDAY, WORKDAY, NETWORKDAYS        |
| Statistical | STDEV, VAR, MEDIAN, MODE, PERCENTILE, QUARTILE, RANK, LARGE, SMALL, CORREL, FORECAST                                    |
| Financial   | PMT, FV, PV, NPV, IRR, RATE, NPER                                                                                       |
| Info        | ISBLANK, ISERROR, ISNUMBER, ISTEXT, ISLOGICAL, TYPE, ROW, COLUMN, ROWS, COLUMNS                                         |
| Array       | SORT, FILTER, UNIQUE, TRANSPOSE                                                                                         |
| Special     | SPARKLINE                                                                                                               |

## formulajs Integration

```typescript
import * as formulajs from "@formulajs/formulajs";
// Map function names: formulajs.SUM([1,2,3]) → 6
// Handle range expansion: =SUM(A1:A5) → expand to array → pass to formulajs.SUM
```

## Error Values

| Error   | Cause                        |
| ------- | ---------------------------- |
| #DIV/0! | Division by zero             |
| #VALUE! | Wrong argument type          |
| #NAME?  | Unknown function name        |
| #N/A    | Lookup found nothing         |
| #NUM!   | Invalid number               |
| #NULL!  | Empty intersection           |
| #REF!   | Invalid reference / circular |

## SPARKLINE

```
=SPARKLINE(data, {charttype, "line"; color, "red"; linewidth, 2})
```

Renders a mini chart inside the cell using Canvas. Support: line, bar, column, winloss.
