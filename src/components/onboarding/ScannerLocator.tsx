import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { BrandSelector, type CarBrand } from './BrandSelector';
import { OBDLocationGuide } from './OBDLocationGuide';
import { PreFlightChecklist } from './PreFlightChecklist';

type LocatorStep = 'brand-select' | 'location-guide' | 'checklist';

interface ScannerLocatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReady: () => void;
}

const STEP_TITLES: Record<LocatorStep, string> = {
  'brand-select': 'Encontre a Porta OBD',
  'location-guide': 'Localização da Porta',
  'checklist': 'Preparação Final',
};

const STEP_DESCRIPTIONS: Record<LocatorStep, string> = {
  'brand-select': 'Selecione a marca do seu veículo',
  'location-guide': 'Veja onde fica a porta OBD-II',
  'checklist': 'Confirme que tudo está pronto',
};

export function ScannerLocator({ open, onOpenChange, onReady }: ScannerLocatorProps) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<LocatorStep>('brand-select');
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | null>(null);

  const handleBrandSelect = (brand: CarBrand) => {
    setSelectedBrand(brand);
    setStep('location-guide');
  };

  const handleBack = () => {
    if (step === 'location-guide') {
      setStep('brand-select');
    } else if (step === 'checklist') {
      setStep('location-guide');
    }
  };

  const handleNext = () => {
    if (step === 'location-guide') {
      setStep('checklist');
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    // Reset state for next time
    setTimeout(() => {
      setStep('brand-select');
      setSelectedBrand(null);
    }, 300);
    onReady();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('brand-select');
      setSelectedBrand(null);
    }, 300);
  };

  const renderContent = () => (
    <div className="space-y-6 px-1">
      {/* Step content */}
      {step === 'brand-select' && (
        <BrandSelector 
          selectedBrand={selectedBrand} 
          onSelectBrand={handleBrandSelect} 
        />
      )}

      {step === 'location-guide' && selectedBrand && (
        <>
          <OBDLocationGuide brand={selectedBrand} />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {step === 'checklist' && (
        <>
          <PreFlightChecklist onComplete={handleComplete} />
          <Button
            variant="ghost"
            onClick={handleBack}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para localização
          </Button>
        </>
      )}
    </div>
  );

  // Progress indicator
  const ProgressDots = () => (
    <div className="flex items-center justify-center gap-2 py-2">
      {(['brand-select', 'location-guide', 'checklist'] as LocatorStep[]).map((s, i) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s === step 
              ? 'w-6 bg-primary' 
              : i < ['brand-select', 'location-guide', 'checklist'].indexOf(step)
                ? 'w-1.5 bg-primary/50'
                : 'w-1.5 bg-muted'
          }`}
        />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>{STEP_TITLES[step]}</DrawerTitle>
            <DrawerDescription>{STEP_DESCRIPTIONS[step]}</DrawerDescription>
            <ProgressDots />
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
          <DialogDescription>{STEP_DESCRIPTIONS[step]}</DialogDescription>
          <ProgressDots />
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
