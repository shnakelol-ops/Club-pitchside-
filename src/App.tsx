import { PixiPitchSurface } from "./core/pitch/PixiPitchSurface";

export default function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 16,
      }}
    >
      <PixiPitchSurface sport="gaelic" />
    </main>
  );
}
