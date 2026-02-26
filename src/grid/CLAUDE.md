# src/grid/

## What's Here
Canvas grid renderer, virtual scroll, cell selection, row/column operations, fill handle, freeze panes. This is the visual core of the spreadsheet.

## Patterns to Follow
- requestAnimationFrame for all canvas draws
- Convert screen coords → grid coords for all mouse events
- Batch state changes before triggering redraw
- Use offscreen canvas for frozen rows/columns

## Do NOT
- Import from server/ — frontend and backend are separate
- Use innerHTML or React rendering inside canvas
- Create objects in the hot render loop
