import { ShieldCheck } from 'lucide-react';

export function AllClearShield() {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 blur-2xl bg-green-500/30 rounded-full scale-150" />
        
        {/* Shield icon with pulse animation */}
        <div className="relative p-8 rounded-full bg-green-500/20 border-2 border-green-500/50 animate-pulse">
          <ShieldCheck className="h-20 w-20 text-green-500" />
        </div>
      </div>
      
      <h3 className="mt-6 text-2xl font-bold text-green-500">
        Tudo OK!
      </h3>
      <p className="mt-2 text-muted-foreground text-center">
        Nenhum código de erro encontrado.
        <br />
        Seu veículo está em bom estado.
      </p>
    </div>
  );
}
