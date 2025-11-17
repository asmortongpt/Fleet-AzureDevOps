# Vendor Marketplace Implementation Guide

**Priority:** P2 - Revenue Opportunity
**Status:** Implementation Ready
**Last Updated:** November 16, 2025

## Overview

### Business Value
- New revenue stream: 5% platform fee on all transactions
- Projected Year 1 revenue: $500K-$2M+ (based on fleet size)
- Vendor lock-in increases customer lifetime value
- Creates ecosystem of complementary services
- Competitive advantage in fleet management space
- Network effects drive platform value

### Technical Complexity
- **Medium-High:** Complex marketplace logic, payment processing, quality management
- Requires robust vendor management system
- Sophisticated bidding and matching algorithm
- Escrow and dispute resolution mechanisms
- Integration with payment systems

### Key Dependencies
- Payment processing (Stripe for escrow, payouts)
- User authentication and vendor profiles
- Service categories and taxonomy
- Rating/review system
- Dispute resolution workflow
- Vendor onboarding and verification

### Timeline Estimate
- **Phase 1 (Vendor Management):** 2-3 weeks
- **Phase 2 (Service Listing & Search):** 2-3 weeks
- **Phase 3 (Bidding Engine):** 2-3 weeks
- **Phase 4 (Payment & Escrow):** 2-3 weeks
- **Phase 5 (Rating & Dispute System):** 2-3 weeks
- **Phase 6 (Testing & Launch):** 2-3 weeks
- **Total:** 12-18 weeks

---

## Architecture

### System Diagram
```
┌──────────────────────────────────────────────────────────────┐
│                    MARKETPLACE UI                            │
│  ┌─────────────────┐            ┌─────────────────────┐      │
│  │ Vendor Dashboard│            │ Fleet RFQ Portal    │      │
│  │ • Listings      │            │ • Browse Services   │      │
│  │ • Bids          │            │ • Request Quotes    │      │
│  │ • Earnings      │            │ • Compare Bids      │      │
│  └─────────────────┘            └─────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
           │                                │
           └────────────┬───────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │  MARKETPLACE API SERVICE   │
          │ • Service matching         │
          │ • Bid management           │
          │ • Escrow handling          │
          │ • Quality monitoring       │
          └─────────────┬──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐
    │PostgreSQL│   │  Stripe  │   │  Search  │
    │Database  │   │  Payment │   │ Index    │
    └─────────┘   └──────────┘   └──────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
          ┌─────────────▼──────────────┐
          │  ANALYTICS & REPORTING     │
          │ • Vendor performance       │
          │ • Revenue tracking         │
          │ • Quality metrics          │
          └────────────────────────────┘
```

### Marketplace Flow

```
1. Vendor Registration & Verification
   ↓
2. Fleet Posts Service Request (RFQ)
   ↓
3. Vendors Submit Bids
   ↓
4. Fleet Selects Best Bid
   ↓
5. Escrow Payment Held
   ↓
6. Work Completion & Delivery
   ↓
7. Fleet Approves & Payment Released
   ↓
8. 5% Fee Collected
   ↓
9. Rating & Review
```

---

## Marketplace Architecture

### Vendor Onboarding Workflow

```typescript
// src/services/marketplace/vendorOnboarding.ts

interface VendorRegistration {
  companyName: string;
  businessType: string; // 'maintenance', 'repair', 'inspection', etc.
  licenseNumber: string;
  insuranceCertificate: string;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  serviceAreas: string[]; // zip codes or regions
  categories: string[]; // service types offered
  certifications: string[];
}

class VendorOnboardingService {
  async registerVendor(data: VendorRegistration): Promise<Vendor> {
    // Validate business license
    const licenseValid = await this.verifyLicense(data.licenseNumber);
    if (!licenseValid) {
      throw new Error('Invalid or expired license');
    }

    // Validate insurance
    const insuranceValid = await this.verifyInsurance(data.insuranceCertificate);
    if (!insuranceValid) {
      throw new Error('Insurance verification failed');
    }

    // Create vendor account
    const vendor = await db.vendors.create({
      data: {
        company_name: data.companyName,
        business_type: data.businessType,
        status: 'pending_verification',
        license_number: data.licenseNumber,
        insurance_certificate_url: data.insuranceCertificate,
        bank_account_token: await this.tokenizeBankAccount(data.bankAccount),
        contact_email: data.contactPerson.email,
        contact_phone: data.contactPerson.phone,
        service_areas: data.serviceAreas,
        service_categories: data.categories,
        certifications: data.certifications,
        created_at: new Date()
      }
    });

    // Trigger background verification
    await this.startVerificationProcess(vendor.id);

    return vendor;
  }

  private async verifyLicense(licenseNumber: string): Promise<boolean> {
    // Call licensing authority API
    try {
      const response = await fetch(
        `https://licensing.example.com/verify/${licenseNumber}`
      );
      return response.ok;
    } catch (error) {
      console.error('License verification failed:', error);
      return false;
    }
  }

  private async verifyInsurance(certificateUrl: string): Promise<boolean> {
    // OCR and validate insurance certificate
    try {
      const imageText = await this.ocrDocument(certificateUrl);
      return this.validateInsuranceCertificate(imageText);
    } catch (error) {
      console.error('Insurance verification failed:', error);
      return false;
    }
  }

  private async startVerificationProcess(vendorId: string): Promise<void> {
    // Queue background verification job
    await queue.add('verify_vendor', { vendorId });
  }
}
```

### Service Listing Management

```typescript
// src/services/marketplace/serviceListing.ts

