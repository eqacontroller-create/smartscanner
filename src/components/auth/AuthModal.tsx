import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { RateLimitService, type RateLimitStatus } from '@/services/auth/RateLimitService';
import { toast } from 'sonner';
import { Cloud, LogIn, UserPlus, Loader2, ShieldAlert, Clock } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Verificar rate limit quando email muda (debounced)
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setRateLimitStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      const status = await RateLimitService.checkLoginBlocked(email);
      setRateLimitStatus(status);
      if (status.blocked && status.remainingSeconds) {
        setCountdown(status.remainingSeconds);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  // Countdown timer quando bloqueado
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Recheck status when timer expires
          RateLimitService.checkLoginBlocked(email).then(setRateLimitStatus);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, email]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar bloqueio antes de tentar login
    const status = await RateLimitService.checkLoginBlocked(email);
    if (status.blocked) {
      setRateLimitStatus(status);
      setCountdown(status.remainingSeconds || 0);
      toast.error('Conta temporariamente bloqueada', {
        description: `Aguarde ${RateLimitService.formatRemainingTime(status.remainingSeconds || 0)} para tentar novamente.`,
      });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      // Registrar tentativa falha
      await RateLimitService.recordLoginAttempt(email, false);
      
      // Atualizar status
      const newStatus = await RateLimitService.checkLoginBlocked(email);
      setRateLimitStatus(newStatus);
      
      if (newStatus.blocked) {
        setCountdown(newStatus.remainingSeconds || 0);
        toast.error('Conta bloqueada por segurança', {
          description: `Muitas tentativas. Aguarde ${RateLimitService.formatRemainingTime(newStatus.remainingSeconds || 0)}.`,
        });
      } else {
        toast.error('Erro ao entrar', { 
          description: `${error.message}. Tentativas restantes: ${newStatus.remainingAttempts}` 
        });
      }
    } else {
      // Registrar tentativa bem-sucedida
      await RateLimitService.recordLoginAttempt(email, true);
      toast.success('Login realizado!', { description: 'Seus dados serão sincronizados.' });
      onOpenChange(false);
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de senha forte
    if (password.length < 8) {
      toast.error('Senha muito curta', { description: 'Mínimo de 8 caracteres.' });
      return;
    }
    
    setLoading(true);

    const { error } = await signUp(email, password);
    
    if (error) {
      toast.error('Erro ao cadastrar', { description: error.message });
    } else {
      toast.success('Conta criada!', { description: 'Você já pode usar o app com sincronização.' });
      onOpenChange(false);
    }

    setLoading(false);
  };

  const isBlocked = rateLimitStatus?.blocked ?? false;
  const attemptsProgress = rateLimitStatus 
    ? ((rateLimitStatus.maxAttempts - rateLimitStatus.remainingAttempts) / rateLimitStatus.maxAttempts) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Sincronização na Nuvem
          </DialogTitle>
          <DialogDescription>
            Entre ou crie uma conta para sincronizar suas corridas e configurações em todos os dispositivos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register">
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            {/* Alerta de bloqueio */}
            {isBlocked && (
              <Alert variant="destructive" className="animate-fade-in">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Bloqueado por segurança. Aguarde{' '}
                    <strong>{RateLimitService.formatRemainingTime(countdown)}</strong>.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Indicador de tentativas */}
            {rateLimitStatus && !isBlocked && rateLimitStatus.attempts > 0 && (
              <div className="space-y-1 animate-fade-in">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tentativas restantes</span>
                  <span className={rateLimitStatus.remainingAttempts <= 2 ? 'text-destructive font-medium' : ''}>
                    {rateLimitStatus.remainingAttempts} de {rateLimitStatus.maxAttempts}
                  </span>
                </div>
                <Progress 
                  value={attemptsProgress} 
                  className="h-1.5"
                />
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBlocked}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBlocked}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || isBlocked}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isBlocked ? (
                  <ShieldAlert className="h-4 w-4 mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {isBlocked ? 'Aguarde...' : 'Entrar'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use pelo menos 8 caracteres para maior segurança.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Criar Conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Seus dados ficam seguros e acessíveis de qualquer dispositivo.
        </p>
      </DialogContent>
    </Dialog>
  );
}
