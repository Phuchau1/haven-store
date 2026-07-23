CREATE TABLE Address (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  user_id VARCHAR,
  full_name VARCHAR,
  phone VARCHAR,
  city VARCHAR,
  district VARCHAR,
  ward VARCHAR,
  street VARCHAR,
  is_default BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE AISetting (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE Article (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE AuditLog (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  user_id VARCHAR,
  action VARCHAR,
  entity_type VARCHAR,
  entity_id VARCHAR,
  old_values VARCHAR,
  new_values VARCHAR,
  ip_address VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE Banner (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  title VARCHAR,
  image VARCHAR,
  video VARCHAR,
  link VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE Cart (
  _id VARCHAR PRIMARY KEY,
  variant_id VARCHAR,
  quantity INT,
  price INT,
  id VARCHAR,
  user_id VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE Category (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  slug VARCHAR,
  description VARCHAR,
  image VARCHAR,
  order INT,
  isActive BOOLEAN,
  id VARCHAR,
  name VARCHAR,
  description VARCHAR,
  image VARCHAR,
  video VARCHAR,
  count INT,
  order INT,
  isActive BOOLEAN,
  subcategories VARCHAR
);

CREATE TABLE ChatMessage (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  session_id VARCHAR,
  sender_type VARCHAR,
  message VARCHAR
);

CREATE TABLE ChatSession (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  customer_name VARCHAR,
  phone VARCHAR,
  userId VARCHAR,
  status VARCHAR
);

CREATE TABLE Color (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  code VARCHAR
);

CREATE TABLE Coupon (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  code VARCHAR,
  discount_type VARCHAR,
  discount_value INT,
  start_date VARCHAR,
  end_date VARCHAR,
  usage_limit INT,
  usage_limit_per_user INT
);

CREATE TABLE FlashSale (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE InventoryHistory (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  variant_id VARCHAR,
  type VARCHAR,
  quantity INT,
  note VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE LuckyWheelConfig (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE Menu (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  title VARCHAR,
  link VARCHAR,
  order INT,
  isActive BOOLEAN,
  children VARCHAR
);

CREATE TABLE Order (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  price INT,
  originalPrice INT,
  category VARCHAR,
  categoryLabel VARCHAR,
  images ARRAY,
  sizes ARRAY,
  colors ARRAY,
  name VARCHAR,
  hex VARCHAR,
  description VARCHAR,
  badge VARCHAR,
  rating INT,
  reviews INT,
  inStock BOOLEAN,
  product VARCHAR,
  quantity INT,
  selectedSize VARCHAR,
  selectedColor VARCHAR,
  name VARCHAR,
  hex VARCHAR,
  id VARCHAR,
  customerName VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  address VARCHAR,
  paymentMethod VARCHAR,
  totalAmount INT,
  couponCode VARCHAR,
  discountAmount INT,
  finalAmount INT,
  note VARCHAR,
  transferReceipt VARCHAR,
  shippingProvider VARCHAR,
  status VARCHAR,
  type VARCHAR,
  createdAt VARCHAR
);

CREATE TABLE OrderStatusHistory (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  order_id VARCHAR,
  status VARCHAR,
  note VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE PaymentMethod (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name_methond VARCHAR,
  description VARCHAR,
  bank_info VARCHAR,
  qr_code_url VARCHAR,
  is_active BOOLEAN
);

CREATE TABLE Product (
  _id VARCHAR PRIMARY KEY,
  name VARCHAR,
  hex VARCHAR,
  image VARCHAR,
  color VARCHAR,
  size VARCHAR,
  stock INT,
  price INT,
  originalPrice INT,
  id VARCHAR,
  name VARCHAR,
  price INT,
  originalPrice INT,
  category VARCHAR,
  categoryLabel VARCHAR,
  category_id JSON,
  subCategory VARCHAR,
  subCategoryLabel VARCHAR,
  images ARRAY,
  sizes ARRAY,
  description VARCHAR,
  content VARCHAR,
  shortDescription VARCHAR,
  richContent VARCHAR,
  specifications JSON,
  sizeGuide ARRAY,
  careInstructions ARRAY,
  features ARRAY,
  tags ARRAY,
  seo JSON,
  faqs ARRAY,
  question VARCHAR,
  answer VARCHAR,
  certificates ARRAY,
  fabric ARRAY,
  status VARCHAR,
  publishAt TIMESTAMP,
  videos ARRAY,
  instructions ARRAY,
  notes ARRAY,
  sizeChartImage VARCHAR,
  badge VARCHAR,
  rating INT,
  reviews INT,
  inStock BOOLEAN,
  soldQuantity INT
);

CREATE TABLE ProductReview (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  user_id VARCHAR,
  userName VARCHAR,
  userEmail VARCHAR,
  product_id VARCHAR,
  rating INT,
  content VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE ProductVariant (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  product_id VARCHAR,
  size_id VARCHAR,
  color_id VARCHAR,
  stock INT,
  reserved_stock INT,
  warehouse_stocks ARRAY,
  warehouse_id VARCHAR,
  stock INT,
  barcode VARCHAR,
  qr_code VARCHAR,
  image VARCHAR,
  price INT,
  sku VARCHAR,
  status VARCHAR
);

CREATE TABLE PurchaseOrder (
  _id VARCHAR PRIMARY KEY,
  variant_id VARCHAR,
  quantity INT,
  price INT,
  id VARCHAR,
  supplier_id VARCHAR,
  warehouse_id VARCHAR,
  status VARCHAR,
  user_id VARCHAR,
  expected_date VARCHAR,
  total_amount INT,
  note VARCHAR
);

CREATE TABLE Review (
  _id VARCHAR PRIMARY KEY,
  productId VARCHAR,
  userId VARCHAR,
  customerName VARCHAR,
  rating INT,
  comment VARCHAR,
  isApproved BOOLEAN
);

CREATE TABLE ShippingMethod (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name_methond VARCHAR,
  description VARCHAR,
  is_active BOOLEAN
);

CREATE TABLE SiteSetting (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE Size (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR
);

CREATE TABLE SpinHistory (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE SpinReward (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE StockReceipt (
  _id VARCHAR PRIMARY KEY,
  variant_id VARCHAR,
  quantity INT,
  price INT,
  id VARCHAR,
  type VARCHAR,
  warehouse_id VARCHAR,
  dest_warehouse_id VARCHAR,
  supplier_id VARCHAR,
  po_id VARCHAR,
  reason VARCHAR,
  note VARCHAR,
  user_id VARCHAR,
  status VARCHAR,
  total_quantity INT,
  total_amount INT
);

CREATE TABLE StockTransaction (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  type VARCHAR,
  reference_id VARCHAR,
  warehouse_id VARCHAR,
  variant_id VARCHAR,
  quantity INT,
  before_stock INT,
  after_stock INT,
  note VARCHAR,
  user_id VARCHAR
);

CREATE TABLE Supplier (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address VARCHAR,
  tax_code VARCHAR,
  status VARCHAR
);

CREATE TABLE User (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  email VARCHAR,
  password VARCHAR,
  googleId VARCHAR,
  facebookId VARCHAR,
  avatar VARCHAR,
  role VARCHAR,
  phone VARCHAR,
  address VARCHAR,
  resetPasswordToken VARCHAR,
  resetPasswordExpires TIMESTAMP
);

CREATE TABLE UserCoupon (
  _id VARCHAR PRIMARY KEY
);

CREATE TABLE UserVoucher (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  user_id VARCHAR,
  coupon_id VARCHAR,
  is_use BOOLEAN
);

CREATE TABLE Warehouse (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  name VARCHAR,
  code VARCHAR,
  address VARCHAR,
  manager_id VARCHAR,
  status VARCHAR
);

CREATE TABLE Wishlist (
  _id VARCHAR PRIMARY KEY,
  id VARCHAR,
  user_id VARCHAR,
  product_id VARCHAR,
  created_at TIMESTAMP
);


ALTER TABLE Product ADD FOREIGN KEY (category_id) REFERENCES Category(_id);
ALTER TABLE OrderItem ADD FOREIGN KEY (product_id) REFERENCES Product(_id);
ALTER TABLE OrderItem ADD FOREIGN KEY (order_id) REFERENCES Order(_id);
ALTER TABLE Review ADD FOREIGN KEY (productId) REFERENCES Product(_id);
ALTER TABLE Review ADD FOREIGN KEY (userEmail) REFERENCES User(email);
ALTER TABLE Cart ADD FOREIGN KEY (userId) REFERENCES User(_id);
ALTER TABLE CartItem ADD FOREIGN KEY (cart_id) REFERENCES Cart(_id);
ALTER TABLE CartItem ADD FOREIGN KEY (product_id) REFERENCES Product(_id);
ALTER TABLE ProductVariant ADD FOREIGN KEY (productId) REFERENCES Product(_id);
ALTER TABLE Wishlist ADD FOREIGN KEY (userId) REFERENCES User(_id);
ALTER TABLE Wishlist ADD FOREIGN KEY (productId) REFERENCES Product(_id);
ALTER TABLE StockTransaction ADD FOREIGN KEY (productId) REFERENCES Product(_id);
ALTER TABLE PurchaseOrder ADD FOREIGN KEY (supplierId) REFERENCES Supplier(_id);
ALTER TABLE StockReceipt ADD FOREIGN KEY (poId) REFERENCES PurchaseOrder(_id);
ALTER TABLE OrderStatusHistory ADD FOREIGN KEY (orderId) REFERENCES Order(_id);
ALTER TABLE ProductReview ADD FOREIGN KEY (productId) REFERENCES Product(_id);
ALTER TABLE UserVoucher ADD FOREIGN KEY (userId) REFERENCES User(_id);
ALTER TABLE ChatMessage ADD FOREIGN KEY (sessionId) REFERENCES ChatSession(_id);
