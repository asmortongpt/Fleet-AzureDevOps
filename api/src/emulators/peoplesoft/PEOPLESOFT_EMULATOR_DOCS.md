# PeopleSoft Emulator API Documentation

## Overview

The PeopleSoft Emulator provides a realistic simulation of PeopleSoft Finance interfaces for the City of Tallahassee Fleet Management System. This allows validation of the AssetWorks replacement integration without requiring live PeopleSoft access.

## Purpose

- Validate chartfields (dept/fund/account/project) before posting
- Post and track GL journals (billing exports)
- Optionally post AP vouchers (sublets)
- Simulate PeopleSoft failures (closed periods, invalid chartfields, duplicate journal handling)
- Provide async callback confirmation to the AMS

## Base URL and Versioning

- **Base URL:** `http://localhost:3001/api/emulators/peoplesoft`
- **Version:** `/v1`
- **Example:** `http://localhost:3001/api/emulators/peoplesoft/v1/finance/gl/journals`

---

## Authentication

### Supported Authentication Modes

1. **OAuth2 Client Credentials** (recommended)
2. **Basic Auth** (optional, for internal testing)
3. **API Key** (optional, simplest mode)

### OAuth2 Token Endpoint

#### `POST /v1/auth/token`

**Request:**
```json
{
  "client_id": "ams-integration",
  "client_secret": "********",
  "grant_type": "client_credentials"
}
```

**Response:**
```json
{
  "access_token": "ps_eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "finance.write finance.read"
}
```

**Headers for subsequent requests:**
```
Authorization: Bearer <token>
```

---

## Common Concepts

### Chartfields

The emulator uses a PeopleSoft-like chartfield model:

- **Business Unit / Company** - City organizational unit
- **Department** - Department code (e.g., 17020 for Fleet Services)
- **Fund** - Fund code (001 = General Fund, 201 = Fleet ISF, etc.)
- **Account** - GL account code (654210 = Vehicle Repairs, etc.)
- **Operating Unit** - Business area (FLEET, POLICE, FIRE, etc.)
- **Project ID** (optional) - Capital project identifier
- **Activity ID** (optional) - Project activity code

### Posting Modes

- **SYNC:** Returns posted/rejected immediately
- **ASYNC:** Returns accepted with status "PROCESSING" and calls back later

### Idempotency

All write endpoints accept:
- `Idempotency-Key: <guid>` header
- Re-submissions with the same key return the same result without duplication

### Correlation / Audit

All endpoints accept optional:
- `X-Correlation-Id: <guid>`
- Included in logs and responses for request tracing

---

## API Endpoints

### 1. Validate Chartfields

#### `POST /v1/finance/chartfields/validate`

**Purpose:** Validate accounting string before creating journals.

**Request:**
```json
{
  "business_unit": "CITY_TALLY",
  "company": "FLEET",
  "department": "17020",
  "fund": "001",
  "account": "654210",
  "operating_unit": "FLEET",
  "program": "FLEET_OPS",
  "project_id": "PRJ-2026-001",
  "activity_id": "A001"
}
```

**Response (valid):**
```json
{
  "is_valid": true,
  "normalized": {
    "business_unit": "CITY_TALLY",
    "company": "FLEET",
    "department": "17020",
    "fund": "001",
    "account": "654210",
    "operating_unit": "FLEET",
    "project_id": "PRJ-2026-001",
    "activity_id": "A001"
  },
  "warnings": [],
  "errors": []
}
```

**Response (invalid):**
```json
{
  "is_valid": false,
  "errors": [
    {
      "field": "account",
      "code": "INVALID_VALUE",
      "message": "Account not found"
    }
  ]
}
```

**Validation Rules:**
- Must exist in emulator's chartfield seed tables
- Department must be active
- Fund must be active
- Account must be active
- Project must be active (if provided)
- Period must be open (optional enforcement)

---

### 2. Post GL Journals

#### `POST /v1/finance/gl/journals`

**Purpose:** Post billing data (BillingBatch → BillingCharge lines) as a GL Journal.

