/**
 * Fallback email templates per context type.
 * Used when AI generation is unavailable.
 */

export type EmailContextType =
  | 'maintenance_reminder'
  | 'schedule_notification'
  | 'work_order_update'
  | 'reservation_confirmation'
  | 'incident_report'
  | 'driver_notice'
  | 'vendor_contact'
  | 'inspection_notice'
  | 'general'

export interface EmailContext {
  type: EmailContextType
  entityName?: string
  recipientName?: string
  details?: string
}

interface TemplateResult {
  subject: string
  body: string
}

export function getEmailTemplate(context: EmailContext): TemplateResult {
  const { type, entityName, recipientName, details } = context
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,'

  switch (type) {
    case 'maintenance_reminder':
      return {
        subject: `Maintenance Reminder${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This is a reminder that ${entityName || 'a vehicle'} is due for scheduled maintenance.${details ? ` ${details}` : ''}`,
          '',
          'Please confirm availability or contact the fleet office to reschedule.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'schedule_notification':
      return {
        subject: `Schedule Update${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This is to notify you of a scheduling update${entityName ? ` for ${entityName}` : ''}.${details ? ` ${details}` : ''}`,
          '',
          'Please review the updated schedule and confirm receipt.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'work_order_update':
      return {
        subject: `Work Order Update${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This is an update regarding ${entityName || 'a work order'}.${details ? ` ${details}` : ''}`,
          '',
          'Please review and take any required action.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'reservation_confirmation':
      return {
        subject: `Reservation Confirmation${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `Your vehicle reservation${entityName ? ` for ${entityName}` : ''} has been confirmed.${details ? ` ${details}` : ''}`,
          '',
          'Please arrive at the scheduled pickup time. Contact the fleet office if you need to make changes.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'incident_report':
      return {
        subject: `Incident Report${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This email is regarding an incident${entityName ? ` involving ${entityName}` : ''}.${details ? ` ${details}` : ''}`,
          '',
          'Please review and provide any additional information as needed.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'driver_notice':
      return {
        subject: `Notice${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This is to inform you of an update${entityName ? ` regarding ${entityName}` : ''}.${details ? ` ${details}` : ''}`,
          '',
          'Please acknowledge receipt of this notice.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'vendor_contact':
      return {
        subject: `Fleet Management Inquiry${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `I am reaching out regarding ${entityName || 'fleet services'}.${details ? ` ${details}` : ''}`,
          '',
          'Please let me know your availability to discuss further.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'inspection_notice':
      return {
        subject: `Inspection Notice${entityName ? ` — ${entityName}` : ''}`,
        body: [
          greeting,
          '',
          `This is regarding an inspection${entityName ? ` for ${entityName}` : ''}.${details ? ` ${details}` : ''}`,
          '',
          'Please review and respond at your earliest convenience.',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }

    case 'general':
    default:
      return {
        subject: entityName ? `Re: ${entityName}` : '',
        body: [
          greeting,
          '',
          details || '',
          '',
          'Thank you,',
          'Fleet Management',
        ].join('\n'),
      }
  }
}

/**
 * Build an AI prompt from email context for AI-generated email body.
 */
export function buildAIPrompt(context: EmailContext): string {
  const typeLabels: Record<EmailContextType, string> = {
    maintenance_reminder: 'a maintenance reminder',
    schedule_notification: 'a schedule notification',
    work_order_update: 'a work order status update',
    reservation_confirmation: 'a vehicle reservation confirmation',
    incident_report: 'an incident report notification',
    driver_notice: 'a driver notice',
    vendor_contact: 'a vendor inquiry',
    inspection_notice: 'an inspection notification',
    general: 'a professional fleet management communication',
  }

  const parts = [
    `Write a professional fleet management email for ${typeLabels[context.type]}.`,
  ]

  if (context.recipientName) {
    parts.push(`Recipient: ${context.recipientName}.`)
  }
  if (context.entityName) {
    parts.push(`Regarding: ${context.entityName}.`)
  }
  if (context.details) {
    parts.push(`Details: ${context.details}.`)
  }

  parts.push('Keep it concise (2-3 short paragraphs). Use a professional but friendly tone. Do not include a subject line — only the email body. Start with a greeting.')

  return parts.join(' ')
}
