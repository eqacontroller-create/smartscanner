-- Corrigir última política RLS permissiva: vehicles INSERT
-- Justificativa: INSERT de vehicles deve ser permitido para qualquer usuário autenticado
-- pois o sistema detecta o VIN automaticamente do carro conectado

-- Remover política antiga permissiva de INSERT  
DROP POLICY IF EXISTS "Allow public insert on vehicles" ON public.vehicles;

-- Criar política: apenas usuários autenticados podem inserir veículos
CREATE POLICY "Authenticated users can insert vehicles"
ON public.vehicles
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');