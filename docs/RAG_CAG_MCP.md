# Adding RAG/CAG/MCP for Accounting Correctness

## RAG (Retrieval Augmented Generation)
Store internal accounting guidance in:
- `accounting_policies` (JSON policy)
- `useful_life_rules` (structured)
- Optional `accounting_documents` table (markdown + embeddings)

At component create/update:
1) Retrieve policy + category rules.
2) Present recommended defaults and citations in UI.
3) Require overrides for out-of-policy values.

## CAG (Constraint Augmented Generation)
AI can suggest values but constraints enforce:
- method is in allow-list
- useful life in allowed range per category
- cost >= 0
- salvage <= cost
- cannot affect closed periods
- override_reason required when out-of-range

## MCP
Expose tools:
- `getCapitalizationThreshold()`
- `getUsefulLifeRule(category)`
- `validateComponent(input)`
- `postJournalEntry(periodId, entries)`
- `fetchInvoice(invoiceId)`

Then AI becomes an orchestrator that calls tools instead of guessing.
