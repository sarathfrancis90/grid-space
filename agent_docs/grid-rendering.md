# Grid Rendering System

## Hybrid Rendering
- **Canvas layer**: Cell backgrounds, borders, grid lines, text, selection highlight
- **DOM overlay**: Active cell editor (textarea), context menus, tooltips, collaborator cursors
- **react-window**: Virtual scroll — only renders visible rows + buffer

## Coordinate Systems
- **Screen coords** (px): Mouse events, canvas drawing
- **Grid coords** (row, col): Cell addresses
- **Scroll offset**: viewport.scrollTop, viewport.scrollLeft
- Convert: screenToGrid(x, y) → { row, col }, gridToScreen(row, col) → { x, y }

## Canvas Drawing Order
1. Fill backgrounds (merge-aware)
2. Grid lines
3. Borders (cell-specific)
4. Text content (clipped to cell bounds)
5. Selection rectangles (blue overlay, 10% opacity)
6. Frozen row/col divider lines
7. Collaborator selections (colored overlays)

## Virtual Scroll
- Row height: default 25px, variable per row
- Column width: default 100px, variable per column
- Buffer: render 10 extra rows above/below viewport
- On scroll: recalculate visible range, redraw canvas
- Throttle scroll handler to 16ms (60fps)

## Cell Editing
- Double-click or F2 → position textarea over cell → focus
- Textarea inherits cell font, size, alignment
- Enter commits (move down), Tab commits (move right), Escape cancels
- Formula mode: typing = shows autocomplete, clicking cells inserts references

## Selection
- Single cell: click
- Range: click + drag OR shift+click
- Multi-range: ctrl+click
- Row: click row header
- Column: click column header
- All: ctrl+A or click top-left corner
- Selection stored in uiStore: { start: {row,col}, end: {row,col} }

## Fill Handle
- Small blue square at bottom-right of selection
- Drag down: extend series (numbers increment, dates advance, formulas adjust references)
- Drag right: same logic, column-wise
- Detect pattern from selected cells (arithmetic sequence, date sequence, repeat)

## Performance
- requestAnimationFrame for all canvas draws
- Batch multiple state changes into single render
- Offscreen canvas for frozen rows/columns
- Avoid getImageData/putImageData — use drawing primitives only
- Profile with Chrome DevTools → Performance tab → aim for 60fps
