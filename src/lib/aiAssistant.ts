import { AIAssistantMessage } from "./types"

export class AIFleetAssistant {
  private conversationHistory: AIAssistantMessage[] = []

  async sendMessage(
    userMessage: string,
    context?: AIAssistantMessage["context"]
  ): Promise<AIAssistantMessage> {
    const userMsg: AIAssistantMessage = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
      context
    }

    this.conversationHistory.push(userMsg)

    const response = await this.generateResponse(userMessage, context)
    
    const assistantMsg: AIAssistantMessage = {
      id: `msg-${Date.now()}-assistant`,
      type: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      context,
      suggestions: response.suggestions
    }

    this.conversationHistory.push(assistantMsg)

    return assistantMsg
  }

  async draftMaintenanceEmail(
    vehicleNumber: string,
    serviceType: string,
    urgency: string,
    vendorName: string
  ): Promise<{ subject: string; body: string }> {
    const promptText = `Draft a professional email to ${vendorName} requesting ${serviceType} for vehicle ${vehicleNumber}. The urgency is ${urgency}. Include a request for cost estimate and timeline.`
    
    const response = await window.spark.llm(promptText)

    const lines = response.split('\n')
    const subject = lines[0].replace('Subject:', '').trim()
    const body = lines.slice(2).join('\n').trim()

    return { subject, body }
  }

  async summarizeMaintenanceHistory(workOrders: any[]): Promise<string> {
    const summaryData = workOrders.map(wo => 
      `${wo.serviceType} on ${wo.createdDate} - ${wo.status} - $${wo.cost || 0}`
    ).join('; ')

    const promptText = `Summarize this maintenance history in 2-3 sentences, highlighting patterns and recommendations: ${summaryData}`
    
    return await window.spark.llm(promptText)
  }

  async analyzeReceipt(receiptText: string): Promise<{
    category: string
    amount: number
    vendor: string
    items: string[]
    confidence: number
  }> {
    const promptText = `Analyze this receipt and extract: category, total amount, vendor name, and line items. Return as JSON. Receipt text: ${receiptText}`
    
    const jsonResponse = await window.spark.llm(promptText, "gpt-4o-mini", true)
    const data = JSON.parse(jsonResponse)

    return {
      category: data.category || "unknown",
      amount: parseFloat(data.amount) || 0,
      vendor: data.vendor || "Unknown Vendor",
      items: data.items || [],
      confidence: data.confidence || 0.8
    }
  }

  async suggestVendor(
    serviceType: string,
    location: string,
    budget: number
  ): Promise<{ vendorName: string; reason: string; estimatedCost: number }[]> {
    const promptText = `Suggest 3 vendor options for ${serviceType} near ${location} with budget around $${budget}. Return as JSON with array of vendors containing vendorName, reason, and estimatedCost.`
    
    const jsonResponse = await window.spark.llm(promptText, "gpt-4o-mini", true)
    const data = JSON.parse(jsonResponse)

    return data.vendors || []
  }

  async generateMaintenanceRecommendations(
    vehicleData: {
      mileage: number
      lastService: string
      age: number
      type: string
    }
  ): Promise<string[]> {
    const promptText = `Based on vehicle data - Mileage: ${vehicleData.mileage}, Last Service: ${vehicleData.lastService}, Age: ${vehicleData.age} years, Type: ${vehicleData.type} - provide 3-5 specific maintenance recommendations as a JSON array.`
    
    const jsonResponse = await window.spark.llm(promptText, "gpt-4o-mini", true)
    const data = JSON.parse(jsonResponse)

    return data.recommendations || []
  }

  async draftTeamsAnnouncement(
    topic: string,
    details: string,
    urgency: "low" | "medium" | "high"
  ): Promise<string> {
    const promptText = `Create a Microsoft Teams announcement about ${topic}. Details: ${details}. Urgency level: ${urgency}. Use appropriate formatting and emojis. Keep it professional but engaging.`
    
    return await window.spark.llm(promptText)
  }

  async translateError(errorCode: string): Promise<{ explanation: string; steps: string[] }> {
    const promptText = `Explain vehicle diagnostic error code ${errorCode} in simple terms and provide troubleshooting steps. Return as JSON with 'explanation' and 'steps' array.`
    
    const jsonResponse = await window.spark.llm(promptText, "gpt-4o-mini", true)
    return JSON.parse(jsonResponse)
  }

  async optimizePurchaseOrder(
    items: { part: string; quantity: number; urgency: string }[]
  ): Promise<{ suggestion: string; consolidatedOrders: any[] }> {
    const itemsText = items.map(i => `${i.part} (qty: ${i.quantity}, urgency: ${i.urgency})`).join('; ')
    
    const promptText = `Analyze these parts orders and suggest optimization: ${itemsText}. Return as JSON with 'suggestion' string and 'consolidatedOrders' array.`
    
    const jsonResponse = await window.spark.llm(promptText, "gpt-4o-mini", true)
    return JSON.parse(jsonResponse)
  }

  private async generateResponse(
    message: string,
    context?: AIAssistantMessage["context"]
  ): Promise<{ content: string; suggestions?: string[] }> {
    const messageLower = message.toLowerCase()

    if (messageLower.includes("maintenance") && context?.vehicleId) {
      return {
        content: "I can help you with vehicle maintenance. Would you like me to:\n• Check the maintenance history\n• Schedule a service appointment\n• Draft an email to a vendor\n• Generate a maintenance report",
        suggestions: [
          "Show maintenance history",
          "Schedule service",
          "Contact vendor",
          "Generate report"
        ]
      }
    }

    if (messageLower.includes("vendor") || messageLower.includes("contact")) {
      return {
        content: "I can assist with vendor communications. I can:\n• Draft professional emails\n• Create purchase orders\n• Schedule appointments\n• Track vendor responses",
        suggestions: [
          "Draft email to vendor",
          "Create purchase order",
          "View vendor contacts",
          "Check vendor ratings"
        ]
      }
    }

    if (messageLower.includes("report") || messageLower.includes("analytics")) {
      return {
        content: "I can generate various reports:\n• Maintenance history reports\n• Fuel consumption analysis\n• Cost breakdown by vehicle\n• Fleet utilization metrics\n\nWhich report would you like?",
        suggestions: [
          "Maintenance report",
          "Fuel analysis",
          "Cost report",
          "Utilization metrics"
        ]
      }
    }

    if (messageLower.includes("schedule") || messageLower.includes("appointment")) {
      return {
        content: "I can help schedule maintenance appointments. Please provide:\n• Vehicle ID\n• Service type needed\n• Preferred date/time\n• Vendor preference (optional)",
        suggestions: [
          "Schedule oil change",
          "Schedule tire rotation",
          "Schedule inspection",
          "View scheduled services"
        ]
      }
    }

    return {
      content: "I'm your Fleet Management AI Assistant. I can help you with:\n• Vehicle maintenance scheduling\n• Vendor communications\n• Report generation\n• Receipt processing\n• Parts inventory\n\nWhat would you like help with?",
      suggestions: [
        "Schedule maintenance",
        "Contact vendor",
        "Generate report",
        "Process receipt"
      ]
    }
  }

  getConversationHistory(): AIAssistantMessage[] {
    return this.conversationHistory
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
}

export const aiAssistant = new AIFleetAssistant()
