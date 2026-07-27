export async function GET() {
    return new Response('google-site-verification: google5769b7fee58b2a81.html', {
        headers: { 'Content-Type': 'text/html' }
    });
}
