import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://havenstore.io.vn';

    // 1. Static main pages
    const routes = [
        '',
        '/shop',
        '/locations',
        '/about',
        '/cart',
        '/checkout',
        '/auth/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: (route === '' || route === '/shop' || route === '/locations' ? 'daily' : 'weekly') as 'daily' | 'weekly',
        priority: route === '' ? 1.0 : route === '/locations' ? 0.9 : 0.8,
    }));

    // 2. Dynamic published products & articles
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com';
        const res = await fetch(`${backendUrl}/api/products`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                const productRoutes = data.products.map((p: any) => ({
                    url: `${baseUrl}/product/${p.slug || p.id}`,
                    lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
                    changeFrequency: 'daily' as const,
                    priority: 0.9,
                }));
                return [...routes, ...productRoutes];
            }
        }
    } catch (e) {
        console.error('Error generating sitemap product URLs:', e);
    }

    return routes;
}
