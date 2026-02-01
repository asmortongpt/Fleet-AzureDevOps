import { Mail, Send, Paperclip, Star, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { msOfficeService } from "@/lib/msOfficeIntegration"
import { MSOutlookEmail } from "@/lib/types"



export function EmailCenter() {
  // Demo email data for inbox functionality
  const DEMO_EMAILS: MSOutlookEmail[] = [
    {
      id: '1',
      from: 'maintenance@fleetvendor.com',
      to: ['fleet-manager@company.com'],
      subject: 'Scheduled Maintenance Reminder - Vehicle #FLT-2024-001',
      body: 'This is a reminder that Vehicle #FLT-2024-001 (Ford F-150) is due for scheduled maintenance on January 5, 2025. Please confirm the appointment or reschedule if needed.\n\nServices due:\n- Oil change\n- Tire rotation\n- Brake inspection\n- Battery check\n\nPlease reply to confirm.',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      isRead: false,
      hasReceipt: false,
    },
    {
      id: '2',
      from: 'billing@fuelcard.com',
      to: ['fleet-manager@company.com'],
      subject: 'Fuel Purchase Receipt - Transaction #89234',
      body: 'Transaction Details:\n\nStation: Shell Station #4521\nDate: December 30, 2024\nTime: 2:34 PM\n\nDriver: John Smith\nVehicle: FLT-2024-003\n\nFuel Type: Regular Unleaded\nGallons: 18.5\nPrice/Gallon: $3.25\nTotal: $60.13\n\nThank you for your business.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false,
      hasReceipt: true,
      relatedVendorId: 'vendor-fuel-001',
    },
    {
      id: '3',
      from: 'support@gpsvendor.com',
      to: ['fleet-manager@company.com'],
      subject: 'GPS Tracking Update - New Features Available',
      body: 'Dear Fleet Manager,\n\nWe are excited to announce new features for your GPS tracking system:\n\n1. Enhanced real-time tracking accuracy\n2. Improved geofence notifications\n3. New driver behavior scoring metrics\n4. Battery backup status monitoring\n\nLog in to your dashboard to explore these features.\n\nBest regards,\nGPS Vendor Support Team',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: true,
      hasReceipt: false,
      relatedVendorId: 'vendor-gps-001',
    },
    {
      id: '4',
      from: 'insurance@fleetinsure.com',
      to: ['fleet-manager@company.com'],
      cc: ['accounting@company.com'],
      subject: 'Policy Renewal Notice - Due January 15, 2025',
      body: 'Important Notice:\n\nYour fleet insurance policy is due for renewal on January 15, 2025.\n\nCurrent Coverage:\n- Vehicles covered: 47\n- Liability limit: $1,000,000\n- Collision deductible: $500\n\nPlease review the attached renewal documents and contact us with any questions.\n\nThank you for choosing Fleet Insure.',
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      isRead: true,
      hasReceipt: false,
      attachments: [
        { id: 'att1', name: 'Renewal_Quote_2025.pdf', size: 245760, type: 'application/pdf' },
        { id: 'att2', name: 'Policy_Summary.pdf', size: 128000, type: 'application/pdf' },
      ],
    },
    {
      id: '5',
      from: 'parts@autopartsplus.com',
      to: ['fleet-manager@company.com'],
      subject: 'Order Confirmation - Brake Pads and Filters',
      body: 'Order Confirmation #ORD-78234\n\nItems Ordered:\n2x Brake Pad Set (Premium) - $89.99 each\n4x Oil Filter (OEM) - $12.50 each\n4x Air Filter - $18.00 each\n\nSubtotal: $301.98\nShipping: Free\nTotal: $301.98\n\nEstimated Delivery: January 3, 2025\n\nTrack your order: www.autopartsplus.com/track/78234',
      date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      isRead: true,
      hasReceipt: true,
      relatedVendorId: 'vendor-parts-001',
    },
  ];

  const [emails, setEmails] = useState<MSOutlookEmail[]>(DEMO_EMAILS)

  const [selectedEmail, setSelectedEmail] = useState<MSOutlookEmail | null>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const [newEmail, setNewEmail] = useState({
    to: "",
    cc: "",
    subject: "",
    body: ""
  })

  const filteredEmails = (emails || []).filter(email => {
    if (filterCategory === "unread") return !email.isRead
    if (filterCategory === "receipts") return email.hasReceipt
    if (filterCategory === "vendor") return email.relatedVendorId
    return true
  })

  const handleSendEmail = async () => {
    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const toAddresses = newEmail.to.split(",").map(e => e.trim())
      const ccAddresses = newEmail.cc ? newEmail.cc.split(",").map(e => e.trim()) : undefined

      const email = await msOfficeService.sendEmail(
        toAddresses,
        newEmail.subject,
        newEmail.body,
        ccAddresses
      )

      setEmails(current => [...(current || []), email])
      toast.success("Email sent successfully")
      setIsComposeOpen(false)
      setNewEmail({ to: "", cc: "", subject: "", body: "" })
    } catch (error) {
      toast.error("Failed to send email")
    }
  }

  const handleReply = (email: MSOutlookEmail) => {
    setNewEmail({
      to: email.from,
      cc: "",
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nOn ${new Date(email.date).toLocaleString()}, ${email.from} wrote:\n${email.body}`
    })
    setIsComposeOpen(true)
  }

  const markAsRead = (emailId: string) => {
    setEmails(current =>
      (current || []).map(email =>
        email.id === emailId ? { ...email, isRead: true } : email
      )
    )
  }

  const categories = [
    { id: "all", label: "All Mail", count: (emails || []).length },
    { id: "unread", label: "Unread", count: (emails || []).filter(e => !e.isRead).length },
    { id: "receipts", label: "Receipts", count: (emails || []).filter(e => e.hasReceipt).length },
    { id: "vendor", label: "Vendor Emails", count: (emails || []).filter(e => e.relatedVendorId).length }
  ]

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-2">
      <div className="w-64 space-y-2">
        <Card>
          <CardHeader>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Compose Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New Email</DialogTitle>
                  <DialogDescription>
                    Compose and send an email through Outlook
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-to">To *</Label>
                    <Input
                      id="email-to"
                      value={newEmail.to}
                      onChange={e => setNewEmail({ ...newEmail, to: e.target.value })}
                      placeholder="recipient@example.com, another@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-cc">CC</Label>
                    <Input
                      id="email-cc"
                      value={newEmail.cc}
                      onChange={e => setNewEmail({ ...newEmail, cc: e.target.value })}
                      placeholder="cc@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject *</Label>
                    <Input
                      id="email-subject"
                      value={newEmail.subject}
                      onChange={e => setNewEmail({ ...newEmail, subject: e.target.value })}
                      placeholder="Email subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-body">Message *</Label>
                    <Textarea
                      id="email-body"
                      value={newEmail.body}
                      onChange={e => setNewEmail({ ...newEmail, body: e.target.value })}
                      placeholder="Type your message..."
                      rows={10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmail}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={filterCategory === category.id ? "secondary" : "ghost"}
                className="w-full justify-between"
                onClick={() => setFilterCategory(category.id)}
              >
                <span className="text-sm">{category.label}</span>
                {category.count > 0 && (
                  <Badge variant="outline">{category.count}</Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              Inbox
            </CardTitle>
            <CardDescription>{filteredEmails.length} messages</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-24rem)]">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-3 text-center">
                  <Mail className="w-12 h-9 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No emails in this category</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map(email => (
                    <div
                      key={email.id}
                      className={`p-2 cursor-pointer hover:bg-muted/50 transition-colors ${!email.isRead ? "bg-blue-50/50" : ""
                        } ${selectedEmail?.id === email.id ? "bg-muted" : ""}`}
                      onClick={() => {
                        setSelectedEmail(email)
                        if (!email.isRead) markAsRead(email.id)
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-sm truncate flex-1">
                          {email.from}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {new Date(email.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold mb-1 truncate">
                        {email.subject}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {email.body.substring(0, 100)}...
                      </div>
                      <div className="flex gap-2 mt-2">
                        {!email.isRead && (
                          <Badge variant="default" className="text-xs">Unread</Badge>
                        )}
                        {email.hasReceipt && (
                          <Badge variant="secondary" className="text-xs">Receipt</Badge>
                        )}
                        {email.attachments && email.attachments.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {email.attachments.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Email Details</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {!selectedEmail ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Mail className="w-12 h-9 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select an email to view details</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">{selectedEmail.subject}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">From:</span>
                        <span>{selectedEmail.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">To:</span>
                        <span>{selectedEmail.to.join(", ")}</span>
                      </div>
                      {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">CC:</span>
                          <span>{selectedEmail.cc.join(", ")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="whitespace-pre-wrap text-sm">
                    {selectedEmail.body}
                  </div>

                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="font-medium mb-2">Attachments ({selectedEmail.attachments.length})</div>
                        <div className="space-y-2">
                          {selectedEmail.attachments.map(attachment => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 p-2 border rounded-lg"
                            >
                              <Paperclip className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{attachment.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleReply(selectedEmail)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline">
                      <Star className="w-4 h-4 mr-2" />
                      Star
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
