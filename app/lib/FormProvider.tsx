"use client";

import React, { useState } from "react";
import FormContext, { FormData } from "./FormContext";

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

  const updateFormData = (data: FormData | ((prevData: FormData) => FormData)) => {
    if (typeof data === 'function') {
      setFormData(data);
    } else {
      setFormData(prevData => ({ ...prevData, ...data }));
    }
  };

  return (
    <FormContext.Provider value={{ formData, setFormData: updateFormData }}>
      {children}
    </FormContext.Provider>
  );
}

export default FormProvider; 