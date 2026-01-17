/**
 * Temas visuais dinâmicos para a Splash Screen baseados na marca do veículo
 * Cada marca tem suas cores, slogan e efeitos visuais personalizados
 */

export interface SplashTheme {
  brand: string;
  displayName: string;
  slogan: string;
  colors: {
    primary: string;      // HSL values: "212 100% 22%"
    accent: string;       // Cor secundária
    glow: string;         // Cor do glow principal
    particleHue: number;  // Hue base das partículas (0-360)
  };
  gradient: {
    background: string;   // Gradiente do fundo
    logo: string;         // Gradiente do texto do logo
    progress: string;     // Gradiente da barra de progresso
  };
  premium: boolean;       // Se mostra efeitos extras (mais partículas, shimmer)
}

// Tema padrão genérico (SmartScanner verde)
export const DEFAULT_THEME: SplashTheme = {
  brand: 'generic',
  displayName: 'SmartScanner',
  slogan: 'Diagnóstico OBD-II Inteligente',
  colors: {
    primary: '142 76% 36%',
    accent: '142 76% 45%',
    glow: '142 76% 45%',
    particleHue: 142,
  },
  gradient: {
    background: `
      radial-gradient(ellipse at 50% 30%, hsl(222 47% 14%) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, hsl(142 40% 8% / 0.5) 0%, transparent 40%),
      linear-gradient(180deg, hsl(222 47% 5%) 0%, hsl(222 47% 9%) 50%, hsl(222 47% 6%) 100%)
    `,
    logo: 'linear-gradient(135deg, hsl(142 76% 60%) 0%, hsl(142 76% 48%) 50%, hsl(152 70% 45%) 100%)',
    progress: 'linear-gradient(90deg, hsl(142 76% 40%) 0%, hsl(142 76% 55%) 100%)',
  },
  premium: false,
};

