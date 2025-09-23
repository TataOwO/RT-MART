import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true, // 支持 HTML5 History API
    host: true, // 等同於 --host，讓外部可以連接
    port: 5173, // 預設端口
  },
});
