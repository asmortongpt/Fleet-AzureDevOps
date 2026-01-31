/**
 * Professional Document Generation Service
 * Generates beautifully formatted policy and SOP documents
 * Supports PDF and Word (DOCX) export with configurable branding
 */

import type { BrandingConfig } from './branding-config'
import { loadBrandingConfig } from './branding-config'

export interface DocumentMetadata {
  documentNumber: string
  title: string
  version: string
  status: 'draft' | 'review' | 'approved' | 'active' | 'archived'
  effectiveDate?: Date
  expiryDate?: Date
  owner: string
  approver?: string
  department?: string
  category: string
  tags?: string[]
}

export interface RevisionHistoryEntry {
  version: string
  date: Date
  author: string
  description: string
}

export interface ApprovalSignature {
  position: string
  name?: string
  date?: Date
  signature?: string // Base64 image
}

export interface PolicyDocument {
  metadata: DocumentMetadata
  purpose: string
  scope: string
  definitions?: Record<string, string>
  policyStatements: string[]
  procedures?: string
  compliance?: string[]
  relatedPolicies?: string[]
  kpis?: string[]
  revisionHistory?: RevisionHistoryEntry[]
  approvals?: ApprovalSignature[]
  attachments?: Array<{ name: string; url: string }>
}

export interface SOPDocument {
  metadata: DocumentMetadata
  purpose: string
  scope: string
  definitions?: Record<string, string>
  procedure: string
  safetyControls?: string
  requiredForms?: string[]
  relatedPolicies?: string[]
  kpis?: string[]
  regulatoryReferences?: string[]
  revisionHistory?: RevisionHistoryEntry[]
  approvals?: ApprovalSignature[]
  attachments?: Array<{ name: string; url: string }>
}

/**
 * Generate HTML representation of document with professional formatting
 */
