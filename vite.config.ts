import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [react()],
    define: {
      // Safely expose API_KEY and IMGBB_API_KEY from Vercel/environment to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.IMGBB_API_KEY': JSON.stringify(env.IMGBB_API_KEY), // Added IMGBB_API_KEY
    },
    build: {
      outDir: 'dist',
    },
  };
});