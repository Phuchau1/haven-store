import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://your-domain.com'; // User sẽ thay đổi domain này sau khi deploy

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        // Sau này khi deploy thật, bạn có thể gọi API lấy danh sách ID sản phẩm
        // và map ra cấu trúc này để đưa toàn bộ sản phẩm lên Google
    ];
}
