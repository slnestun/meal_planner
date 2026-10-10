import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "src/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "src/index.html"),
        recipe: resolve(import.meta.dirname, "src/recipe/index.html"),
        saved: resolve(import.meta.dirname, "src/saved/index.html"),
        planner: resolve(import.meta.dirname, "src/planner/index.html"),
      },
    },
  },
});
