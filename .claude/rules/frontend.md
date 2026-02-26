# Frontend Rules (src/\*\*)

- React 18 functional components only — no class components
- TypeScript strict mode — no any, no as any, no @ts-ignore
- Zustand + Immer for state — mutate draft directly in set()
- TailwindCSS for styling — no CSS modules, no styled-components
- Named exports only (except page-level components which use default)
- One concern per file — max 300 lines
- All props must be typed with interfaces
- Use React.memo() for components that receive object props
- Canvas drawing in useEffect with cleanup
- data-testid on all interactive elements
