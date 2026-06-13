async function test() {
    try {
        const pRes = await fetch('http://localhost:5000/api/products');
        const pData = await pRes.json();
        
        const fsRes = await fetch('http://localhost:5000/api/flash-sales/active');
        const fsData = await fsRes.json();

        // find product in flash sale
        if (fsData.data && fsData.data.products) {
            for (let fsProd of fsData.data.products) {
                const prod = pData.products.find(p => p.id === fsProd.productId);
                if (prod) {
                    console.log('--- PRODUCT ---');
                    console.log('ID:', prod.id, prod.name);
                    console.log('FS Stock:', fsProd.stockQuantity);
                    console.log('FS Variants:', JSON.stringify(fsProd.variants, null, 2));
                    console.log('Normal Variants:', JSON.stringify(prod.variants, null, 2));
                }
            }
        } else {
            console.log('No active flash sales');
        }
    } catch(e) {
        console.error(e);
    }
}
test();
