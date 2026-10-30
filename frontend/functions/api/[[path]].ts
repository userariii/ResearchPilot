// Cloudflare Pages Function: Optional reverse proxy to Worker API
// If WORKER_URL is configured in Cloudflare Pages environment variables,
// requests to /api/* are seamlessly proxied to the Worker backend without CORS.

interface Env {
  WORKER_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const workerUrl = context.env.WORKER_URL;
  if (!workerUrl) {
    return new Response(
      JSON.stringify({
        error: "WORKER_URL is not set on Cloudflare Pages.",
        message: "Configure WORKER_URL in Pages Settings -> Environment variables, or build with VITE_API_BASE set."
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const url = new URL(context.request.url);
  const targetBase = workerUrl.trim().replace(/\/+$/, '');
  const targetUrl = new URL(url.pathname + url.search, targetBase);

  const forwardHeaders = new Headers(context.request.headers);
  forwardHeaders.set("Host", new URL(targetBase).host);

  return fetch(targetUrl.toString(), {
    method: context.request.method,
    headers: forwardHeaders,
    body: context.request.body,
    redirect: "follow",
  });
};