export function generateDocumentHTML(
  document: PolicyDocument | SOPDocument,
  branding: BrandingConfig = loadBrandingConfig()
): string {
  const { organization, logo, colors, typography, header, footer, watermark } = branding

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.metadata.title}</title>
  <style>
    @page {
      size: letter;
      margin: ${header.height || 1.25}in 1in ${footer.height || 0.75}in 1in;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${typography.fontFamily};
      font-size: ${typography.fontSize.body}pt;
      line-height: ${typography.lineHeight};
      color: #1f2937;
      background: white;
    }

    /* Header */
    .document-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: ${header.height || 1.25}in;
      background: ${colors.headerBackground};
      color: ${colors.headerText};
      padding: 0.5in 1in;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${colors.primary};
    }

    .header-logo {
      ${logo.url || logo.base64 ? `
        background-image: url('${logo.url || logo.base64}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: ${logo.position || 'left'} center;
        width: ${logo.width || 150}px;
        height: ${logo.height || 75}px;
      ` : 'display: none;'}
    }

    .header-org {
      flex: 1;
      text-align: ${logo.position === 'right' ? 'left' : 'right'};
      padding: 0 1rem;
    }

    .header-org-name {
      font-size: ${typography.fontSize.heading2}pt;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }

    .header-department {
      font-size: ${typography.fontSize.body}pt;
      opacity: 0.9;
    }

    /* Footer */
    .document-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${footer.height || 0.75}in;
      background: ${colors.footerBackground};
      color: ${colors.footerText};
      padding: 0.25in 1in;
      border-top: 1px solid ${colors.secondary};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: ${typography.fontSize.footer}pt;
    }

    .footer-left {
      text-align: left;
    }

    .footer-center {
      text-align: center;
    }

    .footer-right {
      text-align: right;
    }

    .confidentiality-notice {
      font-weight: bold;
      color: ${colors.primary};
    }

    /* Watermark */
    ${watermark?.enabled ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(${watermark.rotation}deg);
      font-size: ${watermark.fontSize}pt;
      font-weight: bold;
      color: rgba(0, 0, 0, ${watermark.opacity});
      z-index: -1;
      pointer-events: none;
      user-select: none;
    }
    ` : ''}

    /* Content */
    .document-content {
      margin-top: ${(header.height || 1.25) + 0.25}in;
      margin-bottom: ${(footer.height || 0.75) + 0.25}in;
    }

    .title-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 8in;
      text-align: center;
    }

    .document-title {
      font-size: ${typography.fontSize.title}pt;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .document-number {
      font-size: ${typography.fontSize.heading3}pt;
      color: ${colors.secondary};
      margin-bottom: 0.5rem;
    }

    .document-status {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 2rem;
      font-weight: bold;
      font-size: ${typography.fontSize.body}pt;
      margin: 1rem 0;
      ${getStatusBadgeStyle(document.metadata.status, colors)}
    }

    .metadata-table {
      margin: 2rem auto;
      max-width: 500px;
      border-collapse: collapse;
      width: 100%;
    }

    .metadata-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .metadata-table td:first-child {
      font-weight: bold;
      color: ${colors.primary};
      width: 40%;
    }

    h1 {
      font-size: ${typography.fontSize.heading1}pt;
      color: ${colors.primary};
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid ${colors.primary};
      page-break-after: avoid;
    }

    h2 {
      font-size: ${typography.fontSize.heading2}pt;
      color: ${colors.primary};
      margin-top: 1.25rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }

    h3 {
      font-size: ${typography.fontSize.heading3}pt;
      color: ${colors.secondary};
      margin-top: 1rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 0.75rem;
      text-align: justify;
    }

    ul, ol {
      margin-bottom: 0.75rem;
      margin-left: 1.5rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    .definition-term {
      font-weight: bold;
      color: ${colors.primary};
    }

    .policy-statement {
      background: #f9fafb;
      border-left: 4px solid ${colors.primary};
      padding: 1rem;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .policy-statement strong {
      color: ${colors.primary};
    }

    .safety-warning {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 1rem;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .safety-warning::before {
      content: "⚠ SAFETY CRITICAL";
      display: block;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 0.5rem;
    }

    .compliance-box {
      background: #eff6ff;
      border: 1px solid ${colors.accent};
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    .compliance-box h3 {
      color: ${colors.accent};
      margin-top: 0;
    }

    pre {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.25rem;
      padding: 1rem;
      overflow-x: auto;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: ${typography.fontSize.body - 1}pt;
      line-height: 1.4;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      page-break-inside: avoid;
    }

    table th {
      background: ${colors.primary};
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: bold;
    }

    table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    table tr:hover {
      background: #f9fafb;
    }

    .signature-block {
      margin-top: 2rem;
      page-break-inside: avoid;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 3rem;
      padding-top: 0.5rem;
      display: inline-block;
      width: 300px;
    }

    .signature-position {
      font-weight: bold;
      color: ${colors.primary};
    }

    .page-break {
      page-break-after: always;
    }

    a {
      color: ${colors.linkColor};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="document-header">
    ${header.showLogo ? '<div class="header-logo"></div>' : ''}
    <div class="header-org">
      ${header.showOrgName ? `<div class="header-org-name">${organization.name}</div>` : ''}
      ${header.showDepartment && organization.department ? `<div class="header-department">${organization.department}</div>` : ''}
      ${header.customText ? `<div class="header-custom">${header.customText}</div>` : ''}
    </div>
  </div>

  <!-- Footer -->
  <div class="document-footer">
    <div class="footer-left">
      ${footer.showDate ? `Generated: ${new Date().toLocaleDateString()}` : ''}
      ${footer.customText ? `<br>${footer.customText}` : ''}
    </div>
    <div class="footer-center">
      ${footer.showConfidentiality && footer.confidentialityText ?
        `<span class="confidentiality-notice">${footer.confidentialityText}</span>` : ''}
    </div>
    <div class="footer-right">
      ${footer.showPageNumbers ? 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>' : ''}
    </div>
  </div>

  <!-- Watermark -->
  ${watermark?.enabled ? `<div class="watermark">${watermark.text}</div>` : ''}

  <!-- Content -->
  <div class="document-content">
    ${generateTitlePage(document, organization)}
    ${generateTableOfContents(document)}
    ${generateDocumentBody(document, colors)}
    ${document.revisionHistory ? generateRevisionHistory(document.revisionHistory, colors) : ''}
    ${document.approvals ? generateApprovalSignatures(document.approvals, colors) : ''}
  </div>
</body>
</html>
  `
}

/**
 * Generate title page
 */
