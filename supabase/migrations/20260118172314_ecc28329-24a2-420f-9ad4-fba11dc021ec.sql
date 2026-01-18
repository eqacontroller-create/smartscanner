-- =====================================================
-- MIGRAÇÃO: Isolamento de Dados por Usuário
-- =====================================================

-- 1. Adicionar coluna user_id às tabelas que faltam
ALTER TABLE public.dtc_scans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_dtc_scans_user_id ON public.dtc_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);

-- 3. Remover políticas públicas antigas de dtc_scans
DROP POLICY IF EXISTS "Allow public read on dtc_scans" ON public.dtc_scans;
DROP POLICY IF EXISTS "Authenticated users can insert dtc_scans" ON public.dtc_scans;

-- 4. Criar novas políticas RLS para dtc_scans (isolado por usuário)
CREATE POLICY "Users can view own scans"
ON public.dtc_scans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
ON public.dtc_scans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
ON public.dtc_scans FOR DELETE
USING (auth.uid() = user_id);

-- 5. Remover políticas públicas antigas de dtc_findings
DROP POLICY IF EXISTS "Allow public read on dtc_findings" ON public.dtc_findings;
DROP POLICY IF EXISTS "Authenticated users can insert dtc_findings" ON public.dtc_findings;

-- 6. Criar novas políticas RLS para dtc_findings (herda isolamento via scan)
CREATE POLICY "Users can view own findings"
ON public.dtc_findings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dtc_scans 
    WHERE dtc_scans.id = dtc_findings.scan_id 
    AND dtc_scans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert findings for own scans"
ON public.dtc_findings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dtc_scans 
    WHERE dtc_scans.id = scan_id 
    AND dtc_scans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own findings"
ON public.dtc_findings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.dtc_scans 
    WHERE dtc_scans.id = dtc_findings.scan_id 
    AND dtc_scans.user_id = auth.uid()
  )
);

-- 7. Remover políticas públicas antigas de vehicles
DROP POLICY IF EXISTS "Allow public read on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON public.vehicles;

-- 8. Criar novas políticas RLS para vehicles (isolado por usuário)
CREATE POLICY "Users can view own vehicles"
ON public.vehicles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
ON public.vehicles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
ON public.vehicles FOR DELETE
USING (auth.uid() = user_id);