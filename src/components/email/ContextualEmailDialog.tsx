/**
 * Contextual Email Compose Dialog
 *
 * Standalone compose dialog that can be opened from anywhere in the app.
 * Supports AI-generated email text and pre-populated fields.
 */

import { Mail, Send, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { EmailContext } from './email-templates'
import { getEmailTemplate, buildAIPrompt } from './email-templates'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { msOfficeService } from '@/lib/msOfficeIntegration'
import { sendMessage } from '@/services/aiService'

interface ContextualEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  context?: EmailContext
}

export function ContextualEmailDialog({
  open,
  onOpenChange,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  context,
}: ContextualEmailDialogProps) {
  const [to, setTo] = useState(defaultTo)
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Re-sync defaults when dialog opens with new props
  const [lastDefaults, setLastDefaults] = useState({ to: '', subject: '', body: '' })
  if (
    open &&
    (defaultTo !== lastDefaults.to ||
      defaultSubject !== lastDefaults.subject ||
      defaultBody !== lastDefaults.body)
  ) {
    setTo(defaultTo)
    setSubject(defaultSubject)
    setBody(defaultBody)
    setCc('')
    setLastDefaults({ to: defaultTo, subject: defaultSubject, body: defaultBody })
  }

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast.error('Please fill in all required fields (To, Subject, Message)')
      return
    }

    try {
      setSending(true)
      const toAddresses = to.split(',').map((e) => e.trim()).filter(Boolean)
      const ccAddresses = cc ? cc.split(',').map((e) => e.trim()).filter(Boolean) : undefined

      await msOfficeService.sendEmail(toAddresses, subject, body, ccAddresses)
      toast.success('Email sent successfully')
      onOpenChange(false)
      resetForm()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!context) return

    try {
      setGenerating(true)
      const prompt = buildAIPrompt(context)
      const response = await sendMessage(prompt, 'openai', [], undefined, 'operations')

      if (response.content && !response.error) {
        setBody(response.content)
        // Also fill subject if empty
        if (!subject) {
          const template = getEmailTemplate(context)
          setSubject(template.subject)
        }
        toast.success('AI draft generated')
      } else {
        // Fallback to template
        applyTemplate()
        toast.info('Using template (AI unavailable)')
      }
    } catch {
      // Fallback to template on error
      applyTemplate()
      toast.info('Using template (AI unavailable)')
    } finally {
      setGenerating(false)
    }
  }

  const applyTemplate = () => {
    if (!context) return
    const template = getEmailTemplate(context)
    if (!subject) setSubject(template.subject)
    setBody(template.body)
  }

  const resetForm = () => {
    setTo('')
    setCc('')
    setSubject('')
    setBody('')
    setLastDefaults({ to: '', subject: '', body: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            {context
              ? `Compose a contextual email${context.entityName ? ` for ${context.entityName}` : ''}`
              : 'Compose and send an email'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ctx-email-to">To *</Label>
            <Input
              id="ctx-email-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ctx-email-cc">CC</Label>
            <Input
              id="ctx-email-cc"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="cc@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ctx-email-subject">Subject *</Label>
            <Input
              id="ctx-email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ctx-email-body">Message *</Label>
              {context && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAIGenerate}
                  disabled={generating}
                  className="h-7 text-xs gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {generating ? 'Generating...' : 'AI Generate'}
                </Button>
              )}
            </div>
            <Textarea
              id="ctx-email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Type your message..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