interface ServiceListing {
  vendorId: string;
  serviceType: string;
  title: string;
  description: string;
  basePrice: number;
  priceVariation?: 'fixed' | 'hourly' | 'per_unit';
  estimatedDuration?: number; // hours
  serviceArea: string[];
  certifications: string[];
  guarantees?: string[];
  images: string[];
  tags: string[];
}

class ServiceListingService {
  async createListing(vendorId: string, data: ServiceListing): Promise<void> {
    // Validate vendor is verified
    const vendor = await db.vendors.findUnique({
      where: { id: vendorId }
    });

    if (vendor.status !== 'verified') {
      throw new Error('Vendor not yet verified');
    }

    // Create listing
    const listing = await db.service_listings.create({
      data: {
        vendor_id: vendorId,
        service_type: data.serviceType,
        title: data.title,
        description: data.description,
        base_price: data.basePrice,
        price_type: data.priceVariation || 'fixed',
        estimated_duration: data.estimatedDuration,
        service_areas: data.serviceArea,
        certifications: data.certifications,
        guarantees: data.guarantees,
        tags: data.tags,
        status: 'active',
        created_at: new Date()
      }
    });

    // Index for search
    await this.indexForSearch(listing);
  }

  private async indexForSearch(listing: ServiceListing): Promise<void> {
    // Add to Elasticsearch or similar search engine
    const searchIndex = {
      id: listing.id,
      vendor_id: listing.vendor_id,
      vendor_name: (await db.vendors.findUnique({
        where: { id: listing.vendor_id }
      })).company_name,
      title: listing.title,
      description: listing.description,
      service_type: listing.service_type,
      price: listing.base_price,
      location: listing.service_areas,
      rating: (await this.getVendorRating(listing.vendor_id))
    };

    await searchEngine.index(searchIndex);
  }
}
```

---

## Service Taxonomy

```json
{
  "service_categories": {
    "maintenance": {
      "icon": "wrench",
      "subcategories": {
        "oil_change": "Regular oil and filter changes",
        "tire_service": "Tire rotation, balancing, replacement",
        "brake_service": "Brake inspection and maintenance",
        "fluid_flush": "Coolant, transmission, brake fluid",
        "filter_replacement": "Air, cabin, fuel filters",
        "battery_service": "Battery testing and replacement",
        "alignment": "Wheel alignment and balancing"
      }
    },
    "repair": {
      "icon": "tool",
      "subcategories": {
        "engine_repair": "Engine diagnostics and repair",
        "transmission_repair": "Transmission issues",
        "brake_repair": "Brake system repairs",
        "electrical_repair": "Electrical system repairs",
        "suspension_repair": "Suspension and steering",
        "body_repair": "Body damage and panel repair"
      }
    },
    "inspection": {
      "icon": "magnifying-glass",
      "subcategories": {
        "pre_purchase": "Pre-purchase vehicle inspection",
        "safety_inspection": "DOT safety inspection",
        "emissions": "Emissions testing",
        "vin_verification": "VIN verification",
        "accident_inspection": "Accident damage assessment"
      }
    },
    "specialized_services": {
      "icon": "star",
      "subcategories": {
        "gps_installation": "GPS/tracking installation",
        "dash_cam": "Dash camera installation",
        "telematics": "Telematics system setup",
        "fuel_card_setup": "Fuel card program setup",
        "compliance_consulting": "Compliance and regulatory consulting"
      }
    }
  }
}
```

---

## Bidding Engine

### Request for Quote (RFQ)

```typescript
// src/services/marketplace/rfqService.ts

