/**
 * EmailDetailPanel - Complete email detail view with full drilldown support
 *
 * Displays individual email records with all details, attachments,
 * and actions. Supports drilling to related records (vendors, work orders, etc.)
 */

import {
  Paperclip,
  Star,
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Archive,
  Tag,
  Clock,
  User,
  Building,
  FileText,
  Download,
  ExternalLink,
  Eye,
} from 'lucide-react'
import React from 'react'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'

// ============================================================================
// TYPES
// ============================================================================

export interface EmailRecord {
  id: string
  subject: string
  from: string
  fromName?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  date: string
  body: string
  bodyHtml?: string
  isRead: boolean
  isStarred?: boolean
  hasAttachments?: boolean
  attachments?: Array<{
    id: string
    name: string
    size: number
    type: string
    url?: string
  }>
  labels?: string[]
  folder?: string
  priority?: 'high' | 'normal' | 'low'
  threadId?: string
  threadCount?: number
  // Related records
  relatedVendorId?: string
  relatedVendorName?: string
  relatedWorkOrderId?: string
  relatedInvoiceId?: string
  relatedDriverId?: string
  relatedVehicleId?: string
  hasReceipt?: boolean
}

interface EmailDetailPanelProps {
  emailId?: string
  email?: EmailRecord
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function EmailHeader({ email }: { email: EmailRecord }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate pr-2">{email.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            {email.priority === 'high' && (
              <Badge variant="destructive" className="text-xs">High Priority</Badge>
            )}
            {email.hasReceipt && (
              <Badge variant="secondary" className="text-xs">Receipt</Badge>
            )}
            {email.isStarred && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
            {!email.isRead && (
              <Badge className="bg-blue-500 text-white text-xs">Unread</Badge>
            )}
          </div>
        </div>
        {email.folder && (
          <Badge variant="outline" className="shrink-0">{email.folder}</Badge>
        )}
      </div>
    </div>
  )
}

function EmailParticipants({ email, push }: { email: EmailRecord; push: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Participants
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground uppercase">From</div>
            <div className="font-medium truncate">
              {email.fromName || email.from}
            </div>
            <div className="text-sm text-muted-foreground truncate">{email.from}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <User className="w-4 h-4 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground uppercase">To</div>
            <div className="space-y-1">
              {email.to.map((recipient, i) => (
                <div key={i} className="text-sm truncate">{recipient}</div>
              ))}
            </div>
          </div>
        </div>

        {email.cc && email.cc.length > 0 && (
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 mt-1 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground uppercase">CC</div>
              <div className="space-y-1">
                {email.cc.map((recipient, i) => (
                  <div key={i} className="text-sm truncate">{recipient}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground uppercase">Date</div>
            <div className="text-sm">
              {new Date(email.date).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmailBody({ email }: { email: EmailRecord }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Message
        </CardTitle>
      </CardHeader>
      <CardContent>
        {email.bodyHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {email.body}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmailAttachments({ email }: { email: EmailRecord }) {
  if (!email.attachments || email.attachments.length === 0) return null

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('document') || type.includes('word')) return '📝'
    return '📎'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments ({email.attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {email.attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm">{getFileIcon(attachment.type)}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{attachment.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RelatedRecords({ email, push }: { email: EmailRecord; push: any }) {
  const hasRelatedRecords = email.relatedVendorId || email.relatedWorkOrderId ||
                           email.relatedInvoiceId || email.relatedDriverId ||
                           email.relatedVehicleId

  if (!hasRelatedRecords) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Related Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {email.relatedVendorId && (
            <div
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => push({
                id: `vendor-${email.relatedVendorId}`,
                type: 'vendor',
                label: email.relatedVendorName || 'Vendor',
                data: { vendorId: email.relatedVendorId }
              })}
            >
              <Building className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Vendor</div>
                <div className="text-xs text-muted-foreground">
                  {email.relatedVendorName || email.relatedVendorId}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">View</Badge>
            </div>
          )}

          {email.relatedWorkOrderId && (
            <div
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => push({
                id: `workorder-${email.relatedWorkOrderId}`,
                type: 'workOrder',
                label: `Work Order ${email.relatedWorkOrderId}`,
                data: { workOrderId: email.relatedWorkOrderId }
              })}
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Work Order</div>
                <div className="text-xs text-muted-foreground">
                  WO-{email.relatedWorkOrderId}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">View</Badge>
            </div>
          )}

          {email.relatedInvoiceId && (
            <div
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => push({
                id: `invoice-${email.relatedInvoiceId}`,
                type: 'invoice',
                label: `Invoice ${email.relatedInvoiceId}`,
                data: { invoiceId: email.relatedInvoiceId }
              })}
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Invoice</div>
                <div className="text-xs text-muted-foreground">
                  INV-{email.relatedInvoiceId}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">View</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmailLabels({ email }: { email: EmailRecord }) {
  if (!email.labels || email.labels.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="w-4 h-4 text-muted-foreground" />
      {email.labels.map((label, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {label}
        </Badge>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EmailDetailPanel({ emailId, email: providedEmail }: EmailDetailPanelProps) {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  // Construct email from props or drilldown context
  const email: EmailRecord = providedEmail || {
    id: emailId || data.emailId || data.id || 'unknown',
    subject: data.subject || 'No Subject',
    from: data.from || data.sender || 'unknown@example.com',
    fromName: data.fromName || data.senderName,
    to: data.to || data.recipients || ['recipient@example.com'],
    cc: data.cc,
    bcc: data.bcc,
    date: data.date || data.sentAt || new Date().toISOString(),
    body: data.body || data.content || 'No content available.',
    bodyHtml: data.bodyHtml,
    isRead: data.isRead !== undefined ? data.isRead : true,
    isStarred: data.isStarred || data.starred,
    hasAttachments: data.hasAttachments || (data.attachments && data.attachments.length > 0),
    attachments: data.attachments || [],
    labels: data.labels || data.tags,
    folder: data.folder || data.category,
    priority: data.priority,
    threadId: data.threadId,
    threadCount: data.threadCount,
    relatedVendorId: data.relatedVendorId,
    relatedVendorName: data.relatedVendorName,
    relatedWorkOrderId: data.relatedWorkOrderId,
    relatedInvoiceId: data.relatedInvoiceId,
    relatedDriverId: data.relatedDriverId,
    relatedVehicleId: data.relatedVehicleId,
    hasReceipt: data.hasReceipt,
  }

  return (
    <DrilldownContent>
      <div className="space-y-2">
        {/* Header */}
        <EmailHeader email={email} />

        <Separator />

        {/* Labels */}
        <EmailLabels email={email} />

        {/* Participants */}
        <EmailParticipants email={email} push={push} />

        {/* Message Body */}
        <EmailBody email={email} />

        {/* Attachments */}
        <EmailAttachments email={email} />

        {/* Related Records */}
        <RelatedRecords email={email} push={push} />

        {/* Thread Info */}
        {email.threadCount && email.threadCount > 1 && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  This email is part of a thread with {email.threadCount} messages
                </div>
                <Button variant="outline" size="sm">View Thread</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-2">
            <Reply className="w-4 h-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ReplyAll className="w-4 h-4" />
            Reply All
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Forward className="w-4 h-4" />
            Forward
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </DrilldownContent>
  )
}

export default EmailDetailPanel
