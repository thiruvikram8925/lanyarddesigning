import pg from 'pg';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Migration script - connects to both PostgreSQL and MySQL
// Assumes you have POSTGRES_URL in your .env if migrating from an active postgres instance
const postgresUrl = process.env.POSTGRES_URL || 'postgres://user:pass@localhost:5432/lanyard_db';
const mysqlUrl = process.env.DATABASE_URL;

async function migrate() {
  let pgPool, mysqlPool;
  try {
    console.log('Connecting to PostgreSQL...');
    pgPool = new pg.Pool({ connectionString: postgresUrl });
    await pgPool.query('SELECT 1'); // test connection

    console.log('Connecting to MySQL...');
    mysqlPool = mysql.createPool(mysqlUrl);
    await mysqlPool.query('SELECT 1'); // test connection

    console.log('Fetching designs from PostgreSQL...');
    const designsRes = await pgPool.query('SELECT * FROM designs');
    const designs = designsRes.rows;
    console.log(`Found ${designs.length} designs to migrate.`);

    for (const design of designs) {
      await mysqlPool.query(
        `INSERT INTO designs (id, text_content, font_family, font_color, logo_url, lanyard_color, width, clip_type, accessories, id_card_data, preview_image, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          design.id,
          design.text_content,
          design.font_family,
          design.font_color,
          design.logo_url,
          design.lanyard_color,
          design.width,
          design.clip_type,
          JSON.stringify(design.accessories),
          JSON.stringify(design.id_card_data),
          design.preview_image,
          design.created_at
        ]
      );
    }

    console.log('Fetching orders from PostgreSQL...');
    const ordersRes = await pgPool.query('SELECT * FROM orders');
    const orders = ordersRes.rows;
    console.log(`Found ${orders.length} orders to migrate.`);

    for (const order of orders) {
      await mysqlPool.query(
        `INSERT INTO orders (id, design_id, quantity, price_per_unit, total_price_in_inr, order_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          order.id,
          order.design_id,
          order.quantity,
          order.price_per_unit,
          order.total_price_in_inr,
          order.order_status,
          order.created_at
        ]
      );
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (pgPool) await pgPool.end();
    if (mysqlPool) await mysqlPool.end();
  }
}

migrate();
