import { preprocessMeltUI, sequence } from '@melt-ui/pp';
// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://beta.tauri.app/start/frontend/sveltekit/ for more info
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    adapter: adapter(),
    alias: {
      $components: './src/components',
      '$components/*': './src/components/*'
    }
  }
};
export default config;
