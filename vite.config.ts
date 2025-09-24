import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  base: '/comp_coding/', // important for GitHub Pages project page
  plugins: [react()],
});