interface RFQRequest {
  fleetId: string;
  serviceType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  vehicles: Array<{
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
  }>;
  description: string;
  requiredCertifications?: string[];
  preferredVendors?: string[];
  budget?: number;
  timeline: {
    startDate: Date;
    endDate: Date;
  };
  attachments?: string[];
}

class RFQService {
  async createRFQ(data: RFQRequest): Promise<RFQ> {
    // Create RFQ record
    const rfq = await db.rfqs.create({
      data: {
        fleet_id: data.fleetId,
        service_type: data.serviceType,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude
        },
        vehicles: data.vehicles,
        description: data.description,
        required_certifications: data.requiredCertifications,
        budget: data.budget,
        start_date: data.timeline.startDate,
        end_date: data.timeline.endDate,
        status: 'open',
        created_at: new Date()
      }
    });

    // Find matching vendors
    const matchingVendors = await this.findMatchingVendors(rfq);

    // Send invitations to vendors
    for (const vendor of matchingVendors) {
      await this.sendBidInvitation(rfq.id, vendor.id);
    }

    return rfq;
  }

  private async findMatchingVendors(rfq: RFQ): Promise<Vendor[]> {
    // Find vendors with:
    // 1. Service type match
    // 2. Service area coverage
    // 3. Required certifications
    // 4. Adequate rating (> 4.0 stars)

    const vendors = await db.vendors.findMany({
      where: {
        AND: [
          { status: 'verified' },
          { service_categories: { has: rfq.service_type } },
          {
            service_areas: {
              some: {
                contains: this.getZipcodeFromCoords(rfq.location)
              }
            }
          },
          rfq.required_certifications
            ? { certifications: { hasAll: rfq.required_certifications } }
            : {},
          {
            rating: { gte: 4.0 }
          }
        ]
      },
      include: {
        ratings: {
          select: { score: true }
        }
      },
      orderBy: { rating: 'desc' },
      take: 20 // Top 20 vendors
    });

    return vendors;
  }

  private async sendBidInvitation(rfqId: string, vendorId: string): Promise<void> {
    // Send notification to vendor
    await notificationService.send({
      userId: vendorId,
      type: 'bid_invitation',
      data: { rfqId },
      channels: ['email', 'in_app']
    });
  }
}
```

### Bid Submission & Management

```typescript
interface Bid {
  rfqId: string;
  vendorId: string;
  proposedPrice: number;
  laborCost?: number;
  materialsCost?: number;
  estimatedDuration: number; // hours
  availability: {
    startDate: Date;
    endDate: Date;
  };
  notes?: string;
  guarantees?: {
    workmanship: number; // days
    parts: number; // days
  };
}

class BidService {
  async submitBid(data: Bid): Promise<string> {
    // Validate vendor can bid
    const vendor = await db.vendors.findUnique({
      where: { id: data.vendorId }
    });

    const rfq = await db.rfqs.findUnique({
      where: { id: data.rfqId }
    });

    if (!vendor || vendor.status !== 'verified') {
      throw new Error('Vendor not verified');
    }

    if (!rfq || rfq.status !== 'open') {
      throw new Error('RFQ not open for bidding');
    }

    // Create bid
    const bid = await db.bids.create({
      data: {
        rfq_id: data.rfqId,
        vendor_id: data.vendorId,
        proposed_price: data.proposedPrice,
        labor_cost: data.laborCost,
        materials_cost: data.materialsCost,
        estimated_duration: data.estimatedDuration,
        availability_start: data.availability.startDate,
        availability_end: data.availability.endDate,
        notes: data.notes,
        guarantees: data.guarantees,
        status: 'submitted',
        created_at: new Date()
      }
    });

    // Notify fleet about new bid
    await notificationService.send({
      userId: rfq.fleet_id,
      type: 'bid_received',
      data: { rfqId: data.rfqId, vendorId: data.vendorId }
    });

    return bid.id;
  }

