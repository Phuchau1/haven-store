export async function GET() {
    return new Response('google-site-verification: google5e31d691b45f169a.html', {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    });
}
