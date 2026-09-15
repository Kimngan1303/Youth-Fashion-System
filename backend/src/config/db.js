import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'youthfashion_db',
  DB_PORT = 3306,
} = process.env;

let pool = null;

/**
 * Khởi tạo kết nối MySQL, tự động tạo CSDL và 13 bảng theo đúng ERD nếu chưa có
 */
export async function initDatabase() {
  try {
    console.log(`⏳ Đang kết nối tới MySQL Server tại ${DB_HOST}:${DB_PORT} với user "${DB_USER}"...`);

    // 1. Tạo Database nếu chưa tồn tại
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: Number(DB_PORT),
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    console.log(`✅ Cơ sở dữ liệu "${DB_NAME}" đã sẵn sàng.`);

    // 2. Tạo connection pool kết nối trực tiếp vào DB_NAME
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: Number(DB_PORT),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // 3. Khởi tạo 13 bảng theo sơ đồ ERD
    await createERDTables();

    // 4. Khởi tạo dữ liệu mẫu
    await seedERDData();

    console.log('🎉 Khởi tạo cơ sở dữ liệu MySQL theo chuẩn ERD hoàn tất!');
    return pool;
  } catch (error) {
    console.error('❌ Lỗi kết nối hoặc khởi tạo MySQL:', error.message);
    console.error('👉 Vui lòng đảm bảo MySQL Service (XAMPP / Laragon / Docker) đang chạy và thông số trong .env là chính xác.');
    throw error;
  }
}

/**
 * Tạo 13 bảng theo đúng chuẩn ERD được cung cấp
 */
