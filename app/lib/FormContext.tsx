"use client";

import React, { createContext, useContext, useState } from "react";

export interface FormData {
  // Basdata
  customerType: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  serviceTypes: string[];
  moveDate: string;
  moveTime: string;
  startAddress: string;
  startFloor: string;
  startElevator: "big" | "small" | "none";
  endAddress: string;
  endFloor: string;
  endElevator: "big" | "small" | "none";
  startParkingDistance: string;
  endParkingDistance: string;
  parkingDistance?: string; // Legacy-fält
  startLivingArea: string;
  endLivingArea: string;
  startPropertyType: "apartment" | "house" | "storage";
  endPropertyType: "apartment" | "house" | "storage";
  startDoorCode: string;
  endDoorCode: string;
  calculatedDistance?: string;
  packingService: string;
  cleaningService: string;
  paymentMethod: string;
  
  // Lägenhetsspecifika fält
  selectedItems?: { [key: string]: number };
  largeItems: string[];
  additionalServices: string[];
  cleaningArea: string;
  rentalBoxes?: { [key: string]: number };
  movingBoxes: number;
  movingMaterials: string[];
  specialItems: string[];
  specialInstructions: string;
  acceptTerms: boolean;
  needsMovingBoxes?: boolean;
  
  // Företagsspecifika fält
  companyName?: string;
  orgNumber?: string;
  contactPerson?: string;
  role?: string;
  contactPreference?: string[];
  additionalBusinessServices?: string[];
  
  // Kontorsflytt
  officeFromAddress?: string;
  officeToAddress?: string;
  officeType?: string;
  storeType?: string;
  workstations?: string;
  additionalSpaces?: string[];
  officeMoveDate?: string;
  approximateDestination?: boolean;
  officeSizeSquareMeters?: string;
  officeElevator?: "big" | "small" | "none";
  hasLoadingZone?: boolean;
  officeInventory?: { [key: string]: number };
  needsLabeling?: boolean;
  labelingType?: string[];
  specialHandling?: string[];
  estimatedVolume?: number;
  manualVolume?: string;
  needsITSetup?: boolean;
  
  // Städspecifika fält
  address?: string;
  size?: string;
  hasBalcony?: boolean;
  additionalAreas?: string[];
  wasteRemoval?: boolean;
  condition?: "normal" | "deep";
  hasUtilities?: boolean;
  keyHandover?: "onsite" | "advance" | "other";
  keyHandoverNote?: string;
  additionalNotes?: string;
  
  // Värdering av möbler
  valuationItems?: string[];
  valuationOtherItem?: string;
  valuationAddress?: string;
  valuationFloor?: string;
  valuationElevator?: "big" | "small" | "none";
  valuationTimePreference?: "asap" | "specific";
  valuationDate?: string;
  valuationTime?: string;
  valuationComment?: string;
}

interface FormContextType {
  formData: FormData;
  setFormData: (data: FormData | ((prevData: FormData) => FormData)) => void;
}

// Skapa en context med ett standardvärde
const FormContext = createContext<FormContextType | undefined>(undefined);

// Hook för att använda form-contexten
export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

interface FormProviderProps {
  children: React.ReactNode;
  initialData?: Partial<FormData>;
}

// Provider-komponent för att omsluta app
export function FormProvider({ children, initialData = {} }: FormProviderProps) {
  const [formData, setFormData] = useState<FormData>({
    // Default-värden för formuläret
    customerType: "",
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    serviceTypes: [],
    moveDate: "",
    moveTime: "08:00",
    startAddress: "",
    startFloor: "",
    startElevator: "none",
    endAddress: "",
    endFloor: "",
    endElevator: "none",
    parkingDistance: "",
    startParkingDistance: "",
    endParkingDistance: "",
    startLivingArea: "",
    endLivingArea: "",
    startPropertyType: "apartment",
    endPropertyType: "apartment",
    startDoorCode: "",
    endDoorCode: "",
    largeItems: [],
    additionalServices: [],
    cleaningArea: "",
    movingBoxes: 0,
    movingMaterials: [],
    specialItems: [],
    specialInstructions: "",
    acceptTerms: false,
    paymentMethod: "",
    packingService: "",
    cleaningService: "",
    ...initialData
  });

  return (
    <FormContext.Provider value={{ formData, setFormData }}>
      {children}
    </FormContext.Provider>
  );
}

export default FormContext; 