import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://your-domain.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/account', '/checkout'], // Chặn Google Bot vào các trang bảo mật
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
