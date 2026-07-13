import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const publicUrl = parsePublicUrl(env.VITE_PUBLIC_APP_URL);
  const isLocalhost = ['localhost', '127.0.0.1'].includes(publicUrl.hostname);

  return {
    server: {
      host: isLocalhost ? publicUrl.hostname : '0.0.0.0',
      port: Number(publicUrl.port || 5173),
      strictPort: true,
    },
  };
});

function parsePublicUrl(value) {
  try {
    return new URL(value || 'http://localhost:5173/');
  } catch {
    return new URL('http://localhost:5173/');
  }
}
