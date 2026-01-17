import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1400px",
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gauge: {
          bg: "hsl(var(--gauge-bg))",
          border: "hsl(var(--gauge-border))",
          needle: "hsl(var(--gauge-needle))",
          glow: "hsl(var(--gauge-glow))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Logo animations
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.95" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "draw-stroke": {
          "0%": { strokeDashoffset: "var(--stroke-length, 1000)" },
          "100%": { strokeDashoffset: "0" },
        },
        "needle-bounce": {
          "0%, 100%": { transform: "rotate(var(--needle-rotation))" },
          "50%": { transform: "rotate(calc(var(--needle-rotation) + 2deg))" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "smooth-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.9" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "tab-enter": {
          "0%": { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 8px hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.6)" },
        },
        "confetti-fall": {
          "0%": { 
            transform: "translateY(-20vh) rotate(0deg)", 
            opacity: "1" 
          },
          "100%": { 
            transform: "translateY(100vh) rotate(720deg)", 
            opacity: "0" 
          },
        },
        "confetti-spin": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.2)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "celebrate-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "splash-particle": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0)" },
          "20%": { opacity: "1", transform: "translateY(-10px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-50px) scale(0.5)" },
        },
        "neon-pulse": {
          "0%, 100%": { 
            filter: "brightness(1)",
            textShadow: "0 0 10px currentColor"
          },
          "50%": { 
            filter: "brightness(1.2)",
            textShadow: "0 0 20px currentColor, 0 0 40px currentColor"
          },
        },
        // Premium splash-to-dashboard transitions
        "splash-exit": {
          "0%": { 
            opacity: "1", 
            transform: "scale(1)", 
            filter: "blur(0)" 
          },
          "100%": { 
            opacity: "0", 
            transform: "scale(1.05)", 
            filter: "blur(12px)" 
          },
        },
        "dashboard-enter": {
          "0%": { 
            opacity: "0", 
            transform: "scale(0.96)", 
            filter: "blur(10px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "scale(1)", 
            filter: "blur(0)" 
          },
        },
        "stagger-fade-in": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(12px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          },
        },
        // Header logo arrival from splash transition
        "header-logo-arrive": {
          "0%": { 
            opacity: "0", 
            transform: "scale(1.5) translateX(-20px)",
            filter: "blur(4px)"
          },
          "60%": { 
            opacity: "1", 
            transform: "scale(1.1) translateX(0)",
            filter: "blur(0)"
          },
          "100%": { 
            opacity: "1", 
            transform: "scale(1) translateX(0)",
            filter: "blur(0)"
          },
        },
        "header-text-arrive": {
          "0%": { 
            opacity: "0", 
            transform: "translateX(-10px)"
          },
          "100%": { 
            opacity: "1", 
            transform: "translateX(0)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "needle-bounce": "needle-bounce 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "smooth-pulse": "smooth-pulse 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-out": "fade-out 0.2s ease-in forwards",
        "scale-in": "scale-in 0.25s ease-out forwards",
        "scale-out": "scale-out 0.2s ease-in forwards",
        "slide-in-up": "slide-in-up 0.35s ease-out forwards",
        "slide-in-down": "slide-in-down 0.35s ease-out forwards",
        "slide-in-left": "slide-in-left 0.35s ease-out forwards",
        "slide-in-right": "slide-in-right 0.35s ease-out forwards",
        "tab-enter": "tab-enter 0.25s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s ease-out forwards",
        "confetti-spin": "confetti-spin 1s linear infinite",
        "celebrate-pop": "celebrate-pop 0.5s ease-out forwards",
        "splash-particle": "splash-particle 3s ease-out infinite",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        // Logo animations
        "logo-pulse": "logo-pulse 2s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "draw-stroke": "draw-stroke 1s ease-out forwards",
        // Premium transitions
        "splash-exit": "splash-exit 0.7s ease-out forwards",
        "dashboard-enter": "dashboard-enter 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "stagger-fade-in": "stagger-fade-in 0.5s ease-out forwards",
        // Header logo arrival
        "header-logo-arrive": "header-logo-arrive 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "header-text-arrive": "header-text-arrive 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
