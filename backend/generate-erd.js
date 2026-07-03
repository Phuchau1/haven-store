const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'models');
const files = fs.readdirSync(dir);
let dbml = '// FULL ERD FOR FASHION STORE\n\n';

files.forEach(f => {
  if(!f.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const tableName = f.replace('.js', '');
  dbml += 'Table ' + tableName + ' {\n';
  dbml += '  _id ObjectId [primary key]\n';
  
  const lines = content.split('\n');
  let inSchema = false;
  let bracketCount = 0;
  
  for(let i=0; i<lines.length; i++) {
    const line = lines[i];
    if(line.match(/new\s+Schema\s*\(/)) {
       inSchema = true;
       bracketCount = 1;
       continue;
    }
    if(inSchema) {
       if(line.includes('{')) bracketCount += (line.match(/\{/g) || []).length;
       if(line.includes('}')) bracketCount -= (line.match(/\}/g) || []).length;
       
       if(bracketCount <= 0) {
          inSchema = false;
          continue;
       }
       
       const propMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\{/);
       if(propMatch) {
          const propName = propMatch[1];
          let type = 'varchar';
          if(line.includes('Number')) type = 'number';
          else if(line.includes('Boolean')) type = 'boolean';
          else if(line.includes('Date')) type = 'timestamp';
          else if(line.includes('Array') || line.includes('[{')) type = 'array';
          else if(line.includes('Object')) type = 'json';
          
          dbml += '  ' + propName + ' ' + type + '\n';
       } else if (line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\[\s*\{/)) {
          dbml += '  ' + line.match(/^\s*([a-zA-Z0-9_]+)/)[1] + ' array\n';
       } else if (line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*String/)) {
          dbml += '  ' + line.match(/^\s*([a-zA-Z0-9_]+)/)[1] + ' varchar\n';
       }
    }
  }
  dbml += '}\n\n';
});

dbml += 'Ref: Product.category_id > Category._id\n';
dbml += 'Ref: OrderItem.product_id > Product._id\n';
dbml += 'Ref: OrderItem.order_id > Order._id\n';
dbml += 'Ref: Review.productId > Product._id\n';
dbml += 'Ref: Review.userEmail > User.email\n';
dbml += 'Ref: Cart.userId > User._id\n';
dbml += 'Ref: CartItem.cart_id > Cart._id\n';
dbml += 'Ref: CartItem.product_id > Product._id\n';
dbml += 'Ref: ProductVariant.productId > Product._id\n';
dbml += 'Ref: Wishlist.userId > User._id\n';
dbml += 'Ref: Wishlist.productId > Product._id\n';
dbml += 'Ref: StockTransaction.productId > Product._id\n';
dbml += 'Ref: PurchaseOrder.supplierId > Supplier._id\n';
dbml += 'Ref: StockReceipt.poId > PurchaseOrder._id\n';
dbml += 'Ref: OrderStatusHistory.orderId > Order._id\n';
dbml += 'Ref: ProductReview.productId > Product._id\n';
dbml += 'Ref: UserVoucher.userId > User._id\n';
dbml += 'Ref: ChatMessage.sessionId > ChatSession._id\n';

fs.writeFileSync(path.join(__dirname, 'erd_full.dbml'), dbml);
console.log('DONE');
