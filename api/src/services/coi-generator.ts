/**
 * Certificate of Insurance (COI) Generator Service
 * Generates PDF Certificate of Insurance documents
 */

import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

import logger from '../config/logger';
import { InsurancePolicy, CertificateOfInsuranceData } from '../types/insurance';

export class COIGeneratorService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Generate Certificate of Insurance PDF
   */
  async generateCOI(data: CertificateOfInsuranceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, data);

        // Certificate Information
        this.addCertificateInfo(doc, data);

        // Insurance Company Information
        this.addInsuranceCompanyInfo(doc, data);

        // Coverage Details
        this.addCoverageDetails(doc, data);

        // Additional Information
        this.addAdditionalInfo(doc, data);

        // Footer
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        logger.error('Error generating COI:', error);
        reject(error);
      }
    });
  }

  /**
   * Add header section
   */
  private addHeader(doc: PDFKit.PDFDocument, data: CertificateOfInsuranceData): void {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('CERTIFICATE OF LIABILITY INSURANCE', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('This certificate is issued as a matter of information only and confers no rights', {
        align: 'center',
      });

    doc.text('upon the certificate holder. This certificate does not affirmatively or', {
      align: 'center',
    });

    doc.text('negatively amend, extend or alter the coverage afforded by the policies below.', {
      align: 'center',
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(0.5);
  }

  /**
   * Add certificate information
   */
  private addCertificateInfo(doc: PDFKit.PDFDocument, data: CertificateOfInsuranceData): void {
    const startY = doc.y;

    // Left column
    doc.fontSize(10).font('Helvetica-Bold').text('CERTIFICATE NUMBER:', 50, startY);
    doc.font('Helvetica').text(data.certificate_number, 180, startY);

    doc.font('Helvetica-Bold').text('ISSUE DATE:', 50, startY + 20);
    doc.font('Helvetica').text(this.formatDate(data.issue_date), 180, startY + 20);

    // Right column
    doc.font('Helvetica-Bold').text('CERTIFICATE HOLDER:', 300, startY);
    doc.font('Helvetica').text(data.certificate_holder_name, 300, startY + 15, { width: 250 });
    doc.text(data.certificate_holder_address, 300, startY + 30, { width: 250 });

    doc.moveDown(3);
  }

  /**
   * Add insurance company information
   */
  private addInsuranceCompanyInfo(
    doc: PDFKit.PDFDocument,
    data: CertificateOfInsuranceData
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('INSURANCE COMPANY');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Company Name:');
    doc.font('Helvetica').text(data.policy.insurance_carrier, { indent: 20 });

    if (data.policy.carrier_contact_name) {
      doc.font('Helvetica-Bold').text('Contact Name:');
      doc.font('Helvetica').text(data.policy.carrier_contact_name, { indent: 20 });
    }

    if (data.policy.carrier_contact_phone) {
      doc.font('Helvetica-Bold').text('Phone:');
      doc.font('Helvetica').text(data.policy.carrier_contact_phone, { indent: 20 });
    }

    if (data.policy.carrier_contact_email) {
      doc.font('Helvetica-Bold').text('Email:');
      doc.font('Helvetica').text(data.policy.carrier_contact_email, { indent: 20 });
    }

    doc.moveDown(1);
  }

  /**
   * Add coverage details table
   */
  private addCoverageDetails(doc: PDFKit.PDFDocument, data: CertificateOfInsuranceData): void {
    doc.fontSize(12).font('Helvetica-Bold').text('COVERAGE INFORMATION');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [200, 140, 140];
    const rowHeight = 20;

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('COVERAGE TYPE', 50, tableTop, { width: colWidths[0] });
    doc.text('POLICY NUMBER', 250, tableTop, { width: colWidths[1] });
    doc.text('POLICY PERIOD', 390, tableTop, { width: colWidths[2] });

    // Header line
    doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).stroke();

    // Policy details row
    let currentY = tableTop + rowHeight;
    doc.fontSize(9).font('Helvetica');

    doc.text(this.formatPolicyType(data.policy.policy_type), 50, currentY, {
      width: colWidths[0],
    });
    doc.text(data.policy.policy_number, 250, currentY, { width: colWidths[1] });
    doc.text(
      `${this.formatDate(data.policy.policy_start_date)} to ${this.formatDate(data.policy.policy_end_date)}`,
      390,
      currentY,
      { width: colWidths[2] }
    );

    currentY += rowHeight;

    // Coverage limits
    doc.font('Helvetica-Bold').text('LIMITS OF LIABILITY:', 50, currentY);
    currentY += rowHeight;

    doc.font('Helvetica');
    const limits = data.policy.coverage_limits;

    if (limits.bodily_injury) {
      doc.text(`Bodily Injury: $${this.formatCurrency(limits.bodily_injury)}`, 70, currentY);
      currentY += 15;
    }

    if (limits.property_damage) {
      doc.text(`Property Damage: $${this.formatCurrency(limits.property_damage)}`, 70, currentY);
      currentY += 15;
    }

    if (limits.collision) {
      doc.text(`Collision: $${this.formatCurrency(limits.collision)}`, 70, currentY);
      currentY += 15;
    }

    if (limits.comprehensive) {
      doc.text(`Comprehensive: $${this.formatCurrency(limits.comprehensive)}`, 70, currentY);
      currentY += 15;
    }

    if (limits.cargo) {
      doc.text(`Cargo: $${this.formatCurrency(limits.cargo)}`, 70, currentY);
      currentY += 15;
    }

    if (data.policy.deductible_amount) {
      doc.font('Helvetica-Bold').text('DEDUCTIBLE:', 70, currentY);
      doc
        .font('Helvetica')
        .text(`$${this.formatCurrency(data.policy.deductible_amount)}`, 150, currentY);
      currentY += 15;
    }

    doc.moveDown(1);
  }

  /**
   * Add additional information
   */
  private addAdditionalInfo(doc: PDFKit.PDFDocument, data: CertificateOfInsuranceData): void {
    if (data.description_of_operations) {
      doc.fontSize(10).font('Helvetica-Bold').text('DESCRIPTION OF OPERATIONS:');
      doc.font('Helvetica').text(data.description_of_operations, { width: 500 });
      doc.moveDown(0.5);
    }

    if (data.additional_insureds && data.additional_insureds.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('ADDITIONAL INSURED:');
      data.additional_insureds.forEach((insured) => {
        doc.font('Helvetica').text(`• ${insured}`, { indent: 20 });
      });
      doc.moveDown(0.5);
    }

    // Important notice
    doc.fontSize(9).font('Helvetica-Oblique').text(
      'IMPORTANT: If the certificate holder is an ADDITIONAL INSURED, the policy(ies) must have ADDITIONAL INSURED provisions or be endorsed. ' +
        'If SUBROGATION IS WAIVED, subject to the terms and conditions of the policy, certain policies may require an endorsement.',
      { width: 500 }
    );
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument, data: CertificateOfInsuranceData): void {
    const footerY = 700;

    doc.moveTo(50, footerY).lineTo(562, footerY).stroke();

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Generated: ${new Date().toLocaleString()} | Certificate Number: ${data.certificate_number}`,
        50,
        footerY + 10,
        { align: 'center', width: 512 }
      );

    doc.text('This is an electronically generated certificate and does not require a signature.', {
      align: 'center',
      width: 512,
    });
  }

  /**
   * Format policy type for display
   */
  private formatPolicyType(type: string): string {
    const typeMap: Record<string, string> = {
      liability: 'General Liability',
      collision: 'Auto Collision',
      comprehensive: 'Auto Comprehensive',
      cargo: 'Cargo Insurance',
      'workers-comp': "Workers' Compensation",
    };
    return typeMap[type] || type;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Generate COI for a specific policy
   */
  async generateCOIForPolicy(
    policy_id: string,
    tenant_id: string,
    certificate_holder_name: string,
    certificate_holder_address: string,
    description_of_operations?: string,
    additional_insureds?: string[]
  ): Promise<Buffer> {
    try {
      // Get policy details
      const policyResult = await this.pool.query(
        `SELECT * FROM insurance_policies WHERE id = $1 AND tenant_id = $2`,
        [policy_id, tenant_id]
      );

      if (policyResult.rows.length === 0) {
        throw new Error('Policy not found');
      }

      const policy: InsurancePolicy = policyResult.rows[0];

      // Generate certificate number
      const certificate_number = `COI-${Date.now()}-${policy.policy_number}`;

      const coiData: CertificateOfInsuranceData = {
        policy,
        certificate_holder_name,
        certificate_holder_address,
        certificate_number,
        issue_date: new Date().toISOString().split('T')[0],
        description_of_operations,
        additional_insureds,
      };

      const pdfBuffer = await this.generateCOI(coiData);

      // TODO: Store PDF in Azure Blob Storage
      // const blobUrl = await storageService.uploadBlob(`coi/${certificate_number}.pdf`, pdfBuffer);

      // Update policy with COI URL
      // await this.pool.query(
      //   `UPDATE insurance_policies SET certificate_of_insurance_url = $1, updated_at = NOW()
      //    WHERE id = $2 AND tenant_id = $3`,
      //   [blobUrl, policy_id, tenant_id]
      // );

      logger.info(`Generated COI for policy ${policy.policy_number}: ${certificate_number}`);
      return pdfBuffer;
    } catch (error) {
      logger.error('Error generating COI for policy:', error);
      throw error;
    }
  }

  /**
   * Get COI as downloadable stream
   */
  async getCOIStream(
    policy_id: string,
    tenant_id: string,
    certificate_holder_name: string,
    certificate_holder_address: string
  ): Promise<Readable> {
    const buffer = await this.generateCOIForPolicy(
      policy_id,
      tenant_id,
      certificate_holder_name,
      certificate_holder_address
    );
    return Readable.from(buffer);
  }
}
