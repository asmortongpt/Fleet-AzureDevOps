# CTA Fleet ERD - Eraser.io Generated Diagram

**Generated:** February 5, 2026

## Visual ERD Image

![CTA Fleet ERD](./CTA-FLEET-ERD-Visual.png)

**Local File:** `docs/architecture/CTA-FLEET-ERD-Visual.png`

## Direct Image URL

https://storage.googleapis.com/second-petal-295822.appspot.com/elements/elements%3A8d476a92a46557644b09a201a4d295a6c62d45e36cac1948bc8895fcbe387ce9.png

## Editable Eraser.io File

You can edit this diagram online at:

https://app.eraser.io/new?requestId=XDj2CKzyViZ652YoVvcD&state=qK9yRSGOoCoO47Egx5N6l

## Diagram Contents

**Entities Shown:**
- tenants (multi-tenant root)
- users
- vehicles
- drivers
- work_orders
- telemetry_data
- expenses
- documents
- document_embeddings (RAG vectors)
- ml_models
- predictions

**Key Relationships:**
- Multi-tenancy: tenants → all entities (tenant_id)
- User-Driver: users ↔ drivers (one-to-one)
- Driver-Vehicle: drivers → vehicles (assigned)
- Vehicle Operations: vehicles → work_orders, telemetry, expenses
- RAG System: documents → document_embeddings
- AI/ML: ml_models → predictions

**Color Coding:**
- Core entities: Blue
- Maintenance: Red
- Telemetry: Teal
- Financial: Green
- AI/ML: Purple
- Documents: Violet

## Source Code

The ERD was generated from: `docs/architecture/cta-fleet-erd-eraser-code.txt`

Full schema documentation: `docs/architecture/CTA-FLEET-ERD.md`
