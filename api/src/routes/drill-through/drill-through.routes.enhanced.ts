import csurf from 'csurf';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Pool } from 'pg';
import { z } from 'zod';

import { generateExcel } from './utils/generateExcel';
import { generatePDF } from './utils/generatePDF';
import { buildDrillThroughQuery } from './utils/queryBuilder';
import { validateEntityType, validateFilters, validateFormat } from './validators';



const router = express.Router();

router.use(helmet());
router.use(express.json());
router.use(csurf());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

router.get('/:entityType', async (req: Request, res: Response) => {
  try {
    const entityTypeSchema = z.string();
    const entityType = entityTypeSchema.parse(req.params.entityType);
    validateEntityType(entityType);

    const { page = '1', pageSize = '50', filters = '{}' } = req.query;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    const filtersSchema = z.object({}).passthrough();
    const parsedFilters = validateFilters(filtersSchema, filters);

    const { query, countQuery, params, summary } = buildDrillThroughQuery(
      entityType,
      parsedFilters,
      pageSizeNum,
      offset
    );

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / pageSizeNum);

    const dataResult = await pool.query(query, params);

    let summaryData = null;
    if (summary) {
      const summaryResult = await pool.query(summary.query, summary.params);
      summaryData = summaryResult.rows[0];
    }

    res.json({
      totalCount,
      data: dataResult.rows,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      summary: summaryData,
    });
  } catch (error) {
    console.error('Drill-through error:', error);
    res.status(500).json({ error: 'Failed to fetch drill-through data' });
  }
});

router.get('/:entityType/export', async (req: Request, res: Response) => {
  try {
    const entityType = validateEntityType(req.params.entityType);
    const { filters = '{}', format = 'csv' } = req.query;

    const parsedFilters = validateFilters(z.object({}).passthrough(), filters);

    const { query, params } = buildDrillThroughQuery(
      entityType,
      parsedFilters,
      1000000,
      0
    );

    const exportQuery = query.replace(/LIMIT \$\d+ OFFSET \$\d+/, '');
    const result = await pool.query(exportQuery, params.slice(0, -2));

    const filename = `${entityType}_export_${new Date().toISOString().split('T')[0]}`;

    validateFormat(format);

    switch (format) {
      case 'xlsx':
        const workbook = await generateExcel(result.rows);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
        break;
      case 'pdf':
        const pdfDoc = await generatePDF(result.rows);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
        const pdfBytes = await pdfDoc.save();
        res.send(pdfBytes);
        break;
      default:
        res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;