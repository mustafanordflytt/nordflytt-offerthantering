-- TEST CURRENT SCHEMA STATUS
-- Run this FIRST to see what tables and columns exist in your database

-- Check which tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'ai_decisions', 'ai_learning_metrics', 'ai_mode_history', 
            'api_alerts', 'ai_performance_daily', 'autonomous_config',
            'system_health', 'public_procurements', 'inventory_items',
            'inventory_transactions', 'customer_storage', 'suppliers',
            'purchase_orders', 'report_templates', 'generated_reports'
        ) THEN '✅ Expected'
        ELSE '➕ Extra'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name IN (
            'ai_decisions', 'ai_learning_metrics', 'ai_mode_history', 
            'api_alerts', 'ai_performance_daily', 'autonomous_config',
            'system_health', 'public_procurements', 'inventory_items',
            'inventory_transactions', 'customer_storage', 'suppliers',
            'purchase_orders', 'report_templates', 'generated_reports'
        ) THEN 0
        ELSE 1
    END,
    table_name;

-- Check inventory_items columns specifically
SELECT 
    '--- INVENTORY_ITEMS COLUMNS ---' as info;

SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN column_name IN (
            'id', 'item_code', 'name', 'description', 'category', 
            'unit', 'current_stock', 'minimum_stock', 'maximum_stock',
            'unit_cost', 'supplier_id', 'location', 'status',
            'created_at', 'updated_at'
        ) THEN '✅ Expected'
        ELSE '➕ Extra'
    END as status
FROM information_schema.columns
WHERE table_name = 'inventory_items'
ORDER BY ordinal_position;

-- Check constraints on inventory_items
SELECT 
    '--- INVENTORY_ITEMS CONSTRAINTS ---' as info;

SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'inventory_items';

-- Count missing tables
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'ai_decisions', 'ai_learning_metrics', 'ai_mode_history', 
        'api_alerts', 'ai_performance_daily', 'autonomous_config',
        'system_health', 'public_procurements', 'inventory_items',
        'inventory_transactions', 'customer_storage', 'suppliers',
        'purchase_orders', 'report_templates', 'generated_reports'
    ]) AS table_name
)
SELECT 
    '--- DEPLOYMENT STATUS ---' as info,
    COUNT(CASE WHEN it.table_name IS NOT NULL THEN 1 END) || '/15' as tables_exist,
    COUNT(CASE WHEN it.table_name IS NULL THEN 1 END) as missing_count,
    string_agg(
        CASE WHEN it.table_name IS NULL THEN et.table_name END, 
        ', '
    ) as missing_tables
FROM expected_tables et
LEFT JOIN information_schema.tables it 
    ON it.table_schema = 'public' 
    AND it.table_name = et.table_name;