import { defineConfig } from 'vite'
import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.json"
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    }
  }
})