async function createERDTables() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. ROLE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ROLE (
        role_id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. USER
    await connection.query(`
      CREATE TABLE IF NOT EXISTS USER (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NULL,
        last_name VARCHAR(50) NULL,
        phone VARCHAR(20) NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES ROLE(role_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. CATEGORY
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CATEGORY (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        status VARCHAR(20) DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. BRAND
    await connection.query(`
      CREATE TABLE IF NOT EXISTS BRAND (
        brand_id INT AUTO_INCREMENT PRIMARY KEY,
        brand_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NULL,
        status VARCHAR(20) DEFAULT 'active'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. PRODUCT
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PRODUCT (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        brand_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        base_price DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id) ON DELETE RESTRICT,
        CONSTRAINT fk_product_brand FOREIGN KEY (brand_id) REFERENCES BRAND(brand_id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. PRODUCT_IMAGE
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PRODUCT_IMAGE (
        image_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. PRODUCT_VARIANT
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PRODUCT_VARIANT (
        variant_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        sku VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(50) NOT NULL,
        size VARCHAR(20) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. CART
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CART (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. CART_ITEM
    await connection.query(`
      CREATE TABLE IF NOT EXISTS CART_ITEM (
        cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        variant_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES CART(cart_id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_item_variant FOREIGN KEY (variant_id) REFERENCES PRODUCT_VARIANT(variant_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. ORDERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ORDERS (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        order_code VARCHAR(50) NOT NULL UNIQUE,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(191) NOT NULL,
        shipping_address TEXT NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        order_status VARCHAR(50) DEFAULT 'PENDING',
        payment_deadline DATETIME NULL,
        paid_at DATETIME NULL,
        cancelled_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. ORDER_ITEM
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ORDER_ITEM (
        order_item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        variant_id INT NULL,
        product_name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NULL,
        size VARCHAR(20) NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL,
        CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE,
        CONSTRAINT fk_order_item_variant FOREIGN KEY (variant_id) REFERENCES PRODUCT_VARIANT(variant_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. PAYMENT
    await connection.query(`
      CREATE TABLE IF NOT EXISTS PAYMENT (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_code VARCHAR(100) NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'PENDING',
        paid_at DATETIME NULL,
        expired_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. AI_SEARCH_CONFIG
    await connection.query(`
      CREATE TABLE IF NOT EXISTS AI_SEARCH_CONFIG (
        config_id INT AUTO_INCREMENT PRIMARY KEY,
        is_enabled BOOLEAN DEFAULT TRUE,
        top_k INT DEFAULT 10,
        similarity_threshold DECIMAL(5, 4) DEFAULT 0.7000,
        image_weight DECIMAL(4, 2) DEFAULT 0.60,
        text_weight DECIMAL(4, 2) DEFAULT 0.40,
        updated_by INT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ai_config_user FOREIGN KEY (updated_by) REFERENCES USER(user_id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Đã tạo đủ 13 bảng theo đúng sơ đồ ERD!');
  } finally {
    connection.release();
  }
}

/**
 * Seed dữ liệu ban đầu cho các bảng ROLE, USER, BRAND, CATEGORY, PRODUCT, VARIANT, AI_SEARCH_CONFIG
 */
async function seedERDData() {
  const connection = await pool.getConnection();
  try {
    // 1. Seed Roles
    const [roleRows] = await connection.query('SELECT COUNT(*) as count FROM ROLE');
    if (roleRows[0].count === 0) {
      console.log('🌱 Đang tạo các Role (Admin, Manager, Customer, Guest)...');
      await connection.query(`
        INSERT INTO ROLE (role_id, role_name) VALUES
        (1, 'Admin'),
        (2, 'Manager'),
        (3, 'Customer'),
        (4, 'Guest');
      `);
    }

    // 2. Seed Brands
    const [brandRows] = await connection.query('SELECT COUNT(*) as count FROM BRAND');
    if (brandRows[0].count === 0) {
      console.log('🌱 Đang tạo các thương hiệu (Brand)...');
      await connection.query(`
        INSERT INTO BRAND (brand_id, brand_name, description, status) VALUES
        (1, 'Youth Streetwear', 'Thương hiệu thời trang đường phố trẻ trung, đột phá', 'active'),
        (2, 'Urban Minimalist', 'Phong cách tối giản, tinh tế cho giới trẻ hiện đại', 'active'),
        (3, 'Y2K Cyber Club', 'Xu hướng thời trang tương lai cyberpunk và Y2K', 'active');
      `);
    }

    // 3. Seed Categories
    const [catRows] = await connection.query('SELECT COUNT(*) as count FROM CATEGORY');
    if (catRows[0].count === 0) {
      console.log('🌱 Đang tạo các Category...');
      await connection.query(`
        INSERT INTO CATEGORY (category_id, category_name, description, status) VALUES
        (1, 'Áo Thun & Polo', 'Áo thun cotton unisex form rộng, thoáng mát', 'active'),
        (2, 'Áo Khoác & Hoodie', 'Hoodie nỉ bông, jacket dạ, bomber varsity', 'active'),
        (3, 'Quần Jeans & Cargo', 'Quần ống suông rộng wide-leg, quần túi hộp streetwear', 'active'),
        (4, 'Chân Váy & Đầm', 'Chân váy tennis, đầm phong cách năng động', 'active'),
        (5, 'Phụ Kiện Thời Trang', 'Túi tote, mũ lưỡi trai, thắt lưng, balo', 'active');
      `);
    }

    // 4. Seed Users
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM USER');
    if (userRows[0].count === 0) {
      console.log('🌱 Đang tạo các tài khoản mẫu (Admin, Manager, Customer)...');
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash('123456', salt);

      await connection.query(`
        INSERT INTO USER (user_id, role_id, username, email, password_hash, first_name, last_name, phone, status) VALUES
        (1, 1, 'admin', 'admin@youthfashion.vn', ?, 'Quản Trị', 'Hệ Thống', '0987654321', 'active'),
        (2, 2, 'manager', 'manager@youthfashion.vn', ?, 'Quản Lý', 'Cửa Hàng', '0987654322', 'active'),
        (3, 3, 'customer1', 'customer@gmail.com', ?, 'Văn Khách', 'Nguyễn', '0912345678', 'active');
      `, [hashPassword, hashPassword, hashPassword]);

      // Seed cart cho customer
      await connection.query(`INSERT INTO CART (user_id) VALUES (3);`);
    }

    // 5. Seed Products & Variants & Images
    const [prodRows] = await connection.query('SELECT COUNT(*) as count FROM PRODUCT');
    if (prodRows[0].count === 0) {
      console.log('🌱 Đang tạo sản phẩm, biến thể (Variants) và hình ảnh mẫu...');

      const sampleData = [
        {
          name: 'Áo Thun Oversize Streetwear Graphic "CYBERPUNK"',
          catId: 1,
          brandId: 1,
          price: 280000,
          desc: 'Áo thun form rộng unisex chất liệu cotton 100% 250gsm, in họa tiết cyberpunk tương lai sắc nét.',
          imgPrimary: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'TS-CYBER-BLK-M', color: 'Đen', size: 'M', price: 280000, stock: 30 },
            { sku: 'TS-CYBER-BLK-L', color: 'Đen', size: 'L', price: 280000, stock: 25 },
            { sku: 'TS-CYBER-WHT-M', color: 'Trắng', size: 'M', price: 280000, stock: 20 },
            { sku: 'TS-CYBER-WHT-L', color: 'Trắng', size: 'L', price: 280000, stock: 15 }
          ]
        },
        {
          name: 'Áo Khoác Varsity Jacket Phối Tay Da Bóng Chày',
          catId: 2,
          brandId: 1,
          price: 590000,
          desc: 'Áo khoác bóng chày học đường Mỹ, thân dạ lót chần bông mỏng, tay phối da PU cao cấp chống nước.',
          imgPrimary: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'JK-VARSITY-NAVY-M', color: 'Xanh Navy', size: 'M', price: 590000, stock: 15 },
            { sku: 'JK-VARSITY-NAVY-L', color: 'Xanh Navy', size: 'L', price: 590000, stock: 20 },
            { sku: 'JK-VARSITY-BLK-L', color: 'Đen Phối Trắng', size: 'L', price: 590000, stock: 18 }
          ]
        },
        {
          name: 'Áo Hoodie Boxy Nỉ Bông Dày Dặn Unisex',
          catId: 2,
          brandId: 2,
          price: 420000,
          desc: 'Áo hoodie form boxy thời thượng, nỉ chân cua cào bông mịn định lượng 380gsm siêu ấm.',
          imgPrimary: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'HD-BOXY-GRY-M', color: 'Xám Tiêu', size: 'M', price: 420000, stock: 25 },
            { sku: 'HD-BOXY-GRY-L', color: 'Xám Tiêu', size: 'L', price: 420000, stock: 30 },
            { sku: 'HD-BOXY-BLK-L', color: 'Đen', size: 'L', price: 420000, stock: 25 }
          ]
        },
        {
          name: 'Quần Jean Ống Rộng Wide-Leg Rách Gối Y2K',
          catId: 3,
          brandId: 3,
          price: 450000,
          desc: 'Quần denim wash vintage rách gối nhẹ, cạp cao tôn dáng, ống suông rộng chuẩn phong cách Y2K.',
          imgPrimary: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'PNT-JEAN-BLU-29', color: 'Xanh Wash', size: '29', price: 450000, stock: 20 },
            { sku: 'PNT-JEAN-BLU-30', color: 'Xanh Wash', size: '30', price: 450000, stock: 25 },
            { sku: 'PNT-JEAN-BLU-31', color: 'Xanh Wash', size: '31', price: 450000, stock: 15 }
          ]
        },
        {
          name: 'Quần Kaki Túi Hộp Cargo Pants Dây Rút',
          catId: 3,
          brandId: 1,
          price: 390000,
          desc: 'Quần túi hộp Techwear, vải kaki dày dặn chống nhăn, có dây rút tùy chỉnh ống suông hoặc túm bo gấu.',
          imgPrimary: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'PNT-CARGO-BLK-M', color: 'Đen', size: 'M', price: 390000, stock: 20 },
            { sku: 'PNT-CARGO-BLK-L', color: 'Đen', size: 'L', price: 390000, stock: 25 },
            { sku: 'PNT-CARGO-GRN-L', color: 'Xanh Rêu Lính', size: 'L', price: 390000, stock: 15 }
          ]
        },
        {
          name: 'Chân Váy Xếp Ly Tennis Skirt Kèm Quần Bảo Hộ',
          catId: 4,
          brandId: 2,
          price: 240000,
          desc: 'Chân váy chữ A xếp ly dáng xòe trẻ trung, chất tuyết mưa cao cấp kèm quần bảo hộ kín đáo bên trong.',
          imgPrimary: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'SKT-TENNIS-WHT-S', color: 'Trắng', size: 'S', price: 240000, stock: 30 },
            { sku: 'SKT-TENNIS-WHT-M', color: 'Trắng', size: 'M', price: 240000, stock: 30 },
            { sku: 'SKT-TENNIS-BLK-M', color: 'Đen', size: 'M', price: 240000, stock: 25 }
          ]
        },
        {
          name: 'Túi Đeo Chéo Canvas Mini Crossbody Bag',
          catId: 5,
          brandId: 1,
          price: 180000,
          desc: 'Túi đeo chéo canvas mini phong cách Harajuku Nhật Bản, nhiều ngăn tiện lợi cho điện thoại và ví.',
          imgPrimary: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
          imgSecondary: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          variants: [
            { sku: 'ACC-BAG-BLK-F', color: 'Đen', size: 'Freesize', price: 180000, stock: 40 },
            { sku: 'ACC-BAG-CRM-F', color: 'Kem Be', size: 'Freesize', price: 180000, stock: 35 }
          ]
        }
      ];

      for (const item of sampleData) {
        const [prodResult] = await connection.query(`
          INSERT INTO PRODUCT (category_id, brand_id, product_name, description, base_price, status)
          VALUES (?, ?, ?, ?, ?, 'active')
        `, [item.catId, item.brandId, item.name, item.desc, item.price]);

        const newProductId = prodResult.insertId;

        // Lưu ảnh chính & ảnh phụ vào PRODUCT_IMAGE
        await connection.query(`
          INSERT INTO PRODUCT_IMAGE (product_id, image_url, is_primary) VALUES
          (?, ?, 1),
          (?, ?, 0);
        `, [newProductId, item.imgPrimary, newProductId, item.imgSecondary]);

        // Lưu các biến thể vào PRODUCT_VARIANT
        for (const v of item.variants) {
          await connection.query(`
            INSERT INTO PRODUCT_VARIANT (product_id, sku, color, size, price, stock_quantity, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active');
          `, [newProductId, v.sku, v.color, v.size, v.price, v.stock]);
        }
      }
    }

    // 6. Seed AI Search Config
    const [aiRows] = await connection.query('SELECT COUNT(*) as count FROM AI_SEARCH_CONFIG');
    if (aiRows[0].count === 0) {
      console.log('🌱 Đang cấu hình thông số mặc định cho AI Search Config...');
      await connection.query(`
        INSERT INTO AI_SEARCH_CONFIG (config_id, is_enabled, top_k, similarity_threshold, image_weight, text_weight, updated_by)
        VALUES (1, 1, 10, 0.7000, 0.60, 0.40, 1);
      `);
    }

  } finally {
    connection.release();
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool chưa được khởi tạo. Hãy gọi initDatabase() trước.');
  }
  return pool;
}

export default {
  initDatabase,
  getPool,
};
