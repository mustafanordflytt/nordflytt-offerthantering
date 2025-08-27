-- Create GPT API analytics table
CREATE TABLE IF NOT EXISTS public.gpt_api_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    customer_email TEXT,
    api_key_used TEXT,
    error_message TEXT,
    request_body JSONB,
    response_body JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_gpt_metrics_endpoint ON public.gpt_api_metrics(endpoint);
CREATE INDEX idx_gpt_metrics_timestamp ON public.gpt_api_metrics(timestamp DESC);
CREATE INDEX idx_gpt_metrics_status ON public.gpt_api_metrics(status_code);
CREATE INDEX idx_gpt_metrics_customer ON public.gpt_api_metrics(customer_email);

-- Create daily aggregation view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.gpt_api_daily_stats AS
SELECT 
    DATE(timestamp) as date,
    endpoint,
    COUNT(*) as total_requests,
    COUNT(DISTINCT customer_email) as unique_customers,
    AVG(response_time_ms)::INTEGER as avg_response_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER as p95_response_time_ms,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    COUNT(*) FILTER (WHERE status_code < 400) as success_count
FROM public.gpt_api_metrics
GROUP BY DATE(timestamp), endpoint;

-- Create index on materialized view
CREATE INDEX idx_gpt_daily_stats_date ON public.gpt_api_daily_stats(date DESC);

-- Create refresh function
CREATE OR REPLACE FUNCTION public.refresh_gpt_api_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.gpt_api_daily_stats;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.gpt_api_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view all metrics" ON public.gpt_api_metrics
    FOR SELECT TO authenticated
    USING (true);

-- Add comments
COMMENT ON TABLE public.gpt_api_metrics IS 'Analytics and monitoring for GPT API usage';
COMMENT ON MATERIALIZED VIEW public.gpt_api_daily_stats IS 'Daily aggregated statistics for GPT API usage';