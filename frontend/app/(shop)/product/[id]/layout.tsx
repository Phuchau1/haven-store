import { Metadata } from 'next';
import { slugify } from '@/lib/format';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const target = decodeURIComponent(resolvedParams.id || '').toLowerCase();
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com'}/api/products`);
        if (!res.ok) return { title: 'Sản phẩm | HAVEN STORE' };
        const data = await res.json();
        
        const product = data.products?.find((p: any) => {
            const pId = (p.id || '').toLowerCase();
            const pSlug = (p.slug || slugify(p.name || '')).toLowerCase();
            const pNameSlug = slugify(p.name || '').toLowerCase();
            return pId === target || pSlug === target || pNameSlug === target || target.endsWith(pId) || pId.endsWith(target);
        });

        if (!product) {
            return {
                title: 'Không tìm thấy sản phẩm | HAVEN STORE',
            };
        }

        return {
            title: `${product.name} | HAVEN STORE`,
            description: product.description || `Mua sắm ${product.name} chính hãng tại HAVEN STORE. Giá tốt, giao hàng tận nơi.`,
            openGraph: {
                title: product.name,
                description: product.description,
                images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : [],
                type: 'website',
            },
        };
    } catch (e) {
        return {
            title: 'Sản phẩm | HAVEN STORE'
        };
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
