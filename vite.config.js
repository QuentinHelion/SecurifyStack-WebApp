import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
    plugins: [react(), svgr(), tailwindcss()],
    optimizeDeps: {
        include: [
            '@mui/material/Grid',
            '@mui/material/Card',
            '@mui/material/CardContent',
            '@mui/material/Checkbox',
            '@mui/material/Typography',
            '@mui/material/Box',
            '@mui/material/TextField',
            '@mui/material/Button',
            '@mui/material/AppBar',
            '@mui/material/Toolbar',
            '@mui/material/IconButton',
            '@tabler/icons-react',
            'lodash/uniqueId',
        ],
    },
    resolve: {
        alias: {
            src: resolve(__dirname, 'src'),
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                conceptify: resolve(__dirname, 'public/conceptify.html'),
            },
        },
    },
    server: {
        host: true,
        port: 3333,
    },
});