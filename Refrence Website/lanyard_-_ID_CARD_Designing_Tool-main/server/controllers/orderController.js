/**
 * LANYARD-301: Order and upload controllers.
 * Extracted from server/index.js POST /api/uploads and POST /api/design-requests handlers.
 */
import { v2 as cloudinary } from 'cloudinary';
import { query } from '../db.js';
import logger from '../utils/logger.js';

// POST /api/uploads
export async function uploadFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: true, message: 'No file received.' });
  }
  try {
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'lanyard-configurator',
        resource_type: 'auto',
      });
      logger.info('File uploaded to Cloudinary', { url: result.secure_url });
      return res.json({ url: result.secure_url, provider: 'cloudinary' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    logger.info('File saved locally', { url });
    return res.json({ url, provider: 'local' });
  } catch (err) {
    next(err);
  }
}

// POST /api/design-requests
export async function createDesignRequest(req, res, next) {
  const { design, order } = req.body || {};

  if (!design || !order) {
    return res.status(400).json({ error: true, message: 'Missing design or order payload.' });
  }

  // Validate required order fields
  const qty   = Number(order.quantity);
  const price = Number(order.pricePerUnit);
  const total = Number(order.totalPriceInInr);

  if (!qty || qty < 1 || !price || !total) {
    return res.status(400).json({ error: true, message: 'Invalid order fields: quantity, pricePerUnit and totalPriceInInr are required.' });
  }

  const designPayload = {
    textContent:  design.customText    || '',
    fontFamily:   design.fontFamily    || 'Montserrat',
    fontColor:    design.fontColor     || '#ffffff',
    logoUrl:      design.logoUrl       || '',
    lanyardColor: design.lanyardColor  || '#2563eb',
    width:        design.width         || '20mm',
    clipType:     design.clipType      || 'Metal Hook',
    accessories:  design.accessories   || [],
    idCardData:   design.idCard        || {},
    previewImage: design.previewImage  || '',
  };

  try {
    let designId = Date.now();
    let orderId  = designId + 1;

    if (process.env.DATABASE_URL) {
      const designResult = await query(
        `INSERT INTO designs
          (text_content, font_family, font_color, logo_url, lanyard_color, width, clip_type, accessories, id_card_data, preview_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          designPayload.textContent,
          designPayload.fontFamily,
          designPayload.fontColor,
          designPayload.logoUrl,
          designPayload.lanyardColor,
          designPayload.width,
          designPayload.clipType,
          JSON.stringify(designPayload.accessories),
          JSON.stringify(designPayload.idCardData),
          designPayload.previewImage,
        ],
      );
      designId = designResult.rows[0].id;

      const orderResult = await query(
        `INSERT INTO orders
          (design_id, quantity, price_per_unit, total_price_in_inr, order_status)
         VALUES (?, ?, ?, ?, ?)`,
        [designId, qty, price, total, 'new'],
      );
      orderId = orderResult.rows[0].id;
      logger.info('Design request saved to DB', { designId, orderId });
    } else {
      logger.warn('DB not configured — design request handled in mock mode');
    }

    return res.status(201).json({
      designId,
      orderId,
      pricePerUnit:    price,
      totalPriceInInr: total,
      message: process.env.DATABASE_URL
        ? 'Design and order saved.'
        : 'Preview request received in mock mode.',
    });
  } catch (err) {
    next(err);
  }
}
