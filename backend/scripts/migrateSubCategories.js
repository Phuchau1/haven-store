const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { ProductModel } = require('../src/models/Product');

async function migrate() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    console.log(`Connecting to MongoDB at: ${uri}...`);
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB. Migrating products...');

        const products = await ProductModel.find({});
        let updatedCount = 0;

        for (const product of products) {
            let changed = false;
            let name = product.name.toLowerCase();
            let cat = product.category;
            
            // Map Nam (cat-clothing / quan-ao)
            if (cat === 'cat-clothing' || cat === 'quan-ao') {
                if (name.includes('sơ mi') || name.includes('somi')) {
                    product.subCategory = 'ao-so-mi-nam';
                    product.subCategoryLabel = 'Áo sơ mi nam';
                } else if (name.includes('polo')) {
                    product.subCategory = 'ao-polo-nam';
                    product.subCategoryLabel = 'Áo polo nam';
                } else if (name.includes('thun') || name.includes('t-shirt') || name.includes('tshirt')) {
                    product.subCategory = 'ao-thun-nam';
                    product.subCategoryLabel = 'Áo T-shirt nam';
                } else if (name.includes('khoác')) {
                    product.subCategory = 'ao-khoac-nam';
                    product.subCategoryLabel = 'Áo khoác nam';
                } else if (name.includes('jean') || name.includes('bò')) {
                    product.subCategory = 'quan-jean-nam';
                    product.subCategoryLabel = 'Quần jean nam';
                } else if (name.includes('kaki') || name.includes('chino')) {
                    product.subCategory = 'quan-kaki-nam';
                    product.subCategoryLabel = 'Quần kaki nam';
                } else if (name.includes('short') || name.includes('đùi') || name.includes('ngố')) {
                    product.subCategory = 'quan-short-nam';
                    product.subCategoryLabel = 'Quần short nam';
                } else if (name.includes('âu') || name.includes('tây')) {
                    product.subCategory = 'quan-au-nam';
                    product.subCategoryLabel = 'Quần âu nam';
                } else if (name.includes('vest') || name.includes('suit') || name.includes('blazer')) {
                    product.subCategory = 'bo-vest-nam';
                    product.subCategoryLabel = 'Bộ vest nam';
                }
                
                // Fix categories that should be shoes/accessories
                if (name.includes('giày') || name.includes('giay') || name.includes('derby')) {
                    product.category = 'cat-shoes';
                    product.categoryLabel = 'Giày dép';
                    product.subCategory = 'giay-da';
                    product.subCategoryLabel = 'Giày da';
                } else if (name.includes('dép') || name.includes('sandal')) {
                    product.category = 'cat-shoes';
                    product.categoryLabel = 'Giày dép';
                    product.subCategory = 'dep';
                    product.subCategoryLabel = 'Dép';
                } else if (name.includes('thắt lưng') || name.includes('dây nịt')) {
                    product.category = 'cat-accessories';
                    product.categoryLabel = 'Phụ kiện';
                    product.subCategory = 'that-lung';
                    product.subCategoryLabel = 'Thắt lưng';
                } else if (name.includes('ví') || name.includes('bóp')) {
                    product.category = 'cat-accessories';
                    product.categoryLabel = 'Phụ kiện';
                    product.subCategory = 'vi-da';
                    product.subCategoryLabel = 'Ví da';
                } else if (name.includes('tất') || name.includes('vớ')) {
                    product.category = 'cat-accessories';
                    product.categoryLabel = 'Phụ kiện';
                    product.subCategory = 'tat';
                    product.subCategoryLabel = 'Tất';
                }
            }
            
            // Map Accessories & Shoes directly if they are already in the right top-level
            if (cat === 'cat-accessories' || cat === 'phu-kien') {
                if (name.includes('thắt lưng')) {
                    product.subCategory = 'that-lung';
                    product.subCategoryLabel = 'Thắt lưng';
                } else if (name.includes('ví')) {
                    product.subCategory = 'vi-da';
                    product.subCategoryLabel = 'Ví da';
                } else if (name.includes('mũ') || name.includes('nón')) {
                    product.subCategory = 'mu';
                    product.subCategoryLabel = 'Mũ';
                } else if (name.includes('tất') || name.includes('vớ')) {
                    product.subCategory = 'tat';
                    product.subCategoryLabel = 'Tất';
                }
            }
            
            if (cat === 'cat-shoes' || cat === 'giay') {
                if (name.includes('thể thao') || name.includes('sneaker')) {
                    product.subCategory = 'giay-the-thao';
                    product.subCategoryLabel = 'Giày thể thao';
                } else if (name.includes('da') || name.includes('tây') || name.includes('derby')) {
                    product.subCategory = 'giay-da';
                    product.subCategoryLabel = 'Giày da';
                } else if (name.includes('dép') || name.includes('sandal')) {
                    product.subCategory = 'dep';
                    product.subCategoryLabel = 'Dép';
                }
            }
            
            // Map Women (cat-womens)
            if (cat === 'cat-womens') {
                if (name.includes('sơ mi') || name.includes('somi')) {
                    product.subCategory = 'ao-so-mi-nu';
                    product.subCategoryLabel = 'Áo sơ mi nữ';
                } else if (name.includes('váy') || name.includes('đầm')) {
                    if (name.includes('chân váy')) {
                        product.subCategory = 'chan-vay';
                        product.subCategoryLabel = 'Chân váy';
                    } else {
                        product.subCategory = 'vay-lien-dam';
                        product.subCategoryLabel = 'Váy liền đầm';
                    }
                }
            }

            if (product.isModified()) {
                await product.save();
                updatedCount++;
                console.log(`Updated ${product.name} -> ${product.categoryLabel} / ${product.subCategoryLabel}`);
            }
        }

        console.log(`Migration completed! Updated ${updatedCount} products.`);
    } catch (error) {
        console.error('Error migrating products:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

migrate();
