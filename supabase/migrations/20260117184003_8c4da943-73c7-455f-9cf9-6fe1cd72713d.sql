-- Create battery_tests table for tracking battery health over time
CREATE TABLE public.battery_tests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Test conditions
    vin VARCHAR,
    vehicle_brand VARCHAR,
    vehicle_model VARCHAR,
    ambient_temp_celsius NUMERIC,
    
    -- Cranking metrics
    resting_voltage NUMERIC NOT NULL,
    min_cranking_voltage NUMERIC NOT NULL,
    cranking_duration_ms INTEGER NOT NULL,
    voltage_recovery_ms INTEGER,
    
    -- Post-start metrics
    post_start_voltage NUMERIC,
    alternator_voltage NUMERIC,
    
    -- Diagnoses
    battery_status VARCHAR NOT NULL, -- excellent, good, weak, critical
    battery_message TEXT,
    alternator_status VARCHAR, -- excellent, good, weak, not_charging
    alternator_message TEXT,
    
    -- Raw data for detailed analysis
    voltage_samples JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.battery_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own battery tests"
ON public.battery_tests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battery tests"
ON public.battery_tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own battery tests"
ON public.battery_tests
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_battery_tests_user_created ON public.battery_tests(user_id, created_at DESC);
CREATE INDEX idx_battery_tests_vin ON public.battery_tests(vin) WHERE vin IS NOT NULL;