**Headers:**
- `Idempotency-Key: <guid>`
- `X-Correlation-Id: <guid>`
- `Authorization: Bearer <token>`

**Request:**
```json
{
  "journal_header": {
    "business_unit": "CITY_TALLY",
    "journal_date": "2026-01-05",
    "source": "FLEET",
    "reference": "AMSBatchId=AMS-2026-00055",
    "description": "Fleet billing export",
    "posting_mode": "ASYNC"
  },
  "lines": [
    {
      "line_nbr": 1,
      "account": "654210",
      "deptid": "17020",
      "fund_code": "001",
      "operating_unit": "FLEET",
      "project_id": "PRJ-2026-001",
      "activity_id": "A001",
      "amount": 398.50,
      "dr_cr": "DR",
      "reference": {
        "work_order_number": "24-000345",
        "equipment_key": "E-10012",
        "transaction_date": "2026-01-01"
      }
    }
  ]
}
```

**Response (ASYNC accepted):**
```json
{
  "journal_id": "JRNL000456",
  "status": "PROCESSING",
  "accepted_timestamp": "2026-01-05T13:12:21Z"
}
```

**Response (SYNC posted):**
```json
{
  "journal_id": "JRNL000456",
  "status": "POSTED",
  "posted_timestamp": "2026-01-05T13:12:21Z"
}
```

**Response (rejected):**
```json
{
  "journal_id": null,
  "status": "REJECTED",
  "errors": [
    {
      "line_nbr": 1,
      "code": "INVALID_DEPT",
      "message": "Department is inactive"
    }
  ]
}
```

---

### 3. Get Journal Status

#### `GET /v1/finance/gl/journals/{journal_id}`

**Response:**
```json
{
  "journal_id": "JRNL000456",
  "status": "POSTED",
  "header": {
    "business_unit": "CITY_TALLY",
    "journal_date": "2026-01-05",
    "source": "FLEET",
    "reference": "AMSBatchId=AMS-2026-00055",
    "description": "Fleet billing export",
    "posting_mode": "ASYNC"
  },
  "line_count": 125,
  "posted_timestamp": "2026-01-05T13:15:00Z",
  "errors": []
}
```

---

### 4. Post AP Voucher (Optional)

#### `POST /v1/ap/vouchers`

**Purpose:** Emulates AP voucher creation (often used for sublets).

**Request:**
```json
{
  "vendor_id": "V000123",
  "invoice_id": "INV-889911",
  "invoice_date": "2026-01-03",
  "gross_amount": 1250.00,
  "distribution": [
    {
      "account": "654310",
      "deptid": "17020",
      "fund_code": "001",
      "amount": 1250.00,
      "reference": {
        "work_order_number": "24-000789",
        "sublet_vendor": "Acme Transmission"
      }
    }
  ]
}
```

**Response:**
```json
{
  "voucher_id": "VCHR009911",
  "status": "APPROVED"
}
```

---

### 5. Callback to AMS

When `posting_mode` is ASYNC, PeopleSoft emulator notifies AMS:

#### `POST {AMS_BASE}/integrations/peoplesoft/callbacks/gl`

**Payload:**
```json
{
  "journal_id": "JRNL000456",
  "ams_batch_id": "AMS-2026-00055",
  "status": "POSTED",
  "errors": []
}
```

---

## Error Model