  async acceptBid(bidId: string): Promise<void> {
    const bid = await db.bids.findUnique({
      where: { id: bidId },
      include: { rfq: true }
    });

    if (!bid) throw new Error('Bid not found');

    // Update bid and RFQ status
    await db.bids.update({
      where: { id: bidId },
      data: { status: 'accepted' }
    });

    await db.rfqs.update({
      where: { id: bid.rfq_id },
      data: { status: 'awarded', awarded_bid_id: bidId }
    });

    // Reject other bids
    await db.bids.updateMany({
      where: {
        rfq_id: bid.rfq_id,
        id: { not: bidId }
      },
      data: { status: 'rejected' }
    });

    // Create service order
    const order = await this.createServiceOrder(bid);

    // Notify vendor
    await notificationService.send({
      userId: bid.vendor_id,
      type: 'bid_accepted',
      data: { orderId: order.id }
    });
  }

  private async createServiceOrder(bid: Bid): Promise<ServiceOrder> {
    return db.service_orders.create({
      data: {
        bid_id: bid.id,
        vendor_id: bid.vendor_id,
        fleet_id: bid.rfq.fleet_id,
        service_type: bid.rfq.service_type,
        amount: bid.proposed_price,
        status: 'pending_payment',
        created_at: new Date()
      }
    });
  }
}
```

---

## Payment Processing & Escrow

### Stripe Escrow Integration

```typescript
// src/services/payments/escrowService.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

class EscrowService {
  async holdPayment(orderId: string, amount: number): Promise<string> {
    // Create connected account for vendor (if not exists)
    const order = await db.service_orders.findUnique({
      where: { id: orderId },
      include: { vendor: true }
    });

    let vendorStripeAccount = await this.getOrCreateStripeAccount(order.vendor);

    // Create payment intent for escrow
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: orderId,
        vendorId: order.vendor_id,
        type: 'marketplace_escrow'
      }
    });

    // Store in database
    await db.escrow_payments.create({
      data: {
        order_id: orderId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        status: 'pending',
        created_at: new Date()
      }
    });

    return paymentIntent.client_secret;
  }

  async confirmPayment(paymentIntentId: string): Promise<void> {
    // Verify payment is successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not succeeded');
    }

    // Update escrow record
    await db.escrow_payments.update({
      where: { stripe_payment_intent_id: paymentIntentId },
      data: { status: 'held' }
    });

    // Update order status
    const escrow = await db.escrow_payments.findUnique({
      where: { stripe_payment_intent_id: paymentIntentId }
    });

    await db.service_orders.update({
      where: { id: escrow.order_id },
      data: { status: 'in_progress' }
    });
  }

  async releasePayment(orderId: string): Promise<void> {
    const order = await db.service_orders.findUnique({
      where: { id: orderId },
      include: { vendor: true, bid: true }
    });

    const escrow = await db.escrow_payments.findUnique({
      where: { order_id: orderId }
    });

    if (escrow.status !== 'held') {
      throw new Error('Escrow payment not held');
    }

    // Get vendor's Stripe account
    const vendorStripeAccount = await this.getOrCreateStripeAccount(order.vendor);

    // Transfer funds to vendor (minus platform fee)
    const vendorAmount = order.bid.proposed_price * 0.95; // 5% platform fee
    const platformFee = order.bid.proposed_price * 0.05;

    await stripe.transfers.create({
      amount: Math.round(vendorAmount * 100),
      currency: 'usd',
      destination: vendorStripeAccount.id,
      metadata: {
        orderId: orderId,
        type: 'service_completion'
      }
    });

    // Record platform fee
    await db.platform_revenue.create({
      data: {
        order_id: orderId,
        fee_amount: platformFee,
        date: new Date()
      }
    });

    // Update escrow
    await db.escrow_payments.update({
      where: { order_id: orderId },
      data: { status: 'released' }
    });

    // Update order
    await db.service_orders.update({
      where: { id: orderId },
      data: { status: 'completed' }
    });

    // Notify vendor
    await notificationService.send({
      userId: order.vendor_id,
      type: 'payment_released',
      data: { amount: vendorAmount, orderId }
    });
  }

  async refundPayment(orderId: string, reason: string): Promise<void> {
    const escrow = await db.escrow_payments.findUnique({
      where: { order_id: orderId }
    });

    if (!escrow || escrow.status !== 'held') {
      throw new Error('Cannot refund escrow payment');
    }

    // Refund via Stripe
    await stripe.refunds.create({
      payment_intent: escrow.stripe_payment_intent_id
    });

    // Update records
    await db.escrow_payments.update({
      where: { order_id: orderId },
      data: { status: 'refunded' }
    });

    await db.service_orders.update({
      where: { id: orderId },
      data: { status: 'cancelled', cancellation_reason: reason }
    });
  }

  private async getOrCreateStripeAccount(vendor: Vendor): Promise<any> {
    // Check if vendor already has Stripe account
    if (vendor.stripe_account_id) {
      return { id: vendor.stripe_account_id };
    }

    // Create new connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: vendor.contact_email,
      business_profile: {
        name: vendor.company_name,
        support_email: vendor.contact_email
      },
      metadata: {
        vendorId: vendor.id
      }
    });

    // Store account ID
    await db.vendors.update({
      where: { id: vendor.id },
      data: { stripe_account_id: account.id }
    });

    return account;
  }
}
```

---

## Rating & Review System

```typescript
// src/services/marketplace/ratingService.ts