function generateTitlePage(document: PolicyDocument | SOPDocument, organization: any): string {
  const { metadata } = document

  return `
<div class="title-page">
  <div class="document-title">${metadata.title}</div>
  <div class="document-number">${metadata.documentNumber}</div>
  <div class="document-status">${metadata.status.toUpperCase()}</div>

  <table class="metadata-table">
    <tr>
      <td>Version:</td>
      <td>${metadata.version}</td>
    </tr>
    <tr>
      <td>Category:</td>
      <td>${metadata.category}</td>
    </tr>
    <tr>
      <td>Owner:</td>
      <td>${metadata.owner}</td>
    </tr>
    ${metadata.approver ? `
    <tr>
      <td>Approver:</td>
      <td>${metadata.approver}</td>
    </tr>
    ` : ''}
    ${metadata.department ? `
    <tr>
      <td>Department:</td>
      <td>${metadata.department}</td>
    </tr>
    ` : ''}
    ${metadata.effectiveDate ? `
    <tr>
      <td>Effective Date:</td>
      <td>${new Date(metadata.effectiveDate).toLocaleDateString()}</td>
    </tr>
    ` : ''}
    ${metadata.expiryDate ? `
    <tr>
      <td>Review Date:</td>
      <td>${new Date(metadata.expiryDate).toLocaleDateString()}</td>
    </tr>
    ` : ''}
  </table>

  <div style="margin-top: 2rem; color: #6b7280; font-size: 10pt;">
    ${organization.name}<br>
    ${organization.address ? `${organization.address}<br>` : ''}
    ${organization.city && organization.state ? `${organization.city}, ${organization.state} ${organization.zip}<br>` : ''}
    ${organization.phone ? `Phone: ${organization.phone}<br>` : ''}
    ${organization.email ? `Email: ${organization.email}` : ''}
  </div>
</div>
  `
}

/**
 * Generate table of contents
 */
function generateTableOfContents(document: PolicyDocument | SOPDocument): string {
  const sections: string[] = []

  sections.push('<h1>1. Purpose</h1>')
  sections.push('<h1>2. Scope</h1>')

  if (document.definitions && Object.keys(document.definitions).length > 0) {
    sections.push('<h1>3. Definitions</h1>')
  }

  if ('policyStatements' in document) {
    sections.push('<h1>4. Policy Statements</h1>')
    if (document.procedures) sections.push('<h1>5. Procedures</h1>')
  } else if ('procedure' in document) {
    sections.push('<h1>4. Procedure</h1>')
  }

  return `
<div class="page-break">
  <h1>Table of Contents</h1>
  <ol>
    <li>Purpose</li>
    <li>Scope</li>
    ${document.definitions && Object.keys(document.definitions).length > 0 ? '<li>Definitions</li>' : ''}
    ${'policyStatements' in document ? '<li>Policy Statements</li>' : ''}
    ${'policyStatements' in document && document.procedures ? '<li>Procedures</li>' : ''}
    ${'procedure' in document ? '<li>Procedure</li>' : ''}
    ${document.compliance ? '<li>Compliance Requirements</li>' : ''}
    ${'safetyControls' in document && document.safetyControls ? '<li>Safety Controls</li>' : ''}
    ${document.relatedPolicies && document.relatedPolicies.length > 0 ? '<li>Related Policies</li>' : ''}
    ${document.kpis && document.kpis.length > 0 ? '<li>Key Performance Indicators</li>' : ''}
    ${'regulatoryReferences' in document && document.regulatoryReferences ? '<li>Regulatory References</li>' : ''}
    ${document.revisionHistory ? '<li>Revision History</li>' : ''}
    ${document.approvals ? '<li>Approvals</li>' : ''}
  </ol>
</div>
  `
}

/**
 * Generate document body
 */
function generateDocumentBody(document: PolicyDocument | SOPDocument, colors: any): string {
  let html = '<div class="page-break"></div>'

  // Purpose
  html += `
<h1>Purpose</h1>
<p>${document.purpose}</p>
  `

  // Scope
  html += `
<h1>Scope</h1>
<p>${document.scope}</p>
  `

  // Definitions
  if (document.definitions && Object.keys(document.definitions).length > 0) {
    html += '<h1>Definitions</h1><dl>'
    for (const [term, definition] of Object.entries(document.definitions)) {
      html += `<dt class="definition-term">${term}</dt><dd>${definition}</dd>`
    }
    html += '</dl>'
  }

  // Policy Statements or Procedure
  if ('policyStatements' in document) {
    html += '<h1>Policy Statements</h1>'
    document.policyStatements.forEach((statement, index) => {
      html += `<div class="policy-statement"><strong>Policy ${index + 1}:</strong> ${statement}</div>`
    })

    if (document.procedures) {
      html += `<h1>Procedures</h1><pre>${document.procedures}</pre>`
    }
  } else if ('procedure' in document) {
    html += `<h1>Procedure</h1><pre>${document.procedure}</pre>`
  }

  // Safety Controls
  if ('safetyControls' in document && document.safetyControls) {
    html += `<div class="safety-warning">${document.safetyControls}</div>`
  }

  // Compliance
  if (document.compliance && document.compliance.length > 0) {
    html += '<div class="compliance-box"><h3>Compliance Requirements</h3><ul>'
    document.compliance.forEach((req: string) => {
      html += `<li>${req}</li>`
    })
    html += '</ul></div>'
  }

  // Regulatory References
  if ('regulatoryReferences' in document && document.regulatoryReferences) {
    html += '<h2>Regulatory References</h2><ul>'
    document.regulatoryReferences.forEach(ref => {
      html += `<li>${ref}</li>`
    })
    html += '</ul>'
  }

  // Related Policies
  if (document.relatedPolicies && document.relatedPolicies.length > 0) {
    html += '<h2>Related Policies</h2><ul>'
    document.relatedPolicies.forEach(policy => {
      html += `<li>${policy}</li>`
    })
    html += '</ul>'
  }

  // KPIs
  if (document.kpis && document.kpis.length > 0) {
    html += '<h2>Key Performance Indicators</h2><ul>'
    document.kpis.forEach(kpi => {
      html += `<li>${kpi}</li>`
    })
    html += '</ul>'
  }

  // Required Forms
  if ('requiredForms' in document && document.requiredForms) {
    html += '<h2>Required Forms</h2><ul>'
    document.requiredForms.forEach(form => {
      html += `<li>${form}</li>`
    })
    html += '</ul>'
  }

  return html
}

