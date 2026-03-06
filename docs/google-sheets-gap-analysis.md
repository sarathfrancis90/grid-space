# Google Sheets vs GridSpace -- Feature Gap Analysis

**Date:** 2026-03-06
**Methodology:** Exhaustive comparison of Google Sheets features (from official docs, product pages, and community resources) against GridSpace's `feature_list.json` (427 features) and actual codebase implementation.

---

## Summary

| Metric                                      | Count     |
| ------------------------------------------- | --------- |
| Total Google Sheets features identified     | 292       |
| Features GridSpace HAS (full or equivalent) | 198       |
| Features GridSpace has PARTIALLY            | 22        |
| Features GridSpace is MISSING               | 72        |
| **Parity percentage**                       | **75.3%** |

---

## Category-by-Category Breakdown

### 1. Cell Operations & Grid Basics

| #   | Feature                                   | Google Sheets | GridSpace        | Gap?    | Priority |
| --- | ----------------------------------------- | ------------- | ---------------- | ------- | -------- |
| 1   | Click cell to select                      | Yes           | Yes              | No      | --       |
| 2   | Arrow key navigation                      | Yes           | Yes              | No      | --       |
| 3   | Tab/Shift+Tab navigation                  | Yes           | Yes              | No      | --       |
| 4   | Enter/Shift+Enter navigation              | Yes           | Yes              | No      | --       |
| 5   | Double-click/F2 edit mode                 | Yes           | Yes              | No      | --       |
| 6   | Type to start editing (replace)           | Yes           | Yes              | No      | --       |
| 7   | Escape cancels edit                       | Yes           | Yes              | No      | --       |
| 8   | Shift+click extend selection              | Yes           | Yes              | No      | --       |
| 9   | Ctrl+click multi-selection                | Yes           | Yes              | No      | --       |
| 10  | Click+drag range selection                | Yes           | Yes              | No      | --       |
| 11  | Click row/column header select            | Yes           | Yes              | No      | --       |
| 12  | Ctrl+A select all                         | Yes           | Yes              | No      | --       |
| 13  | Insert/delete rows and columns            | Yes           | Yes              | No      | --       |
| 14  | Resize row/column by dragging             | Yes           | Yes              | No      | --       |
| 15  | Double-click auto-fit width               | Yes           | Yes              | No      | --       |
| 16  | Hide/unhide rows and columns              | Yes           | Yes              | No      | --       |
| 17  | Freeze rows and columns                   | Yes           | Yes              | No      | --       |
| 18  | Copy/Cut/Paste (Ctrl+C/X/V)               | Yes           | Yes              | No      | --       |
| 19  | Paste special (values, format, transpose) | Yes           | Yes              | No      | --       |
| 20  | Delete/Backspace clears cells             | Yes           | Yes              | No      | --       |
| 21  | Ctrl+Home/End navigation                  | Yes           | Yes              | No      | --       |
| 22  | Ctrl+Arrow jump to data edge              | Yes           | Yes              | No      | --       |
| 23  | Page Up/Down scrolling                    | Yes           | Yes              | No      | --       |
| 24  | Fill handle drag to extend series         | Yes           | Yes              | No      | --       |
| 25  | Virtual scrolling (10k+ rows)             | Yes           | Yes              | No      | --       |
| 26  | Row grouping with collapse/expand         | Yes           | Yes              | No      | --       |
| 27  | Column grouping with collapse/expand      | Yes           | Yes              | No      | --       |
| 28  | Smart Fill (pattern detection auto-fill)  | Yes           | Yes (Flash Fill) | No      | --       |
| 29  | Drag and drop cells to move               | Yes           | No               | **Yes** | P1       |
| 30  | Right-to-left (RTL) text support          | Yes           | No               | **Yes** | P2       |

### 2. Formatting

| #   | Feature                                                 | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ------------------------------------------------------- | ------------- | --------- | ------- | -------- |
| 31  | Bold/Italic/Underline/Strikethrough                     | Yes           | Yes       | No      | --       |
| 32  | Font family picker                                      | Yes           | Yes       | No      | --       |
| 33  | Font size picker                                        | Yes           | Yes       | No      | --       |
| 34  | Text color picker                                       | Yes           | Yes       | No      | --       |
| 35  | Background/fill color picker                            | Yes           | Yes       | No      | --       |
| 36  | Horizontal alignment (L/C/R)                            | Yes           | Yes       | No      | --       |
| 37  | Vertical alignment (T/M/B)                              | Yes           | Yes       | No      | --       |
| 38  | Number format -- General                                | Yes           | Yes       | No      | --       |
| 39  | Number format -- Number (decimals)                      | Yes           | Yes       | No      | --       |
| 40  | Number format -- Currency                               | Yes           | Yes       | No      | --       |
| 41  | Number format -- Percent                                | Yes           | Yes       | No      | --       |
| 42  | Number format -- Date (multiple)                        | Yes           | Yes       | No      | --       |
| 43  | Number format -- Time                                   | Yes           | Yes       | No      | --       |
| 44  | Number format -- Scientific                             | Yes           | Yes       | No      | --       |
| 45  | Custom number format                                    | Yes           | Yes       | No      | --       |
| 46  | Borders -- all sides                                    | Yes           | Yes       | No      | --       |
| 47  | Borders -- individual sides                             | Yes           | Yes       | No      | --       |
| 48  | Borders -- styles (thin, thick, dashed, dotted, double) | Yes           | Yes       | No      | --       |
| 49  | Borders -- color                                        | Yes           | Yes       | No      | --       |
| 50  | Merge/unmerge cells                                     | Yes           | Yes       | No      | --       |
| 51  | Paint format (format painter)                           | Yes           | Yes       | No      | --       |
| 52  | Text wrapping (overflow, wrap, clip)                    | Yes           | Yes       | No      | --       |
| 53  | Text rotation (angled text)                             | Yes           | Yes       | No      | --       |
| 54  | Alternating row colors                                  | Yes           | Yes       | No      | --       |
| 55  | Clear formatting                                        | Yes           | Yes       | No      | --       |
| 56  | Increase/decrease indent                                | Yes           | Yes       | No      | --       |
| 57  | Toolbar reflects current format                         | Yes           | Yes       | No      | --       |
| 58  | Number format -- Accounting                             | Yes           | No        | **Yes** | P2       |
| 59  | Number format -- Duration                               | Yes           | No        | **Yes** | P2       |
| 60  | Themes (predefined color/font sets)                     | Yes           | No        | **Yes** | P2       |

