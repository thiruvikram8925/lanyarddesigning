/**
 * LANYARD-301: Template controller.
 * Extracted from server/index.js GET /api/templates handler.
 */
import { query } from '../db.js';
import logger from '../utils/logger.js';

export async function getTemplates(req, res, next) {
  try {
    const page        = Math.max(1, parseInt(req.query.page)  || 1);
    const limit       = Math.min(100, parseInt(req.query.limit) || 20);
    const orientation = req.query.orientation;
    const category    = req.query.category;
    const search      = req.query.search;
    const offset      = (page - 1) * limit;

    let queryStr   = 'SELECT * FROM templates';
    const conditions = [];
    const params     = [];

    if (orientation && orientation !== 'all') {
      conditions.push('orientation = ?');
      params.push(orientation);
    }
    if (category && category.toLowerCase() !== 'all') {
      conditions.push('LOWER(category) = ?');
      params.push(category.toLowerCase());
    }
    if (search) {
      conditions.push('LOWER(name) LIKE ?');
      params.push(`%${search.toLowerCase()}%`);
    }
    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }
    queryStr += ' ORDER BY id ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await query(queryStr, params);

    const templates = result.rows.map((row) => ({
      ...row,
      front: {
        backgroundColor: '#ffffff',
        elements: typeof row.front_elements === 'string'
          ? JSON.parse(row.front_elements)
          : (row.front_elements ?? []),
      },
      back: {
        backgroundColor: '#ffffff',
        elements: typeof row.back_elements === 'string'
          ? JSON.parse(row.back_elements)
          : (row.back_elements ?? []),
      },
      preview: row.preview_gradient,
    }));

    logger.info('Templates fetched', { count: templates.length, page });
    res.json({ templates, page, limit });
  } catch (err) {
    next(err);
  }
}
