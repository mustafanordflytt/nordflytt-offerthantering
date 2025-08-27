# 🚀 Supabase Schema Deployment Guide

## 📋 Current Situation

You've encountered several errors when trying to deploy the schema:
1. `ERROR: 42703: column "category" does not exist`
2. `ERROR: 42P01: relation 'public_procurements' does not exist`
3. `ERROR: 42703: column 'current_stock' does not exist`

These errors indicate that your `inventory_items` table exists but is missing several columns.

## ✅ Solution: Use DEPLOY_COMPLETE_SOLUTION.sql

I've created a comprehensive deployment script that handles all these issues:

### 📂 File: `database/DEPLOY_COMPLETE_SOLUTION.sql`

This script:
1. **Fixes existing tables first** - Adds all missing columns to `inventory_items`
2. **Creates all new tables** - AI tables, procurements, storage, etc.
3. **Handles constraints safely** - Checks before adding unique constraints
4. **Creates indexes conditionally** - Only if columns exist
5. **Adds sample data** - With proper error handling

## 🔧 Deployment Steps

### Step 1: Test Current Schema
First, check what's currently in your database:

```sql
-- Run TEST_CURRENT_SCHEMA.sql in Supabase SQL Editor
-- This will show you:
-- - Which tables exist
-- - What columns inventory_items has
-- - What's missing
```

### Step 2: Deploy Complete Solution
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql
2. Copy the entire content of `database/DEPLOY_COMPLETE_SOLUTION.sql`
3. Paste into SQL Editor
4. Click "Run"

### Step 3: Verify Deployment
The script will automatically report:
- ✅ How many tables were created/verified
- ⚠️ Any missing tables
- 🎉 Success message when complete

## 🧪 Test API Endpoints

After deployment, test these endpoints:

```bash
# Test AI Decisions
curl http://localhost:3000/api/ai-decisions/stream

# Test AI Learning Metrics
curl http://localhost:3000/api/ai-learning/metrics

# Test Inventory
curl http://localhost:3000/api/inventory

# Test Public Procurements
curl http://localhost:3000/api/public-procurements
```

## 🔍 Troubleshooting

If you still get errors:

1. **Run TEST_CURRENT_SCHEMA.sql first** to see exactly what's in your database
2. **Check for typos** in table/column names
3. **Ensure you're in the right project** (gindcnpiejkntkangpuc)

## 📊 Expected Result

After successful deployment, you should have:
- 15 new/updated tables
- All API endpoints working with real data
- Sample data in key tables
- Proper indexes and constraints

## 🎯 Quick Links

- **Supabase SQL Editor**: https://supabase.com/dashboard/project/gindcnpiejkntkangpuc/sql
- **Main deployment file**: `database/DEPLOY_COMPLETE_SOLUTION.sql`
- **Schema test file**: `database/TEST_CURRENT_SCHEMA.sql`

---

**Note**: The deployment script is idempotent - you can run it multiple times safely. It will skip existing tables and only add missing components.