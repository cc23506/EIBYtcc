const db = require('../../config/db');

async function findUserByUsername(username) {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

async function findProduct() {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM products');
  return rows;
}

async function findProductById(productId) {
  const pool = await db.connect();
  const [rows] = await pool.execute(`
    SELECT *FROM products WHERE id = ?`, [productId]
  );
  return rows[0];
}

async function insertProduct(name, description) {
  const pool = await db.connect();
  const [result] = await pool.execute(
    'INSERT INTO products (name, description) VALUES (?, ?)', [name, description]
  );
  return result;
}

async function insertProductZone(productId, zoneId) {
  const pool = await db.connect();

  await pool.execute('INSERT INTO product_zone (product_id, zone_id) VALUES (?, ?)', [productId, zoneId]);
}

async function alterProduct(productId, newName, newDescription) {
  const pool = await db.connect();

  const [result] = await pool.execute(
    'UPDATE products SET name = ?, description = ? WHERE id = ?',
    [newName, newDescription, productId]
  );
  return result;
}

async function deleteProduct(productId) {
  const pool = await db.connect();
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [productId]);
  return result;
}

async function deleteProductZones(productId) {
  const pool = await db.connect();
  await pool.execute('DELETE FROM product_zone WHERE product_id = ?', [productId]);
}

async function deleteZoneProduct(productId) {
  const pool = await db.connect();
  const [result] = await pool.execute('DELETE FROM product_zone WHERE product_id = ?', [productId]);
  return result;
}

async function findZone() {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM zones');
  return rows;
}

async function findZoneById(zoneId) {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM zones WHERE id = ?', [zoneId]);
  return rows[0];
}

async function findZoneByPath() {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM zone_image WHERE id = ?', [zone.image_id]);
  return rows[0];
}

async function findZoneByPathId(imageId) {
  const pool = await db.connect();
  const [rows] = await pool.execute('SELECT * FROM zones WHERE image_id = ?', [imageId]);
  return rows;
}


async function findLatestImage() {
  const pool = await db.connect();
  const [rows] = await pool.execute(`
    SELECT * FROM zone_image
    ORDER BY uploadedAt DESC
    LIMIT 1
  `);
  return rows.length ? rows[0] : null;
}

async function findLatestImageByUser(userId) {
  const pool = await db.connect();
  const query = `
    SELECT *
    FROM zone_image
    WHERE user_id = ?
    ORDER BY uploadedAt DESC
    LIMIT 1`;
  const [rows] = await pool.execute(query, [userId]);
  return rows[0];  // Retorna a última imagem carregada por esse usuário
}

async function findZoneByProduct(productId) {
  const pool = await db.connect();
  const [productZone] = await pool.execute('SELECT zone_id FROM product_zone WHERE product_id = ?', [productId]);
  
  if (productZone.length === 0) {
    return null;
  }

  const zoneId = productZone[0].zone_id
  const [zone] = await pool.execute('SELECT * FROM zones WHERE id = ?', [zoneId]);

  return zone[0] || null;
}

async function insertZoneImage(imagePath, userId){
  const pool = await db.connect();
  const query = 'INSERT INTO zone_image (imagePath, user_id) VALUES (?, ?)';
  const [result] = await pool.execute(query, [imagePath, userId]);
  return result;
};

async function insertZone(zoneData){
  const pool = await db.connect();
  const query = 'INSERT INTO zones (name, x1, x2, y1, y2, image_id) VALUES (?, ?, ?, ?, ?, ?)';
  await pool.execute(query, [zoneData.name, zoneData.x1, zoneData.x2, zoneData.y1, zoneData.y2, zoneData.image_id]);
};

async function alterZone(zoneData){
  const pool = await db.connect();
  const query = 'UPDATE zones SET name = ?, x1 = ?, x2 = ?, y1 = ?, y2 = ?, image_id = ? WHERE id = ?';
  await pool.execute(query, [zoneData.name, zoneData.x1, zoneData.x2, zoneData.y1, zoneData.y2, zoneData.image_id, zoneData.id]);
};


async function deleteZone(zoneId) {
  const pool = await db.connect();
  const [result] = await pool.execute('DELETE FROM zones WHERE id = ?', [zoneId]);
  return result;
}

async function deleteZonesByImageId(imageId) {
  const pool = await db.connect();
  const [result] = await pool.execute('DELETE FROM zones WHERE image_id = ?', [imageId]);
  return result;
}

async function deleteUserZonesAndImage(userId) {
  const pool = await db.connect();
  const deleteZonesQuery = `
    DELETE zones FROM zones
    INNER JOIN zone_image ON zones.image_id = zone_image.id
    WHERE zone_image.user_id = ?;
  `;
  await pool.execute(deleteZonesQuery, [userId]);

  const deleteImageQuery = 'DELETE FROM zone_image WHERE user_id = ?';
  await pool.execute(deleteImageQuery, [userId]);
}

async function findImageByZoneId(zoneId) {
  const pool = await db.connect();

  const query = `
    SELECT zi.*
    FROM zone_image zi
    INNER JOIN zones z ON z.image_id = zi.id
    WHERE z.id = ?`;

  const [rows] = await pool.execute(query, [zoneId]);
  
  return rows.length ? rows[0] : null;  // Retorna a imagem se encontrada, ou null se não houver
}


module.exports = {
  findImageByZoneId,
  findUserByUsername,
  findProduct,
  findProductById,
  insertProduct,
  insertProductZone,
  deleteProduct,
  deleteProductZones,
  deleteZoneProduct,
  alterProduct,
  findZone,
  findZoneById,
  findZoneByPath,
  findZoneByPathId,
  findZoneByProduct,
  findLatestImage,
  findLatestImageByUser,
  insertZone,
  insertZoneImage,
  alterZone,
  deleteZone,
  deleteZonesByImageId,
  deleteUserZonesAndImage,
};