All error responses use consistent schema:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more lines invalid",
    "details": [
      {
        "line_nbr": 3,
        "field": "fund_code",
        "code": "INVALID_VALUE",
        "message": "Fund not found"
      }
    ]
  }
}
```

### Common Error Codes

- `INVALID_VALUE` - Value not found in reference data
- `INACTIVE_VALUE` - Value exists but is inactive
- `PERIOD_CLOSED` - Accounting period is closed
- `DUPLICATE_IDEMPOTENCY_KEY` - Request already processed
- `INVALID_AMOUNT` - Amount validation failed
- `MISSING_REQUIRED_FIELD` - Required field is missing
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Pagination and Filtering

For journal retrieval endpoints:

**Query Parameters:**
- `status=POSTED` - Filter by status
- `from=2026-01-01` - Start date
- `to=2026-01-31` - End date
- `page=1` - Page number
- `pageSize=100` - Items per page

**Response:**
```json
{
  "items": [ /* journal objects */ ],
  "page": 1,
  "pageSize": 100,
  "totalItems": 221,
  "totalPages": 3
}
```

---

## Test Scenario Control

#### `POST /v1/emulator/control`

Enable/disable test scenarios to simulate specific conditions.

**Request:**
```json
{
  "scenario": "CLOSED_PERIOD",
  "enabled": true,
  "params": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  }
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "scenario": "CLOSED_PERIOD"
}
```

### Supported PeopleSoft Scenarios

| Scenario | Description | Parameters |
|----------|-------------|------------|
| `CLOSED_PERIOD` | Reject journal_date in closed period | `start`, `end` dates |
| `INVALID_GL_ACCOUNT` | Force account validation failure | None |
| `INVALID_DEPARTMENT` | Force department validation failure | None |
| `PROJECT_REQUIRED` | Require project_id for all postings | None |
| `PROJECT_INVALID` | Force project validation failure | None |
| `RANDOM_LINE_REJECTIONS` | Randomly reject journal lines | `probability` (0-1) |
| `ASYNC_DELAY` | Add delay to async processing | `delay` (milliseconds) |
| `DUPLICATE_JOURNAL` | Test idempotency behavior | None |
| `RATE_LIMITING` | Enforce rate limits | `max_requests`, `window_ms` |

#### `GET /v1/emulator/control`

Get all scenarios and their current state.

#### `GET /v1/emulator/control/{scenario}`

Get specific scenario configuration.

---

## City of Tallahassee Reference Data

### Departments

| Code | Name | Director |
|------|------|----------|
| 17020 | Fleet Services Division | Michael Stevens |
| 17025 | Equipment Maintenance | Sarah Johnson |
| 17030 | Fuel Management | Robert Martinez |
| 11010 | Public Works - Streets | James Wilson |
| 11020 | Public Works - Sanitation | Patricia Davis |
| 12010 | Police Department | Chief Lawrence Henderson |
| 12020 | Fire Department | Chief Angela Rodriguez |
| 13010 | Parks and Recreation | David Thompson |
| 14010 | Electric Utility | Jennifer White |
| 14020 | Water Utility | Christopher Brown |

### Funds

| Code | Name | Type |
|------|------|------|
| 001 | General Fund | GENERAL |
| 002 | Capital Projects Fund | CAPITAL |
| 101 | Electric Enterprise Fund | ENTERPRISE |
| 102 | Water/Sewer Enterprise Fund | ENTERPRISE |
| 201 | Internal Service Fund - Fleet | INTERNAL_SERVICE |
| 301 | Gas Tax Revenue Fund | SPECIAL_REVENUE |
| 302 | Stormwater Management Fund | SPECIAL_REVENUE |
| 401 | Bond Fund - Infrastructure | CAPITAL |

### GL Accounts (Expenses)

| Account | Name | Category |
|---------|------|----------|
| 654110 | Vehicle Fuel - Gasoline | Fuel |
| 654120 | Vehicle Fuel - Diesel | Fuel |
| 654130 | Vehicle Fuel - Alternative | Fuel |
| 654210 | Vehicle Repairs & Maintenance | Maintenance |
| 654220 | Vehicle Parts & Supplies | Maintenance |
| 654230 | Vehicle Tires | Maintenance |
| 654240 | Vehicle Preventive Maintenance | Maintenance |
| 654310 | Sublet Repairs - Outside Vendors | Sublet |
| 654320 | Emergency Repairs | Maintenance |
| 654410 | Vehicle Registration & Licensing | Administrative |
| 654420 | Vehicle Insurance | Administrative |

### Active Projects

| Project ID | Name | Budget | Department |
|------------|------|--------|------------|
| PRJ-2026-001 | Fleet Modernization Initiative | $2,500,000 | 17020 |
| PRJ-2026-002 | EV Charging Infrastructure | $850,000 | 17020 |
| PRJ-2026-003 | Heavy Equipment Replacement | $1,200,000 | 11010 |
| PRJ-2025-045 | Police Fleet Upgrade | $1,800,000 | 12010 |
| PRJ-2025-046 | Fire Apparatus Replacement | $2,200,000 | 12020 |
| PRJ-2026-004 | Fuel System Upgrade | $450,000 | 17030 |
| PRJ-2025-032 | Sanitation Fleet Replacement | $3,500,000 | 11020 |
| PRJ-2026-005 | Telematics System Implementation | $180,000 | 17020 |

---

## Integration Examples

### Example 1: Validate Chartfield Before Posting

```bash
curl -X POST http://localhost:3001/api/emulators/peoplesoft/v1/finance/chartfields/validate \
  -H "Content-Type: application/json" \
  -d '{
    "business_unit": "CITY_TALLY",
    "company": "FLEET",
    "department": "17020",
    "fund": "201",
    "account": "654210",
    "operating_unit": "FLEET"
  }'
