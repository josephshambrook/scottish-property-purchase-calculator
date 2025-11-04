const server = Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);
    let filePath = url.pathname;

    // Serve index.html for root path
    if (filePath === '/') {
      filePath = '/index.html';
    }

    // Try to serve the requested file
    const file = Bun.file(`.${filePath}`);
    const exists = await file.exists();

    if (exists) {
      // Inject live reload script into HTML files
      if (filePath.endsWith('.html')) {
        const content = await file.text();
        return new Response(content, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      return new Response(file);
    }

    // 404 for files that don't exist
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
