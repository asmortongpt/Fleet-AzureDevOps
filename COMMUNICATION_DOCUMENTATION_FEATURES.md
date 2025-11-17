# Fleet Application: Communication & Documentation Features
## Comprehensive Feature Documentation

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Thoroughness Level:** Very Thorough

---

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [EmailCenter](#emailcenter)
3. [CommunicationLog](#communicationlog)
4. [ReceiptProcessing](#receiptprocessing)
5. [DocumentScanner](#documentscanner)
6. [TeamsIntegration](#teamsintegration)
7. [Integration Architecture](#integration-architecture)
8. [Test Scenarios](#test-scenarios)

---

## Feature Overview

The Communication & Documentation module in the Fleet application provides comprehensive tools for managing fleet-related communications, document processing, and expense tracking. These features enable seamless collaboration between fleet managers, technicians, drivers, vendors, and administrative staff.

### Key Capabilities:
- Email management with Outlook integration
- Unified communication logging and audit trails
- Automated receipt processing with OCR
- Intelligent document scanning and analysis
- Microsoft Teams team collaboration
- Cross-system integration for workflow automation

---

## 1. EmailCenter

### Feature Description
The EmailCenter module provides integrated email management capabilities within the Fleet application, allowing users to compose, send, and organize emails directly through Microsoft Outlook without leaving the application interface.

### Location
`/src/components/modules/EmailCenter.tsx`

### Target Users
- Fleet Managers
- Operations Coordinators
- Vendor Managers
- Administrative Staff
- Dispatch Personnel

### User Stories

#### 1.1 Fleet Manager Email Management
**As a** fleet manager,  
**I want to** send maintenance requests to vendors directly through the application,  
**so that** I can maintain a centralized communication history and automatically link emails to vehicles and work orders.

#### 1.2 Vendor Communication
**As a** vendor manager,  
**I want to** receive and respond to fleet-related emails within the application,  
**so that** all vendor communications are logged for compliance and audit purposes.

#### 1.3 Receipt Email Processing
**As an** operations coordinator,  
**I want to** receive receipts via email and have them automatically identified and categorized,  
**so that** I can quickly process expense claims without manual data entry.

#### 1.4 Email Organization & Filtering
**As a** fleet administrator,  
**I want to** filter emails by type (unread, receipts, vendor communications),  
**so that** I can quickly locate important messages and prioritize responses.

#### 1.5 Email Reply & Collaboration
**As a** technician,  
**I want to** reply to work order-related emails directly in the application,  
**so that** all communication threads are preserved in the system.

### Key Workflows

#### Workflow 1: Send Maintenance Request Email
```
START
  ├─ User clicks "Compose Email" button
  ├─ System opens compose dialog
  ├─ User fills in required fields:
  │   ├─ To (recipient email)
  │   ├─ CC (optional)
  │   ├─ Subject
  │   └─ Message body
  ├─ System validates input fields
  ├─ User submits email
  ├─ System calls msOfficeService.sendEmail()
  ├─ Email is sent through Outlook
  ├─ System adds email to local state
  ├─ Success notification displayed
  └─ Compose dialog closes
END
```

#### Workflow 2: Filter & View Emails
```
START
  ├─ User navigates to EmailCenter
  ├─ System displays initial inbox with all emails
  ├─ User selects filter category:
  │   ├─ All Mail
  │   ├─ Unread
  │   ├─ Receipts
  │   └─ Vendor Emails
  ├─ System filters email list based on selection
  ├─ User clicks on email in list
  ├─ System marks email as read (if unread)
  ├─ Email details panel displays:
  │   ├─ Subject and headers
  │   ├─ Full message body
  │   ├─ Attachments (if any)
  │   └─ Action buttons (Reply, Star)
  └─ User can reply or perform other actions
END
```

#### Workflow 3: Reply to Email
```
START
  ├─ User selects email and clicks "Reply"
  ├─ System pre-populates compose form:
  │   ├─ To field = original sender
  │   ├─ Subject = "Re: [Original Subject]"
  │   └─ Body = quoted original message
  ├─ User modifies message content
  ├─ User sends reply
  ├─ System processes reply same as new email
  ├─ Reply is added to email thread
  └─ Confirmation displayed
END
```

### Core Functionality & Features

#### Email Composition
- **Multi-recipient support:** Send to multiple recipients using comma-separated addresses
- **CC functionality:** Add carbon copy recipients for visibility
- **Rich text composition:** Support for formatted message bodies
- **Draft handling:** Preserve unsent emails in compose dialog

#### Email Display & Organization
- **List view:** Displays sender, subject, preview, and date
- **Status indicators:** Visual badges for unread status, receipts, and attachments
- **Detail pane:** Full email view with headers, body, and attachments
- **Unread highlighting:** Blue background indicates unread messages
- **Selected highlighting:** Muted background shows selected email

#### Email Filtering
- **All Mail:** Shows all emails in inbox
- **Unread:** Shows only unread messages with count badge
- **Receipts:** Filters emails marked with receipt flag
- **Vendor Emails:** Shows emails related to vendor communications
- **Dynamic badge counts:** Real-time count of emails in each category

#### Attachment Handling
- **Attachment display:** Shows attachment name and file size
- **Attachment information:** File size in KB, grouped display
- **Visual indicators:** Paperclip icon with count in email list

#### Email-Entity Relationships
- **Vehicle linking:** Email can be related to specific vehicles
- **Work order linking:** Email can reference work orders
- **Vendor tracking:** Email source linked to vendor database
- **Automatic receipt detection:** System identifies receipt emails

### Data Inputs and Outputs

#### Inputs
- Email address(es) for recipient
- CC address(es) for visibility
- Email subject line
- Email body text
- File attachments (via drag-drop or file selection)
- Filter selection (category)
- Search/sort parameters

#### Outputs
- Sent email record (MSOutlookEmail object)
- Updated inbox list with new email
- Toast notification (success/error)
- Email details for selected message
- Updated filter counts
- Reply email with quoted text

#### Data Structure (MSOutlookEmail)
```typescript
{
  id: string                    // Unique email identifier
  subject: string               // Email subject line
  from: string                  // Sender email address
  to: string[]                  // Array of recipient addresses
  cc?: string[]                 // Array of CC addresses
  date: string                  // ISO timestamp of email date
  body: string                  // Full email body content
  attachments?: EmailAttachment[] // File attachments array
  isRead: boolean               // Read status flag
  category?: string             // Optional email category
  relatedVehicleId?: string     // Link to vehicle
  relatedWorkOrderId?: string   // Link to work order
  relatedVendorId?: string      // Link to vendor
  hasReceipt: boolean           // Receipt detection flag
}
```

### Integration Points

#### 1. Microsoft Outlook Integration
- **Service:** `msOfficeService.sendEmail()`
- **Function:** Sends email through Outlook
- **Parameters:** to addresses, subject, body, cc addresses, attachments
- **Return:** Created MSOutlookEmail object with ID and timestamp
- **Status:** Simulated in current implementation, ready for real Outlook API

#### 2. Receipt Processing Integration
- **Trigger:** Emails flagged as containing receipts
- **Action:** Emails appear in "Receipts" filter category
- **Data Flow:** Receipt detection linked to Receipt Processing module
- **Automation:** Can trigger automatic receipt extraction workflow

#### 3. Communication Log Integration
- **Relationship:** Emails automatically create communication log entries
- **Audit Trail:** All email communications logged for compliance
- **Participant Tracking:** Email participants added to communication logs
- **Linking:** Email-to-workorder relationships mirror in communication logs

#### 4. Work Order System Integration
- **Auto-linking:** Work order creation can generate related emails
- **Status Updates:** Work order changes can trigger email notifications
- **Vendor Communication:** Maintenance requests sent via email
- **Bidirectional:** Vendor responses tracked and linked to work orders

#### 5. Vendor Management Integration
- **Vendor Filtering:** View all emails from specific vendors
- **Vendor History:** Complete email thread with each vendor
- **Contact Sync:** Vendor contact information from Outlook sync
- **Performance Tracking:** Email responsiveness tracked for vendor ratings

---

## 2. CommunicationLog

### Feature Description
The CommunicationLog module provides a comprehensive audit trail of all fleet-related communications across multiple channels (email, Teams, phone, SMS, in-person meetings). It enables tracking of conversations, participants, and follow-up items for regulatory compliance and operational continuity.

### Location
`/src/components/modules/CommunicationLog.tsx`

### Target Users
- Fleet Operations Managers
- Compliance Officers
- Dispatch Supervisors
- HR/Administrative Staff
- Quality Assurance Teams
- Legal/Audit Teams

### User Stories

#### 2.1 Communication Audit Trail
**As a** compliance officer,  
**I want to** maintain a complete log of all fleet communications with timestamps and participants,  
**so that** I can demonstrate regulatory compliance and resolve disputes with evidence.

#### 2.2 Follow-up Management
**As an** operations manager,  
**I want to** mark communications requiring follow-up action with due dates,  
**so that** I can track pending items and ensure timely resolution.

#### 2.3 Multi-channel Communication Recording
**As a** supervisor,  
**I want to** log communications from various channels (email, Teams, phone, SMS, meetings),  
**so that** all interactions are recorded in a single unified system.

#### 2.4 Communication Search & Filtering
**As an** administrator,  
**I want to** search through communications by keyword, participant, or type,  
**so that** I can quickly find relevant conversations.

#### 2.5 Related Entity Linking
**As a** fleet manager,  
**I want to** link communications to vehicles, vendors, and work orders,  
**so that** I can understand the full context of each conversation.

#### 2.6 Follow-up Completion Tracking
**As a** supervisor,  
**I want to** mark follow-ups as complete when actions are finished,  
**so that** I can monitor team accountability and task completion.

### Key Workflows

#### Workflow 1: Log New Communication
```
START
  ├─ User clicks "Log Communication" button
  ├─ System opens dialog with form
  ├─ User selects communication type:
  │   ├─ Email
  │   ├─ Microsoft Teams
  │   ├─ Phone Call
  │   ├─ SMS/Text
  │   └─ In-Person Meeting
  ├─ User enters subject line
  ├─ User adds participants:
  │   ├─ Types participant name/email
  │   ├─ Clicks "Add" or presses Enter
  │   ├─ System displays participant badge
  │   └─ Can remove participants by clicking X
  ├─ User enters communication summary
  ├─ User optionally links to:
  │   ├─ Vehicle ID
  │   ├─ Vendor ID
  │   └─ Work Order ID
  ├─ User optionally marks follow-up required:
  │   ├─ Sets follow-up date
  │   └─ System displays conditional date picker
  ├─ User submits form
  ├─ System validates required fields
  ├─ System creates communication log entry:
  │   ├─ Generates unique ID
  │   ├─ Records current timestamp
  │   ├─ Sets tenant ID
  │   └─ Records creating user
  ├─ Communication added to logs list
  ├─ Success notification displayed
  └─ Dialog closes
END
```

#### Workflow 2: Filter & Search Communications
```
START
  ├─ User views Communication Log page
  ├─ System displays summary statistics:
  │   ├─ Total Communications count
  │   ├─ Today's Activity count
  │   ├─ Pending Follow-ups count
  │   └─ Completion Rate percentage
  ├─ User enters search term in search box
  ├─ System filters by:
  │   ├─ Subject text match
  │   ├─ Summary text match
  │   ├─ Participant name/email match
  ├─ User selects type filter:
  │   ├─ All Types
  │   ├─ Email
  │   ├─ Teams
  │   ├─ Phone
  │   ├─ SMS
  │   └─ In-Person
  ├─ System applies both filters simultaneously
  ├─ Communication table updates in real-time
  ├─ User views filtered results:
  │   ├─ Date and time
  │   ├─ Type badge with icon
  │   ├─ Subject line
  │   ├─ Participant display (first 2 + overflow count)
  │   ├─ Summary preview
  │   └─ Follow-up status
  └─ Results can be sorted by column headers
END
```

#### Workflow 3: Mark Follow-up Complete
```
START
  ├─ User views communication with pending follow-up
  ├─ System shows orange "Required" badge with date
  ├─ User clicks "Mark Complete" button (checkmark icon)
  ├─ System updates follow-up status:
  │   ├─ Sets followUpRequired to false
  │   ├─ Records completion timestamp
  │   └─ Updates UI immediately
  ├─ Badge changes to show completion status
  ├─ Success toast notification displayed
  └─ Statistics update (completion rate, pending count)
END
```

### Core Functionality & Features

#### Communication Logging
- **Multi-type support:** Email, Teams, Phone, SMS, In-Person
- **Participant management:** Add/remove multiple participants
- **Dynamic participant badges:** Visual display of all participants
- **Relationship linking:** Optional vehicle, vendor, work order associations
- **Follow-up scheduling:** Optional follow-up date selection
- **Summary documentation:** Required text field for conversation summary

#### Summary Statistics Dashboard
- **Total Communications:** All-time count of logged communications
- **Today's Activity:** Real-time count of communications logged today
- **Pending Follow-ups:** Count of communications requiring follow-up action
- **Completion Rate:** Percentage of follow-ups completed (dynamic: 96%)
- **Visual indicators:** Icons and color coding for quick scanning

#### Communication Search & Filtering
- **Full-text search:** Searches across subject, summary, and participant names
- **Type filtering:** Filter by communication channel type
- **Real-time results:** Results update as user types/selects
- **Result counts:** Display filtered count in card header
- **No results state:** Empty state message when no matches found

#### Communication Table Display
- **Column headers:** Date, Type, Subject, Participants, Summary, Follow-up, Actions
- **Date display:** Full date and time (locale-formatted)
- **Type badges:** Color-coded badges with icons for each type
- **Participant display:** Shows first 2 participants plus overflow count
- **Summary truncation:** Long summaries truncated with ellipsis
- **Follow-up badge:** Shows follow-up date or "Required" status
- **Action buttons:** Mark complete button for pending follow-ups

#### Type-Specific Icons & Colors
- **Email:** Blue envelope icon, blue background
- **Teams:** Purple chat circle icon, purple background
- **Phone:** Green phone icon, green background
- **SMS:** Cyan device mobile icon, cyan background
- **In-Person:** Orange users icon, orange background

### Data Inputs and Outputs

#### Inputs
- Communication type selection (email, teams, phone, sms, in-person)
- Subject text
- Participant names/emails (multi-entry)
- Communication summary (required textarea)
- Optional vehicle ID
- Optional vendor ID
- Optional work order ID
- Follow-up required checkbox
- Optional follow-up date
- Search term (text)
- Type filter selection

#### Outputs
- CommunicationLog object created and stored
- Updated communication history table
- Toast notification (success/error)
- Summary statistics updated
- Follow-up list updated
- Completion rate calculated

#### Data Structure (CommunicationLog)
```typescript
{
  id: string                      // Unique communication identifier
  tenantId: string                // Organization identifier
  type: "email" | "teams" | "phone" | "sms" | "in-person"
  date: string                    // ISO timestamp of communication
  participants: string[]          // Array of participant names/emails
  subject: string                 // Communication subject/topic
  summary: string                 // Detailed summary of conversation
  relatedVehicleId?: string       // Optional vehicle relationship
  relatedVendorId?: string        // Optional vendor relationship
  relatedWorkOrderId?: string     // Optional work order relationship
  followUpRequired: boolean        // Follow-up action flag
  followUpDate?: string           // Optional follow-up due date (ISO)
  attachments?: string[]          // Optional attachment references
  createdBy: string               // User who logged communication
}
```

### Integration Points

#### 1. EmailCenter Integration
- **Auto-logging:** Emails can trigger automatic communication log entries
- **Participant extraction:** Email recipients extracted to log participants
- **Subject linking:** Email subjects become communication log subjects
- **Bidirectional:** Email filters reflect in communication log statistics

#### 2. TeamsIntegration Integration
- **Teams messages auto-log:** Teams messages can create log entries
- **Channel context:** Channel name recorded in communication log
- **Mention tracking:** @mentions tracked as participants
- **Notification sync:** Team alerts trigger communication logs

#### 3. Work Order System Integration
- **Relationship tracking:** Communications linked to maintenance requests
- **Status updates:** Work order changes trigger related communications
- **Completion tracking:** Work order completion updates follow-ups
- **Cross-reference:** Work order details accessible from log

#### 4. Vendor Management Integration
- **Vendor communication history:** All vendor interactions logged
- **Performance metrics:** Communication frequency impacts vendor ratings
- **Response tracking:** Vendor response times recorded
- **Dispute resolution:** Communication logs used as evidence

#### 5. Audit & Compliance Integration
- **Compliance reporting:** Communication logs exported for audits
- **User attribution:** All logs tracked by creating user
- **Timestamp accuracy:** Precise timing for regulatory requirements
- **Immutability:** Communication logs create audit trail

#### 6. Notification System Integration
- **Follow-up reminders:** System can send reminders for pending follow-ups
- **Alert creation:** Critical communications trigger alerts
- **Escalation:** Overdue follow-ups escalate automatically

---

## 3. ReceiptProcessing

### Feature Description
The ReceiptProcessing module enables automated receipt capture, OCR data extraction, expense categorization, and approval workflow management. It leverages AI-powered document analysis to extract merchant, amount, date, and itemized details from receipt images, reducing manual data entry and improving expense tracking accuracy.

### Location
`/src/components/modules/ReceiptProcessing.tsx`

### Target Users
- Drivers (receipt submission)
- Fleet Administrators (expense processing)
- Accounting/Finance Staff (receipt approval)
- Fleet Managers (expense reporting)
- Finance Directors (budget analysis)

### User Stories

#### 3.1 Driver Receipt Submission
**As a** driver,  
**I want to** quickly upload receipt images from my phone while on the road,  
**so that** I can submit expenses immediately without losing receipts.

#### 3.2 Automated OCR Processing
**As an** administrator,  
**I want to** have receipt data automatically extracted from images using OCR,  
**so that** I don't have to manually type in merchant names, amounts, and dates.

#### 3.3 Expense Categorization
**As a** finance staff member,  
**I want to** have receipts automatically categorized (fuel, maintenance, parts, etc.),  
**so that** expense reports are organized and easier to analyze.

#### 3.4 Receipt Approval Workflow
**As a** fleet manager,  
**I want to** review pending receipts, approve or reject them, and see the approval status,  
**so that** I can control expenses and ensure proper documentation.

#### 3.5 OCR Confidence Visibility
**As an** auditor,  
**I want to** see OCR confidence scores and review extracted data,  
**so that** I can identify potential errors before expenses are approved.

#### 3.6 Receipt Image Archive
**As an** administrator,  
**I want to** maintain original receipt images for audit purposes,  
**so that** we have proof of expenses for regulatory compliance.

#### 3.7 Expense Reimbursement Tracking
**As a** driver,  
**I want to** see the status of my submitted receipts and when I'll be reimbursed,  
**so that** I can manage my personal finances.

### Key Workflows

#### Workflow 1: Upload & Process Receipt
```
START
  ├─ User clicks "Upload Receipt" button
  ├─ System opens upload dialog
  ├─ User sees upload area with drag-drop support
  ├─ User selects receipt image file:
  │   ├─ Via click to browse, OR
  │   ├─ Drag and drop image, OR
  │   ├─ (Optional) Take photo with camera
  ├─ System validates file:
  │   ├─ Checks file type (image only)
  │   ├─ Validates file size (max 10MB)
  │   └─ Rejects if invalid
  ├─ System begins OCR processing:
  │   ├─ Shows "Processing with OCR..." message
  │   ├─ Displays progress bar (0-100%)
  │   └─ Progress increments at set intervals
  ├─ System calls msOfficeService.extractReceiptData():
  │   ├─ Creates object URL for preview
  │   ├─ Performs OCR on image
  │   └─ Extracts: merchant, date, total, items
  ├─ System calls aiAssistant.analyzeReceipt():
  │   ├─ Sends OCR text to AI
  │   ├─ AI determines: vendor, amount, category
  │   └─ AI calculates confidence score
  ├─ System displays OCR preview:
  │   ├─ Extracted data section (left)
  │   ├─ Image preview (right)
  │   ├─ Confidence percentage badge
  │   ├─ Merchant name
  │   ├─ Total amount
  │   └─ Itemized list
  ├─ System pre-fills form fields with extracted data
  ├─ User reviews and adjusts data:
  │   ├─ Vendor (required)
  │   ├─ Amount (required)
  │   ├─ Category (fuel, maintenance, parts, etc.)
  │   ├─ Payment method (corporate card, cash, check, etc.)
  │   └─ Notes (optional)
  ├─ User optionally links to:
  │   ├─ Vehicle ID
  │   ├─ Driver ID
  │   └─ Work Order ID
  ├─ User submits receipt
  ├─ System validates required fields
  ├─ System creates Receipt object:
  │   ├─ Generates unique ID
  │   ├─ Records current timestamp
  │   ├─ Sets status to "pending"
  │   ├─ Stores OCR data for reference
  │   └─ Associates image URL
  ├─ Receipt added to receipts list
  ├─ Success notification displayed
  └─ Dialog closes and form resets
END
```

#### Workflow 2: Approve/Reject Receipt
```
START
  ├─ Manager views Receipt Processing page
  ├─ System displays pending receipt count
  ├─ Manager reviews receipt in table:
  │   ├─ Date
  │   ├─ Vendor
  │   ├─ Category
  │   ├─ Amount
  │   ├─ Payment method
  │   ├─ Submitted by
  │   └─ Current status (pending)
  ├─ Manager can click "View" to see receipt image
  ├─ Manager clicks checkmark (approve) or X (reject)
  ├─ System updates receipt status:
  │   ├─ Sets status to "approved" or "rejected"
  │   ├─ Records manager as approver
  │   └─ Updates record immediately
  ├─ Table updates with new status:
  │   ├─ Status badge changes color
  │   ├─ Action buttons disappear (no longer pending)
  │   └─ Updated totals reflected
  ├─ Notification sent to submitter
  └─ Statistics updated on dashboard
END
```

#### Workflow 3: Track Expense Status
```
START
  ├─ System displays receipt statistics:
  │   ├─ Total Receipts count
  │   ├─ Pending Approval amount
  │   ├─ Approved amount
  │   └─ OCR Accuracy percentage
  ├─ System filters receipts by status
  ├─ User reviews expense status:
  │   ├─ Pending (yellow badge) - awaiting review
  │   ├─ Approved (green badge) - approved
  │   ├─ Rejected (red badge) - returned
  │   └─ Reimbursed (blue badge) - paid out
  ├─ System calculates totals:
  │   ├─ Sum of pending amounts
  │   ├─ Sum of approved amounts
  │   └─ Count by status
  └─ User tracks workflow progress
END
```

### Core Functionality & Features

#### Receipt Upload & OCR Processing
- **Multiple upload methods:** Click to browse, drag-and-drop, camera capture
- **File validation:** Image format and size validation (max 10MB)
- **OCR processing:** Automatic data extraction from receipt images
- **Progress indication:** Visual progress bar during processing
- **Confidence scoring:** AI-calculated confidence percentage for extracted data
- **Item-level extraction:** Detailed itemized list of receipt items

#### Automated Data Extraction
- **Merchant name:** Automatically detected from receipt
- **Date:** Receipt date parsed from image
- **Total amount:** Total transaction amount extracted
- **Items:** Itemized list with descriptions and amounts
- **Pre-population:** Extracted data pre-fills form fields
- **AI categorization:** Category auto-assigned based on vendor/items

#### Receipt Details & Preview
- **Image preview:** Visual display of uploaded receipt image
- **Extracted data section:** All OCR-extracted fields displayed
- **Confidence badge:** Shows OCR confidence percentage
- **Editable fields:** User can override or correct extracted data
- **Required validations:** Vendor and amount marked required

#### Receipt Categorization
- **Predefined categories:** 
  - Fuel
  - Maintenance
  - Parts
  - Service
  - Toll
  - Parking
  - Other
- **Payment methods:**
  - Corporate Card
  - Cash
  - Check
  - Employee Reimbursement
- **Optional notes:** Field for additional context or explanations

#### Entity Linking
- **Vehicle ID:** Link receipt to specific vehicle
- **Driver ID:** Link receipt to submitting driver
- **Work Order ID:** Link receipt to maintenance work order
- **Bidirectional:** Updates reflected in related records

#### Approval Workflow
- **Status tracking:** pending → approved/rejected → reimbursed
- **Approval actions:** Checkmark to approve, X to reject
- **Approver recording:** System records manager who approved
- **Status display:** Color-coded badges for quick identification
- **Action buttons:** Only available for pending receipts

#### Financial Tracking
- **Pending approval total:** Sum of all amounts awaiting approval
- **Approved total:** Sum of approved expense amounts
- **Receipt counts:** Count by status category
- **OCR accuracy metric:** System-wide OCR confidence percentage

### Data Inputs and Outputs

#### Inputs
- Receipt image file (image/* format, max 10MB)
- Vendor name (required)
- Amount (required, decimal)
- Category selection (required)
- Payment method selection (optional, defaults to corporate-card)
- Vehicle ID (optional)
- Driver ID (optional)
- Work Order ID (optional)
- Notes (optional text)
- Approval action (approve/reject)

#### Outputs
- Receipt object created and stored
- OCR extracted data returned
- AI analysis with confidence score
- Receipt image URL/reference
- Updated statistics (counts, totals)
- Approval status updates
- Toast notifications (success/error)

#### Data Structure (Receipt)
```typescript
{
  id: string                          // Unique receipt identifier
  date: string                        // ISO timestamp of transaction
  vendor: string                      // Merchant/vendor name
  category: "fuel" | "maintenance" | "parts" | "service" | "toll" | "parking" | "other"
  amount: number                      // Transaction total amount
  taxAmount: number                   // Tax included in receipt
  paymentMethod: string               // Payment method used
  vehicleId?: string                  // Optional vehicle reference
  driverId?: string                   // Optional driver reference
  workOrderId?: string                // Optional work order reference
  imageUrl?: string                   // URL to receipt image
  ocrData?: {
    merchantName?: string             // OCR-extracted merchant
    date?: string                     // OCR-extracted date
    total?: string                    // OCR-extracted total
    items?: Array<{                   // OCR-extracted line items
      description: string
      amount: number
    }>
  }
  status: "pending" | "approved" | "rejected" | "reimbursed"
  submittedBy: string                 // User who submitted
  approvedBy?: string                 // Approving manager
  notes?: string                      // Additional notes
}
```

### Integration Points

#### 1. MSOfficeService Integration
- **Function:** `extractReceiptData(file: File)`
- **Purpose:** Performs OCR analysis on receipt image
- **Returns:** ocrData object with extracted information
- **Used in:** File upload processing workflow

#### 2. AIAssistant Integration
- **Function:** `analyzeReceipt(receiptText: string)`
- **Purpose:** AI analysis of receipt text for categorization
- **Returns:** {vendor, amount, category, confidence}
- **Used in:** Pre-filling form with AI-suggested values

#### 3. Vehicle Management Integration
- **Relationship:** Receipts linked to vehicles
- **Data flow:** Vehicle-specific expense tracking
- **Reporting:** Receipt data aggregated by vehicle
- **History:** Vehicle maintenance cost tracking

#### 4. Work Order System Integration
- **Relationship:** Receipts can reference maintenance work orders
- **Automatic linking:** Receipts for work order materials/services
- **Cost tracking:** Work order expenses updated from receipts
- **Reporting:** Total work order cost includes receipt amounts

#### 5. Driver Management Integration
- **Relationship:** Receipts submitted by drivers
- **Reimbursement:** Driver reimbursement amounts calculated from receipts
- **History:** Driver-specific expense history
- **Accountability:** Expense tracking by driver

#### 6. Financial/Accounting System Integration
- **Approval workflow:** Manager approval controls expense recognition
- **Budget tracking:** Receipts tracked against departmental budgets
- **Compliance:** Receipts maintained for audit purposes
- **Reporting:** Financial reports generated from receipt data

---

## 4. DocumentScanner

### Feature Description
The DocumentScanner is an intelligent document processing component that handles document upload, OCR analysis, entity matching, and validation. It supports various document types (receipts, invoices, licenses, registrations) with batch processing capability and provides confidence indicators and matched entity suggestions.

### Location
`/src/components/ai/DocumentScanner.tsx`

### Target Users
- Fleet Administrators
- New vehicle intake staff
- Driver onboarding team
- Compliance/Documentation staff
- Accounting staff
- Audit teams

### User Stories

#### 4.1 Batch Document Upload
**As a** fleet administrator,  
**I want to** upload multiple documents at once for batch processing,  
**so that** I can process vehicle registrations and maintenance invoices efficiently.

#### 4.2 Smart Entity Matching
**As a** documentation officer,  
**I want to** have the system automatically match documents to vehicles, drivers, and vendors,  
**so that** I can quickly associate documents with the correct entities.

#### 4.3 OCR Confidence Verification
**As a** compliance officer,  
**I want to** see OCR confidence scores and validation issues before accepting extracted data,  
**so that** I can ensure data accuracy and compliance.

#### 4.4 Field Extraction & Verification
**As a** data entry staff,  
**I want to** see extracted fields with individual confidence scores and review flags,  
**so that** I can quickly identify which fields need manual verification.

#### 4.5 Document Type Classification
**As an** intake coordinator,  
**I want to** have documents automatically classified by type (receipt, invoice, license, etc.),  
**so that** documents are routed to the appropriate process.

#### 4.6 Mobile Document Capture
**As a** driver,  
**I want to** take photos of documents using my phone camera,  
**so that** I can submit documents immediately without needing a scanner.

### Key Workflows

#### Workflow 1: Upload & Batch Process Documents
```
START
  ├─ User navigates to DocumentScanner
  ├─ System displays upload area with:
  │   ├─ Drag-and-drop zone
  │   ├─ "Browse Files" button
  │   └─ "Take Photo" button (mobile)
  ├─ User selects files to upload:
  │   ├─ Single upload: one file selected, auto-processes
  │   ├─ Batch upload: multiple files selected
  │   └─ System allows JPG, PNG, PDF (max 10MB)
  ├─ System validates files
  ├─ System enters processing state:
  │   ├─ Shows loading spinner
  │   ├─ Displays "Processing documents..." message
  │   └─ Progress bar shows 66% (indeterminate)
  ├─ For each file, system:
  │   ├─ Sends to /api/ai/analyze-document endpoint
  │   ├─ Includes optional documentType parameter
  │   ├─ Uses multipart/form-data
  │   └─ Waits for analysis response
  ├─ System receives DocumentAnalysis response:
  │   ├─ documentType (e.g., "fuel_receipt", "parts_invoice")
  │   ├─ confidence (overall confidence 0-1)
  │   ├─ extractedData (field-level extractions)
  │   ├─ suggestedMatches (vehicle, vendor, driver matches)
  │   ├─ validationIssues (list of problems found)
  │   └─ rawOcrText (raw OCR output)
  ├─ System stores analysis in Map<fileName, DocumentAnalysis>
  ├─ System displays results for each file
  ├─ User can expand each file to view details
  └─ Processing complete
END
```

#### Workflow 2: Review Document Analysis Results
```
START
  ├─ User sees document cards in list
  ├─ Each card shows:
  │   ├─ File name with file icon
  │   ├─ File size in KB
  │   ├─ Document type badge with color
  │   ├─ Eye icon to expand details
  │   └─ X icon to remove
  ├─ User clicks eye icon to expand
  ├─ System displays detailed analysis:
  │
  │   ├─ Extraction Confidence:
  │   │   ├─ Overall confidence score (percentage)
  │   │   ├─ Color-coded: green (≥90%), yellow (70-89%), red (<70%)
  │   │   └─ Progress bar visual
  │
  │   ├─ Validation Issues (if any):
  │   │   ├─ Yellow alert box
  │   │   ├─ List of identified problems
  │   │   └─ Examples: "Missing date field", "Amount unclear"
  │
  │   ├─ Matched Entities:
  │   │   ├─ Suggested vehicle with match confidence
  │   │   ├─ Suggested vendor with match confidence
  │   │   ├─ Suggested driver with match confidence
  │   │   └─ Allow user to confirm/override
  │
  │   └─ Extracted Data Grid:
  │       ├─ 2-column grid layout
  │       ├─ Each field shows:
  │       │   ├─ Field name (capitalized, underscores removed)
  │       │   ├─ Extracted value
  │       │   ├─ Field-level confidence score
  │       │   └─ Warning icon if field needs review
  │       └─ Examples: merchant_name, date, total, amount, tax
  │
  └─ User can approve or edit matched entities
END
```

#### Workflow 3: Handle Documents with Issues
```
START
  ├─ System detects validation issues during analysis
  ├─ Yellow alert displayed with "Issues Found" header
  ├─ List shows specific problems:
  │   ├─ "Document type could not be determined"
  │   ├─ "Missing required field: date"
  │   ├─ "Confidence below acceptable threshold"
  │   └─ "Multiple merchants detected (possible multi-receipt)"
  ├─ Field confidence colors indicate problems:
  │   ├─ Red text (low confidence fields)
  │   ├─ Yellow warning icons (fields needing review)
  │   └─ Gray text (null/missing values)
  ├─ User can:
  │   ├─ Manually correct extracted fields
  │   ├─ Confirm or reject suggested entity matches
  │   ├─ Add notes about document issues
  │   └─ Decide to accept or re-upload
  ├─ System allows proceeding despite issues
  ├─ User confirms data and submits
  └─ Document processed with noted issues
END
```

### Core Functionality & Features

#### Document Upload & Handling
- **Multiple input methods:**
  - Click "Browse Files" to select
  - Drag and drop files
  - "Take Photo" button for mobile camera capture
- **Batch processing:** allowBatch parameter enables multiple file processing
- **File validation:** JPG, PNG, PDF formats, max 10MB per file
- **Auto-processing:** Files automatically processed upon selection
- **Drag indicator:** Visual feedback when dragging files over upload area

#### Document Type Classification
- **Automatic detection:** System determines document type from content
- **Supported types:**
  - fuel_receipt
  - parts_invoice
  - service_invoice
  - inspection_report
  - driver_license
  - vehicle_registration
  - unknown (fallback)
- **Color-coded badges:** Each type has distinct visual identifier
- **Type display:** Badge shown in file card and details

#### OCR & Data Extraction
- **Field extraction:** Individual field values extracted with confidence scores
- **Item-level data:** Line items extracted from invoices
- **Raw OCR text:** Original OCR output preserved for reference
- **Confidence scoring:** Each field has independent confidence metric
- **Partial success:** Can extract some fields even if others fail

#### Intelligent Entity Matching
- **Vehicle matching:** Suggests matching vehicles with confidence score
- **Vendor matching:** Identifies relevant vendors from document
- **Driver matching:** Suggests driver matches for applicable documents
- **Confidence thresholds:** Shows match confidence percentage
- **User override:** User can confirm, modify, or reject suggestions

#### Validation & Quality Assurance
- **Issue detection:** System identifies extraction problems
- **Warning flags:** Individual fields marked for review
- **Issue categories:**
  - Missing required fields
  - Low confidence extractions
  - Validation rule failures
  - Ambiguous data
- **Severity indication:** Critical vs. advisory issues
- **Confidence visualization:** Color-coded confidence indicators

#### Batch Processing Management
- **Progress tracking:** Shows processing status for multiple files
- **Individual processing:** Each file analyzed independently
- **Result aggregation:** All results displayed in unified list
- **File removal:** Can remove individual files from batch
- **Completion callback:** Optional callback on batch completion

### Data Inputs and Outputs

#### Inputs
- Document file (image or PDF, max 10MB)
- Optional documentType parameter (to pre-specify expected type)
- allowBatch flag (true for batch, false for single file)
- onComplete callback function
- User selections for entity matching confirmation

#### Outputs
- DocumentAnalysis object with complete analysis results
- Classification badge with document type
- Extracted fields with individual confidence scores
- Suggested entity matches with confidence percentages
- Validation issues list
- Raw OCR text
- Success or error notifications

#### Data Structures

**DocumentAnalysis Interface:**
```typescript
interface DocumentAnalysis {
  documentType: string              // Type: fuel_receipt, parts_invoice, etc.
  confidence: number                // Overall confidence 0-1
  extractedData: Record<string, {   // Field-level extractions
    value: any                       // Extracted value
    confidence: number               // Field confidence 0-1
    needsReview: boolean             // Manual review flag
  }>
  suggestedMatches: {               // Entity matching suggestions
    vehicle?: {
      id: string
      name: string
      confidence: number
    }
    vendor?: {
      id: string
      name: string
      confidence: number
    }
    driver?: {
      id: string
      name: string
      confidence: number
    }
  }
  validationIssues: string[]        // List of validation problems
  rawOcrText?: string               // Raw OCR output
}
```

**DocumentScannerProps Interface:**
```typescript
interface DocumentScannerProps {
  documentType?: string             // Optional pre-specified type
  onComplete?: (analysis: DocumentAnalysis) => void
  allowBatch?: boolean              // Enable batch processing
}
```

### Integration Points

#### 1. AI Document Analysis API
- **Endpoint:** `/api/ai/analyze-document`
- **Method:** POST with multipart/form-data
- **Input:** File + optional documentType
- **Output:** DocumentAnalysis object
- **Used for:** All document processing

#### 2. Vehicle Management Integration
- **Entity matching:** Documents matched to vehicles
- **Vehicle documentation:** Vehicle registration documents linked
- **Maintenance records:** Service invoices linked to vehicles
- **Compliance:** Vehicle documents archived with vehicle record

#### 3. Vendor Management Integration
- **Vendor identification:** Documents auto-matched to vendors
- **Invoice processing:** Vendor invoices extracted and linked
- **Parts invoices:** Vendor invoices for parts sourcing
- **Contract documentation:** Vendor agreements stored with profile

#### 4. Driver Management Integration
- **License documentation:** Driver license documents processed
- **Certification tracking:** Certification documents extracted
- **Driver identification:** Driver license info linked to driver record
- **Compliance:** Driver documentation for legal requirements

#### 5. Receipt Processing Integration
- **Receipt documents:** Fuel and parts receipts processed here
- **Data flow:** DocumentScanner feeds to ReceiptProcessing
- **Field mapping:** Extracted fields map to receipt fields
- **Confidence sharing:** OCR confidence used in receipt approval

#### 6. Work Order Integration
- **Service invoices:** Linked to specific work orders
- **Parts invoices:** Associated with maintenance work
- **Cost tracking:** Invoice amounts included in work order costs
- **Documentation:** Invoices archived with work order

---

## 5. TeamsIntegration

### Feature Description
The TeamsIntegration module provides seamless Microsoft Teams connectivity, enabling fleet teams to communicate, receive notifications, and post updates directly within their Teams workspace. It supports multi-channel posting, team notifications, and bidirectional communication integration.

### Location
`/src/components/modules/TeamsIntegration.tsx`

### Target Users
- Fleet Operations Managers
- Maintenance Team Leads
- Dispatch Supervisors
- Fleet Management Executive
- All fleet team members
- External vendors (via Teams)

### User Stories

#### 5.1 Team Channel Communication
**As a** fleet operations manager,  
**I want to** post updates and announcements to specific Teams channels,  
**so that** the entire team stays informed about operational changes.

#### 5.2 Maintenance Team Notifications
**As a** supervisor,  
**I want to** send urgent maintenance alerts to the maintenance team,  
**so that** critical issues receive immediate attention.

#### 5.3 Multi-channel Organization
**As a** team lead,  
**I want to** organize messages across different channels (ops, maintenance, management),  
**so that** communications stay organized by topic and audience.

#### 5.4 Quick Alert Dispatch
**As a** fleet manager,  
**I want to** send urgent notifications with priority levels to alert team members,  
**so that** critical situations are handled immediately.

#### 5.5 Message Threading & Reactions
**As a** team member,  
**I want to** see reactions and threaded discussions in the Teams feed,  
**so that** I can quickly understand team sentiment and engagement.

#### 5.6 Related Entity Tracking
**As a** maintenance coordinator,  
**I want to** link Teams messages to vehicles and work orders,  
**so that** communication context is preserved with the work.

### Key Workflows

#### Workflow 1: Post Message to Teams Channel
```
START
  ├─ User navigates to TeamsIntegration
  ├─ System displays channel list with unread badges:
  │   ├─ Fleet Operations (3 unread)
  │   ├─ Maintenance Team (1 unread)
  │   ├─ Fleet Management (0 unread)
  │   └─ Critical Alerts (2 unread)
  ├─ User selects target channel:
  │   ├─ Click channel button to switch view
  │   └─ Selected channel highlighted as "secondary"
  ├─ User clicks "Compose" button
  ├─ System opens compose dialog with form:
  │   ├─ Subject field (required)
  │   ├─ Message content area (required)
  │   └─ Channel selector (shows current channel)
  ├─ User enters message details:
  │   ├─ Subject: Brief title/topic
  │   ├─ Message: Full message content (6 rows textarea)
  │   └─ Channel: Can change channel before sending
  ├─ System validates required fields
  ├─ User clicks "Send Message" button
  ├─ System calls msOfficeService.sendTeamsMessage():
  │   ├─ channelId: from selectedChannel
  │   ├─ subject: from form input
  │   ├─ content: from message textarea
  │   └─ mentions: extracted from message
  ├─ Message sent to Teams
  ├─ System receives MSTeamsMessage object:
  │   ├─ Generated message ID
  │   ├─ Current timestamp
  │   ├─ Message author (Fleet Manager)
  │   └─ Empty reactions array
  ├─ Message added to messages list
  ├─ Dialog closes and form resets
  ├─ Success notification displayed
  ├─ Channel feed updates with new message
  └─ User sees message in channel view
END
```

#### Workflow 2: Switch Channels & View Messages
```
START
  ├─ User views channel sidebar
  ├─ Each channel shows:
  │   ├─ Channel name with # prefix
  │   ├─ Unread count badge (if > 0)
  │   ├─ Current selection highlighted
  │   └─ Hover effect on button
  ├─ User clicks different channel
  ├─ System updates selectedChannel state
  ├─ System filters messages for new channel:
  │   ├─ Only messages with matching channelId
  │   └─ Filters from full messages array
  ├─ Channel view updates:
  │   ├─ Channel name displays in header
  │   ├─ Message count shows in header
  │   ├─ Member count displays (12 members)
  │   ├─ "Team collaboration and notifications" subtitle
  │   └─ Messages list refreshes
  ├─ System displays channel messages:
  │   ├─ Empty state if no messages (icon + message)
  │   ├─ Message list if messages exist
  │   └─ Messages sorted chronologically
  └─ User can compose or read messages
END
```

#### Workflow 3: Send Priority Notification
```
START
  ├─ User clicks "Alert Team" button in Quick Actions
  ├─ System calls handleNotifyMaintenance():
  │   ├─ Channel: "maintenance"
  │   ├─ Title: "Maintenance Alert"
  │   ├─ Message: "A [priority] priority maintenance issue..."
  │   └─ Priority: "urgent"
  ├─ System calls msOfficeService.createTeamsNotification():
  │   ├─ Creates priority emoji (🚨 for urgent)
  │   ├─ Formats message with emphasis
  │   └─ Creates rich notification content
  ├─ Message formatted as:
  │   ├─ Priority emoji (🚨 ⛔ ⚠️ ℹ️)
  │   ├─ Bold title
  │   ├─ Message body
  │   └─ Optional action URL
  ├─ Message sent to maintenance channel
  ├─ System adds to messages list
  ├─ Notification sent to maintenance team
  ├─ Unread badge updates
  ├─ Success toast displayed: "Notification sent to maintenance team"
  └─ Alert team alerted immediately
END
```

#### Workflow 4: View Message with Reactions
```
START
  ├─ User views message in channel feed
  ├─ Message displays:
  │   ├─ Author avatar (first letter in circle)
  │   ├─ Author name
  │   ├─ Timestamp (locale formatted)
  │   ├─ Optional subject line (bold)
  │   ├─ Message content (whitespace preserved)
  │   └─ Reaction badges (if any)
  ├─ Message structure:
  │   ├─ Avatar: colored circle with initials
  │   ├─ Header: name + timestamp
  │   ├─ Body: subject (if present) + content
  │   ├─ Reactions: badges with emoji + count
  │   └─ Separator after message
  ├─ Reaction badges show:
  │   ├─ Emoji (e.g., 👍 ❤️ 🔥)
  │   ├─ Count of reactions
  │   └─ Outlined badge style
  ├─ User can see conversation flow
  └─ Engagement visible at glance
END
```

### Core Functionality & Features

#### Channel Management
- **Predefined channels:**
  - Fleet Operations (main operations channel)
  - Maintenance Team (maintenance-specific)
  - Fleet Management (leadership)
  - Critical Alerts (urgent issues)
- **Channel navigation:** Easy switching between channels
- **Current channel highlighting:** Visual indicator of selected channel
- **Unread badges:** Count of unread messages per channel
- **Member count:** Display of active members in channel

#### Message Composition
- **Compose dialog:** Modal form for new messages
- **Subject field:** Brief topic/title (required)
- **Content area:** Extended textarea for message body (6 rows, required)
- **Channel selector:** Select target channel before sending
- **Channel pre-selection:** Defaults to currently viewed channel
- **Form validation:** Requires subject and content

#### Message Display & Threading
- **Message list:** Chronological feed of channel messages
- **Author info:** Avatar, name, and timestamp
- **Subject display:** Bold subject line (if provided)
- **Content rendering:** Preserves whitespace in message body
- **Reaction display:** Shows emoji reactions with counts
- **Empty state:** Helpful message when no messages in channel

#### Message Components
- **Author avatar:** Colored circle with first letter of name
- **Name display:** Author name in bold
- **Timestamp:** Locale-formatted date and time
- **Subject:** Optional bold line for message topic
- **Content:** Full message text with whitespace preserved
- **Reactions:** Emoji reactions shown as badges with counts

#### Team Notifications
- **Priority-based alerts:**
  - Low priority: ℹ️ (information)
  - Medium priority: ⚠️ (warning)
  - High priority: 🔴 (alert)
  - Urgent priority: 🚨 (critical)
- **Rich formatting:** Bold titles, structured content
- **Action URLs:** Optional links to related resources
- **Auto-routing:** Directed to appropriate channel
- **Immediate delivery:** Synchronous send to Teams

#### Quick Actions
- **Alert Team button:** One-click urgent notification
- **Compose button:** Quick access to message composition
- **Preset channels:** Common action channels pre-configured
- **Rapid response:** Minimal input required for quick alerts

### Data Inputs and Outputs

#### Inputs
- Channel ID selection (fleet-ops, maintenance, management, alerts)
- Message subject (required text)
- Message content (required text, multiline)
- Optional channel change in compose dialog
- Priority level for notifications (low, medium, high, urgent)
- Optional mentions (extracted from message)
- Optional related entity IDs (vehicle, work order)

#### Outputs
- MSTeamsMessage object created and stored
- Message posted to Teams channel
- Updated channel message list
- Toast notification (success/error)
- Unread badge counts updated
- Reactions data displayed
- Success confirmation

#### Data Structure (MSTeamsMessage)
```typescript
{
  id: string                      // Unique message identifier
  channelId: string               // Target channel ID
  channelName: string             // Display name of channel
  subject: string                 // Message subject/title
  content: string                 // Full message content
  author: string                  // Message author name
  timestamp: string               // ISO timestamp of message
  attachments?: string[]          // Optional file attachments
  mentions?: string[]             // Array of @mentioned users
  reactions?: Array<{             // Optional reactions
    emoji: string                 // Emoji character
    count: number                 // Number of reactions
  }>
  relatedVehicleId?: string       // Optional vehicle reference
  relatedWorkOrderId?: string     // Optional work order reference
}
```

### Integration Points

#### 1. Microsoft Teams API Integration
- **Service:** `msOfficeService.sendTeamsMessage()`
- **Function:** Posts message to Teams channel
- **Parameters:** channelId, subject, content, mentions, attachments
- **Return:** Created MSTeamsMessage object
- **Status:** Simulated, ready for Teams Graph API

#### 2. Notification System Integration
- **Service:** `msOfficeService.createTeamsNotification()`
- **Function:** Creates priority-formatted notifications
- **Emoji mapping:** Priority level to emoji conversion
- **Rich formatting:** Markdown-formatted content
- **Auto-routing:** Directs to appropriate channel based on priority

#### 3. CommunicationLog Integration
- **Auto-logging:** Teams messages create communication log entries
- **Participant extraction:** Message author added to logs
- **Subject linking:** Message subject becomes log subject
- **Channel context:** Channel name recorded in log
- **Mention tracking:** @mentions tracked as participants

#### 4. Work Order System Integration
- **Related linking:** Messages can reference work orders
- **Status updates:** Work order changes communicated via Teams
- **Notification triggers:** Work order events trigger Team alerts
- **Completion notification:** Work order completion posted to teams

#### 5. Vehicle Management Integration
- **Vehicle alerts:** Vehicle-related issues posted to Teams
- **Service notifications:** Maintenance alerts for specific vehicles
- **Status updates:** Vehicle status changes shared with team
- **Incident reporting:** Vehicle incidents posted immediately

#### 6. Alert & Escalation System Integration
- **Urgent notification routing:** Critical alerts go to alert channel
- **Priority escalation:** High-priority issues escalate to management
- **Automatic notifications:** System-generated alerts posted to Teams
- **Acknowledgment tracking:** Team member acknowledgments recorded

---

## Integration Architecture

### Cross-Module Data Flow

```
EmailCenter
  ├─→ CommunicationLog (auto-logging)
  ├─→ Receipt Detection (receipt emails)
  ├─→ Work Order System (vendor emails)
  └─→ Vendor Management (vendor communications)

CommunicationLog
  ├─→ TeamsIntegration (Teams message logging)
  ├─→ EmailCenter (email logging)
  ├─→ Follow-up tracking
  └─→ Audit System (compliance logs)

ReceiptProcessing
  ├─→ DocumentScanner (document analysis)
  ├─→ AI Assistant (categorization)
  ├─→ Vehicle Management (vehicle expenses)
  ├─→ Work Order System (service costs)
  └─→ Expense Tracking (financial data)

DocumentScanner
  ├─→ ReceiptProcessing (receipt documents)
  ├─→ Vehicle Management (registration docs)
  ├─→ Driver Management (license docs)
  ├─→ Vendor Management (invoices)
  └─→ AI Analysis (OCR processing)

TeamsIntegration
  ├─→ CommunicationLog (message logging)
  ├─→ Work Order Alerts (maintenance notifications)
  ├─→ Maintenance Team (routine updates)
  ├─→ Fleet Management (strategic info)
  └─→ Critical Alerts (urgent issues)
```

### Shared Services & Dependencies

#### MSOfficeService
- Used by: EmailCenter, TeamsIntegration, ReceiptProcessing
- Provides: Email sending, Teams messaging, document analysis, contact sync
- Critical dependency: Handles all MS Office 365 integration

#### AIAssistant
- Used by: ReceiptProcessing, DocumentScanner
- Provides: Receipt analysis, document classification, categorization
- Critical dependency: AI-powered data extraction

#### Communication Audit Trail
- Records from: All five modules
- Used by: Compliance, Legal, Audit teams
- Purpose: Complete audit trail for all communications

---

## Test Scenarios

### 1. EmailCenter Test Cases

#### TC1.1: Send Email with Valid Data
```
Precondition: User is logged in, compose dialog open
Steps:
  1. Fill "To" field with valid email: vendor@company.com
  2. Fill "CC" field with: manager@company.com
  3. Fill "Subject" with: "Maintenance Request - Fleet #5"
  4. Fill "Body" with: "Please schedule maintenance for..."
  5. Click "Send Email" button
Expected Result:
  - Email sent successfully
  - Success toast displayed
  - Email appears in inbox list
  - Dialog closes
  - Form resets
```

#### TC1.2: Send Email to Multiple Recipients
```
Precondition: Compose dialog open
Steps:
  1. Fill "To" with: "vendor1@co.com, vendor2@co.com, vendor3@co.com"
  2. Fill subject and body
  3. Send email
Expected Result:
  - Email sent to all three recipients
  - System splits comma-separated addresses correctly
  - All recipients receive email
```

#### TC1.3: Email Validation - Missing Required Fields
```
Precondition: Compose dialog open
Steps:
  1. Leave "To" field empty
  2. Fill "Subject" and "Body"
  3. Click "Send Email"
Expected Result:
  - Error toast displayed: "Please fill in required fields"
  - Email not sent
  - Dialog remains open for correction
```

#### TC1.4: Filter Emails by Category
```
Precondition: Multiple emails in inbox
Steps:
  1. Click "Receipts" filter button
  2. Verify only receipt emails shown
  3. Click "Unread" filter button
  4. Verify only unread emails shown
  5. Click "All Mail" filter button
  6. Verify all emails shown
Expected Result:
  - Filters work correctly
  - Badge counts accurate
  - Email list updates dynamically
  - Filter selection highlighted
```

#### TC1.5: View Email Details & Reply
```
Precondition: Email in inbox list
Steps:
  1. Click email in list
  2. Verify details panel populates:
     - Subject, from, to, cc, date
     - Full body content
     - Attachments (if any)
  3. Click "Reply" button
  4. Verify compose form pre-filled:
     - To: original sender
     - Subject: "Re: [original subject]"
     - Body: quoted original message
  5. Add reply text
  6. Send
Expected Result:
  - Details display correctly
  - Reply pre-fills correctly
  - Reply sent and added to thread
  - Email marked as read when opened
```

#### TC1.6: View Attachments
```
Precondition: Email with attachments
Steps:
  1. Click email in list
  2. Scroll to attachments section
  3. Verify attachment display:
     - Paperclip icon
     - File name
     - File size in KB
  4. Count matches email list badge
Expected Result:
  - Attachments display correctly
  - File sizes calculate correctly
  - Count badge matches actual files
```

### 2. CommunicationLog Test Cases

#### TC2.1: Log New Communication - Email Type
```
Precondition: Communication Log open, dialog closed
Steps:
  1. Click "Log Communication" button
  2. Select "Email" from type dropdown
  3. Fill subject: "Vendor negotiation"
  4. Add participant: "john.vendor@co.com"
  5. Fill summary: "Discussed pricing for..."
  6. Click Save Log
Expected Result:
  - Communication logged successfully
  - Appears in table with email type badge
  - Timestamp recorded
  - Icon and color correct (blue envelope)
  - Statistics update (total count increases)
```

#### TC2.2: Log Communication with Follow-up
```
Precondition: Log dialog open
Steps:
  1. Enter communication details
  2. Check "Follow-up required" checkbox
  3. Set follow-up date to 2 days from now
  4. Save log
Expected Result:
  - Communication logged
  - Follow-up badge shows date
  - Pending follow-ups count increases
  - Follow-up appears in table
  - Mark complete button available
```

#### TC2.3: Mark Follow-up Complete
```
Precondition: Communication with follow-up pending
Steps:
  1. Locate communication in table
  2. Click checkmark button in actions column
  3. Verify update
Expected Result:
  - Follow-up status changes to complete
  - Badge removed from row
  - Pending count decreases
  - Completion rate increases
  - Success toast displayed
```

#### TC2.4: Search Communications
```
Precondition: Multiple communications logged
Steps:
  1. Enter search term: "maintenance"
  2. Verify results filtered to matching entries
  3. Clear search
  4. Enter participant name: "john"
  5. Verify results show johns' communications
  6. Search for non-existent: "xyz"
  7. Verify empty state
Expected Result:
  - Search filters across subject, summary, participants
  - Real-time filtering
  - Clear search restores full list
  - Empty state when no matches
```

#### TC2.5: Filter by Type
```
Precondition: Multiple communications, different types
Steps:
  1. Select "Teams" from type dropdown
  2. Verify only Teams messages shown
  3. Select "Phone" from type dropdown
  4. Verify only phone calls shown
  5. Select "All Types"
  6. Verify all communications shown
Expected Result:
  - Type filter works correctly
  - Icons and colors match type
  - Counts accurate
  - Real-time filtering
```

### 3. ReceiptProcessing Test Cases

#### TC3.1: Upload & Process Receipt Image
```
Precondition: Receipt Processing open, valid receipt image available
Steps:
  1. Click "Upload Receipt" button
  2. Select receipt image (JPG, PNG, max 10MB)
  3. Observe processing:
     - "Processing with OCR..." message appears
     - Progress bar increments
     - Completes to 100%
  4. Verify OCR preview displays:
     - Image preview (right side)
     - Extracted data (left side):
       - Confidence percentage
       - Merchant name
       - Total amount
       - Itemized list
Expected Result:
  - Processing completes successfully
  - OCR accuracy high (>90%)
  - Merchant correctly identified
  - Amount extracted accurately
  - Items listed with amounts
```

#### TC3.2: Approve Receipt
```
Precondition: Receipt uploaded, status = pending
Steps:
  1. Locate receipt in table (status: pending)
  2. Click checkmark (approve) button
  3. Observe status change
Expected Result:
  - Status changes from "pending" to "approved"
  - Row updates immediately
  - Approve/reject buttons disappear
  - Approved total increases
  - Pending total decreases
  - Success toast displayed
```

#### TC3.3: Reject Receipt
```
Precondition: Receipt uploaded, status = pending
Steps:
  1. Locate receipt in table
  2. Click X (reject) button
  3. Observe status change
Expected Result:
  - Status changes to "rejected"
  - Approved total unaffected
  - Receipt removed from approval queue
  - Success toast displayed
```

#### TC3.4: Link Receipt to Work Order
```
Precondition: Receipt upload dialog open
Steps:
  1. Upload receipt image
  2. After OCR completes
  3. In work order field, enter: "WO-12345"
  4. Save receipt
Expected Result:
  - Receipt saved with work order reference
  - Receipt appears in work order history
  - Work order cost updated
```

### 4. DocumentScanner Test Cases

#### TC4.1: Upload Single Document
```
Precondition: DocumentScanner component open
Steps:
  1. Click "Browse Files" button
  2. Select valid document (JPG/PNG/PDF, <10MB)
  3. Observe processing
  4. Verify analysis displays:
     - Document type badge
     - Confidence score
     - Extracted data
     - Validation issues (if any)
Expected Result:
  - Document uploaded and processed
  - Analysis results displayed
  - File appears in list with results
  - No errors
```

#### TC4.2: Batch Upload Multiple Documents
```
Precondition: DocumentScanner with allowBatch=true
Steps:
  1. Click "Browse Files"
  2. Select multiple documents (3+)
  3. Observe batch processing
  4. Verify all files processed
Expected Result:
  - Multiple files accepted
  - All processed sequentially
  - Results displayed for each file
  - File count shows in list header
```

#### TC4.3: Review Validation Issues
```
Precondition: Document processed with issues
Steps:
  1. Click eye icon to expand results
  2. Observe "Issues Found" alert box
  3. Verify issue list:
     - Missing field
     - Low confidence field
     - Validation failure
  4. Locate field with warning icon
Expected Result:
  - Issues clearly displayed
  - Alert box visible
  - Specific issues listed
  - Warning icons on problematic fields
```

#### TC4.4: Verify Entity Matching
```
Precondition: Document with entity matches
Steps:
  1. Expand document results
  2. View "Matched Entities" section
  3. Verify display:
     - Vehicle name + confidence %
     - Vendor name + confidence %
     - Driver name + confidence % (if applicable)
Expected Result:
  - Suggested matches displayed
  - Confidence scores shown
  - User can confirm/override matches
```

### 5. TeamsIntegration Test Cases

#### TC5.1: Post Message to Teams Channel
```
Precondition: TeamsIntegration open, Fleet Operations channel selected
Steps:
  1. Click "Compose" button
  2. Verify dialog opens with channel form
  3. Fill "Subject": "Routine Maintenance Update"
  4. Fill "Message": "Scheduled maintenance for Fleet #5..."
  5. Verify channel: Fleet Operations (selected)
  6. Click "Send Message"
Expected Result:
  - Message posted to Teams
  - Appears in channel feed immediately
  - Author shows as "Fleet Manager"
  - Timestamp recorded
  - Success toast displayed
  - Dialog closes
```

#### TC5.2: Switch Channels
```
Precondition: Multiple channels visible in sidebar
Steps:
  1. Click "Maintenance Team" channel
  2. Observe:
     - Channel highlighted
     - Channel name updates in header
     - Messages filtered to Maintenance Team
     - Member count shows (12 members)
  3. Click "Critical Alerts" channel
  4. Observe same updates for different channel
Expected Result:
  - Channels switch smoothly
  - Message list updates correctly
  - UI reflects selected channel
  - Unread badges accurate
```

#### TC5.3: Send Priority Alert
```
Precondition: TeamsIntegration open
Steps:
  1. Click "Alert Team" button
  2. Observe alert post:
     - Posts to Maintenance Team channel
     - 🚨 priority emoji displays
     - Title: "Maintenance Alert"
     - Message formatted with priority
  3. Verify notification sent
Expected Result:
  - Alert posted immediately
  - Message appears in channel feed
  - Team notified
  - Priority emoji displays correctly
  - Success notification shown
```

#### TC5.4: View Message Reactions
```
Precondition: Message in channel with reactions
Steps:
  1. View channel messages
  2. Locate message with reactions
  3. Verify display:
     - Emoji shown
     - Count displayed next to emoji
     - Multiple emoji shown as badges
  4. Observe examples:
     - 👍 2
     - ❤️ 5
     - 🔥 1
Expected Result:
  - Reactions display correctly
  - Counts accurate
  - Multiple reactions shown
  - Visual styling clear
```

---

## Summary

This comprehensive documentation covers all Communication & Documentation features in the Fleet application:

1. **EmailCenter** - Integrated email management with Outlook
2. **CommunicationLog** - Unified audit trail across all channels
3. **ReceiptProcessing** - Automated receipt processing with OCR
4. **DocumentScanner** - Intelligent document analysis
5. **TeamsIntegration** - Microsoft Teams team collaboration

Each feature provides:
- Clear user stories addressing specific user roles
- Detailed workflows showing step-by-step user journeys
- Core functionality with feature descriptions
- Data structures and integration points
- Comprehensive test scenarios for QA validation

The modules are tightly integrated to provide a cohesive communication and documentation experience, with shared services for Microsoft Office 365 integration and AI-powered analysis.

---

**Document Status:** Complete  
**Version:** 1.0  
**Last Updated:** 2025-11-11  
**Thoroughness:** Very Thorough (comprehensive analysis of all 5 features)