interface Review {
  orderId: string;
  reviewerId: string; // Fleet user
  vendorId: string;
  rating: number; // 1-5
  category: 'quality' | 'timeliness' | 'communication' | 'value';
  title: string;
  comment: string;
  photos?: string[];
  response?: {
    vendorResponse: string;
    respondedAt: Date;
  };
}

class RatingService {
  async submitReview(data: Review): Promise<void> {
    // Verify order is completed
    const order = await db.service_orders.findUnique({
      where: { id: data.orderId }
    });

    if (order.status !== 'completed') {
      throw new Error('Can only review completed orders');
    }

    // Check if already reviewed
    const existing = await db.reviews.findFirst({
      where: {
        order_id: data.orderId,
        reviewer_id: data.reviewerId
      }
    });

    if (existing) {
      throw new Error('Already reviewed this order');
    }

    // Create review
    const review = await db.reviews.create({
      data: {
        order_id: data.orderId,
        reviewer_id: data.reviewerId,
        vendor_id: data.vendorId,
        rating: data.rating,
        category: data.category,
        title: data.title,
        comment: data.comment,
        photos: data.photos,
        created_at: new Date(),
        verified_purchase: true
      }
    });

    // Update vendor rating
    await this.updateVendorRating(data.vendorId);

    // Notify vendor
    await notificationService.send({
      userId: data.vendorId,
      type: 'new_review',
      data: { rating: data.rating, comment: data.comment }
    });
  }

  async submitVendorResponse(reviewId: string, response: string): Promise<void> {
    await db.reviews.update({
      where: { id: reviewId },
      data: {
        vendor_response: response,
        vendor_response_date: new Date()
      }
    });

    // Notify reviewer
    const review = await db.reviews.findUnique({
      where: { id: reviewId }
    });

    await notificationService.send({
      userId: review.reviewer_id,
      type: 'vendor_responded',
      data: { response }
    });
  }

