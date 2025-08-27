-- Create analytics views for reporting

-- Revenue by month view
CREATE VIEW revenue_by_month AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as invoice_count,
    SUM(total_amount) / 100.0 as total_revenue,
    SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) / 100.0 as paid_revenue,
    SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) / 100.0 as overdue_revenue,
    AVG(total_amount) / 100.0 as avg_invoice_value
FROM invoices
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', created_at);

-- Customer lifetime value view
CREATE VIEW customer_lifetime_value AS
SELECT 
    c.id,
    c.customer_id,
    c.company_name,
    c.contact_name,
    COUNT(DISTINCT i.id) as total_invoices,
    SUM(i.total_amount) / 100.0 as total_revenue,
    SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) / 100.0 as paid_revenue,
    AVG(i.total_amount) / 100.0 as avg_invoice_value,
    MIN(i.created_at) as first_invoice_date,
    MAX(i.created_at) as last_invoice_date,
    COUNT(DISTINCT j.id) as total_jobs,
    c.created_at as customer_since
FROM crm_customers c
LEFT JOIN invoices i ON c.id = i.customer_id
LEFT JOIN jobs j ON c.customer_id = j.customer_id
GROUP BY c.id, c.customer_id, c.company_name, c.contact_name, c.created_at;

-- Employee performance view
CREATE VIEW employee_performance AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'completed') as completed_jobs,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'in_progress') as in_progress_jobs,
    AVG(j.actual_duration_minutes) as avg_job_duration_minutes,
    COUNT(DISTINCT DATE(j.scheduled_date)) as days_worked,
    COUNT(DISTINCT c.id) as unique_customers_served
FROM crm_users u
LEFT JOIN jobs j ON u.id = j.assigned_to
LEFT JOIN crm_customers c ON j.customer_id = c.customer_id
WHERE u.role IN ('employee', 'manager', 'admin')
GROUP BY u.id, u.name, u.email, u.role;

-- Sales pipeline view
CREATE VIEW sales_pipeline AS
SELECT 
    l.pipeline_stage,
    COUNT(*) as lead_count,
    SUM(l.estimated_value) / 100.0 as total_pipeline_value,
    AVG(l.estimated_value) / 100.0 as avg_deal_size,
    AVG(l.conversion_probability) as avg_probability,
    COUNT(*) FILTER (WHERE l.is_hot_lead) as hot_leads,
    COUNT(*) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_this_week
FROM leads l
WHERE l.pipeline_stage != 'lost'
GROUP BY l.pipeline_stage;

-- Job analytics view
CREATE VIEW job_analytics AS
SELECT 
    DATE_TRUNC('month', scheduled_date) as month,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_jobs,
    AVG(estimated_duration_minutes) as avg_estimated_duration,
    AVG(actual_duration_minutes) FILTER (WHERE status = 'completed') as avg_actual_duration,
    COUNT(DISTINCT customer_id) as unique_customers,
    COUNT(DISTINCT assigned_to) as active_employees
FROM jobs
GROUP BY DATE_TRUNC('month', scheduled_date);

-- Expense analytics view
CREATE VIEW expense_analytics AS
SELECT 
    DATE_TRUNC('month', expense_date) as month,
    e.category,
    COUNT(*) as expense_count,
    SUM(e.amount) / 100.0 as total_expenses,
    AVG(e.amount) / 100.0 as avg_expense,
    COUNT(DISTINCT e.supplier_id) as unique_suppliers
FROM expenses e
WHERE e.status = 'approved'
GROUP BY DATE_TRUNC('month', expense_date), e.category;

-- Calendar utilization view
CREATE VIEW calendar_utilization AS
SELECT 
    DATE_TRUNC('week', start_datetime) as week,
    COUNT(*) as total_events,
    COUNT(DISTINCT created_by) as active_users,
    SUM(EXTRACT(EPOCH FROM (end_datetime - start_datetime)) / 3600) as total_hours_scheduled,
    COUNT(*) FILTER (WHERE type = 'meeting') as meetings,
    COUNT(*) FILTER (WHERE type = 'job') as job_events,
    COUNT(*) FILTER (WHERE type = 'training') as training_events
FROM calendar_events
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('week', start_datetime);

-- Supplier spending view
CREATE VIEW supplier_spending AS
SELECT 
    s.id,
    s.supplier_name,
    s.supplier_code,
    sc.category_name,
    COUNT(DISTINCT e.id) as total_transactions,
    SUM(e.amount) / 100.0 as total_spent,
    AVG(e.amount) / 100.0 as avg_transaction,
    MIN(e.expense_date) as first_transaction,
    MAX(e.expense_date) as last_transaction,
    COUNT(DISTINCT DATE_TRUNC('month', e.expense_date)) as active_months
FROM suppliers s
LEFT JOIN supplier_categories sc ON s.category_id = sc.id
LEFT JOIN expenses e ON s.id = e.supplier_id AND e.status = 'approved'
GROUP BY s.id, s.supplier_name, s.supplier_code, sc.category_name;

-- Customer conversion funnel
CREATE VIEW conversion_funnel AS
WITH lead_conversions AS (
    SELECT 
        l.id,
        l.created_at as lead_date,
        c.created_at as customer_date,
        j.created_at as first_job_date,
        i.created_at as first_invoice_date
    FROM leads l
    LEFT JOIN crm_customers c ON l.converted_customer_id = c.customer_id
    LEFT JOIN jobs j ON c.customer_id = j.customer_id AND j.id = (
        SELECT id FROM jobs WHERE customer_id = c.customer_id ORDER BY created_at LIMIT 1
    )
    LEFT JOIN invoices i ON c.id = i.customer_id AND i.id = (
        SELECT id FROM invoices WHERE customer_id = c.id ORDER BY created_at LIMIT 1
    )
)
SELECT 
    DATE_TRUNC('month', lead_date) as month,
    COUNT(*) as total_leads,
    COUNT(customer_date) as converted_to_customer,
    COUNT(first_job_date) as booked_job,
    COUNT(first_invoice_date) as generated_revenue,
    ROUND(COUNT(customer_date)::numeric / COUNT(*)::numeric * 100, 2) as lead_to_customer_rate,
    ROUND(COUNT(first_job_date)::numeric / NULLIF(COUNT(customer_date)::numeric, 0) * 100, 2) as customer_to_job_rate,
    ROUND(COUNT(first_invoice_date)::numeric / NULLIF(COUNT(first_job_date)::numeric, 0) * 100, 2) as job_to_revenue_rate
FROM lead_conversions
GROUP BY DATE_TRUNC('month', lead_date);

-- Grant permissions
GRANT SELECT ON revenue_by_month TO authenticated;
GRANT SELECT ON customer_lifetime_value TO authenticated;
GRANT SELECT ON employee_performance TO authenticated;
GRANT SELECT ON sales_pipeline TO authenticated;
GRANT SELECT ON job_analytics TO authenticated;
GRANT SELECT ON expense_analytics TO authenticated;
GRANT SELECT ON calendar_utilization TO authenticated;
GRANT SELECT ON supplier_spending TO authenticated;
GRANT SELECT ON conversion_funnel TO authenticated;