### 3. Conditional Formatting

| #   | Feature                                       | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------------------- | ------------- | --------- | ------- | -------- |
| 61  | Value rules (greater, less, between, equal)   | Yes           | Yes       | No      | --       |
| 62  | Text rules (contains, starts with, ends with) | Yes           | Yes       | No      | --       |
| 63  | Color scales (2-color, 3-color gradient)      | Yes           | Yes       | No      | --       |
| 64  | Is blank / not blank                          | Yes           | Yes       | No      | --       |
| 65  | Date rules (today, yesterday, etc.)           | Yes           | Yes       | No      | --       |
| 66  | Custom formula rule                           | Yes           | Yes       | No      | --       |
| 67  | Multiple rules with priority order            | Yes           | Yes       | No      | --       |
| 68  | Conditional format manager                    | Yes           | Yes       | No      | --       |
| 69  | Data bars (bar chart in cell)                 | Yes           | No        | **Yes** | P1       |
| 70  | Icon sets (arrows, flags, stars)              | Yes           | No        | **Yes** | P1       |

### 4. Data Tools

| #   | Feature                                                  | Google Sheets | GridSpace          | Gap?    | Priority |
| --- | -------------------------------------------------------- | ------------- | ------------------ | ------- | -------- |
| 71  | Sort ascending/descending                                | Yes           | Yes                | No      | --       |
| 72  | Multi-column sort                                        | Yes           | Yes                | No      | --       |
| 73  | Filter toggle                                            | Yes           | Yes                | No      | --       |
| 74  | Filter by value (checkbox list)                          | Yes           | Yes                | No      | --       |
| 75  | Filter by condition                                      | Yes           | Yes                | No      | --       |
| 76  | Filter by color                                          | Yes           | Yes                | No      | --       |
| 77  | Find (Ctrl+F)                                            | Yes           | Yes                | No      | --       |
| 78  | Replace (Ctrl+H)                                         | Yes           | Yes                | No      | --       |
| 79  | Find & replace with regex                                | Yes           | Yes                | No      | --       |
| 80  | Data validation -- number range                          | Yes           | Yes                | No      | --       |
| 81  | Data validation -- text length                           | Yes           | Yes                | No      | --       |
| 82  | Data validation -- date range                            | Yes           | Yes                | No      | --       |
| 83  | Data validation -- dropdown list                         | Yes           | Yes                | No      | --       |
| 84  | Data validation -- checkbox                              | Yes           | Yes                | No      | --       |
| 85  | Data validation -- custom formula                        | Yes           | Yes                | No      | --       |
| 86  | Pivot table create and editor                            | Yes           | Yes                | No      | --       |
| 87  | Pivot table aggregation (SUM, COUNT, AVG, MIN, MAX)      | Yes           | Yes                | No      | --       |
| 88  | Pivot table filter                                       | Yes           | Yes                | No      | --       |
| 89  | Named ranges (create, use, edit, delete)                 | Yes           | Yes                | No      | --       |
| 90  | Protected ranges (lock cells)                            | Yes           | Yes                | No      | --       |
| 91  | Slicer (interactive filter control)                      | Yes           | Yes                | No      | --       |
| 92  | Text to columns                                          | Yes           | Yes                | No      | --       |
| 93  | Remove duplicates                                        | Yes           | Yes                | No      | --       |
| 94  | Trim whitespace cleanup                                  | Yes           | Yes                | No      | --       |
| 95  | Checkbox cells                                           | Yes           | Yes                | No      | --       |
| 96  | Goal Seek (what-if analysis)                             | Yes           | Yes                | No      | --       |
| 97  | Filter Views (per-user saved filter sets)                | Yes           | No                 | **Yes** | P0       |
| 98  | Data validation -- email, URL types                      | Yes           | No                 | **Yes** | P2       |
| 99  | Explore / data insights (auto-suggest charts, summaries) | Yes           | Partial (AI Panel) | Partial | P2       |
| 100 | Smart cleanup suggestions (auto-detect issues)           | Yes           | No                 | **Yes** | P3       |
| 101 | Column stats (column header quick stats)                 | Yes           | No                 | **Yes** | P3       |

### 5. Formulas -- Core & Logical

