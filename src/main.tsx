import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";
import { SplashScreen } from "./components/splash";
import { useSplashScreen } from "./hooks/useSplashScreen";

function Root() {
  const { isVisible, phase, isExiting, skipSplash } = useSplashScreen({ minDuration: 5000 });
  
  // Determine if dashboard should be visible and interactive
  const showDashboard = phase === 'exiting' || phase === 'hidden';
  
  return (
    <div className="relative">
      {/* Splash Screen Layer */}
      {isVisible && (
        <SplashScreen 
          phase={phase} 
          onSkip={skipSplash} 
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
        }}
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