/**
 * Generate revision history
 */
function generateRevisionHistory(history: RevisionHistoryEntry[], colors: any): string {
  return `
<div class="page-break">
  <h1>Revision History</h1>
  <table>
    <thead>
      <tr>
        <th>Version</th>
        <th>Date</th>
        <th>Author</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${history.map(entry => `
        <tr>
          <td>${entry.version}</td>
          <td>${new Date(entry.date).toLocaleDateString()}</td>
          <td>${entry.author}</td>
          <td>${entry.description}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
  `
}

/**
 * Generate approval signatures
 */
function generateApprovalSignatures(approvals: ApprovalSignature[], colors: any): string {
  return `
<div class="page-break">
  <h1>Approvals</h1>
  ${approvals.map(approval => `
    <div class="signature-block">
      <div class="signature-position">${approval.position}</div>
      ${approval.signature ? `<img src="${approval.signature}" alt="Signature" style="max-width: 200px; margin: 1rem 0;">` : ''}
      <div class="signature-line">
        <div>${approval.name || '_'.repeat(40)}</div>
        <div style="font-size: 9pt; color: #6b7280;">
          ${approval.date ? new Date(approval.date).toLocaleDateString() : 'Date: _________________'}
        </div>
      </div>
    </div>
  `).join('')}
</div>
  `
}

/**
 * Get status badge styling
 */
function getStatusBadgeStyle(status: string, colors: any): string {
  const styles: Record<string, string> = {
    draft: `background: #fef3c7; color: #92400e; border: 1px solid #fbbf24;`,
    review: `background: #dbeafe; color: #1e40af; border: 1px solid #3b82f6;`,
    approved: `background: #d1fae5; color: #065f46; border: 1px solid #10b981;`,
    active: `background: #dcfce7; color: #166534; border: 1px solid #22c55e;`,
    archived: `background: #f3f4f6; color: #374151; border: 1px solid #9ca3af;`
  }
  return styles[status] || styles.draft
}

/**
 * Export document as PDF (using print dialog)
 */
export async function exportToPDF(
  document: PolicyDocument | SOPDocument,
  branding: BrandingConfig = loadBrandingConfig()
): Promise<void> {
  const html = generateDocumentHTML(document, branding)

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

/**
 * Export document as Word (DOCX) - generates HTML that Word can import
 */
export async function exportToWord(
  document: PolicyDocument | SOPDocument,
  branding: BrandingConfig = loadBrandingConfig()
): Promise<void> {
  const html = generateDocumentHTML(document, branding)

  // Create blob with Word-compatible HTML
  const blob = new Blob([`
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${document.metadata.title}</title>
    </head>
    <body>${html}</body>
    </html>
  `], {
    type: 'application/vnd.ms-word'
  })

  // Download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${document.metadata.documentNumber}_${sanitizeFilename(document.metadata.title)}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

/**
 * Preview document in new tab
 */
export function previewDocument(
  document: PolicyDocument | SOPDocument,
  branding: BrandingConfig = loadBrandingConfig()
): void {
  const html = generateDocumentHTML(document, branding)
  const previewWindow = window.open('', '_blank')
  if (previewWindow) {
    previewWindow.document.write(html)
    previewWindow.document.close()
  }
}

export default {
  generateDocumentHTML,
  exportToPDF,
  exportToWord,
  previewDocument
}