// Temas por marca de veículo
export const SPLASH_THEMES: Record<string, SplashTheme> = {
  // ============ ALEMÃS ============
  volkswagen: {
    brand: 'volkswagen',
    displayName: 'Volkswagen',
    slogan: 'Das Auto',
    colors: {
      primary: '214 100% 20%',
      accent: '195 100% 41%',
      glow: '195 100% 45%',
      particleHue: 195,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(214 100% 18%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(195 60% 10% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(214 100% 8%) 0%, hsl(214 80% 12%) 50%, hsl(214 100% 6%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(195 100% 60%) 0%, hsl(195 100% 45%) 50%, hsl(200 90% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(195 100% 35%) 0%, hsl(195 100% 55%) 100%)',
    },
    premium: false,
  },
  
  audi: {
    brand: 'audi',
    displayName: 'Audi',
    slogan: 'Vorsprung durch Technik',
    colors: {
      primary: '0 0% 10%',
      accent: '0 0% 75%',
      glow: '0 0% 70%',
      particleHue: 0, // Cinza (sem saturação)
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 0% 15%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 0% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 0% 5%) 0%, hsl(0 0% 10%) 50%, hsl(0 0% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 0% 90%) 0%, hsl(0 0% 70%) 50%, hsl(0 0% 60%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 0% 50%) 0%, hsl(0 0% 75%) 100%)',
    },
    premium: true,
  },
  
  bmw: {
    brand: 'bmw',
    displayName: 'BMW',
    slogan: 'The Ultimate Driving Machine',
    colors: {
      primary: '210 100% 35%',
      accent: '210 100% 55%',
      glow: '210 100% 50%',
      particleHue: 210,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(210 100% 18%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(210 60% 10% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(220 40% 6%) 0%, hsl(210 50% 12%) 50%, hsl(220 40% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(210 100% 65%) 0%, hsl(210 100% 50%) 50%, hsl(215 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(210 100% 40%) 0%, hsl(210 100% 60%) 100%)',
    },
    premium: true,
  },
  
  mercedes: {
    brand: 'mercedes',
    displayName: 'Mercedes-Benz',
    slogan: 'The Best or Nothing',
    colors: {
      primary: '0 0% 20%',
      accent: '0 0% 80%',
      glow: '45 10% 70%',
      particleHue: 45, // Prata quente
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 0% 18%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(45 10% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 0% 10%) 50%, hsl(0 0% 3%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 0% 95%) 0%, hsl(45 5% 75%) 50%, hsl(0 0% 65%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 0% 55%) 0%, hsl(45 10% 80%) 100%)',
    },
    premium: true,
  },
  
  porsche: {
    brand: 'porsche',
    displayName: 'Porsche',
    slogan: 'There is No Substitute',
    colors: {
      primary: '0 0% 15%',
      accent: '45 100% 50%',
      glow: '45 100% 55%',
      particleHue: 45, // Dourado
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 0% 15%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(45 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 0% 8%) 50%, hsl(0 0% 3%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(45 100% 65%) 0%, hsl(45 100% 50%) 50%, hsl(40 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(45 100% 45%) 0%, hsl(45 100% 60%) 100%)',
    },
    premium: true,
  },

  // ============ AMERICANAS ============
  ford: {
    brand: 'ford',
    displayName: 'Ford',
    slogan: 'Go Further',
    colors: {
      primary: '214 100% 25%',
      accent: '214 100% 50%',
      glow: '214 100% 50%',
      particleHue: 214,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(214 100% 18%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(214 60% 10% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(214 100% 8%) 0%, hsl(214 80% 14%) 50%, hsl(214 100% 6%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(214 100% 65%) 0%, hsl(214 100% 50%) 50%, hsl(220 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(214 100% 40%) 0%, hsl(214 100% 60%) 100%)',
    },
    premium: false,
  },
  
  chevrolet: {
    brand: 'chevrolet',
    displayName: 'Chevrolet',
    slogan: 'Find New Roads',
    colors: {
      primary: '45 100% 40%',
      accent: '45 100% 55%',
      glow: '45 100% 50%',
      particleHue: 45, // Dourado
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(45 60% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(45 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(220 20% 6%) 0%, hsl(45 30% 10%) 50%, hsl(220 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(45 100% 60%) 0%, hsl(45 100% 50%) 50%, hsl(40 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(45 100% 40%) 0%, hsl(45 100% 58%) 100%)',
    },
    premium: false,
  },
  
  jeep: {
    brand: 'jeep',
    displayName: 'Jeep',
    slogan: 'Go Anywhere. Do Anything.',
    colors: {
      primary: '80 40% 30%',
      accent: '80 50% 45%',
      glow: '80 50% 45%',
      particleHue: 80, // Verde oliva
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(80 30% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(80 30% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(80 20% 6%) 0%, hsl(80 25% 10%) 50%, hsl(80 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(80 50% 55%) 0%, hsl(80 50% 45%) 50%, hsl(85 45% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(80 50% 35%) 0%, hsl(80 50% 50%) 100%)',
    },
    premium: false,
  },

  // ============ JAPONESAS ============
  toyota: {
    brand: 'toyota',
    displayName: 'Toyota',
    slogan: 'Let\'s Go Places',
    colors: {
      primary: '0 85% 40%',
      accent: '0 85% 55%',
      glow: '0 85% 50%',
      particleHue: 0, // Vermelho
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 20% 6%) 0%, hsl(0 30% 10%) 50%, hsl(0 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 85% 60%) 0%, hsl(0 85% 50%) 50%, hsl(355 80% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 85% 40%) 0%, hsl(0 85% 55%) 100%)',
    },
    premium: false,
  },
  
  honda: {
    brand: 'honda',
    displayName: 'Honda',
    slogan: 'The Power of Dreams',
    colors: {
      primary: '0 100% 35%',
      accent: '0 100% 50%',
      glow: '0 100% 50%',
      particleHue: 0, // Vermelho
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 70% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 30% 6%) 0%, hsl(0 40% 10%) 50%, hsl(0 30% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 60%) 0%, hsl(0 100% 45%) 50%, hsl(355 90% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 38%) 0%, hsl(0 100% 55%) 100%)',
    },
    premium: false,
  },
  
  nissan: {
    brand: 'nissan',
    displayName: 'Nissan',
    slogan: 'Innovation That Excites',
    colors: {
      primary: '0 0% 20%',
      accent: '0 100% 50%',
      glow: '0 100% 50%',
      particleHue: 0, // Vermelho
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 0% 15%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 0% 5%) 0%, hsl(0 10% 10%) 50%, hsl(0 0% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 0% 90%) 0%, hsl(0 100% 55%) 50%, hsl(0 100% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 40%) 0%, hsl(0 100% 55%) 100%)',
    },
    premium: false,
  },
  
  mitsubishi: {
    brand: 'mitsubishi',
    displayName: 'Mitsubishi',
    slogan: 'Drive Your Ambition',
    colors: {
      primary: '0 100% 40%',
      accent: '0 100% 55%',
      glow: '0 100% 50%',
      particleHue: 0,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 20% 6%) 0%, hsl(0 30% 10%) 50%, hsl(0 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 60%) 0%, hsl(0 100% 50%) 50%, hsl(355 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 40%) 0%, hsl(0 100% 55%) 100%)',
    },
    premium: false,
  },
  
  subaru: {
    brand: 'subaru',
    displayName: 'Subaru',
    slogan: 'Love. It\'s What Makes a Subaru.',
    colors: {
      primary: '210 100% 35%',
      accent: '210 100% 50%',
      glow: '210 100% 50%',
      particleHue: 210,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(210 70% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(210 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(210 40% 6%) 0%, hsl(210 50% 10%) 50%, hsl(210 40% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(210 100% 60%) 0%, hsl(210 100% 50%) 50%, hsl(215 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(210 100% 40%) 0%, hsl(210 100% 55%) 100%)',
    },
    premium: false,
  },
  
  mazda: {
    brand: 'mazda',
    displayName: 'Mazda',
    slogan: 'Feel Alive',
    colors: {
      primary: '0 100% 35%',
      accent: '0 100% 50%',
      glow: '0 100% 50%',
      particleHue: 0,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 20% 6%) 0%, hsl(0 30% 10%) 50%, hsl(0 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 55%) 0%, hsl(0 100% 45%) 50%, hsl(355 90% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 38%) 0%, hsl(0 100% 52%) 100%)',
    },
    premium: false,
  },

  // ============ COREANAS ============
  hyundai: {
    brand: 'hyundai',
    displayName: 'Hyundai',
    slogan: 'New Thinking. New Possibilities.',
    colors: {
      primary: '210 100% 30%',
      accent: '210 100% 50%',
      glow: '210 100% 45%',
      particleHue: 210,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(210 80% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(210 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(210 50% 6%) 0%, hsl(210 60% 10%) 50%, hsl(210 50% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(210 100% 60%) 0%, hsl(210 100% 48%) 50%, hsl(215 90% 42%) 100%)',
      progress: 'linear-gradient(90deg, hsl(210 100% 38%) 0%, hsl(210 100% 55%) 100%)',
    },
    premium: false,
  },
  
  kia: {
    brand: 'kia',
    displayName: 'Kia',
    slogan: 'Movement That Inspires',
    colors: {
      primary: '0 100% 35%',
      accent: '0 100% 50%',
      glow: '0 100% 45%',
      particleHue: 0,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 20% 6%) 0%, hsl(0 30% 10%) 50%, hsl(0 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 58%) 0%, hsl(0 100% 48%) 50%, hsl(355 90% 42%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 38%) 0%, hsl(0 100% 52%) 100%)',
    },
    premium: false,
  },

  // ============ EUROPEIAS ============
  fiat: {
    brand: 'fiat',
    displayName: 'Fiat',
    slogan: 'Driven by Passion',
    colors: {
      primary: '350 85% 35%',
      accent: '350 85% 50%',
      glow: '350 85% 50%',
      particleHue: 350, // Vermelho rosado
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(350 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(350 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(350 30% 6%) 0%, hsl(350 40% 10%) 50%, hsl(350 30% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(350 85% 60%) 0%, hsl(350 85% 50%) 50%, hsl(345 80% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(350 85% 40%) 0%, hsl(350 85% 55%) 100%)',
    },
    premium: false,
  },
  
  renault: {
    brand: 'renault',
    displayName: 'Renault',
    slogan: 'Passion for Life',
    colors: {
      primary: '50 100% 45%',
      accent: '50 100% 55%',
      glow: '50 100% 50%',
      particleHue: 50, // Amarelo
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(50 50% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(50 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(220 20% 6%) 0%, hsl(50 30% 10%) 50%, hsl(220 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(50 100% 60%) 0%, hsl(50 100% 50%) 50%, hsl(45 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(50 100% 42%) 0%, hsl(50 100% 58%) 100%)',
    },
    premium: false,
  },
  
  peugeot: {
    brand: 'peugeot',
    displayName: 'Peugeot',
    slogan: 'Motion & Emotion',
    colors: {
      primary: '210 80% 25%',
      accent: '210 80% 45%',
      glow: '210 80% 45%',
      particleHue: 210,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(210 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(210 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(210 40% 6%) 0%, hsl(210 50% 10%) 50%, hsl(210 40% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(210 80% 55%) 0%, hsl(210 80% 45%) 50%, hsl(215 75% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(210 80% 35%) 0%, hsl(210 80% 52%) 100%)',
    },
    premium: false,
  },
  
  citroen: {
    brand: 'citroen',
    displayName: 'Citroën',
    slogan: 'Inspired by You',
    colors: {
      primary: '0 100% 40%',
      accent: '0 100% 55%',
      glow: '0 100% 50%',
      particleHue: 0,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 60% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(0 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 20% 6%) 0%, hsl(0 30% 10%) 50%, hsl(0 20% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 58%) 0%, hsl(0 100% 48%) 50%, hsl(355 90% 42%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 40%) 0%, hsl(0 100% 55%) 100%)',
    },
    premium: false,
  },
  
  volvo: {
    brand: 'volvo',
    displayName: 'Volvo',
    slogan: 'For Life',
    colors: {
      primary: '210 60% 25%',
      accent: '210 60% 45%',
      glow: '210 60% 45%',
      particleHue: 210,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(210 50% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(210 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(210 30% 6%) 0%, hsl(210 40% 10%) 50%, hsl(210 30% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(210 60% 55%) 0%, hsl(210 60% 45%) 50%, hsl(215 55% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(210 60% 35%) 0%, hsl(210 60% 52%) 100%)',
    },
    premium: true,
  },

  // ============ ITALIANAS ============
  ferrari: {
    brand: 'ferrari',
    displayName: 'Ferrari',
    slogan: 'We Are the Competition',
    colors: {
      primary: '0 100% 45%',
      accent: '45 100% 50%',
      glow: '0 100% 55%',
      particleHue: 0, // Vermelho puro
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(0 80% 18%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(45 60% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 50% 6%) 0%, hsl(0 60% 12%) 50%, hsl(0 50% 5%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(0 100% 60%) 0%, hsl(45 100% 55%) 50%, hsl(0 100% 50%) 100%)',
      progress: 'linear-gradient(90deg, hsl(0 100% 45%) 0%, hsl(0 100% 60%) 100%)',
    },
    premium: true,
  },
  
  lamborghini: {
    brand: 'lamborghini',
    displayName: 'Lamborghini',
    slogan: 'Expect the Unexpected',
    colors: {
      primary: '45 100% 45%',
      accent: '45 100% 60%',
      glow: '45 100% 55%',
      particleHue: 45, // Dourado
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(45 60% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(45 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(45 30% 8%) 50%, hsl(0 0% 3%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(45 100% 65%) 0%, hsl(45 100% 50%) 50%, hsl(40 90% 45%) 100%)',
      progress: 'linear-gradient(90deg, hsl(45 100% 45%) 0%, hsl(45 100% 62%) 100%)',
    },
    premium: true,
  },
  
  maserati: {
    brand: 'maserati',
    displayName: 'Maserati',
    slogan: 'The Absolute Opposite of Ordinary',
    colors: {
      primary: '215 100% 25%',
      accent: '215 100% 45%',
      glow: '215 100% 45%',
      particleHue: 215,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(215 70% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(215 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(215 40% 5%) 0%, hsl(215 50% 10%) 50%, hsl(215 40% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(215 100% 55%) 0%, hsl(215 100% 45%) 50%, hsl(220 90% 40%) 100%)',
      progress: 'linear-gradient(90deg, hsl(215 100% 38%) 0%, hsl(215 100% 52%) 100%)',
    },
    premium: true,
  },
  
  alfaromeo: {
    brand: 'alfaromeo',
    displayName: 'Alfa Romeo',
    slogan: 'La Meccanica delle Emozioni',
    colors: {
      primary: '350 100% 35%',
      accent: '350 100% 50%',
      glow: '350 100% 50%',
      particleHue: 350,
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(350 70% 14%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(350 50% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(350 40% 5%) 0%, hsl(350 50% 10%) 50%, hsl(350 40% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(350 100% 58%) 0%, hsl(350 100% 48%) 50%, hsl(345 90% 42%) 100%)',
      progress: 'linear-gradient(90deg, hsl(350 100% 38%) 0%, hsl(350 100% 52%) 100%)',
    },
    premium: true,
  },

  // ============ BRITÂNICAS ============
  jaguar: {
    brand: 'jaguar',
    displayName: 'Jaguar',
    slogan: 'Grace, Space, Pace',
    colors: {
      primary: '165 60% 25%',
      accent: '165 60% 45%',
      glow: '165 60% 45%',
      particleHue: 165, // Verde esmeralda
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(165 50% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(165 40% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(165 30% 5%) 0%, hsl(165 40% 9%) 50%, hsl(165 30% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(165 60% 55%) 0%, hsl(165 60% 42%) 50%, hsl(170 55% 38%) 100%)',
      progress: 'linear-gradient(90deg, hsl(165 60% 35%) 0%, hsl(165 60% 50%) 100%)',
    },
    premium: true,
  },
  
  landrover: {
    brand: 'landrover',
    displayName: 'Land Rover',
    slogan: 'Above and Beyond',
    colors: {
      primary: '145 50% 28%',
      accent: '145 50% 42%',
      glow: '145 50% 42%',
      particleHue: 145, // Verde floresta
    },
    gradient: {
      background: `
        radial-gradient(ellipse at 50% 30%, hsl(145 40% 12%) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, hsl(145 30% 8% / 0.5) 0%, transparent 40%),
        linear-gradient(180deg, hsl(145 25% 5%) 0%, hsl(145 35% 9%) 50%, hsl(145 25% 4%) 100%)
      `,
      logo: 'linear-gradient(135deg, hsl(145 50% 52%) 0%, hsl(145 50% 40%) 50%, hsl(150 45% 35%) 100%)',
      progress: 'linear-gradient(90deg, hsl(145 50% 32%) 0%, hsl(145 50% 48%) 100%)',
    },
    premium: true,
  },

  // ============ TEMA GENÉRICO (fallback) ============
  generic: DEFAULT_THEME,
};

/**
 * Obtém o tema da splash para uma marca específica
 * Fallback para tema genérico se a marca não for encontrada
 */
export function getSplashTheme(brand: string | null | undefined): SplashTheme {
  if (!brand) return DEFAULT_THEME;
  
  const normalizedBrand = brand.toLowerCase().replace(/[\s-_]/g, '');
  
  // Mapeamentos especiais para variações de nome
  const brandAliases: Record<string, string> = {
    'vw': 'volkswagen',
    'mercedesbenz': 'mercedes',
    'alfaomeo': 'alfaromeo',
    'alfa': 'alfaromeo',
    'chevy': 'chevrolet',
    'gm': 'chevrolet',
    'range rover': 'landrover',
    'rangerover': 'landrover',
  };
  
  const mappedBrand = brandAliases[normalizedBrand] || normalizedBrand;
  
  return SPLASH_THEMES[mappedBrand] || DEFAULT_THEME;
}

/**
 * Verifica se um tema é premium (para efeitos extras)
 */
export function isPremiumBrand(brand: string | null | undefined): boolean {
  return getSplashTheme(brand).premium;
}
