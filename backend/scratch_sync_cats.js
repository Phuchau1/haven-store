require('dotenv').config();
const mongoose = require('mongoose');

const CATEGORIES_LIST = [
    { id: 'cat-clothing', name: 'Thời Trang Nam', order: 1 },
    { id: 'cat-womens', name: 'Thời Trang Nữ', order: 2 },
    { id: 'cat-accessories', name: 'Phụ Kiện Thời Trang', order: 3 },
    { id: 'cat-shoes', name: 'Giày Dép', order: 4 },
    { id: 'cat-sport', name: 'Đồ Thể Thao', order: 5 }
];

const SUBCATEGORIES_MAP = {
    'cat-womens': [
        { id: 'ao-so-mi-nu', name: 'Áo sơ mi nữ', order: 1 },
        { id: 'ao-polo-nu', name: 'Áo polo nữ', order: 2 },
        { id: 'ao-thun-nu', name: 'Áo T-shirt nữ', order: 3 },
        { id: 'ao-khoac-nu', name: 'Áo khoác nữ', order: 4 },
        { id: 'quan-au-nu', name: 'Quần âu nữ', order: 5 },
        { id: 'quan-jean-nu', name: 'Quần jean nữ', order: 6 },
        { id: 'quan-short-nu', name: 'Quần short nữ', order: 7 },
        { id: 'vay-lien-dam', name: 'Váy liền đầm', order: 8 },
        { id: 'chan-vay', name: 'Chân váy', order: 9 },
        { id: 'giay-dep-nu', name: 'Giày dép nữ', order: 10 },
        { id: 'tui-xach', name: 'Túi xách', order: 11 }
    ],
    'cat-clothing': [
        { id: 'ao-so-mi-nam', name: 'Áo sơ mi nam', order: 1 },
        { id: 'ao-polo-nam', name: 'Áo polo nam', order: 2 },
        { id: 'ao-thun-nam', name: 'Áo T-shirt nam', order: 3 },
        { id: 'ao-khoac-nam', name: 'Áo khoác nam', order: 4 },
        { id: 'quan-au-nam', name: 'Quần âu nam', order: 5 },
        { id: 'quan-jean-nam', name: 'Quần jean nam', order: 6 },
        { id: 'quan-short-nam', name: 'Quần short nam', order: 7 },
        { id: 'quan-kaki-nam', name: 'Quần kaki nam', order: 8 },
        { id: 'bo-vest-nam', name: 'Bộ vest nam', order: 9 },
        { id: 'giay-da-nam', name: 'Giày da nam', order: 10 },
        { id: 'vi-da-nam', name: 'Ví da nam', order: 11 },
        { id: 'day-lung-nam', name: 'Dây lưng nam', order: 12 },
        { id: 'dep-nam', name: 'Dép nam', order: 13 }
    ],
    'cat-accessories': [
        { id: 'tui-xach', name: 'Túi xách', order: 1 },
        { id: 'vi-da', name: 'Ví da', order: 2 },
        { id: 'that-lung', name: 'Thắt lưng', order: 3 },
        { id: 'mu', name: 'Mũ / Nón', order: 4 },
        { id: 'tat', name: 'Tất / Vớ', order: 5 }
    ],
    'cat-shoes': [
        { id: 'giay-dep-nu', name: 'Giày dép nữ', order: 1 },
        { id: 'giay-the-thao', name: 'Giày thể thao', order: 2 },
        { id: 'giay-da', name: 'Giày da', order: 3 },
        { id: 'dep', name: 'Dép', order: 4 }
    ],
    'cat-sport': [
        { id: 'bo-the-thao', name: 'Bộ đồ thể thao', order: 1 },
        { id: 'ao-the-thao', name: 'Áo thể thao', order: 2 },
        { id: 'quan-the-thao', name: 'Quần thể thao', order: 3 }
    ]
};

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const categoriesCol = mongoose.connection.db.collection('categories');
    
    for (const cat of CATEGORIES_LIST) {
        const subcats = SUBCATEGORIES_MAP[cat.id] || [];
        // Make sure they match the schema: { id, name, subcategories, isActive, ... }
        
        await categoriesCol.updateOne(
            { id: cat.id },
            {
                $set: {
                    name: cat.name,
                    order: cat.order,
                    isActive: true,
                    subcategories: subcats.map(sub => ({
                        id: sub.id,
                        name: sub.name,
                        isActive: true,
                        order: sub.order
                    }))
                }
            },
            { upsert: true }
        );
        console.log(`Upserted category: ${cat.name} with ${subcats.length} subcategories`);
    }
    
    console.log('Done syncing categories DB!');
    process.exit(0);
});
