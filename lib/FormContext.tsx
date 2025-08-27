'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Comprehensive form data interface
export interface FormData {
  // Step 1: Customer Type
  customerType?: 'private' | 'company';
  
  // Step 2: Contact Information
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    orgNumber?: string;
  };
  
  // Step 3: Moving Details
  moveDetails?: {
    moveDate: string;
    moveTime?: string;
    flexibility?: 'specific' | 'flexible' | 'anytime';
    
    // From address
    startAddress: string;
    startPostalCode?: string;
    startCity?: string;
    startFloor?: number;
    startElevator?: 'yes' | 'no' | 'small' | 'big';
    startPropertyType?: 'apartment' | 'house' | 'office' | 'storage';
    startLivingArea?: number;
    startParkingDistance?: number;
    startDoorCode?: string;
    
    // To address
    endAddress: string;
    endPostalCode?: string;
    endCity?: string;
    endFloor?: number;
    endElevator?: 'yes' | 'no' | 'small' | 'big';
    endPropertyType?: 'apartment' | 'house' | 'office' | 'storage';
    endLivingArea?: number;
    endParkingDistance?: number;
    endDoorCode?: string;
    
    // Calculated values
    distance?: number;
    estimatedVolume?: number;
  };
  
  // Step 4: Services
  services?: {
    movingService: boolean;
    packingService?: 'none' | 'partial' | 'full';
    unpackingService?: boolean;
    cleaningService?: 'none' | 'basic' | 'deep' | 'movein';
    storageService?: boolean;
    
    // Special items
    specialItems?: {
      piano?: boolean;
      safe?: boolean;
      art?: boolean;
      antiques?: boolean;
      fragile?: boolean;
    };
    
    // Additional services
    movingBoxes?: number;
    bubbleWrap?: boolean;
    wardrobeBoxes?: number;
    
    specialInstructions?: string;
  };
  
  // Step 5: Price & Confirmation
  pricing?: {
    basePrice: number;
    volumePrice: number;
    distancePrice: number;
    servicesPrice: number;
    rutDeduction: number;
    totalPrice: number;
    totalPriceAfterRut: number;
  };
  
  // Metadata
  currentStep?: number;
  completedSteps?: number[];
  createdAt?: string;
  updatedAt?: string;
  bookingId?: string;
  status?: 'draft' | 'submitted' | 'confirmed';
}

interface FormContextType {
  formData: FormData;
  setFormData: (data: FormData) => void;
  updateFormData: (updates: Partial<FormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isStepCompleted: (step: number) => boolean;
  markStepCompleted: (step: number) => void;
  clearForm: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  calculatePricing: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

const STORAGE_KEY = 'nordflytt-booking-form';
const TOTAL_STEPS = 5;

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormDataState] = useState<FormData>({
    currentStep: 1,
    completedSteps: [],
    status: 'draft'
  });
  
  const [currentStep, setCurrentStep] = useState(1);

  // Load saved data on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // Auto-save on data change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage();
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [formData]);

  const setFormData = useCallback((data: FormData) => {
    setFormDataState(data);
  }, []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormDataState(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      markStepCompleted(currentStep);
      setCurrentStep(currentStep + 1);
      updateFormData({ currentStep: currentStep + 1 });
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      updateFormData({ currentStep: currentStep - 1 });
    }
  }, [currentStep]);

  const isStepCompleted = useCallback((step: number) => {
    return formData.completedSteps?.includes(step) || false;
  }, [formData.completedSteps]);

  const markStepCompleted = useCallback((step: number) => {
    const completed = formData.completedSteps || [];
    if (!completed.includes(step)) {
      updateFormData({
        completedSteps: [...completed, step]
      });
    }
  }, [formData.completedSteps, updateFormData]);

  const clearForm = useCallback(() => {
    setFormDataState({
      currentStep: 1,
      completedSteps: [],
      status: 'draft'
    });
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, [formData]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setFormDataState(data);
        setCurrentStep(data.currentStep || 1);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }, []);

  const calculatePricing = useCallback(() => {
    // Base prices (SEK)
    const BASE_MOVING_PRICE = 2500;
    const PRICE_PER_CUBIC_METER = 240; // After RUT
    const PRICE_PER_KM = 50;
    const RUT_DEDUCTION_RATE = 0.5; // 50%

    const moveDetails = formData.moveDetails;
    const services = formData.services;

    if (!moveDetails) return;

    // Calculate volume (m³) based on living area
    const volume = moveDetails.estimatedVolume || 
      (moveDetails.startLivingArea ? moveDetails.startLivingArea * 0.35 : 20);

    // Calculate base prices
    let basePrice = BASE_MOVING_PRICE;
    let volumePrice = volume * PRICE_PER_CUBIC_METER * 2; // *2 because RUT is already applied
    let distancePrice = (moveDetails.distance || 10) * PRICE_PER_KM;
    let servicesPrice = 0;

    // Add service prices
    if (services?.packingService === 'full') servicesPrice += 3000;
    else if (services?.packingService === 'partial') servicesPrice += 1500;
    
    if (services?.unpackingService) servicesPrice += 1500;
    
    if (services?.cleaningService === 'deep') servicesPrice += 3500;
    else if (services?.cleaningService === 'basic') servicesPrice += 2000;
    else if (services?.cleaningService === 'movein') servicesPrice += 2500;

    // Special items
    if (services?.specialItems?.piano) servicesPrice += 1500;
    if (services?.specialItems?.safe) servicesPrice += 1000;

    // Moving supplies
    if (services?.movingBoxes) servicesPrice += services.movingBoxes * 79;
    if (services?.wardrobeBoxes) servicesPrice += services.wardrobeBoxes * 199;

    // Calculate totals
    const totalBeforeRut = basePrice + volumePrice + distancePrice + servicesPrice;
    const rutEligible = basePrice + volumePrice; // Only labor is RUT-eligible
    const rutDeduction = rutEligible * RUT_DEDUCTION_RATE;
    const totalPrice = totalBeforeRut;
    const totalPriceAfterRut = totalBeforeRut - rutDeduction;

    updateFormData({
      pricing: {
        basePrice,
        volumePrice,
        distancePrice,
        servicesPrice,
        rutDeduction,
        totalPrice,
        totalPriceAfterRut
      }
    });
  }, [formData.moveDetails, formData.services, updateFormData]);

  const value: FormContextType = {
    formData,
    setFormData,
    updateFormData,
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    isStepCompleted,
    markStepCompleted,
    clearForm,
    saveToLocalStorage,
    loadFromLocalStorage,
    calculatePricing
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};