'use client';

import { Check } from 'lucide-react';
import { useFormContext } from '@/lib/FormContext';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Kundtyp',
    description: 'Privat eller företag'
  },
  {
    id: 2,
    title: 'Kontakt',
    description: 'Dina uppgifter'
  },
  {
    id: 3,
    title: 'Flytt',
    description: 'Adresser & datum'
  },
  {
    id: 4,
    title: 'Tjänster',
    description: 'Välj tillägg'
  },
  {
    id: 5,
    title: 'Bekräftelse',
    description: 'Granska & boka'
  }
];

export default function ProgressIndicator() {
  const { currentStep, isStepCompleted } = useFormContext();

  return (
    <div className="w-full py-4">
      {/* Mobile view - simplified */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">
            Steg {currentStep} av {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[currentStep - 1].title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop view - detailed */}
      <div className="hidden sm:block">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li
                key={step.id}
                className={cn(
                  stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
                  'relative'
                )}
              >
                {/* Connector line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute top-4 left-8 -ml-px mt-0.5 h-0.5 w-full bg-gray-300"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        'h-full bg-blue-600 transition-all duration-300',
                        currentStep > step.id || isStepCompleted(step.id)
                          ? 'w-full'
                          : 'w-0'
                      )}
                    />
                  </div>
                )}

                <div className="group relative flex items-start">
                  <span className="flex h-9 items-center">
                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
                        currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.id || isStepCompleted(step.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500 group-hover:bg-gray-400'
                      )}
                    >
                      {currentStep > step.id || isStepCompleted(step.id) ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </span>
                  </span>
                  <span className="ml-4 flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors duration-300',
                        currentStep === step.id
                          ? 'text-blue-600'
                          : currentStep > step.id || isStepCompleted(step.id)
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      )}
                    >
                      {step.title}
                    </span>
                    <span
                      className={cn(
                        'text-xs transition-colors duration-300',
                        currentStep === step.id
                          ? 'text-blue-500'
                          : 'text-gray-500'
                      )}
                    >
                      {step.description}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}