  private async updateVendorRating(vendorId: string): Promise<void> {
    // Calculate average rating
    const reviews = await db.reviews.findMany({
      where: { vendor_id: vendorId }
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await db.vendors.update({
      where: { id: vendorId },
      data: {
        rating: avgRating,
        review_count: reviews.length
      }
    });
  }

  async getVendorRatings(vendorId: string): Promise<VendorRatings> {
    const reviews = await db.reviews.findMany({
      where: { vendor_id: vendorId },
      include: { reviewer: { select: { name: true } } }
    });

    const byCategory = {
      quality: reviews.filter(r => r.category === 'quality').map(r => r.rating),
      timeliness: reviews.filter(r => r.category === 'timeliness').map(r => r.rating),
      communication: reviews.filter(r => r.category === 'communication').map(r => r.rating),
      value: reviews.filter(r => r.category === 'value').map(r => r.rating)
    };

    return {
      overall: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      byCategory: {
        quality: this.averageRating(byCategory.quality),
        timeliness: this.averageRating(byCategory.timeliness),
        communication: this.averageRating(byCategory.communication),
        value: this.averageRating(byCategory.value)
      },
      totalReviews: reviews.length,
      recentReviews: reviews.slice(0, 10)
    };
  }

  private averageRating(ratings: number[]): number {
    return ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
  }
}
```

---

## Dispute Resolution

### Dispute Management System

```typescript
// src/services/marketplace/disputeService.ts

interface Dispute {
  orderId: string;
  initiatedBy: 'fleet' | 'vendor';
  type: 'poor_quality' | 'incomplete_service' | 'overcharge' | 'miscommunication' | 'other';
  description: string;
  supportingDocuments?: string[];
  requestedResolution: string;
}

class DisputeService {
  async createDispute(data: Dispute): Promise<string> {
    // Verify order exists and is in dispute window (30 days)
    const order = await db.service_orders.findUnique({
      where: { id: data.orderId }
    });

    const daysSinceCompletion = Math.floor(
      (Date.now() - order.completed_at.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCompletion > 30) {
      throw new Error('Dispute window has closed (30 days)');
    }

    // Create dispute
    const dispute = await db.disputes.create({
      data: {
        order_id: data.orderId,
        initiated_by: data.initiatedBy,
        type: data.type,
        description: data.description,
        documents: data.supportingDocuments,
        requested_resolution: data.requestedResolution,
        status: 'open',
        created_at: new Date()
      }
    });

    // Hold refund if initiated by fleet
    if (data.initiatedBy === 'fleet') {
      await this.holdRefund(order.id);
    }

    // Notify other party
    await this.notifyDisputeParty(order, dispute);

    return dispute.id;
  }

  async respondToDispute(disputeId: string, response: string): Promise<void> {
    const dispute = await db.disputes.findUnique({
      where: { id: disputeId }
    });

    if (dispute.status !== 'open') {
      throw new Error('Dispute is not open for response');
    }

    // Record response
    await db.dispute_responses.create({
      data: {
        dispute_id: disputeId,
        respondent_type: dispute.initiated_by === 'fleet' ? 'vendor' : 'fleet',
        response: response,
        created_at: new Date()
      }
    });

    // Notify other party
    await this.notifyDisputeResponse(dispute);
  }

  async resolveDispute(
    disputeId: string,
    resolution: 'full_refund' | 'partial_refund' | 'no_refund' | 'adjustment',
    refundAmount?: number,
    notes?: string
  ): Promise<void> {
    const dispute = await db.disputes.findUnique({
      where: { id: disputeId },
      include: { order: true }
    });

    // Determine resolution
    let finalRefund = 0;
    let message = '';

    switch (resolution) {
      case 'full_refund':
        finalRefund = dispute.order.amount;
        message = 'Full refund approved';
        break;
      case 'partial_refund':
        finalRefund = refundAmount || 0;
        message = `Partial refund approved: $${finalRefund}`;
        break;
      case 'no_refund':
        finalRefund = 0;
        message = 'No refund - service deemed acceptable';
        break;
      case 'adjustment':
        finalRefund = refundAmount || 0;
        message = `Adjustment: $${finalRefund}`;
        break;
    }

    // Process refund if applicable
    if (finalRefund > 0) {
      const escrow = await db.escrow_payments.findUnique({
        where: { order_id: dispute.order_id }
      });

      const refundRemainder = dispute.order.amount - finalRefund;

      // Refund to fleet
      await stripe.refunds.create({
        payment_intent: escrow.stripe_payment_intent_id,
        amount: Math.round(finalRefund * 100)
      });

      // Release remainder to vendor
      if (refundRemainder > 0) {
        const vendor = await db.vendors.findUnique({
          where: { id: dispute.order.vendor_id }
        });
        const vendorAmount = refundRemainder * 0.95; // Deduct fee

        await stripe.transfers.create({
          amount: Math.round(vendorAmount * 100),
          currency: 'usd',
          destination: vendor.stripe_account_id
        });
      }
    } else {
      // Release full amount to vendor
      const order = dispute.order;
      const vendor = await db.vendors.findUnique({
        where: { id: order.vendor_id }
      });

      const vendorAmount = order.amount * 0.95;
      await stripe.transfers.create({
        amount: Math.round(vendorAmount * 100),
        currency: 'usd',
        destination: vendor.stripe_account_id
      });
    }

    // Update dispute
    await db.disputes.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        resolution: resolution,
        refund_amount: finalRefund,
        resolution_notes: notes,
        resolved_at: new Date()
      }
    });

    // Notify parties
    await this.notifyDisputeResolution(dispute, finalRefund, message);
  }

  private async holdRefund(orderId: string): Promise<void> {
    // Flag order to prevent vendor payout
    await db.service_orders.update({
      where: { id: orderId },
      data: { status: 'disputed', hold_payment: true }
    });
  }

  private async notifyDisputeParty(order: any, dispute: any): Promise<void> {
    const otherPartyId = dispute.initiated_by === 'fleet'
      ? order.vendor_id
      : order.fleet_id;

    await notificationService.send({
      userId: otherPartyId,
      type: 'dispute_opened',
      data: { disputeId: dispute.id, type: dispute.type }
    });
  }

  private async notifyDisputeResponse(dispute: any): Promise<void> {
    const notifyId = dispute.initiated_by === 'fleet'
      ? dispute.order.vendor_id
      : dispute.order.fleet_id;

    await notificationService.send({
      userId: notifyId,
      type: 'dispute_response',
      data: { disputeId: dispute.id }
    });
  }

