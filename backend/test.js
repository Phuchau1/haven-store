fetch('http://localhost:5000/api/stock-receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        type: 'EXPORT',
        warehouse_id: 'wh-hcm',
        reason: 'Test',
        status: 'COMPLETED',
        user_id: 'admin',
        items: [{ variant_id: 'QUAN-JEAN-03-NÂU-29-GY6Y', quantity: 1, price: 690000 }]
    })
}).then(res => res.json()).then(console.log).catch(console.error);
