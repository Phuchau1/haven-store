'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Camera, ChevronRight, Loader2, ShoppingBag, Star, RotateCcw, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { generateWithImage, buildTryOnPrompt } from '@/lib/gemini';

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    description?: string;
    category?: string;
}

function formatPrice(p: number) {
    return p.toLocaleString('vi-VN') + 'đ';
}

function parseMarkdown(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
}

// Upload Zone
function UploadZone({ onFile }: { onFile: (f: File) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) onFile(file);
    };

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 min-h-[200px] ${drag ? 'border-amber-400 bg-amber-50 scale-105' : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/50'}`}
        >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
            <motion.div animate={{ y: drag ? -5 : 0 }} className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <Camera size={28} className="text-amber-500" />
                </div>
                <div>
                    <p className="font-bold text-gray-800">Tải ảnh của bạn lên</p>
                    <p className="text-sm text-gray-500 mt-1">Kéo thả hoặc nhấn để chọn ảnh</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP • Tối đa 10MB</p>
                </div>
            </motion.div>
        </div>
    );
}

// Product Card Selector
function ProductCard({ product, selected, onClick }: { product: Product; selected: boolean; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative text-left rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-amber-400 shadow-lg shadow-amber-100' : 'border-gray-100 hover:border-gray-300'}`}
        >
            {selected && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                </div>
            )}
            <div className="relative h-36 bg-gray-50">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            </div>
            <div className="p-2">
                <p className="text-xs font-semibold text-gray-800 line-clamp-2">{product.name}</p>
                <p className="text-xs text-amber-600 font-bold mt-1">{formatPrice(product.price)}</p>
            </div>
        </motion.button>
    );
}

// Result display
function AIResult({ result }: { result: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-amber-100"
        >
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 border-b border-amber-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-white" />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">AI Stylist PH Store</p>
                    <p className="text-xs text-gray-500">Phân tích hoàn tất</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
            </div>
            <div className="p-5 bg-white">
                <div
                    className="text-sm text-gray-700 leading-relaxed space-y-2"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }}
                />
            </div>
        </motion.div>
    );
}

