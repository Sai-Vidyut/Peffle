export const colors = {
  bg: "#0c0f0d",
  text: "#e8ede9",
  dim: "#6b736e",
  accent: "#5ef0d6",
  green: "#3ddc84",
  red: "#ff5a4a",
  panel: "#141a17",
};

export type MascotState =
  | "idle"
  | "thinking"
  | "success"
  | "warning"
  | "blocked"
  | "approval"
  | "killed";
