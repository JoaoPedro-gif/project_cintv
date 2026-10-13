import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// O proxy faz navegador e API parecerem a mesma origem: cookie de sessão e CSRF funcionam sem CORS
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, allowedHosts: true, port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
