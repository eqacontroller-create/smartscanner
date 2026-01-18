import React from 'react';
import { MapPin, Lightbulb } from 'lucide-react';
import { OBDDiagram } from './OBDDiagram';
import type { CarBrand } from './BrandSelector';

interface OBDLocation {
  position: string;
  description: string;
  diagramPosition: { x: number; y: number };
  tips: string[];
}

const OBD_LOCATIONS: Record<CarBrand, OBDLocation> = {
  volkswagen: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Logo abaixo do painel de instrumentos, perto do pedal de embreagem.',
    diagramPosition: { x: 25, y: 65 },
    tips: ['Pode ter uma tampa plástica', 'Olhe para cima, sob o painel'],
  },
  honda: {
    position: 'Abaixo do volante, lado direito',
    description: 'Próximo à caixa de fusíveis, do lado do passageiro do volante.',
    diagramPosition: { x: 65, y: 60 },
    tips: ['Geralmente sem tampa', 'Fácil acesso'],
  },
  ford: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Próximo à alavanca de abertura do capô.',
    diagramPosition: { x: 20, y: 60 },
    tips: ['Pode estar atrás de uma tampa', 'Procure perto dos fusíveis'],
  },
  fiat: {
    position: 'Abaixo do volante, centro-esquerda',
    description: 'Sob o painel, pode estar coberto por uma tampa.',
    diagramPosition: { x: 35, y: 65 },
    tips: ['Tampa geralmente removível', 'Encaixa com pressão'],
  },
  chevrolet: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Próximo ao pedal de freio de estacionamento.',
    diagramPosition: { x: 25, y: 70 },
    tips: ['Acesso direto na maioria dos modelos'],
  },
  toyota: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Sob o painel, fácil acesso.',
    diagramPosition: { x: 30, y: 65 },
    tips: ['Geralmente exposta', 'Padrão japonês'],
  },
  hyundai: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Próximo à caixa de fusíveis interna.',
    diagramPosition: { x: 25, y: 60 },
    tips: ['Pode ter tampa decorativa'],
  },
  kia: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Similar ao Hyundai, fácil localização.',
    diagramPosition: { x: 25, y: 62 },
    tips: ['Acesso direto', 'Bem posicionada'],
  },
  renault: {
    position: 'Abaixo do volante, centro',
    description: 'Sob o painel central, pode ter tampa.',
    diagramPosition: { x: 40, y: 65 },
    tips: ['Tampa de plástico comum', 'Pode precisar de lanterna'],
  },
  nissan: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Próximo aos pedais, sob o painel.',
    diagramPosition: { x: 28, y: 68 },
    tips: ['Padrão japonês', 'Geralmente exposta'],
  },
  jeep: {
    position: 'Abaixo do volante, lado esquerdo',
    description: 'Posição padrão americana, fácil acesso.',
    diagramPosition: { x: 25, y: 65 },
    tips: ['Sem tampa na maioria dos modelos'],
  },
  generic: {
    position: 'Geralmente abaixo do volante',
    description: 'A porta OBD-II fica a no máximo 60cm do volante, geralmente sob o painel.',
    diagramPosition: { x: 30, y: 65 },
    tips: [
      'Procure uma tomada retangular com 16 pinos',
      'Pode estar atrás de uma tampa plástica',
      'Consulte o manual do veículo'
    ],
  },
};

interface OBDLocationGuideProps {
  brand: CarBrand;
}

export function OBDLocationGuide({ brand }: OBDLocationGuideProps) {
  const location = OBD_LOCATIONS[brand];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <MapPin className="h-4 w-4" />
          {location.position}
        </div>
        <p className="text-sm text-muted-foreground">
          {location.description}
        </p>
      </div>

      {/* Diagrama */}
      <OBDDiagram portPosition={location.diagramPosition} />

      {/* Dicas */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Dicas para encontrar
        </div>
        <ul className="space-y-1">
          {location.tips.map((tip, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
