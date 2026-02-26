# Keyboard Shortcuts (Match Google Sheets)

## Navigation

| Shortcut            | Action                      |
| ------------------- | --------------------------- |
| Arrow keys          | Move selection              |
| Tab / Shift+Tab     | Move right / left           |
| Enter / Shift+Enter | Move down / up              |
| Ctrl+Home           | Go to A1                    |
| Ctrl+End            | Go to last cell with data   |
| Ctrl+Arrow          | Jump to edge of data region |
| Page Up/Down        | Scroll one viewport         |
| Ctrl+G              | Go to cell dialog           |

## Editing

| Shortcut              | Action             |
| --------------------- | ------------------ |
| F2                    | Enter edit mode    |
| Escape                | Cancel edit        |
| Delete/Backspace      | Clear cell content |
| Ctrl+Z                | Undo               |
| Ctrl+Y / Ctrl+Shift+Z | Redo               |
| Ctrl+C                | Copy               |
| Ctrl+X                | Cut                |
| Ctrl+V                | Paste              |
| Ctrl+Shift+V          | Paste special      |
| Alt+Enter             | Newline in cell    |

## Formatting

| Shortcut     | Action            |
| ------------ | ----------------- |
| Ctrl+B       | Bold              |
| Ctrl+I       | Italic            |
| Ctrl+U       | Underline         |
| Ctrl+5       | Strikethrough     |
| Ctrl+Shift+1 | Number format     |
| Ctrl+Shift+2 | Time format       |
| Ctrl+Shift+3 | Date format       |
| Ctrl+Shift+4 | Currency format   |
| Ctrl+Shift+5 | Percent format    |
| Ctrl+Shift+6 | Scientific format |
| Ctrl+\       | Clear formatting  |

## Selection

| Shortcut         | Action                   |
| ---------------- | ------------------------ |
| Ctrl+A           | Select all               |
| Shift+Click      | Extend selection         |
| Ctrl+Click       | Add to selection         |
| Shift+Space      | Select entire row        |
| Ctrl+Space       | Select entire column     |
| Ctrl+Shift+Arrow | Extend selection to edge |

## Other

| Shortcut | Action                  |
| -------- | ----------------------- |
| Ctrl+F   | Find                    |
| Ctrl+H   | Replace                 |
| Ctrl+K   | Insert link             |
| Ctrl+;   | Insert current date     |
| Ctrl+P   | Print                   |
| Ctrl+/   | Keyboard shortcuts help |

## Implementation

- Use keydown event on document
- Prevent default browser behavior for overridden shortcuts
- Check `event.ctrlKey || event.metaKey` for Mac support
- Map shortcuts to store actions
- Disable during modal dialogs
