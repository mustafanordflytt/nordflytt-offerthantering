export interface MoveFormData {
  // Customer information
  customerType: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  orgNumber?: string;
  contactPerson?: string;
  role?: string;
  contactPreference?: string[];

  // Service information
  serviceType: string;
  serviceTypes: string[];

  // Move details
  moveDate: string;
  moveTime: string;
  startAddress: string;
  startFloor: string;
  startElevator: "big" | "small" | "none";
  endAddress: string;
  endFloor: string;
  endElevator: "big" | "small" | "none";
  startLivingArea: string;
  endLivingArea: string;
  startPropertyType: "apartment" | "house" | "storage";
  endPropertyType: "apartment" | "house" | "storage";
  startParkingDistance: string;
  endParkingDistance: string;
  parkingDistance: string; // Legacy field
  startDoorCode?: string;
  endDoorCode?: string;
  calculatedDistance?: string;
  flexibleMoveDate?: boolean;
  flexibleDateRange?: string;

  // Additional services
  largeItems: string[];
  additionalServices: string[];
  specialItems: string[];
  movingBoxes: number;
  movingMaterials: string[];
  specialInstructions: string;
  packingService: string;
  cleaningService: string;

  // Office moving specific
  officeFromAddress: string;
  officeToAddress: string;
  officeType: string;
  storeType: string;
  workstations: string;
  additionalSpaces: string[];
  officeMoveDate: string;
  approximateDestination: boolean;
  officeSizeSquareMeters: string;
  officeElevator: "big" | "small" | "none";
  hasLoadingZone: boolean;
  officeInventory: { [key: string]: number };
  needsLabeling: boolean;
  labelingType: string[];
  specialHandling: string[];
  estimatedVolume: number;
  manualVolume: string;
  needsITSetup: boolean;

  // Cleaning specific
  address: string;
  size: string;
  hasBalcony: boolean;
  additionalAreas: string[];
  wasteRemoval: boolean;
  condition: "normal" | "deep";
  hasUtilities: boolean;
  keyHandover: "onsite" | "advance" | "other";
  keyHandoverNote: string;
  additionalNotes: string;
  cleaningArea: string;

  // Payment and terms
  acceptTerms: boolean;
  paymentMethod: string;

  // Form state
  step: number;
  
  // Additional fields
  valuationTime?: string;
  valuationComment?: string;
  valuationTimePreference?: "asap" | "specific";
  valuationDate?: string;
  valuationItems?: string[];
  valuationOtherItem?: string;
  valuationAddress?: string;
  valuationFloor?: string;
  valuationElevator?: "big" | "small" | "none";
}

export type FormField = keyof MoveFormData; 