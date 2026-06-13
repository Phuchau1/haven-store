const fs = require('fs');
async function test() {
    try {
        const pRes = await fetch('http://localhost:5000/api/products');
        const pData = await pRes.json();
        
        const fsRes = await fetch('http://localhost:5000/api/flash-sales/active');
        const fsData = await fsRes.json();

        let out = '';
        if (fsData.data && fsData.data.products) {
            for (let fsProd of fsData.data.products) {
                const prod = pData.products.find(p => p.id === fsProd.productId);
                if (prod) {
                    out += '--- PRODUCT ---\n';
                    out += 'ID: ' + prod.id + ' ' + prod.name + '\n';
                    out += 'Normal Variants: ' + JSON.stringify(prod.variants, null, 2) + '\n';
                    out += 'FS Variants: ' + JSON.stringify(fsProd.variants, null, 2) + '\n';
                    out += 'FS Stock: ' + fsProd.stockQuantity + '\n';
                }
            }
        }
        fs.writeFileSync('e:\\BANWEB\\fashion-store\\backend\\test_out.txt', out);
    } catch(e) {
        fs.writeFileSync('e:\\BANWEB\\fashion-store\\backend\\test_out.txt', e.message);
    }
}
test();
