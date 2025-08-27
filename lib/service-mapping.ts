// Service name mapping between form values and pricing logic

export interface ServiceMapping {
  formName: string;
  pricingField: keyof ServicePricingFields;
  price: number;
}

export interface ServicePricingFields {
  mobelmontering: boolean;
  upphangning: boolean;
  bortforsling: boolean;
  nätverksinstallation?: boolean;
}

// Map service names from form to pricing fields
export const serviceNameMapping: ServiceMapping[] = [
  // Private services
  { formName: "Möbelmontering", pricingField: "mobelmontering", price: 1500 },
  { formName: "Upphängning & installation", pricingField: "upphangning", price: 1200 },
  { formName: "Bortforsling & återvinning", pricingField: "bortforsling", price: 1800 },
  
  // Business services
  { formName: "Demontering & montering", pricingField: "mobelmontering", price: 1500 },
  { formName: "Nätverksinstallation & IT-drift", pricingField: "nätverksinstallation", price: 7500 },
  { formName: "Avfallshantering & återvinning", pricingField: "bortforsling", price: 1800 }
];

// Check if a packing service was selected
export function isPackingServiceSelected(packingService: string | undefined): boolean {
  if (!packingService) return false;
  return packingService !== "Ingen packning" && packingService !== "";
}

// Check if a cleaning service was selected
export function isCleaningServiceSelected(cleaningService: string | undefined): boolean {
  if (!cleaningService) return false;
  return cleaningService !== "Ingen städning" && cleaningService !== "";
}

// Get price for a specific service
export function getServicePrice(serviceName: string): number {
  const mapping = serviceNameMapping.find(m => m.formName === serviceName);
  return mapping?.price || 0;
}

// Convert form services to pricing boolean fields
export function mapServicesToPricingFields(
  packingService: string | undefined,
  cleaningService: string | undefined,
  additionalServices: string[] | undefined
): Partial<ServicePricingFields> & { packHjalp: boolean; flyttstad: boolean } {
  const result: any = {
    packHjalp: isPackingServiceSelected(packingService),
    flyttstad: isCleaningServiceSelected(cleaningService),
    mobelmontering: false,
    upphangning: false,
    bortforsling: false
  };

  // Map additional services
  if (additionalServices && Array.isArray(additionalServices)) {
    additionalServices.forEach(serviceName => {
      const mapping = serviceNameMapping.find(m => m.formName === serviceName);
      if (mapping) {
        result[mapping.pricingField] = true;
      }
    });
  }

  return result;
}

// Get display info for all selected services
export interface ServiceDisplayInfo {
  name: string;
  price: number;
  category: 'moving' | 'packing' | 'cleaning' | 'additional';
}

export function getSelectedServicesDisplay(
  packingService: string | undefined,
  cleaningService: string | undefined,
  additionalServices: string[] | undefined,
  livingArea: number = 70
): ServiceDisplayInfo[] {
  const services: ServiceDisplayInfo[] = [];

  // Packing service
  if (isPackingServiceSelected(packingService)) {
    services.push({
      name: packingService || "Packning",
      price: livingArea * 44, // 44 kr/m² for packing
      category: 'packing'
    });
  }

  // Cleaning service  
  if (isCleaningServiceSelected(cleaningService)) {
    services.push({
      name: cleaningService || "Flyttstädning",
      price: livingArea * 44, // 44 kr/m² for cleaning
      category: 'cleaning'
    });
  }

  // Additional services
  if (additionalServices && Array.isArray(additionalServices)) {
    additionalServices.forEach(serviceName => {
      const price = getServicePrice(serviceName);
      if (price > 0) {
        services.push({
          name: serviceName,
          price: price,
          category: 'additional'
        });
      }
    });
  }

  return services;
}