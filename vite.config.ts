import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Relative assets support GitHub Pages /OneFlow/ and local previews alike.
  base: './',
});
