import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  nitro: { preset: process.env["VERCEL"] ? "vercel" : "node-server" },
  tanstackStart: { server: { entry: "server" } },
  vite: { server: { host: "127.0.0.1", port: 5173, strictPort: true } },
});
