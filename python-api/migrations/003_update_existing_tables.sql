-- Add GPT-related columns to existing tables if they don't exist

-- Add to customers table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='customers' AND column_name='gpt_interaction_count') THEN
        ALTER TABLE public.customers 
        ADD COLUMN gpt_interaction_count INTEGER DEFAULT 0,
        ADD COLUMN last_gpt_interaction TIMESTAMPTZ;
    END IF;
END $$;

-- Add to jobs table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='jobs' AND column_name='gpt_price_calculated') THEN
        ALTER TABLE public.jobs 
        ADD COLUMN gpt_price_calculated BOOLEAN DEFAULT FALSE,
        ADD COLUMN gpt_price_calculation JSONB;
    END IF;
END $$;

-- Create function to track GPT interactions
CREATE OR REPLACE FUNCTION public.track_gpt_interaction(p_customer_email TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.customers 
    SET 
        gpt_interaction_count = COALESCE(gpt_interaction_count, 0) + 1,
        last_gpt_interaction = NOW()
    WHERE email = p_customer_email;
END;
$$ LANGUAGE plpgsql;

-- Create GPT session tracking table
CREATE TABLE IF NOT EXISTS public.gpt_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    customer_email TEXT,
    customer_id UUID REFERENCES public.customers(id),
    conversation_context JSONB DEFAULT '{}',
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_gpt_sessions_customer ON public.gpt_sessions(customer_email);
CREATE INDEX idx_gpt_sessions_created ON public.gpt_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.gpt_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Staff can view all sessions" ON public.gpt_sessions
    FOR SELECT TO authenticated
    USING (true);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_gpt_sessions
    BEFORE UPDATE ON public.gpt_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.gpt_sessions IS 'Track GPT chat sessions for analytics and context';
COMMENT ON FUNCTION public.track_gpt_interaction IS 'Update customer GPT interaction statistics';