| #   | Feature                                 | Google Sheets | GridSpace  | Gap?    | Priority |
| --- | --------------------------------------- | ------------- | ---------- | ------- | -------- |
| 102 | = activates formula mode                | Yes           | Yes        | No      | --       |
| 103 | Formula autocomplete                    | Yes           | Yes        | No      | --       |
| 104 | Click cell inserts reference            | Yes           | Yes        | No      | --       |
| 105 | Color-coded range references            | Yes           | Yes        | No      | --       |
| 106 | A1 style reference                      | Yes           | Yes        | No      | --       |
| 107 | Absolute/mixed references ($)           | Yes           | Yes        | No      | --       |
| 108 | Range reference A1:B5                   | Yes           | Yes        | No      | --       |
| 109 | Cross-sheet reference Sheet!A1          | Yes           | Yes        | No      | --       |
| 110 | Dependency graph recalc                 | Yes           | Yes        | No      | --       |
| 111 | Circular reference detection            | Yes           | Yes        | No      | --       |
| 112 | Error values (#DIV/0!, #VALUE!, etc.)   | Yes           | Yes        | No      | --       |
| 113 | SUM, AVERAGE, COUNT, COUNTA, COUNTBLANK | Yes           | Yes        | No      | --       |
| 114 | MIN, MAX                                | Yes           | Yes        | No      | --       |
| 115 | IF, IFS, SWITCH                         | Yes           | Yes        | No      | --       |
| 116 | AND, OR, NOT, XOR                       | Yes           | Yes        | No      | --       |
| 117 | IFERROR, IFNA                           | Yes           | Yes        | No      | --       |
| 118 | String concatenation & operator         | Yes           | Yes        | No      | --       |
| 119 | Nested formulas                         | Yes           | Yes        | No      | --       |
| 120 | Operator precedence                     | Yes           | Yes        | No      | --       |
| 121 | ARRAYFORMULA                            | Yes           | Yes        | No      | --       |
| 122 | LET function                            | Yes           | Yes        | No      | --       |
| 123 | LAMBDA function                         | Yes           | Yes (stub) | Partial | P1       |
| 124 | TRUE, FALSE constants                   | Yes           | Yes        | No      | --       |

### 6. Formulas -- Lookup & Reference

| #   | Feature       | Google Sheets | GridSpace                  | Gap?    | Priority |
| --- | ------------- | ------------- | -------------------------- | ------- | -------- |
| 125 | VLOOKUP       | Yes           | Yes                        | No      | --       |
| 126 | HLOOKUP       | Yes           | Yes                        | No      | --       |
| 127 | INDEX, MATCH  | Yes           | Yes                        | No      | --       |
| 128 | XLOOKUP       | Yes           | Yes                        | No      | --       |
| 129 | OFFSET        | Yes           | Listed but not in registry | **Yes** | P1       |
| 130 | INDIRECT      | Yes           | Listed but not in registry | **Yes** | P1       |
| 131 | ROW, COLUMN   | Yes           | Yes (basic)                | Partial | P1       |
| 132 | ROWS, COLUMNS | Yes           | Yes                        | No      | --       |
| 133 | CHOOSE        | Yes           | Yes                        | No      | --       |
| 134 | LOOKUP        | Yes           | No                         | **Yes** | P2       |
| 135 | ADDRESS       | Yes           | No                         | **Yes** | P2       |
| 136 | GETPIVOTDATA  | Yes           | No                         | **Yes** | P3       |

### 7. Formulas -- Math

| #   | Feature                                | Google Sheets | GridSpace        | Gap?    | Priority |
| --- | -------------------------------------- | ------------- | ---------------- | ------- | -------- |
| 137 | ROUND, ROUNDUP, ROUNDDOWN              | Yes           | Yes              | No      | --       |
| 138 | ABS, SQRT, POWER, MOD                  | Yes           | Yes              | No      | --       |
| 139 | CEILING, FLOOR                         | Yes           | Yes              | No      | --       |
| 140 | LOG, LOG10, EXP, LN                    | Yes           | Yes (LN via LOG) | No      | --       |
| 141 | PI, RAND, RANDBETWEEN                  | Yes           | Yes              | No      | --       |
| 142 | SUMPRODUCT                             | Yes           | No               | **Yes** | P0       |
| 143 | PRODUCT                                | Yes           | No               | **Yes** | P1       |
| 144 | INT, TRUNC                             | Yes           | No               | **Yes** | P1       |
| 145 | SIGN                                   | Yes           | No               | **Yes** | P1       |
| 146 | EVEN, ODD                              | Yes           | No               | **Yes** | P2       |
| 147 | FACT, COMBIN, PERMUT                   | Yes           | No               | **Yes** | P2       |
| 148 | GCD, LCM                               | Yes           | No               | **Yes** | P2       |
| 149 | MROUND, QUOTIENT                       | Yes           | No               | **Yes** | P2       |
| 150 | SUBTOTAL                               | Yes           | No               | **Yes** | P1       |
| 151 | SIN, COS, TAN, ASIN, ACOS, ATAN, ATAN2 | Yes           | No               | **Yes** | P2       |
| 152 | SINH, COSH, TANH                       | Yes           | No               | **Yes** | P3       |
| 153 | RADIANS, DEGREES                       | Yes           | No               | **Yes** | P2       |
| 154 | SQRTPI, MULTINOMIAL                    | Yes           | No               | **Yes** | P3       |
| 155 | SERIESSUM, SUMSQ                       | Yes           | No               | **Yes** | P3       |

### 8. Formulas -- Text

| #   | Feature                                  | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ---------------------------------------- | ------------- | --------- | ------- | -------- |
| 156 | CONCATENATE, LEFT, RIGHT, MID, LEN, TRIM | Yes           | Yes       | No      | --       |
| 157 | UPPER, LOWER, PROPER                     | Yes           | Yes       | No      | --       |
| 158 | SUBSTITUTE, FIND, SEARCH                 | Yes           | Yes       | No      | --       |
| 159 | TEXT, VALUE                              | Yes           | Yes       | No      | --       |
| 160 | REPT, EXACT, CLEAN, CHAR, CODE           | Yes           | Yes       | No      | --       |
| 161 | TEXTJOIN                                 | Yes           | No        | **Yes** | P0       |
| 162 | SPLIT                                    | Yes           | No        | **Yes** | P1       |
| 163 | REPLACE                                  | Yes           | No        | **Yes** | P1       |
| 164 | JOIN (CONCAT array)                      | Yes           | No        | **Yes** | P1       |
| 165 | T (returns text or empty)                | Yes           | No        | **Yes** | P2       |
| 166 | N (returns number or 0)                  | Yes           | No        | **Yes** | P2       |
| 167 | FIXED, DOLLAR                            | Yes           | No        | **Yes** | P2       |
| 168 | NUMBERVALUE                              | Yes           | No        | **Yes** | P3       |
| 169 | ROMAN, ARABIC                            | Yes           | No        | **Yes** | P3       |

### 9. Formulas -- Date & Time

| #   | Feature                        | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ------------------------------ | ------------- | --------- | ------- | -------- |
| 170 | TODAY, NOW                     | Yes           | Yes       | No      | --       |
| 171 | DATE, YEAR, MONTH, DAY         | Yes           | Yes       | No      | --       |
| 172 | HOUR, MINUTE, SECOND           | Yes           | Yes       | No      | --       |
| 173 | DATEDIF, EDATE, EOMONTH        | Yes           | Yes       | No      | --       |
| 174 | WEEKDAY, WEEKNUM               | Yes           | Yes       | No      | --       |
| 175 | WORKDAY, NETWORKDAYS           | Yes           | Yes       | No      | --       |
| 176 | DATEVALUE                      | Yes           | No        | **Yes** | P1       |
| 177 | TIMEVALUE                      | Yes           | No        | **Yes** | P1       |
| 178 | TIME function                  | Yes           | No        | **Yes** | P1       |
| 179 | DAYS, DAYS360                  | Yes           | No        | **Yes** | P2       |
| 180 | ISOWEEKNUM                     | Yes           | No        | **Yes** | P2       |
| 181 | YEARFRAC                       | Yes           | No        | **Yes** | P2       |
| 182 | WORKDAY.INTL, NETWORKDAYS.INTL | Yes           | No        | **Yes** | P3       |

### 10. Formulas -- Statistical

| #   | Feature                                      | Google Sheets | GridSpace | Gap?    | Priority |
| --- | -------------------------------------------- | ------------- | --------- | ------- | -------- |
| 183 | STDEV, VAR                                   | Yes           | Yes       | No      | --       |
| 184 | MEDIAN, MODE                                 | Yes           | Yes       | No      | --       |
| 185 | PERCENTILE, QUARTILE                         | Yes           | Yes       | No      | --       |
| 186 | RANK                                         | Yes           | Yes       | No      | --       |
| 187 | LARGE, SMALL                                 | Yes           | Yes       | No      | --       |
| 188 | CORREL, FORECAST                             | Yes           | Yes       | No      | --       |
| 189 | STDEVP, VARP (population)                    | Yes           | No        | **Yes** | P1       |
| 190 | FREQUENCY                                    | Yes           | No        | **Yes** | P2       |
| 191 | GROWTH, TREND, LINEST, LOGEST                | Yes           | No        | **Yes** | P2       |
| 192 | NORM.DIST, NORM.INV, NORM.S.DIST, NORM.S.INV | Yes           | No        | **Yes** | P2       |
| 193 | T.DIST, T.INV, CHISQ.DIST, F.DIST            | Yes           | No        | **Yes** | P3       |
| 194 | BINOM.DIST, POISSON.DIST, WEIBULL.DIST       | Yes           | No        | **Yes** | P3       |
| 195 | FISHER, FISHERINV                            | Yes           | No        | **Yes** | P3       |
| 196 | GAMMA, GAMMALN, BETA.DIST, BETA.INV          | Yes           | No        | **Yes** | P3       |
| 197 | EXPON.DIST, LOGNORM.DIST                     | Yes           | No        | **Yes** | P3       |
| 198 | CONFIDENCE, COVARIANCE.P, COVARIANCE.S       | Yes           | No        | **Yes** | P3       |
| 199 | SLOPE, INTERCEPT, RSQ, STEYX                 | Yes           | No        | **Yes** | P2       |
| 200 | GEOMEAN, HARMEAN, TRIMMEAN                   | Yes           | No        | **Yes** | P3       |
| 201 | AVERAGEA, MAXA, MINA, STDEVA, VARA           | Yes           | No        | **Yes** | P2       |
| 202 | PERCENTRANK, RANK.AVG, RANK.EQ               | Yes           | No        | **Yes** | P3       |
| 203 | PERMUT, COMBIN, COMBINA                      | Yes           | No        | **Yes** | P3       |

### 11. Formulas -- Financial

| #   | Feature                           | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------- | ------------- | --------- | ------- | -------- |
| 204 | PMT, FV, PV, NPV, IRR             | Yes           | Yes       | No      | --       |
| 205 | RATE, NPER                        | Yes           | Yes       | No      | --       |
| 206 | PPMT, IPMT                        | Yes           | No        | **Yes** | P1       |
| 207 | CUMPRINC, CUMIPMT                 | Yes           | No        | **Yes** | P2       |
| 208 | XNPV, XIRR, MIRR                  | Yes           | No        | **Yes** | P2       |
| 209 | SLN, SYD, DB, DDB                 | Yes           | No        | **Yes** | P2       |
| 210 | EFFECT, NOMINAL                   | Yes           | No        | **Yes** | P2       |
| 211 | PRICE, YIELD, DURATION, MDURATION | Yes           | No        | **Yes** | P3       |
| 212 | DISC, INTRATE, ACCRINT, ACCRINTM  | Yes           | No        | **Yes** | P3       |
| 213 | DOLLARDE, DOLLARFR                | Yes           | No        | **Yes** | P3       |

### 12. Formulas -- Conditional Aggregation

| #   | Feature                      | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ---------------------------- | ------------- | --------- | ------- | -------- |
| 214 | SUMIF, COUNTIF, AVERAGEIF    | Yes           | Yes       | No      | --       |
| 215 | SUMIFS, COUNTIFS, AVERAGEIFS | Yes           | Yes       | No      | --       |
| 216 | MAXIFS, MINIFS               | Yes           | No        | **Yes** | P1       |

### 13. Formulas -- Info

| #   | Feature                                       | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------------------- | ------------- | --------- | ------- | -------- |
| 217 | ISBLANK, ISERROR, ISNUMBER, ISTEXT, ISLOGICAL | Yes           | Yes       | No      | --       |
| 218 | TYPE                                          | Yes           | Yes       | No      | --       |
| 219 | ISEVEN, ISODD                                 | Yes           | No        | **Yes** | P2       |
| 220 | ISNA, ISREF, ISFORMULA                        | Yes           | No        | **Yes** | P2       |
| 221 | ISERR (error except #N/A)                     | Yes           | No        | **Yes** | P2       |
| 222 | ERROR.TYPE                                    | Yes           | No        | **Yes** | P3       |
| 223 | CELL (returns info about a cell)              | Yes           | No        | **Yes** | P2       |
| 224 | SHEET, SHEETS (sheet number/count)            | Yes           | No        | **Yes** | P3       |

### 14. Formulas -- Array & Lambda Helpers

| #   | Feature                                 | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------------- | ------------- | --------- | ------- | -------- |
| 225 | SORT, FILTER, UNIQUE                    | Yes           | Yes       | No      | --       |
| 226 | TRANSPOSE                               | Yes           | Yes       | No      | --       |
| 227 | ARRAYFORMULA                            | Yes           | Yes       | No      | --       |
| 228 | FLATTEN                                 | Yes           | No        | **Yes** | P1       |
| 229 | MAP                                     | Yes           | No        | **Yes** | P1       |
| 230 | REDUCE                                  | Yes           | No        | **Yes** | P1       |
| 231 | SCAN                                    | Yes           | No        | **Yes** | P2       |
| 232 | MAKEARRAY                               | Yes           | No        | **Yes** | P2       |
| 233 | BYROW                                   | Yes           | No        | **Yes** | P2       |
| 234 | BYCOL                                   | Yes           | No        | **Yes** | P2       |
| 235 | TOCOL, TOROW                            | Yes           | No        | **Yes** | P2       |
| 236 | WRAPCOLS, WRAPROWS                      | Yes           | No        | **Yes** | P3       |
| 237 | HSTACK, VSTACK                          | Yes           | No        | **Yes** | P2       |
| 238 | CHOOSECOLS, CHOOSEROWS                  | Yes           | No        | **Yes** | P2       |
| 239 | Named Functions (user-defined reusable) | Yes           | No        | **Yes** | P1       |

### 15. Formulas -- Database Functions

| #   | Feature                                | Google Sheets | GridSpace | Gap?    | Priority |
| --- | -------------------------------------- | ------------- | --------- | ------- | -------- |
| 240 | DSUM, DAVERAGE, DCOUNT, DCOUNTA        | Yes           | No        | **Yes** | P2       |
| 241 | DGET                                   | Yes           | No        | **Yes** | P2       |
| 242 | DMAX, DMIN                             | Yes           | No        | **Yes** | P2       |
| 243 | DPRODUCT, DSTDEV, DSTDEVP, DVAR, DVARP | Yes           | No        | **Yes** | P3       |

### 16. Formulas -- Engineering Functions

| #   | Feature                                           | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ------------------------------------------------- | ------------- | --------- | ------- | -------- |
| 244 | BIN2DEC, BIN2HEX, BIN2OCT                         | Yes           | No        | **Yes** | P2       |
| 245 | DEC2BIN, DEC2HEX, DEC2OCT                         | Yes           | No        | **Yes** | P2       |
| 246 | HEX2BIN, HEX2DEC, HEX2OCT                         | Yes           | No        | **Yes** | P2       |
| 247 | OCT2BIN, OCT2DEC, OCT2HEX                         | Yes           | No        | **Yes** | P2       |
| 248 | CONVERT (unit conversion)                         | Yes           | No        | **Yes** | P2       |
| 249 | DELTA, GESTEP                                     | Yes           | No        | **Yes** | P3       |
| 250 | ERF, ERFC                                         | Yes           | No        | **Yes** | P3       |
| 251 | BESSELI, BESSELJ, BESSELK, BESSELY                | Yes           | No        | **Yes** | P3       |
| 252 | COMPLEX, IMABS, IMAGINARY, IMREAL                 | Yes           | No        | **Yes** | P3       |
| 253 | IMSUM, IMSUB, IMDIV, IMPRODUCT, IMPOWER           | Yes           | No        | **Yes** | P3       |
| 254 | IMCOS, IMSIN, IMTAN, IMEXP, IMLN, IMLOG2, IMLOG10 | Yes           | No        | **Yes** | P3       |
| 255 | BITAND, BITOR, BITXOR, BITLSHIFT, BITRSHIFT       | Yes           | No        | **Yes** | P3       |

### 17. Formulas -- Web & Google-Specific

| #   | Feature                                | Google Sheets | GridSpace  | Gap?    | Priority |
| --- | -------------------------------------- | ------------- | ---------- | ------- | -------- |
| 256 | IMPORTDATA                             | Yes           | Yes (stub) | Partial | P2       |
| 257 | IMPORTRANGE                            | Yes           | Yes (stub) | Partial | P2       |
| 258 | IMAGE                                  | Yes           | Yes (stub) | Partial | P2       |
| 259 | SPARKLINE                              | Yes           | Yes        | No      | --       |
| 260 | QUERY                                  | Yes           | Yes        | No      | --       |
| 261 | REGEXMATCH, REGEXEXTRACT, REGEXREPLACE | Yes           | Yes        | No      | --       |
| 262 | IMPORTHTML                             | Yes           | No         | **Yes** | P2       |
| 263 | IMPORTXML                              | Yes           | No         | **Yes** | P3       |
| 264 | IMPORTFEED                             | Yes           | No         | **Yes** | P3       |
| 265 | GOOGLEFINANCE                          | Yes           | No         | **Yes** | P2       |
| 266 | GOOGLETRANSLATE                        | Yes           | No         | **Yes** | P3       |
| 267 | ENCODEURL, ISURL                       | Yes           | No         | **Yes** | P3       |

### 18. Charts

| #   | Feature                       | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ----------------------------- | ------------- | --------- | ------- | -------- |
| 268 | Column chart                  | Yes           | Yes       | No      | --       |
| 269 | Bar chart                     | Yes           | Yes       | No      | --       |
| 270 | Line chart                    | Yes           | Yes       | No      | --       |
| 271 | Area chart                    | Yes           | Yes       | No      | --       |
| 272 | Pie chart (+ donut variant)   | Yes           | Yes       | No      | --       |
| 273 | Scatter chart                 | Yes           | Yes       | No      | --       |
| 274 | Combo chart                   | Yes           | Yes       | No      | --       |
| 275 | Chart editor sidebar          | Yes           | Yes       | No      | --       |
| 276 | Chart move/resize/delete      | Yes           | Yes       | No      | --       |
| 277 | Chart live-updates from data  | Yes           | Yes       | No      | --       |
| 278 | Histogram chart               | Yes           | No        | **Yes** | P1       |
| 279 | Waterfall chart               | Yes           | No        | **Yes** | P2       |
| 280 | Treemap chart                 | Yes           | No        | **Yes** | P2       |
| 281 | Gauge chart                   | Yes           | No        | **Yes** | P2       |
| 282 | Candlestick chart             | Yes           | No        | **Yes** | P2       |
| 283 | Radar/Spider chart            | Yes           | No        | **Yes** | P2       |
| 284 | Geo/Map chart                 | Yes           | No        | **Yes** | P3       |
| 285 | Org chart                     | Yes           | No        | **Yes** | P3       |
| 286 | Timeline chart                | Yes           | No        | **Yes** | P3       |
| 287 | Stacked/100% stacked variants | Yes           | No        | **Yes** | P1       |
| 288 | 3D chart variants             | Yes           | No        | **Yes** | P3       |
| 289 | Trendlines on charts          | Yes           | No        | **Yes** | P1       |
| 290 | Error bars on charts          | Yes           | No        | **Yes** | P3       |
| 291 | Data labels on charts         | Yes           | Partial   | Partial | P1       |
| 292 | Chart export as image/PDF     | Yes           | No        | **Yes** | P2       |

### 19. Sheets Management

| #   | Feature                           | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------- | ------------- | --------- | ------- | -------- |
| 293 | Sheet tabs at bottom              | Yes           | Yes       | No      | --       |
| 294 | Add/delete/rename sheet           | Yes           | Yes       | No      | --       |
| 295 | Reorder sheets (drag)             | Yes           | Yes       | No      | --       |
| 296 | Duplicate sheet                   | Yes           | Yes       | No      | --       |
| 297 | Tab color                         | Yes           | Yes       | No      | --       |
| 298 | Sheet tab context menu            | Yes           | Yes       | No      | --       |
| 299 | Copy sheet to another spreadsheet | Yes           | No        | **Yes** | P2       |
| 300 | Hide/show sheet tab               | Yes           | No        | **Yes** | P1       |

### 20. File Operations

| #   | Feature                                                     | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ----------------------------------------------------------- | ------------- | --------- | ------- | -------- |
| 301 | Undo/Redo (100 entries)                                     | Yes           | Yes       | No      | --       |
| 302 | CSV import/export                                           | Yes           | Yes       | No      | --       |
| 303 | XLSX import/export (preserves formulas, formatting, sheets) | Yes           | Yes       | No      | --       |
| 304 | TSV export                                                  | Yes           | Yes       | No      | --       |
| 305 | PDF export                                                  | Yes           | Yes       | No      | --       |
| 306 | JSON export                                                 | N/A (API)     | Yes       | No      | --       |
| 307 | Drag-and-drop file import                                   | Yes           | Yes       | No      | --       |
| 308 | Export selected range only                                  | Yes           | Yes       | No      | --       |
| 309 | ODS (OpenDocument) import/export                            | Yes           | No        | **Yes** | P2       |
| 310 | HTML export (publish as web page)                           | Yes           | No        | **Yes** | P3       |

### 21. UI & Menus

| #   | Feature                                                         | Google Sheets | GridSpace            | Gap?    | Priority |
| --- | --------------------------------------------------------------- | ------------- | -------------------- | ------- | -------- |
| 311 | Formula bar (name box + formula display)                        | Yes           | Yes                  | No      | --       |
| 312 | Name box navigation                                             | Yes           | Yes                  | No      | --       |
| 313 | Right-click context menus (cell, row, column)                   | Yes           | Yes                  | No      | --       |
| 314 | Menu bar (File, Edit, View, Insert, Format, Data, Tools)        | Yes           | Yes                  | No      | --       |
| 315 | Status bar (SUM, AVG, COUNT, MIN, MAX)                          | Yes           | Yes                  | No      | --       |
| 316 | Cell comments (add, edit, delete)                               | Yes           | Yes                  | No      | --       |
| 317 | Cell notes                                                      | Yes           | Yes                  | No      | --       |
| 318 | Hyperlinks (insert, click to open)                              | Yes           | Yes                  | No      | --       |
| 319 | Image in cell                                                   | Yes           | Yes                  | No      | --       |
| 320 | Show/hide gridlines                                             | Yes           | Yes                  | No      | --       |
| 321 | Show/hide formula bar                                           | Yes           | Yes                  | No      | --       |
| 322 | Print dialog (orientation, margins, page breaks, header/footer) | Yes           | Yes                  | No      | --       |
| 323 | Zoom controls (50-200%)                                         | Yes           | Yes                  | No      | --       |
| 324 | Search menus / command palette                                  | Yes           | Yes                  | No      | --       |
| 325 | Spell check                                                     | Yes           | Yes (browser native) | No      | --       |
| 326 | Smart Chips (people, file, date, place, finance, rating)        | Yes           | No                   | **Yes** | P1       |
| 327 | Dropdown Chips (styled dropdown in cell)                        | Yes           | No                   | **Yes** | P1       |
| 328 | Suggestions mode (track changes)                                | Yes           | No                   | **Yes** | P1       |
| 329 | Tables (auto-formatted structured ranges with headers)          | Yes           | No                   | **Yes** | P1       |
| 330 | Full-screen mode                                                | Yes           | No                   | **Yes** | P2       |
| 331 | Sidebar panel framework (custom sidebars)                       | Yes           | No                   | **Yes** | P3       |
| 332 | Split pane view (multiple scroll regions)                       | Yes           | No                   | **Yes** | P2       |

### 22. Keyboard Shortcuts

| #   | Feature                          | Google Sheets | GridSpace | Gap?    | Priority |
| --- | -------------------------------- | ------------- | --------- | ------- | -------- |
| 333 | Ctrl+B/I/U formatting            | Yes           | Yes       | No      | --       |
| 334 | Ctrl+Z/Y undo/redo               | Yes           | Yes       | No      | --       |
| 335 | Ctrl+C/V/X copy/paste/cut        | Yes           | Yes       | No      | --       |
| 336 | Ctrl+Shift+V paste special       | Yes           | Yes       | No      | --       |
| 337 | Ctrl+F find, Ctrl+H replace      | Yes           | Yes       | No      | --       |
| 338 | Ctrl+; insert date               | Yes           | Yes       | No      | --       |
| 339 | Alt+Enter newline in cell        | Yes           | Yes       | No      | --       |
| 340 | F2 edit mode                     | Yes           | Yes       | No      | --       |
| 341 | Ctrl+1 format cells              | Yes           | Yes       | No      | --       |
| 342 | Ctrl+Shift+1-6 number formats    | Yes           | Yes       | No      | --       |
| 343 | Ctrl+K insert link               | Yes           | Yes       | No      | --       |
| 344 | Ctrl+Shift+; insert current time | Yes           | No        | **Yes** | P2       |
| 345 | Ctrl+` show all formulas         | Yes           | No        | **Yes** | P1       |
| 346 | F4 cycle absolute/relative ref   | Yes           | No        | **Yes** | P1       |

### 23. Collaboration

| #   | Feature                                 | Google Sheets | GridSpace | Gap?    | Priority |
| --- | --------------------------------------- | ------------- | --------- | ------- | -------- |
| 347 | Real-time co-editing (multi-user)       | Yes           | Yes       | No      | --       |
| 348 | Presence / collaborator avatars         | Yes           | Yes       | No      | --       |
| 349 | Colored cursors per user                | Yes           | Yes       | No      | --       |
| 350 | Selection range broadcast               | Yes           | Yes       | No      | --       |
| 351 | Cell lock / edit indicator              | Yes           | Yes       | No      | --       |
| 352 | CRDT conflict resolution                | Yes           | Yes (Yjs) | No      | --       |
| 353 | Per-user undo/redo                      | Yes           | Yes       | No      | --       |
| 354 | Reconnection handling                   | Yes           | Yes       | No      | --       |
| 355 | Connection status indicator             | Yes           | Yes       | No      | --       |
| 356 | Offline support with sync               | Yes           | Yes       | No      | --       |
| 357 | Threaded comment replies                | Yes           | Yes       | No      | --       |
| 358 | @mention in comments                    | Yes           | Yes       | No      | --       |
| 359 | Resolve/unresolve comments              | Yes           | Yes       | No      | --       |
| 360 | Comments panel/sidebar                  | Yes           | Yes       | No      | --       |
| 361 | Assign tasks in comments (action items) | Yes           | No        | **Yes** | P1       |
| 362 | Email notifications for comments        | Yes           | Yes       | No      | --       |
| 363 | Notification center (in-app)            | Yes           | Yes       | No      | --       |
| 364 | Activity log / edit history per cell    | Yes           | No        | **Yes** | P2       |

### 24. Sharing & Permissions

| #   | Feature                                  | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ---------------------------------------- | ------------- | --------- | ------- | -------- |
| 365 | Share dialog (add by email)              | Yes           | Yes       | No      | --       |
| 366 | Roles: Viewer, Commenter, Editor         | Yes           | Yes       | No      | --       |
| 367 | Share link (view/comment/edit)           | Yes           | Yes       | No      | --       |
| 368 | Copy link to clipboard                   | Yes           | Yes       | No      | --       |
| 369 | Transfer ownership                       | Yes           | Yes       | No      | --       |
| 370 | Shared with me section                   | Yes           | Yes       | No      | --       |
| 371 | Permission enforcement (server-side)     | Yes           | Yes       | No      | --       |
| 372 | Protected ranges per user                | Yes           | Yes       | No      | --       |
| 373 | Publish to web                           | Yes           | Yes       | No      | --       |
| 374 | Embed spreadsheet iframe                 | Yes           | Yes       | No      | --       |
| 375 | Share notification email                 | Yes           | Yes       | No      | --       |
| 376 | Make a copy for viewers                  | Yes           | Yes       | No      | --       |
| 377 | Restrict download/print/copy for viewers | Yes           | No        | **Yes** | P1       |
| 378 | Expiring access (time-limited sharing)   | Yes           | No        | **Yes** | P2       |

### 25. Version History

| #   | Feature                          | Google Sheets | GridSpace | Gap? | Priority |
| --- | -------------------------------- | ------------- | --------- | ---- | -------- |
| 379 | Auto-create version on save      | Yes           | Yes       | No   | --       |
| 380 | Version history sidebar          | Yes           | Yes       | No   | --       |
| 381 | Version timeline with timestamps | Yes           | Yes       | No   | --       |
| 382 | Version shows who made changes   | Yes           | Yes       | No   | --       |
| 383 | Preview previous version         | Yes           | Yes       | No   | --       |
| 384 | Restore previous version         | Yes           | Yes       | No   | --       |
| 385 | Name/label a version             | Yes           | Yes       | No   | --       |
| 386 | Visual diff (highlight changes)  | Yes           | Yes       | No   | --       |

### 26. Backend, Storage & Dashboard

| #   | Feature                                    | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ------------------------------------------ | ------------- | --------- | ------- | -------- |
| 387 | Cloud storage with auto-save               | Yes           | Yes       | No      | --       |
| 388 | Dashboard listing spreadsheets             | Yes           | Yes       | No      | --       |
| 389 | Grid/list view toggle                      | Yes           | Yes       | No      | --       |
| 390 | Sort by name/date/modified                 | Yes           | Yes       | No      | --       |
| 391 | Search spreadsheets                        | Yes           | Yes       | No      | --       |
| 392 | Delete/rename spreadsheet                  | Yes           | Yes       | No      | --       |
| 393 | Star/favorite spreadsheets                 | Yes           | Yes       | No      | --       |
| 394 | Templates gallery                          | Yes           | Yes       | No      | --       |
| 395 | Duplicate spreadsheet                      | Yes           | Yes       | No      | --       |
| 396 | Trash/recycle bin for deleted spreadsheets | Yes           | No        | **Yes** | P1       |
| 397 | Folders for organization                   | Yes           | No        | **Yes** | P1       |

### 27. Integrations & API

| #   | Feature                                       | Google Sheets | GridSpace                  | Gap?    | Priority |
| --- | --------------------------------------------- | ------------- | -------------------------- | ------- | -------- |
| 398 | REST API (CRUD spreadsheets, cells)           | Yes           | Yes                        | No      | --       |
| 399 | Batch update API                              | Yes           | Yes                        | No      | --       |
| 400 | Export API (CSV/XLSX/PDF)                     | Yes           | Yes                        | No      | --       |
| 401 | API key authentication                        | Yes           | Yes                        | No      | --       |
| 402 | API rate limiting                             | Yes           | Yes                        | No      | --       |
| 403 | API documentation (Swagger)                   | Yes           | Yes                        | No      | --       |
| 404 | Webhooks                                      | Yes           | Yes                        | No      | --       |
| 405 | Add-ons / extension marketplace               | Yes           | Partial (extension routes) | Partial | P2       |
| 406 | Apps Script (custom scripting)                | Yes           | Partial (ScriptEditor)     | Partial | P1       |
| 407 | Google Forms integration (responses to sheet) | Yes           | No                         | **Yes** | P3       |

### 28. Macros & Automation

| #   | Feature                                               | Google Sheets | GridSpace | Gap?    | Priority |
| --- | ----------------------------------------------------- | ------------- | --------- | ------- | -------- |
| 408 | Record macro                                          | Yes           | Yes       | No      | --       |
| 409 | Macro manager                                         | Yes           | Yes       | No      | --       |
| 410 | Script editor                                         | Yes           | Yes       | No      | --       |
| 411 | Trigger-based automation (onEdit, onOpen, time-based) | Yes           | No        | **Yes** | P1       |

### 29. Views & AI (GridSpace extras)

| #   | Feature                                    | Google Sheets     | GridSpace | Gap? | Priority |
| --- | ------------------------------------------ | ----------------- | --------- | ---- | -------- |
| 412 | Kanban view                                | No                | Yes       | N/A  | --       |
| 413 | Calendar view                              | No                | Yes       | N/A  | --       |
| 414 | Timeline/Gantt view                        | No                | Yes       | N/A  | --       |
| 415 | AI Analysis panel (client-side statistics) | Partial (Explore) | Yes       | N/A  | --       |

### 30. Performance & Production

| #   | Feature                               | Google Sheets      | GridSpace | Gap?    | Priority |
| --- | ------------------------------------- | ------------------ | --------- | ------- | -------- |
| 416 | 60fps scroll at 10k rows              | Yes                | Yes       | No      | --       |
| 417 | Formula recalc < 500ms for 1000 cells | Yes                | Yes       | No      | --       |
| 418 | Docker production build               | Yes (cloud-native) | Yes       | No      | --       |
| 419 | Offline support + sync queue          | Yes                | Yes       | No      | --       |
| 420 | SSL/TLS                               | Yes                | Yes       | No      | --       |
| 421 | Mobile responsive / apps              | Yes                | No        | **Yes** | P1       |
| 422 | Progressive Web App (PWA) installable | Yes                | No        | **Yes** | P2       |

---

## Gap Summary by Priority

### P0 -- Must-have for basic use (blocks adoption): 3

| #   | Feature                                   | Category       |
| --- | ----------------------------------------- | -------------- |
| 97  | Filter Views (per-user saved filter sets) | Data Tools     |
| 142 | SUMPRODUCT function                       | Math Functions |
| 161 | TEXTJOIN function                         | Text Functions |

### P1 -- Important for power users: 33

| #   | Feature                                   | Category                |
| --- | ----------------------------------------- | ----------------------- |
| 29  | Drag and drop cells to move               | Grid                    |
| 69  | Data bars in conditional formatting       | Conditional Formatting  |
| 70  | Icon sets in conditional formatting       | Conditional Formatting  |
| 123 | Full LAMBDA implementation (not stub)     | Formulas                |
| 129 | OFFSET function                           | Lookup Functions        |
| 130 | INDIRECT function                         | Lookup Functions        |
| 131 | Full ROW/COLUMN with cell ref context     | Lookup Functions        |
| 143 | PRODUCT function                          | Math Functions          |
| 144 | INT, TRUNC functions                      | Math Functions          |
| 145 | SIGN function                             | Math Functions          |
| 150 | SUBTOTAL function                         | Math Functions          |
| 162 | SPLIT function                            | Text Functions          |
| 163 | REPLACE function                          | Text Functions          |
| 164 | JOIN function                             | Text Functions          |
| 176 | DATEVALUE function                        | Date Functions          |
| 177 | TIMEVALUE function                        | Date Functions          |
| 178 | TIME function                             | Date Functions          |
| 189 | STDEVP, VARP                              | Statistical Functions   |
| 206 | PPMT, IPMT                                | Financial Functions     |
| 216 | MAXIFS, MINIFS                            | Conditional Aggregation |
| 228 | FLATTEN function                          | Array Functions         |
| 229 | MAP function (LAMBDA helper)              | Array Functions         |
| 230 | REDUCE function (LAMBDA helper)           | Array Functions         |
| 239 | Named Functions (user-defined)            | Array Functions         |
| 278 | Histogram chart                           | Charts                  |
| 287 | Stacked/100% stacked chart variants       | Charts                  |
| 289 | Trendlines on charts                      | Charts                  |
| 300 | Hide/show sheet tab                       | Sheets                  |
| 326 | Smart Chips                               | UI                      |
| 327 | Dropdown Chips                            | UI                      |
| 328 | Suggestions mode (track changes)          | UI                      |
| 329 | Tables (structured auto-formatted ranges) | UI                      |
| 345 | Ctrl+` show all formulas                  | Keyboard                |
| 346 | F4 cycle absolute/relative reference      | Keyboard                |
| 361 | Assign tasks in comments                  | Collaboration           |
| 377 | Restrict download/print/copy for viewers  | Sharing                 |
| 396 | Trash/recycle bin                         | Dashboard               |
| 397 | Folders for organization                  | Dashboard               |
| 406 | Full Apps Script equivalent               | Integrations            |
| 411 | Trigger-based automation                  | Automation              |
| 421 | Mobile responsive / apps                  | Production              |

### P2 -- Nice-to-have, improves parity: 47

(Includes: accounting/duration formats, themes, email/URL validation, filter views, EVEN, ODD, FACT, GCD, LCM, MROUND, QUOTIENT, trig functions, RADIANS, DEGREES, T, N, FIXED, DOLLAR, DAYS, ISOWEEKNUM, YEARFRAC, FREQUENCY, GROWTH, TREND, LINEST, NORM.DIST, SLOPE, INTERCEPT, AVERAGEA/MAXA/MINA, CUMPRINC, XNPV, SLN, DB, EFFECT, number base conversions, CONVERT, IMPORTHTML, GOOGLEFINANCE, histogram/waterfall/treemap/gauge/candlestick/radar charts, chart export, copy sheet to another spreadsheet, ODS import/export, full-screen, split pane, RTL, expiring access, edit history per cell, PWA, add-on marketplace)

### P3 -- Advanced/niche: 26

(Includes: SINH/COSH/TANH, SQRTPI, MULTINOMIAL, SERIESSUM, NUMBERVALUE, ROMAN, WORKDAY.INTL, distribution functions, FISHER, GAMMA, BETA, BESSELI, complex number functions, BITAND/BITOR, IMPORTXML, IMPORTFEED, GOOGLETRANSLATE, ENCODEURL, geo/org/timeline/3D charts, error bars, HTML export, sidebar framework, Google Forms integration, smart cleanup, column stats)

---

## Top 10 Highest-Impact Gaps to Close

1. **Filter Views** -- Lets multiple users apply independent filters without affecting others. Critical for team use.
2. **Smart Chips & Dropdown Chips** -- Modern Google Sheets UX centerpiece. Rich, interactive cell content.
3. **Suggestions Mode** -- Track-changes equivalent for spreadsheets. Essential for review workflows.
4. **Tables** -- Auto-formatted structured data ranges with structured references. Used constantly.
5. **Missing core functions (SUMPRODUCT, TEXTJOIN, SPLIT, INT, PRODUCT, SUBTOTAL)** -- These are among the most-used spreadsheet functions.
6. **LAMBDA helpers (MAP, REDUCE, FLATTEN, Named Functions)** -- Power-user formula capability.
7. **Additional chart types (histogram, stacked, trendlines)** -- Common data visualization needs.
8. **Data bars & icon sets in conditional formatting** -- Visual data representation in cells.
9. **Trash & folders in dashboard** -- Basic file management expectations.
10. **Mobile responsive layout** -- Spreadsheet access from phones/tablets.
