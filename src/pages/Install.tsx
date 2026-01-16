import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Share, Plus, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 safe-area-y">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <Link 
          to="/" 
          className="inline-flex items-center min-h-[44px] py-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar ao App
        </Link>

        <div className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <Smartphone className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <h1 className="text-2xl xs:text-3xl font-bold">Instalar SmartScanner</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Instale o app na sua tela inicial para acesso rápido e funcionar offline!
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-500">
                <Check className="h-6 w-6" />
                <span className="font-medium">App já está instalado!</span>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full h-14 text-lg">
            <Download className="h-5 w-5 mr-2" />
            Instalar Agora
          </Button>
        ) : (
          <div className="space-y-4">
            {isIOS ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share className="h-5 w-5" />
                    iPhone / iPad
                  </CardTitle>
                  <CardDescription>Siga estes passos no Safari:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">1</div>
                    <p>Toque no ícone de <strong>Compartilhar</strong> <Share className="inline h-4 w-4" /> na barra inferior</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">2</div>
                    <p>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <Plus className="inline h-4 w-4" /></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">3</div>
                    <p>Toque em <strong>"Adicionar"</strong> no canto superior direito</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Android
                  </CardTitle>
                  <CardDescription>Siga estes passos no Chrome:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">1</div>
                    <p>Toque nos <strong>3 pontos</strong> (⋮) no canto superior direito</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">2</div>
                    <p>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">3</div>
                    <p>Confirme tocando em <strong>"Instalar"</strong></p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Benefícios do App Instalado:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Acesso direto da tela inicial</li>
              <li>✓ Funciona mesmo offline</li>
              <li>✓ Tela cheia sem barra do navegador</li>
              <li>✓ Atualizações automáticas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
