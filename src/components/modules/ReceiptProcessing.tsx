import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Receipt, Upload, Scan, CheckCircle, X, Image, FileText } from "@phosphor-icons/react"
import { Receipt as ReceiptType } from "@/lib/types"
import { msOfficeService } from "@/lib/msOfficeIntegration"
import { aiAssistant } from "@/lib/aiAssistant"
import { toast } from "sonner"

export function ReceiptProcessing() {
  const [receipts, setReceipts] = useState<ReceiptType[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newReceipt, setNewReceipt] = useState<Partial<ReceiptType>>({
    category: "fuel",
    status: "pending",
    paymentMethod: "corporate-card"
  })

  const [ocrPreview, setOcrPreview] = useState<{
    imageUrl: string
    data: ReceiptType["ocrData"]
    confidence: number
  } | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simulate file upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file)

      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const ocrData = await msOfficeService.extractReceiptData(file)
      
      // Use AI to analyze and categorize
      const receiptText = `${ocrData?.merchantName || ""} ${ocrData?.total || ""} ${ocrData?.items?.map(i => i.description).join(" ") || ""}`
      const analysis = await aiAssistant.analyzeReceipt(receiptText)

      clearInterval(progressInterval)
      setUploadProgress(100)

      setOcrPreview({
        imageUrl,
        data: ocrData,
        confidence: analysis.confidence
      })

      setNewReceipt(prev => ({
        ...prev,
        vendor: analysis.vendor,
        amount: analysis.amount,
        category: analysis.category as ReceiptType["category"],
        date: ocrData?.date || new Date().toISOString(),
        imageUrl
      }))

      toast.success("Receipt processed successfully")
    } catch (error) {
      toast.error("Failed to process receipt")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveReceipt = () => {
    if (!newReceipt.vendor || !newReceipt.amount) {
      toast.error("Please fill in required fields")
      return
    }

    const receipt: ReceiptType = {
      id: `receipt-${Date.now()}`,
      date: newReceipt.date || new Date().toISOString(),
      vendor: newReceipt.vendor,
      category: newReceipt.category as ReceiptType["category"],
      amount: newReceipt.amount,
      taxAmount: newReceipt.taxAmount || 0,
      paymentMethod: newReceipt.paymentMethod || "corporate-card",
      status: "pending",
      submittedBy: "Current User",
      imageUrl: newReceipt.imageUrl,
      ocrData: ocrPreview?.data,
      vehicleId: newReceipt.vehicleId,
      driverId: newReceipt.driverId,
      workOrderId: newReceipt.workOrderId,
      notes: newReceipt.notes
    }

    setReceipts(current => [...(current || []), receipt])
    toast.success("Receipt saved successfully")
    setIsUploadDialogOpen(false)
    resetForm()
  }

  const handleApprove = (receiptId: string) => {
    setReceipts(current => 
      (current || []).map(r => 
        r.id === receiptId 
          ? { ...r, status: "approved" as const, approvedBy: "Fleet Manager" }
          : r
      )
    )
    toast.success("Receipt approved")
  }

  const handleReject = (receiptId: string) => {
    setReceipts(current => 
      (current || []).map(r => 
        r.id === receiptId 
          ? { ...r, status: "rejected" as const, approvedBy: "Fleet Manager" }
          : r
      )
    )
    toast.success("Receipt rejected")
  }

  const resetForm = () => {
    setNewReceipt({
      category: "fuel",
      status: "pending",
      paymentMethod: "corporate-card"
    })
    setOcrPreview(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStatusColor = (status: ReceiptType["status"]) => {
    const colors: Record<ReceiptType["status"], string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      reimbursed: "bg-blue-100 text-blue-700"
    }
    return colors[status]
  }

  const getCategoryColor = (category: ReceiptType["category"]) => {
    const colors: Record<ReceiptType["category"], string> = {
      fuel: "bg-orange-100 text-orange-700",
      maintenance: "bg-blue-100 text-blue-700",
      parts: "bg-purple-100 text-purple-700",
      service: "bg-green-100 text-green-700",
      toll: "bg-cyan-100 text-cyan-700",
      parking: "bg-pink-100 text-pink-700",
      other: "bg-gray-100 text-gray-700"
    }
    return colors[category]
  }

  const totalPending = (receipts || []).filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0)
  const totalApproved = (receipts || []).filter(r => r.status === "approved").reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Receipt Processing</h2>
          <p className="text-muted-foreground">Automated OCR extraction and expense tracking</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Receipt</DialogTitle>
              <DialogDescription>
                Upload a receipt image for automatic OCR extraction
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <Label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Image className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-sm font-medium">
                      {isProcessing ? "Processing..." : "Click to upload receipt image"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG up to 10MB
                    </div>
                  </div>
                </Label>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Processing with OCR...</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {ocrPreview && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-medium">Extracted Data</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Confidence:</span>
                        <Badge variant="secondary">{Math.round(ocrPreview.confidence * 100)}%</Badge>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Merchant:</div>
                        <div className="font-medium">{ocrPreview.data?.merchantName}</div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Total:</div>
                        <div className="font-medium">${ocrPreview.data?.total}</div>
                      </div>
                      {ocrPreview.data?.items && ocrPreview.data.items.length > 0 && (
                        <div className="p-2 bg-muted rounded">
                          <div className="text-muted-foreground mb-1">Items:</div>
                          {ocrPreview.data.items.map((item, idx) => (
                            <div key={idx} className="text-xs flex justify-between">
                              <span>{item.description}</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Preview</h3>
                    <img 
                      src={ocrPreview.imageUrl} 
                      alt="Receipt preview" 
                      className="w-full rounded border"
                    />
                  </div>
                </div>
              )}

              {ocrPreview && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receipt-vendor">Vendor *</Label>
                    <Input
                      id="receipt-vendor"
                      value={newReceipt.vendor}
                      onChange={e => setNewReceipt({ ...newReceipt, vendor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt-amount">Amount *</Label>
                    <Input
                      id="receipt-amount"
                      type="number"
                      step="0.01"
                      value={newReceipt.amount}
                      onChange={e => setNewReceipt({ ...newReceipt, amount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt-category">Category</Label>
                    <Select
                      value={newReceipt.category}
                      onValueChange={value => setNewReceipt({ ...newReceipt, category: value as ReceiptType["category"] })}
                    >
                      <SelectTrigger id="receipt-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="parts">Parts</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="toll">Toll</SelectItem>
                        <SelectItem value="parking">Parking</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt-payment">Payment Method</Label>
                    <Select
                      value={newReceipt.paymentMethod}
                      onValueChange={value => setNewReceipt({ ...newReceipt, paymentMethod: value })}
                    >
                      <SelectTrigger id="receipt-payment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporate-card">Corporate Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="reimbursement">Employee Reimbursement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="receipt-notes">Notes</Label>
                    <Textarea
                      id="receipt-notes"
                      value={newReceipt.notes}
                      onChange={e => setNewReceipt({ ...newReceipt, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsUploadDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveReceipt} disabled={!ocrPreview}>
                Save Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(receipts || []).length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <FileText className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Receipt className="w-3 h-3" />
              {(receipts || []).filter(r => r.status === "pending").length} receipts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalApproved.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              {(receipts || []).filter(r => r.status === "approved").length} receipts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">OCR Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <Scan className="w-3 h-3" />
              High confidence
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipts ({(receipts || []).length})</CardTitle>
          <CardDescription>Submitted expenses awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(receipts || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No receipts found. Upload your first receipt to get started.
                  </TableCell>
                </TableRow>
              ) : (
                (receipts || []).map(receipt => (
                  <TableRow key={receipt.id}>
                    <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{receipt.vendor}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(receipt.category)} variant="secondary">
                        {receipt.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">${receipt.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{receipt.paymentMethod}</TableCell>
                    <TableCell>{receipt.submittedBy}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(receipt.status)} variant="secondary">
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {receipt.status === "pending" && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleApprove(receipt.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReject(receipt.id)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                      {receipt.imageUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedReceipt(receipt)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
