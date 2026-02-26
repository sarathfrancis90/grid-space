# Formatting System

## CellFormat Interface
```typescript
interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;       // default: 'Arial'
  fontSize?: number;         // default: 10
  textColor?: string;        // hex: '#000000'
  backgroundColor?: string;  // hex: '#ffffff'
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  numberFormat?: string;     // '0.00', '$#,##0', '0%', 'yyyy-mm-dd', etc.
  wrapText?: 'overflow' | 'wrap' | 'clip';
  textRotation?: number;     // degrees: -90 to 90
  indent?: number;           // 0-10
  borders?: {
    top?: Border;
    right?: Border;
    bottom?: Border;
    left?: Border;
  };
}

interface Border {
  style: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double';
  color: string;
}
```

## Number Formatting
Use a number format string parser. Key patterns:
- `0` — digit placeholder (shows 0 if no digit)
- `#` — digit placeholder (blank if no digit)
- `.` — decimal point
- `,` — thousands separator
- `%` — multiply by 100, show percent
- `$` — literal dollar sign
- Custom: `$#,##0.00` → `$1,234.56`

## Paint Format (Format Painter)
1. User clicks paint format button → enters paint mode
2. Copy format from selected cell(s)
3. Click target cell/range → apply format → exit paint mode
4. Double-click paint format → persistent mode (stays active until Escape)

## Conditional Formatting
```typescript
interface ConditionalRule {
  id: string;
  range: string;        // 'A1:A100'
  type: 'value' | 'text' | 'date' | 'formula' | 'colorScale';
  condition: string;    // 'greaterThan', 'contains', etc.
  values: string[];     // comparison values
  format: Partial<CellFormat>;  // format to apply
  priority: number;     // lower = higher priority
}
```

## Merge Cells
- Store merged regions: { start: {row,col}, end: {row,col} }
- Value lives in top-left cell only
- Canvas: draw merged cell spanning multiple cells
- Click any cell in merged region → selects entire merged region
- Unmerge: value stays in top-left, other cells become empty
