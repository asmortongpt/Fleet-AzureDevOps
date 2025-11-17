/**
 * Microsoft Office Integration Service - Real API Implementation
 * Replaces mock implementation with actual backend API calls
 */

import { apiClient } from './api-client'
import { MSTeamsMessage, MSOutlookEmail, Receipt, CommunicationLog } from "./types"

export class MSOfficeIntegrationService {
  async sendTeamsMessage(
    teamId: string,
    channelId: string,
    subject: string,
    content: string,
    mentions?: string[],
    attachments?: File[]
  ): Promise<MSTeamsMessage> {
    try {
      const response = await apiClient.teams.sendMessage(teamId, channelId, {
        subject,
        content,
        contentType: 'html',
        mentions,
        attachments: attachments?.map(f => ({
          name: f.name,
          contentType: f.type
        }))
      })

      return {
        id: response.id,
        channelId,
        channelName: '', // Will be populated by component
        subject,
        content,
        author: response.from?.user?.displayName || "You",
        timestamp: response.createdDateTime || new Date().toISOString(),
        attachments: attachments?.map(f => f.name),
        mentions,
        reactions: []
      }
    } catch (error) {
      console.error('Error sending Teams message:', error)
      throw error
    }
  }

  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    attachments?: File[]
  ): Promise<MSOutlookEmail> {
    try {
      const response = await apiClient.outlook.sendEmail({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: body
          },
          toRecipients: to.map(email => ({ emailAddress: { address: email } })),
          ccRecipients: cc?.map(email => ({ emailAddress: { address: email } }))
        }
      })

      return {
        id: response.id || `email-${Date.now()}`,
        subject,
        from: response.from?.emailAddress?.address || "fleet@company.com",
        to,
        cc,
        date: new Date().toISOString(),
        body,
        attachments: attachments?.map(f => ({
          id: `att-${Date.now()}-${f.name}`,
          name: f.name,
          type: f.type,
          size: f.size
        })),
        isRead: false,
        hasReceipt: false
      }
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  async createOutlookCalendarEvent(
    title: string,
    start: string,
    end: string,
    location: string,
    attendees: string[],
    description?: string
  ): Promise<{ id: string; success: boolean }> {
    try {
      const response = await apiClient.calendar.createEvent({
        subject: title,
        start: {
          dateTime: start,
          timeZone: 'UTC'
        },
        end: {
          dateTime: end,
          timeZone: 'UTC'
        },
        location: {
          displayName: location
        },
        attendees: attendees.map(email => ({
          emailAddress: { address: email },
          type: 'required'
        })),
        body: description ? {
          contentType: 'HTML',
          content: description
        } : undefined
      })

      return {
        id: response.id,
        success: true
      }
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  async scheduleMaintenanceWithVendor(
    vendorEmail: string,
    vehicleInfo: string,
    serviceType: string,
    preferredDate: string
  ): Promise<MSOutlookEmail> {
    const subject = `Maintenance Request: ${serviceType} - ${vehicleInfo}`
    const body = `
Dear Service Provider,

We would like to schedule ${serviceType} for ${vehicleInfo}.

Preferred Date: ${preferredDate}

Please confirm availability and provide:
- Service appointment time
- Estimated cost
- Expected completion time

Best regards,
Fleet Management Team
    `.trim()

    return this.sendEmail([vendorEmail], subject, body)
  }

  async processReceiptFromEmail(emailId: string): Promise<Receipt> {
    try {
      // Get email and extract receipt data
      const email: any = await apiClient.outlook.getMessage(emailId)

      // Use AI to process receipt
      const ocrData = await apiClient.ai.processReceipt(emailId)

      const receipt: Receipt = {
        id: `receipt-${Date.now()}`,
        date: new Date().toISOString(),
        vendor: ocrData.merchantName || "Auto extracted from email",
        category: "maintenance",
        amount: parseFloat(ocrData.total || '0'),
        taxAmount: 0,
        paymentMethod: "corporate-card",
        status: "pending",
        submittedBy: "email-automation",
        ocrData
      }

      return receipt
    } catch (error) {
      console.error('Error processing receipt:', error)
      throw error
    }
  }

  async extractReceiptData(imageFile: File): Promise<Receipt["ocrData"]> {
    try {
      // Upload image and process with AI
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch(`${apiClient['baseURL']}/api/ai/receipt/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient['token']}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to extract receipt data')
      }

      return await response.json()
    } catch (error) {
      console.error('Error extracting receipt data:', error)
      throw error
    }
  }

  async createTeamsNotification(
    teamId: string,
    channelId: string,
    title: string,
    message: string,
    priority: "low" | "medium" | "high" | "urgent",
    actionUrl?: string
  ): Promise<MSTeamsMessage> {
    const priorityEmoji = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🔴",
      urgent: "🚨"
    }

    const content = `${priorityEmoji[priority]} **${title}**\n\n${message}${actionUrl ? `\n\n[View Details](${actionUrl})` : ""}`

    return this.sendTeamsMessage(teamId, channelId, title, content)
  }

  async logCommunication(
    type: CommunicationLog["type"],
    subject: string,
    summary: string,
    participants: string[],
    relatedIds?: {
      vehicleId?: string
      vendorId?: string
      workOrderId?: string
    }
  ): Promise<CommunicationLog> {
    const log: CommunicationLog = {
      id: `comm-${Date.now()}`,
      tenantId: "default-tenant",
      type,
      date: new Date().toISOString(),
      participants,
      subject,
      summary,
      ...relatedIds,
      followUpRequired: false,
      createdBy: "system"
    }

    // Log to backend
    try {
      await apiClient.post('/api/communication-logs', log)
    } catch (error) {
      console.error('Error logging communication:', error)
    }

    return log
  }

  async generateMaintenanceReport(
    vehicleIds: string[],
    startDate: string,
    endDate: string,
    format: "excel" | "pdf" | "word"
  ): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const response: any = await apiClient.post('/api/reports/maintenance', {
        vehicleIds,
        startDate,
        endDate,
        format
      })

      return {
        fileUrl: response.fileUrl,
        fileName: response.fileName
      }
    } catch (error) {
      console.error('Error generating report:', error)
      throw error
    }
  }

  async shareToTeams(
    teamId: string,
    channelId: string,
    reportUrl: string,
    reportName: string
  ): Promise<MSTeamsMessage> {
    return this.sendTeamsMessage(
      teamId,
      channelId,
      `Fleet Report: ${reportName}`,
      `A new fleet report has been generated and is ready for review.\n\n[Download Report](${reportUrl})`
    )
  }

  async syncOutlookContacts(): Promise<{ name: string; email: string; role: string }[]> {
    try {
      const response: any = await apiClient.get('/api/outlook/contacts')
      return response.value || []
    } catch (error) {
      console.error('Error syncing contacts:', error)
      return []
    }
  }

  async createExcelInventoryReport(parts: any[]): Promise<Blob> {
    const csvContent = [
      "Part Number,Name,Category,Quantity,Min Stock,Cost,Location",
      ...parts.map(p =>
        `${p.partNumber},"${p.name}",${p.category},${p.quantityOnHand},${p.minStockLevel},${p.unitCost},${p.location}`
      )
    ].join("\n")

    return new Blob([csvContent], { type: "text/csv" })
  }

  async getTeamsChannels(teamId: string): Promise<any[]> {
    try {
      const response: any = await apiClient.teams.listChannels(teamId)
      return response.value || []
    } catch (error) {
      console.error('Error getting Teams channels:', error)
      return []
    }
  }

  async getTeamsMessages(teamId: string, channelId: string): Promise<MSTeamsMessage[]> {
    try {
      const response: any = await apiClient.teams.listMessages(teamId, channelId)
      return response.value || []
    } catch (error) {
      console.error('Error getting Teams messages:', error)
      return []
    }
  }

  async getEmails(filter?: any): Promise<MSOutlookEmail[]> {
    try {
      const response: any = await apiClient.outlook.listMessages(filter)
      return response.value || []
    } catch (error) {
      console.error('Error getting emails:', error)
      return []
    }
  }

  async replyToEmail(messageId: string, comment: string): Promise<void> {
    try {
      await apiClient.outlook.replyToEmail(messageId, {
        comment,
        message: {
          body: {
            contentType: 'HTML',
            content: comment
          }
        }
      })
    } catch (error) {
      console.error('Error replying to email:', error)
      throw error
    }
  }
}

export const msOfficeService = new MSOfficeIntegrationService()
