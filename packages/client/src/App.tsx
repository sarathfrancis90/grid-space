import { Grid } from "./components/grid";

export function App() {
  return (
    <div
      data-testid="app-root"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Grid />
    </div>
  );
}
