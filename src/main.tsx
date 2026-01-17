import { createRoot } from "react-dom/client";
import { StrictMode, useState, useEffect } from "react";
import App from "./App.tsx";
import "./index.css";
import { SplashScreen, FlyingLogo } from "./components/splash";
import { useSplashScreen } from "./hooks/useSplashScreen";
import { useSplashTheme } from "./hooks/useSplashTheme";

function Root() {
  const { isVisible, phase, isExiting, skipSplash } = useSplashScreen({ minDuration: 5000 });
  const splashTheme = useSplashTheme();
  const [logoLanded, setLogoLanded] = useState(false);
  
  // Determine if dashboard should be visible and interactive
  const showDashboard = phase === 'exiting' || phase === 'hidden';
  
  // Calculate glow color from theme
  const glowColor = `hsl(${splashTheme.colors.glow})`;
  
  // Mark logo as landed after transition
  useEffect(() => {
    if (phase === 'exiting') {
      const timer = setTimeout(() => {
        setLogoLanded(true);
      }, 600);
      return () => clearTimeout(timer);
    }
    if (phase === 'hidden') {
      setLogoLanded(true);
    }
  }, [phase]);
  
  return (
    <div className="relative">
      {/* Splash Screen Layer - tema dinâmico por marca */}
      {isVisible && (
        <SplashScreen 
          phase={phase} 
          onSkip={skipSplash}
          theme={splashTheme}
        />
      )}
      
      {/* Flying Logo - animates from splash center to header position */}
      {isVisible && phase === 'exiting' && (
        <FlyingLogo 
          phase={phase}
          theme={splashTheme}
          glowColor={glowColor}
        />
      )}
      
      {/* Dashboard Layer - starts appearing during 'exiting' phase */}
      <div 
        className={`
          transition-all duration-1000 ease-out
          ${!showDashboard 
            ? 'opacity-0 scale-[0.96] blur-md pointer-events-none' 
            : isExiting
              ? 'opacity-100 scale-100 blur-0 animate-dashboard-enter'
              : 'opacity-100 scale-100 blur-0'
          }
        `}
        style={{
          visibility: showDashboard ? 'visible' : 'hidden',
          // Pass logo landed state to CSS variable for header animation
          '--logo-landed': logoLanded ? '1' : '0',
        } as React.CSSProperties}
        data-logo-landed={logoLanded}
      >
        <App />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
