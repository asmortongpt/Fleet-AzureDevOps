import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';

/**
 * QRGeneratorService handles the generation of QR codes for assets,
 * embedding both asset ID and tenant ID for secure and efficient identification.
 */
export class QRGeneratorService {
  /**
   * Validates input parameters using Zod schema.
   */
  private static validateInput = z.object({
    assetId: z.string().min(1),
    tenantId: z.string().min(1),
  });

  /**
   * Generates a QR code in SVG format containing the asset ID and tenant ID.
   * @param req Express Request object.
   * @param res Express Response object.
   */
  public static async generateQRCode(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = QRGeneratorService.validateInput.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({ error: 'Invalid input parameters.' });
        return;
      }

      const { assetId, tenantId } = validationResult.data;

      // Construct data to be encoded in the QR code
      const data = JSON.stringify({ assetId, tenantId });

      // Generate QR code in SVG format
      const qrCodeSVG = await QRCode.toString(data, {
        type: 'svg',
        color: {
          dark: '#000', // Black dots
          light: '#FFF', // Transparent background
        },
        width: 300,
        height: 300,
        errorCorrectionLevel: 'H', // High error correction level for better scanning reliability
      });

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrCodeSVG);
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Internal server error while generating QR code.' });
    }
  }
}