```

### Example 2: Post GL Journal (SYNC)

```bash
curl -X POST http://localhost:3001/api/emulators/peoplesoft/v1/finance/gl/journals \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "journal_header": {
      "business_unit": "CITY_TALLY",
      "journal_date": "2026-01-05",
      "source": "FLEET",
      "reference": "AMS-2026-00055",
      "description": "Fleet billing export",
      "posting_mode": "SYNC"
    },
    "lines": [
      {
        "line_nbr": 1,
        "account": "654210",
        "deptid": "17020",
        "fund_code": "201",
        "operating_unit": "FLEET",
        "amount": 398.50,
        "dr_cr": "DR"
      }
    ]
  }'
```

### Example 3: Enable Closed Period Scenario

```bash
curl -X POST http://localhost:3001/api/emulators/peoplesoft/v1/emulator/control \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "CLOSED_PERIOD",
    "enabled": true,
    "params": {
      "start": "2025-12-01",
      "end": "2025-12-31"
    }
  }'
```

---

## Implementation Notes

### PeopleSoft Reality Behaviors Emulated

1. **Closed Period Rejections** - Posting to closed accounting periods
2. **Chartfield Combo Validation** - Invalid department/fund/account combinations
3. **Project Requirements** - Some account ranges require project IDs
4. **Currency Rounding** - Two-decimal currency precision
5. **Partial Failures** - Some lines reject while others post successfully
6. **Async Processing** - Delayed processing with callbacks
7. **Idempotency** - Duplicate request handling

### Data Lineage

For audit purposes, the emulator stores:
- Original request payload (JSON)
- Timestamp of request
- Correlation IDs
- Idempotency keys
- Processing outcome

---

## Troubleshooting

### Common Issues

**Issue:** Chartfield validation fails
- **Solution:** Check that all chartfield components exist in seed data
- **Reference:** See "City of Tallahassee Reference Data" section

**Issue:** Journal rejected with "Period Closed"
- **Solution:** Check if CLOSED_PERIOD scenario is enabled
- **Fix:** Disable scenario or use different journal_date

**Issue:** Duplicate journal error
- **Solution:** Use different idempotency key or check existing journal status

**Issue:** Async journal stuck in "PROCESSING"
- **Solution:** Check ASYNC_DELAY scenario parameters
- **Note:** Default processing time is 2 seconds

---

## Support and Feedback

For questions or issues:
1. Check the test scenario control settings
2. Review console logs for detailed error messages
3. Verify chartfield combinations against seed data
4. Contact the Fleet System development team

---

## Version History

- **v1.0.0** (2026-01-05) - Initial release with City of Tallahassee data
  - 35+ valid chartfield combinations
  - Full GL journal posting support
  - AP voucher support
  - Comprehensive test scenarios
  - Async processing with callbacks

---

## Related Documentation

- [FuelMaster Emulator Documentation](../fuelmaster/FUELMASTER_EMULATOR_DOCS.md)
- [AssetWorks Replacement Integration Guide](../../docs/ASSETWORKS_REPLACEMENT_INTEGRATION.md)
- [City of Tallahassee Chartfield Reference](./tallahassee-seed-data.ts)