export default function AITryOnPage() {
    const [userPhoto, setUserPhoto] = useState<File | null>(null);
    const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [productSearch, setProductSearch] = useState('');

    const handlePhoto = (file: File) => {
        setUserPhoto(file);
        setUserPhotoUrl(URL.createObjectURL(file));
        setResult('');
        setError('');
    };

    const loadProducts = useCallback(async (q = '') => {
        setLoadingProducts(true);
        try {
            const url = q
                ? `/api/products?search=${encodeURIComponent(q)}&limit=12`
                : '/api/products?limit=12';
            const res = await fetch(url);
            const data = await res.json();
            setProducts(data.products || []);
        } catch {
            setProducts([]);
        }
        setLoadingProducts(false);
    }, []);

    React.useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadProducts(productSearch);
    };

    const analyze = async () => {
        if (!userPhoto || !selectedProduct) return;
        setAnalyzing(true);
        setResult('');
        setError('');

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(',')[1];
                const mimeType = userPhoto.type;
                const prompt = buildTryOnPrompt(
                    selectedProduct.name,
                    selectedProduct.description || ''
                );
                try {
                    const text = await generateWithImage(prompt, base64);
                    setResult(text);
                } catch {
                    setError('Không thể kết nối AI. Hiển thị kết quả mẫu.');
                    setResult(`👗 **Phân tích AI cho: ${selectedProduct.name}**\n\n✅ **Đánh giá phù hợp:** Sản phẩm này có thiết kế linh hoạt, phù hợp với nhiều vóc dáng và tông màu da.\n\n💡 **Cách mặc gợi ý:**\n- Chọn size vừa vặn để tôn dáng tốt nhất\n- Mix cùng quần âu hoặc jeans tùy phong cách\n- Có thể mặc cả ngày lẫn đi chơi buổi tối\n\n🎨 **Phối đồ hoàn chỉnh:**\n- Phối với quần đen slim + giày da để trông sang trọng\n- Thêm túi xách nhỏ màu nude để hoàn thiện look\n\n⭐ **Đánh giá tổng thể: 8.5/10** — Lựa chọn thời trang, đa năng và dễ mặc!`);
                }
                setAnalyzing(false);
            };
            reader.readAsDataURL(userPhoto);
        } catch {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
            setAnalyzing(false);
        }
    };

    const canAnalyze = userPhoto && selectedProduct && !analyzing;

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-yellow-50/30">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
                <div className="container-torano py-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronRight size={18} className="rotate-180" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                                <Camera size={16} className="text-white" />
                            </div>
                            <div>
                                <h1 className="font-black text-gray-900 text-lg leading-tight">AI Thử Đồ</h1>
                                <p className="text-xs text-gray-400">Powered by Gemini AI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-torano py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Hero banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <Sparkles size={14} /> AI Stylist · Phân tích thời trang thông minh
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                            Thử đồ ảo với{' '}
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                                AI Stylist
                            </span>
                        </h2>
                        <p className="text-gray-500 max-w-lg mx-auto">
                            Upload ảnh của bạn, chọn sản phẩm yêu thích — AI sẽ phân tích và tư vấn cách phối đồ phù hợp nhất
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Step 1: Upload Photo */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">1</div>
                                    <h3 className="font-bold text-gray-800">Ảnh của bạn</h3>
                                </div>

                                <AnimatePresence mode="wait">
                                    {userPhotoUrl ? (
                                        <motion.div
                                            key="photo"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative"
                                        >
                                            <div className="relative h-56 rounded-xl overflow-hidden bg-gray-100">
                                                <Image src={userPhotoUrl} alt="Ảnh của bạn" fill className="object-cover" />
                                            </div>
                                            <button
                                                onClick={() => { setUserPhoto(null); setUserPhotoUrl(''); setResult(''); }}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                            <p className="text-xs text-center text-green-600 font-medium mt-2 flex items-center justify-center gap-1">
                                                ✅ Ảnh đã sẵn sàng
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <UploadZone onFile={handlePhoto} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Step 2: Select Product */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">2</div>
                                    <h3 className="font-bold text-gray-800">Chọn sản phẩm muốn thử</h3>
                                </div>

                                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm sản phẩm..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                                    />
                                    <button type="submit" className="px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors">
                                        Tìm
                                    </button>
                                </form>

                                {loadingProducts ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 size={24} className="animate-spin text-amber-400" />
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Không tìm thấy sản phẩm</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                                        {products.map(p => (
                                            <ProductCard
                                                key={p.id}
                                                product={p}
                                                selected={selectedProduct?.id === p.id}
                                                onClick={() => { setSelectedProduct(p); setResult(''); }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {selectedProduct && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-3"
                                    >
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                            <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{selectedProduct.name}</p>
                                            <p className="text-xs text-amber-600 font-bold">{formatPrice(selectedProduct.price)}</p>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)}>
                                            <X size={14} className="text-gray-400" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Step 3: Analyze */}
                            <motion.button
                                onClick={analyze}
                                disabled={!canAnalyze}
                                whileHover={canAnalyze ? { scale: 1.01 } : undefined}
                                whileTap={canAnalyze ? { scale: 0.98 } : undefined}
                                className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${canAnalyze
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-200 hover:shadow-xl'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        AI đang phân tích...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Phân tích với AI Stylist
                                    </>
                                )}
                            </motion.button>

                            {!userPhoto && !selectedProduct && (
                                <p className="text-center text-xs text-gray-400">Upload ảnh và chọn sản phẩm để bắt đầu</p>
                            )}
                        </div>
                    </div>

                    {/* Result */}
                    <AnimatePresence>
                        {(result || error) && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-8"
                            >
                                {error && (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl mb-4 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Side by side */}
                                {userPhotoUrl && selectedProduct && (
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ảnh của bạn</p>
                                            <div className="relative h-48 rounded-xl overflow-hidden bg-gray-50">
                                                <Image src={userPhotoUrl} alt="You" fill className="object-cover" />
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 border border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sản phẩm</p>
                                            <div className="relative h-48 rounded-xl overflow-hidden bg-gray-50">
                                                <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-cover" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {result && <AIResult result={result} />}

                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={() => { setResult(''); setError(''); }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <RotateCcw size={14} /> Thử lại
                                    </button>
                                    {selectedProduct && (
                                        <Link
                                            href={`/product/${selectedProduct.id}`}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                                        >
                                            <ShoppingBag size={14} /> Xem sản phẩm
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
