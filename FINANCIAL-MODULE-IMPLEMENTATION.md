# Financial Module - Production Implementation

## Overview
The Financial/Ekonomi module has been fully integrated with database and authentication system, providing comprehensive invoicing, expense management, and payment tracking capabilities. All mock data has been replaced with real Supabase integration.

## Database Schema

### 1. Core Financial Tables

#### invoices (Outgoing)
Main table for customer invoices:
```sql
- id (UUID)
- invoice_number (UNIQUE) - Auto-generated YYYY0001 format
- customer_id, job_id, offer_id (references)
- invoice_date, due_date
- currency (default SEK)
- status (draft, sent, viewed, paid, overdue, cancelled)
- Amounts in minor units (öre):
  - subtotal_amount, vat_amount, rut_deduction_amount
  - discount_amount, total_amount, paid_amount
- RUT fields:
  - rut_eligible, rut_hours, rut_personal_number
- External integrations:
  - fortnox_id, fortnox_status, fortnox_synced_at
- AI fields:
  - auto_created, ai_review_score, ai_approved, ai_notes
- Audit fields
```

#### invoice_line_items
Line items for invoices:
```sql
- id (UUID)
- invoice_id (FK)
- line_number (unique per invoice)
- type (service, material, expense, discount)
- description, quantity, unit_price
- Amounts: subtotal, vat, total (all in minor units)
- RUT: rut_eligible, rut_hours
- service_code, account_id
```

#### invoice_payments
Payment records:
```sql
- id (UUID)
- invoice_id (FK)
- payment_method_id (FK)
- amount (minor units)
- payment_date
- reference, bank_transaction_id, bank_account
- status (pending, completed, failed, refunded)
```

#### expenses (Incoming)
Supplier invoices and expenses:
```sql
- id (UUID)
- expense_number (UNIQUE) - EXP000001 format
- supplier_id (FK)
- supplier_invoice_number
- invoice_date, due_date
- status (pending, approved, paid, rejected)
- Amounts in minor units
- Categories: expense_category, cost_center, project_code
- External: billo_invoice_id, billo_status
- AI: category_suggestion, fraud_risk_score, approval_recommendation
- Attachments: receipt_url, attachments (JSONB)
```

### 2. Supporting Tables
- **tax_rates**: VAT rates (25%, 12%, 6%) and RUT (50%)
- **payment_methods**: Bankgiro, Swish, Card, Cash
- **financial_accounts**: Chart of accounts
- **expense_line_items**: Detailed expense breakdown

## API Endpoints

### 1. Invoices API

#### GET /api/crm/invoices
Features:
- JWT authentication with financial:read permission
- Filtering by status, customer, date range
- Full-text search
- Pagination support
- Returns transformed data with amounts in SEK (from öre)
- Includes related customer, job, payments, line items
- Comprehensive statistics

#### POST /api/crm/invoices
Features:
- Create new invoices with auto-generated number
- Line items with automatic calculations
- RUT deduction support (50% for eligible hours)
- VAT calculation per line item
- All amounts stored in minor units (öre)

### 2. Individual Invoice API

#### GET /api/crm/invoices/[id]
Returns complete invoice details:
- Full customer and job information
- All line items with calculations
- Payment history
- RUT savings calculation
- Overdue status and days

#### PUT /api/crm/invoices/[id]
Features:
- Update invoice details
- Status management with timestamps
- Line items replacement
- Automatic total recalculation
- Prevents editing paid/cancelled invoices

#### DELETE /api/crm/invoices/[id]
- Admin-only deletion
- Prevents deletion of sent/paid invoices
- Cascades to line items and payments

### 3. Invoice Operations

#### POST /api/crm/invoices/[id]/send
- Mark invoice as sent
- Update status and timestamp
- Email integration ready (TODO)
- Validates customer email

#### POST /api/crm/invoices/[id]/payments
- Record payments
- Automatic status update via trigger
- Validates payment doesn't exceed balance
- Updates paid_amount and status

### 4. Expenses API

#### GET /api/crm/expenses
Features:
- List all expenses with filters
- AI fraud risk and category display
- Supplier information
- Approval workflow status
- Statistics by category

#### POST /api/crm/expenses
- Create expense records
- Auto-generate expense number
- VAT calculation
- Line items support

#### GET/PUT/DELETE /api/crm/expenses/[id]
- Individual expense operations
- Approval workflow
- Status management
- Admin-only deletion

## Frontend Integration

### 1. Updated Ekonomi Page
The page (`/app/crm/ekonomi/page.tsx`) now features:
- Real API integration with authentication
- Four tabs: Overview, Invoices, Expenses, Reports
- Live statistics calculation
- Search and filtering
- Action buttons for send, payment, approval

### 2. Key Features

#### Overview Tab
- Revenue and expense cards
- Unpaid invoices tracking
- Cash flow calculation
- Recent activity timeline
- Profit margin display

#### Invoices Tab
- Searchable invoice list
- Status filtering
- Send invoice action
- Payment registration
- RUT deduction display
- Download placeholder

#### Expenses Tab
- Expense approval workflow
- AI fraud risk display
- Category management
- Status filtering
- Approval recommendations

## Advanced Features

### 1. Automatic Calculations
Database triggers handle:
- Invoice total calculation from line items
- Payment status updates
- Overdue status checking

### 2. Minor Units Storage
All monetary values stored as integers in öre:
- Prevents floating-point errors
- Consistent calculations
- Easy currency conversion

### 3. RUT Integration
- 50% deduction for eligible services
- Hours tracking per line item
- Personal number storage
- Automatic calculation

### 4. AI Placeholders
Ready for AI integration:
- Invoice review scoring
- Expense fraud detection
- Category suggestions
- Approval recommendations

## Security Implementation

### 1. Row Level Security
All tables have RLS enabled:
- View: All CRM users with financial:read
- Create/Update: financial:write permission
- Approve expenses: Manager role
- Delete: Admin only

### 2. Data Validation
- Positive amount constraints
- Date validation
- Status transition rules
- Reference integrity

## Performance Optimizations

### 1. Database Indexes
- invoice_number, expense_number (unique)
- customer_id, supplier_id
- status, dates for filtering
- Line item foreign keys

### 2. Query Efficiency
- Selective field loading
- JOIN optimization
- Pagination for large datasets
- Aggregate calculations in database

## Testing

1. Create invoice:
```bash
curl -X POST http://localhost:3000/api/crm/invoices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "dueDate": "2025-02-07",
    "lineItems": [{
      "description": "Flyttjänst",
      "quantity": 8,
      "unitPrice": 500,
      "rutEligible": true,
      "rutHours": 8
    }]
  }'
```

2. Record payment:
```bash
curl -X POST http://localhost:3000/api/crm/invoices/UUID/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 4000,
    "paymentDate": "2025-01-08"
  }'
```

## Migration Notes

### Before:
- Mock invoice data
- No payment tracking
- Basic expense list
- No RUT support

### After:
- Full invoice lifecycle
- Payment management
- Expense approval workflow
- RUT deduction calculations
- AI-ready fields

## Next Steps

1. **Email Integration**
   - SendGrid for invoice delivery
   - Payment reminders
   - Expense notifications

2. **File Uploads**
   - Receipt attachments
   - Invoice PDFs
   - Expense documentation

3. **External Integrations**
   - Fortnox sync implementation
   - Billo expense import
   - Bank transaction matching

4. **Reporting**
   - Financial statements
   - Tax reports
   - Cash flow analysis

This completes the Financial module production implementation.