  private async notifyDisputeResolution(
    dispute: any,
    refundAmount: number,
    message: string
  ): Promise<void> {
    // Notify fleet
    await notificationService.send({
      userId: dispute.order.fleet_id,
      type: 'dispute_resolved',
      data: {
        resolution: dispute.resolution,
        refundAmount,
        message
      }
    });

    // Notify vendor
    await notificationService.send({
      userId: dispute.order.vendor_id,
      type: 'dispute_resolved',
      data: {
        resolution: dispute.resolution,
        message
      }
    });
  }
}
```

---

## Database Schema

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending_verification', -- 'pending_verification', 'verified', 'suspended', 'inactive'
  license_number VARCHAR(100) ENCRYPTED,
  insurance_certificate_url TEXT,
  bank_account_token VARCHAR(500) ENCRYPTED,
  stripe_account_id VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  service_categories TEXT[],
  service_areas TEXT[],
  certifications TEXT[],
  rating NUMERIC(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_earnings NUMERIC(15,2) DEFAULT 0,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(license_number),
  INDEX idx_status (status),
  INDEX idx_rating (rating)
);

CREATE TABLE service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(12,2) NOT NULL,
  price_type VARCHAR(50), -- 'fixed', 'hourly', 'per_unit'
  estimated_duration INTEGER,
  service_areas TEXT[],
  certifications TEXT[],
  guarantees TEXT[],
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_service_type (service_type)
);

CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  location GEOGRAPHY,
  vehicles JSONB,
  description TEXT,
  required_certifications TEXT[],
  budget NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'awarded', 'closed'
  awarded_bid_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fleet_id) REFERENCES fleets(id),
  INDEX idx_fleet (fleet_id),
  INDEX idx_status (status)
);

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  proposed_price NUMERIC(12,2) NOT NULL,
  labor_cost NUMERIC(12,2),
  materials_cost NUMERIC(12,2),
  estimated_duration INTEGER,
  availability_start DATE,
  availability_end DATE,
  notes TEXT,
  guarantees JSONB,
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected', 'withdrawn'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  INDEX idx_rfq (rfq_id),
  INDEX idx_vendor (vendor_id),
  UNIQUE(rfq_id, vendor_id)
);

CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  fleet_id UUID NOT NULL,
  service_type VARCHAR(100),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_payment', -- 'pending_payment', 'in_progress', 'completed', 'cancelled', 'disputed'
  hold_payment BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bid_id) REFERENCES bids(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (fleet_id) REFERENCES fleets(id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_fleet (fleet_id),
  INDEX idx_status (status)
);

CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE,
  stripe_payment_intent_id VARCHAR(255),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'held', 'released', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  INDEX idx_status (status)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50),
  title VARCHAR(255),
  comment TEXT,
  photos TEXT[],
  vendor_response TEXT,
  vendor_response_date TIMESTAMP WITH TIME ZONE,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_rating (rating)
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  initiated_by VARCHAR(50), -- 'fleet', 'vendor'
  type VARCHAR(100),
  description TEXT,
  documents TEXT[],
  requested_resolution TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved'
  resolution VARCHAR(50),
  refund_amount NUMERIC(12,2),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  INDEX idx_status (status),
  INDEX idx_order (order_id)
);

CREATE TABLE platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  fee_amount NUMERIC(12,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  INDEX idx_date (date)
);
```

---

## Vendor Compliance & Vetting

### Verification Process

