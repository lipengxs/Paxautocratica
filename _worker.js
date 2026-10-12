const pagePaths = new Set(['/related-games', '/', '/guides', '/media', '/news', '/privacy-policy', '/terms-of-service']);
const publicFiles = new Set(['/static/game-discovery.css',
    '/static/site.css', '/static/fieldnotes.svg', '/static/retire-workers.js',
    '/sw.js', '/robots.txt', '/sitemap.xml', '/BingSiteAuth.xml',
    '/B362957FC36C5EDDD6079B6D78330424.txt'
]);
const retiredFiles = new Set([
    '/favicon.ico', '/ads.txt', '/blog-post-chinese.md', '/blog-post-english.md',
    '/SEO_ANALYSIS_REPORT.md', '/网站安全分析报告.md', '/冒充官网风险评估.md'
]);
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; worker-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests";
function secure(response, request, noindex = false) {
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', policy);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    headers.set('Cache-Control', 'no-store, no-transform, max-age=0');
    if (noindex || new URL(request.url).hostname.endsWith('.pages.dev')) headers.set('X-Robots-Tag', 'noindex');
    return new Response(request.method === 'HEAD' ? null : response.body, {status: response.status, statusText: response.statusText, headers});
}
function plain(message, status) {
    return new Response(message + '\n', {status, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        let path;
        try { path = decodeURIComponent(url.pathname); }
        catch (_) { return secure(plain('Invalid path', 400), request, true); }
        // Deny old files before static lookup, including query and encoded variants.
        if ((path.startsWith('/static/') && !publicFiles.has(path)) || retiredFiles.has(path)) {
            return secure(plain('This resource has been permanently withdrawn.', 410), request, true);
        }
        if (!['GET', 'HEAD'].includes(request.method)) {
            const response = plain('Method not allowed', 405);
            response.headers.set('Allow', 'GET, HEAD');
            return secure(response, request, true);
        }
        let canonical = path;
        if (path === '/index.html' || path === '/index') canonical = '/';
        else if (path.endsWith('.html')) canonical = path.slice(0, -5);
        else if (path.length > 1 && path.endsWith('/')) canonical = path.slice(0, -1);
        if (pagePaths.has(canonical) && canonical !== url.pathname) {
            url.pathname = canonical;
            return secure(new Response(null, {status: 308, headers: {Location: url.href}}), request);
        }
        if (!pagePaths.has(path) && !publicFiles.has(path)) {
            return secure(plain('Page not found. Visit https://pax-autocratica.com/ for the current independent reading guide.', 404), request, true);
        }
        const response = await env.ASSETS.fetch(request);
        return secure(response, request, response.status >= 400);
    }
};
