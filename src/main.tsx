import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";
import { SplashScreen } from "./components/splash";
import { useSplashScreen } from "./hooks/useSplashScreen";

function Root() {
  const { isVisible, phase, skipSplash } = useSplashScreen({ minDuration: 2800 });
  
  return (
    <>
      {isVisible && <SplashScreen phase={phase} onSkip={skipSplash} />}
      <div 
        className={isVisible ? 'opacity-0' : 'animate-fade-in'}
        style={{ display: isVisible ? 'none' : 'block' }}
      >
        <App />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