```typescript
class VendorVerificationService {
  async verifyVendor(vendorId: string): Promise<void> {
    const vendor = await db.vendors.findUnique({
      where: { id: vendorId }
    });

    const checks = {
      licenseVerified: await this.verifyLicense(vendor.license_number),
      insuranceValid: await this.verifyInsurance(vendor.insurance_certificate_url),
      backgroundCheckPassed: await this.runBackgroundCheck(vendor),
      bankAccountValid: await this.validateBankAccount(vendor.bank_account_token),
      businessRegistered: await this.checkBusinessRegistration(vendor)
    };

    // All checks must pass
    const allPassed = Object.values(checks).every(result => result === true);

    if (allPassed) {
      await db.vendors.update({
        where: { id: vendorId },
        data: {
          status: 'verified',
          verification_date: new Date()
        }
      });

      await notificationService.send({
        userId: vendorId,
        type: 'vendor_verified',
        data: { message: 'Your vendor account has been verified!' }
      });
    } else {
      const failedChecks = Object.entries(checks)
        .filter(([, result]) => result === false)
        .map(([check]) => check);

      await db.vendors.update({
        where: { id: vendorId },
        data: {
          status: 'verification_failed',
          verification_notes: `Failed checks: ${failedChecks.join(', ')}`
        }
      });
    }
  }

  private async verifyLicense(licenseNumber: string): Promise<boolean> {
    // Implement license verification via API
    return true;
  }

  private async verifyInsurance(certificateUrl: string): Promise<boolean> {
    // Verify insurance certificate is current and valid
    return true;
  }

  private async runBackgroundCheck(vendor: Vendor): Promise<boolean> {
    // Run background check on vendor
    return true;
  }

  private async validateBankAccount(bankToken: string): Promise<boolean> {
    // Validate bank account via Stripe or similar
    return true;
  }

  private async checkBusinessRegistration(vendor: Vendor): Promise<boolean> {
    // Check business is registered with state
    return true;
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('BidService', () => {
  it('should create bid with valid data', async () => {
    const bid = await bidService.submitBid({
      rfqId: 'RFQ-001',
      vendorId: 'VENDOR-001',
      proposedPrice: 500,
      estimatedDuration: 4,
      availability: {
        startDate: new Date(),
        endDate: addDays(new Date(), 7)
      }
    });

    expect(bid).toBeDefined();
    expect(bid.status).toBe('submitted');
  });

  it('should reject bid from unverified vendor', async () => {
    expect(() => bidService.submitBid({
      rfqId: 'RFQ-001',
      vendorId: 'UNVERIFIED-VENDOR',
      proposedPrice: 500,
      estimatedDuration: 4,
      availability: {}
    })).toThrow('Vendor not verified');
  });
});

describe('EscrowService', () => {
  it('should hold payment on accepted bid', async () => {
    const clientSecret = await escrowService.holdPayment('ORDER-001', 500);
    expect(clientSecret).toBeDefined();

    const escrow = await db.escrow_payments.findUnique({
      where: { order_id: 'ORDER-001' }
    });

    expect(escrow.status).toBe('pending');
  });
});
```

---

## Cost Analysis

### Development Cost
- Backend API: 120 hours × $100 = $12,000
- Frontend UI: 100 hours × $100 = $10,000
- Payment integration: 60 hours × $120 = $7,200
- Dispute system: 40 hours × $100 = $4,000
- Testing/QA: 80 hours × $80 = $6,400
- Documentation: 30 hours × $80 = $2,400

**Total Development:** $42,000

### Infrastructure Cost (Monthly)
- Database: $150
- API hosting: $300
- Search (Elasticsearch): $100
- Monitoring: $50
- **Total Monthly:** $600 (~$7,200/year)

### Platform Fees (Transaction-based)
- 5% of all transactions
- Year 1 projection (conservative): $500,000 revenue × 5% = $25,000

### Year 1 Total: $42,000 + $7,200 + $25,000 (gross revenue) = $74,200 cost

### Revenue Model

| Scenario | Monthly Volume | Annual Revenue | Notes |
|----------|---|---|---|
| Conservative | $200K | $120,000 | 5% platform fee |
| Moderate | $500K | $300,000 | Growing adoption |
| Optimistic | $1M+ | $600,000+ | Market leadership |

### ROI Calculation
**Year 1 Cost:** $42,000 + $7,200 = $49,200
**Conservative Year 1 Revenue:** $120,000 × 5% = $6,000 profit
**Moderate Year 1 Revenue:** $300,000 × 5% = $15,000 profit
**Year 1+ Ongoing Margin:** ~80% (minimal variable costs)

**Year 2+ Annual Revenue:** $300,000 - $600,000 (estimated)
**Year 2+ Net Profit:** $240,000 - $540,000

---

## Success Metrics

- **Vendor Acquisition:** 200+ verified vendors Year 1
- **RFQ Volume:** 1,000+ RFQs/month by end of Year 1
- **Average Bid Time:** < 24 hours
- **Payment Success Rate:** > 98%
- **Dispute Rate:** < 2% of transactions
- **Vendor Satisfaction:** > 4.0/5.0 stars
- **Fleet Adoption:** > 40% of customers using marketplace

---

**Document Version:** 1.0
**Last Updated:** November 16, 2025
**Owner:** Technical Implementation Specialist
**Status:** Ready for Engineering Review
