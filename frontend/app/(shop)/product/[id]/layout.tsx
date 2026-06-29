import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`);
        if (!res.ok) return { title: 'Sản phẩm | PH Store' };
        const data = await res.json();
        const product = data.products?.find((p: any) => p.id === resolvedParams.id);

        if (!product) {
            return {
                title: 'Không tìm thấy sản phẩm | PH Store',
            };
        }

        return {
            title: `${product.name} | PH Store`,
            description: product.description || `Mua sắm ${product.name} chính hãng tại PH Store. Giá tốt, giao hàng tận nơi.`,
            openGraph: {
                title: product.name,
                description: product.description,
                images: product.images && product.images.length > 0 ? [{ url: product.images[0] }] : [],
                type: 'website',
            },
        };
    } catch (e) {
        return {
            title: 'Sản phẩm | PH Store'
        };
    }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
