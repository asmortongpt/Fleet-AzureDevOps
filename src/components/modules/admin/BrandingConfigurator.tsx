/**
 * Branding Configuration Component
 * Allows administrators to customize document branding
 */

import {
  Building,
  Palette,
  FileText,
  Image as ImageIcon,
  TextAa,
  FloppyDisk,
  Eye,
  ArrowCounterClockwise,
  Upload
} from '@phosphor-icons/react'
import { useMemo, useEffect, useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { BrandingConfig } from '@/lib/document-generation/branding-config'
import {
  loadBrandingConfig,
  saveBrandingConfig,
  defaultBrandingConfig,
  brandingTemplates,
  applyBrandingTemplate
} from '@/lib/document-generation/branding-config'
import { previewDocument } from '@/lib/document-generation/document-generator'
import type { PolicyDocument } from '@/lib/document-generation/document-generator'

export function BrandingConfigurator() {
  const [config, setConfig] = useState<BrandingConfig>(loadBrandingConfig())
  const [hasChanges, setHasChanges] = useState(false)
  const { data: policyResponse } = useSWR<{ data?: any[] }>(
    '/api/policies?limit=1',
    (url: string) =>
      fetch(url, { credentials: 'include' })
        .then(res => res.json())
        .then(data => data?.data ?? data),
    { shouldRetryOnError: false }
  )

  const policyForPreview = useMemo(() => {
    const policies = Array.isArray(policyResponse?.data) ? policyResponse?.data : Array.isArray(policyResponse) ? policyResponse : []
    return policies[0]
  }, [policyResponse])

  useEffect(() => {
    const loaded = loadBrandingConfig()
    setConfig(loaded)
  }, [])

  const handleSave = () => {
    saveBrandingConfig(config)
    setHasChanges(false)
    toast.success('Branding configuration saved successfully')
  }

  const handleReset = () => {
    setConfig(defaultBrandingConfig)
    setHasChanges(true)
    toast('Reset to default configuration')
  }

  const handleApplyTemplate = (templateName: string) => {
    const newConfig = applyBrandingTemplate(templateName as keyof typeof brandingTemplates, config)
    setConfig(newConfig)
    setHasChanges(true)
    toast.success(`Applied ${templateName} template`)
  }

  const handlePreview = () => {
    if (!policyForPreview) {
      toast.error('No policy data available for preview')
      return
    }

    const parseContent = (content: any) => {
      if (!content) return {}
      if (typeof content === 'string') {
        try {
          return JSON.parse(content)
        } catch {
          return {}
        }
      }
      if (typeof content === 'object') return content
      return {}
    }

    const content = parseContent(policyForPreview.content)
    const document: PolicyDocument = {
      metadata: {
        documentNumber: String(content.documentNumber ?? policyForPreview.number ?? policyForPreview.id ?? ''),
        title: String(content.title ?? policyForPreview.name ?? ''),
        version: String(content.version ?? policyForPreview.version ?? ''),
        status: (content.status ?? (policyForPreview.is_active ? 'active' : 'draft')) as PolicyDocument['metadata']['status'],
        effectiveDate: content.effectiveDate ? new Date(content.effectiveDate) : undefined,
        owner: String(content.owner ?? policyForPreview.created_by ?? ''),
        approver: content.approver,
        department: content.department,
        category: String(content.category ?? policyForPreview.category ?? ''),
        tags: Array.isArray(content.tags) ? content.tags : undefined
      },
      purpose: String(content.purpose ?? policyForPreview.description ?? ''),
      scope: String(content.scope ?? ''),
      definitions: content.definitions,
      policyStatements: Array.isArray(content.policyStatements) ? content.policyStatements : [],
      procedures: content.procedures,
      compliance: Array.isArray(content.compliance) ? content.compliance : [],
      relatedPolicies: Array.isArray(content.relatedPolicies) ? content.relatedPolicies : [],
      kpis: Array.isArray(content.kpis) ? content.kpis : [],
      revisionHistory: Array.isArray(content.revisionHistory)
        ? content.revisionHistory.map((entry: any) => ({
            version: String(entry.version ?? ''),
            date: entry.date
              ? new Date(entry.date)
              : policyForPreview?.updated_at
                ? new Date(policyForPreview.updated_at)
                : policyForPreview?.created_at
                  ? new Date(policyForPreview.created_at)
                  : new Date(),
            author: String(entry.author ?? ''),
            description: String(entry.description ?? '')
          }))
        : undefined,
      approvals: Array.isArray(content.approvals) ? content.approvals : undefined,
      attachments: Array.isArray(content.attachments) ? content.attachments : undefined
    }

    previewDocument(document, config)
  }

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.')
    const newConfig = { ...config }
    let current: any = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setConfig(newConfig)
    setHasChanges(true)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        updateConfig('logo.base64', event.target?.result as string)
        toast.success('Logo uploaded successfully')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Document Branding Configuration</h2>
          <p className="text-slate-700 mt-1">Customize the appearance of exported policy and SOP documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <ArrowCounterClockwise className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <FloppyDisk className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-3 h-3" />
            Quick Templates
          </CardTitle>
          <CardDescription>Apply pre-configured branding templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.keys(brandingTemplates).map((templateName) => (
              <Button
                key={templateName}
                variant="outline"
                onClick={() => handleApplyTemplate(templateName)}
                className="h-auto py-2 flex flex-col items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="capitalize">{templateName}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="organization" className="space-y-2">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="organization">
            <Building className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="logo">
            <ImageIcon className="w-4 h-4 mr-2" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="w-4 h-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <TextAa className="w-4 h-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout">
            <FileText className="w-4 h-4 mr-2" />
            Layout
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Information displayed on documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={config.organization.name}
                    onChange={(e) => updateConfig('organization.name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Legal Name (Optional)</Label>
                  <Input
                    value={config.organization.legalName || ''}
                    onChange={(e) => updateConfig('organization.legalName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={config.organization.department || ''}
                  onChange={(e) => updateConfig('organization.department', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={config.organization.address || ''}
                  onChange={(e) => updateConfig('organization.address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={config.organization.city || ''}
                    onChange={(e) => updateConfig('organization.city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={config.organization.state || ''}
                    onChange={(e) => updateConfig('organization.state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input
                    value={config.organization.zip || ''}
                    onChange={(e) => updateConfig('organization.zip', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={config.organization.phone || ''}
                    onChange={(e) => updateConfig('organization.phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={config.organization.email || ''}
                    onChange={(e) => updateConfig('organization.email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={config.organization.website || ''}
                  onChange={(e) => updateConfig('organization.website', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo Configuration</CardTitle>
              <CardDescription>Upload and configure your organization's logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <Label>Upload Logo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {config.logo.base64 && (
                  <div className="mt-2">
                    <img
                      src={config.logo.base64}
                      alt="Logo preview"
                      className="max-w-xs border border-slate-700 rounded p-2 bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={config.logo.position || 'left'}
                    onValueChange={(value) => updateConfig('logo.position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    value={config.logo.width || 150}
                    onChange={(e) => updateConfig('logo.width', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={config.logo.height || 75}
                    onChange={(e) => updateConfig('logo.height', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Customize document colors and theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(config.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                        className="w-16 h-8"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>Configure fonts and text sizing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={config.typography.fontFamily}
                  onValueChange={(value) => updateConfig('typography.fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                    <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(config.typography.fontSize).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key}</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateConfig(`typography.fontSize.${key}`, parseInt(e.target.value))}
                      min={8}
                      max={72}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Line Height</Label>
                <Input
                  type="number"
                  value={config.typography.lineHeight}
                  onChange={(e) => updateConfig('typography.lineHeight', parseFloat(e.target.value))}
                  step={0.1}
                  min={1}
                  max={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout & Formatting</CardTitle>
              <CardDescription>Configure headers, footers, and document structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Header Settings */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Header</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Logo</Label>
                    <Switch
                      checked={config.header.showLogo}
                      onCheckedChange={(checked) => updateConfig('header.showLogo', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Organization Name</Label>
                    <Switch
                      checked={config.header.showOrgName}
                      onCheckedChange={(checked) => updateConfig('header.showOrgName', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Department</Label>
                    <Switch
                      checked={config.header.showDepartment}
                      onCheckedChange={(checked) => updateConfig('header.showDepartment', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Header Text (Optional)</Label>
                  <Input
                    value={config.header.customText || ''}
                    onChange={(e) => updateConfig('header.customText', e.target.value)}
                    placeholder="e.g., Quality Management System"
                  />
                </div>
              </div>

              {/* Footer Settings */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Footer</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Page Numbers</Label>
                    <Switch
                      checked={config.footer.showPageNumbers}
                      onCheckedChange={(checked) => updateConfig('footer.showPageNumbers', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Date</Label>
                    <Switch
                      checked={config.footer.showDate}
                      onCheckedChange={(checked) => updateConfig('footer.showDate', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Confidentiality Notice</Label>
                    <Switch
                      checked={config.footer.showConfidentiality}
                      onCheckedChange={(checked) => updateConfig('footer.showConfidentiality', checked)}
                    />
                  </div>
                </div>
                {config.footer.showConfidentiality && (
                  <div className="space-y-2">
                    <Label>Confidentiality Text</Label>
                    <Textarea
                      value={config.footer.confidentialityText || ''}
                      onChange={(e) => updateConfig('footer.confidentialityText', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Watermark Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Watermark</h3>
                  <Switch
                    checked={config.watermark?.enabled || false}
                    onCheckedChange={(checked) => updateConfig('watermark.enabled', checked)}
                  />
                </div>
                {config.watermark?.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Watermark Text</Label>
                      <Input
                        value={config.watermark.text}
                        onChange={(e) => updateConfig('watermark.text', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={config.watermark.fontSize}
                        onChange={(e) => updateConfig('watermark.fontSize', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Opacity</Label>
                      <Input
                        type="number"
                        value={config.watermark.opacity}
                        onChange={(e) => updateConfig('watermark.opacity', parseFloat(e.target.value))}
                        step={0.05}
                        min={0}
                        max={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation (degrees)</Label>
                      <Input
                        type="number"
                        value={config.watermark.rotation}
                        onChange={(e) => updateConfig('watermark.rotation', parseInt(e.target.value))}
                        min={-180}
                        max={180}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BrandingConfigurator
