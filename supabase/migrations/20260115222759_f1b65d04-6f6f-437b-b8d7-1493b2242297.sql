-- Corrigir políticas RLS permissivas nas tabelas dtc_scans, dtc_findings e vehicles
-- Essas tabelas tinham políticas com USING (true) e WITH CHECK (true) que são muito permissivas

-- =====================================================
-- TABELA: vehicles
-- Justificativa: Dados de veículos podem ser públicos para leitura, mas INSERT e UPDATE
-- devem ser controlados. Como não há user_id, mantemos leitura pública mas restringimos escrita.
-- =====================================================

-- Remover política antiga permissiva de UPDATE
DROP POLICY IF EXISTS "Allow public update on vehicles" ON public.vehicles;

-- Criar política restritiva: apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update vehicles"
ON public.vehicles
FOR UPDATE
USING (auth.role() = 'authenticated');

-- =====================================================
-- TABELA: dtc_scans
-- Justificativa: Scans de diagnóstico são dados importantes. 
-- Leitura pública OK para compartilhamento, mas INSERT deve ser autenticado.
-- =====================================================

-- Remover política antiga permissiva de INSERT
DROP POLICY IF EXISTS "Allow public insert on dtc_scans" ON public.dtc_scans;

-- Criar política: apenas usuários autenticados podem inserir
CREATE POLICY "Authenticated users can insert dtc_scans"
ON public.dtc_scans
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- TABELA: dtc_findings
-- Justificativa: Findings de diagnóstico são dados importantes.
-- Mesma lógica dos scans.
-- =====================================================

-- Remover política antiga permissiva de INSERT
DROP POLICY IF EXISTS "Allow public insert on dtc_findings" ON public.dtc_findings;

-- Criar política: apenas usuários autenticados podem inserir
CREATE POLICY "Authenticated users can insert dtc_findings"
ON public.dtc_findings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');