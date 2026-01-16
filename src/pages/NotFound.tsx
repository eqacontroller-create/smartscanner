import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6 safe-area-y">
      <div className="text-center max-w-sm mx-auto">
        <h1 className="mb-3 sm:mb-4 text-5xl sm:text-6xl font-bold text-foreground">404</h1>
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl text-muted-foreground">
          Página não encontrada
        </p>
        <a 
          href="/" 
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 text-primary font-medium underline hover:text-primary/90 transition-colors"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
