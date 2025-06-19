export interface Provider {
    id: number;
    name: string;
    npi: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
    cmsCertificationNumber: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Service {
    id: number;
    code: string;
    codeType: 'CPT' | 'HCPCS' | 'DRG' | 'ICD10';
    description: string;
    category: string;
  }
  
  export interface StandardCharge {
    id: number;
    providerId: number;
    serviceId: number;
    grossCharge: number;
    cashPrice: number;
    minNegotiatedRate: number;
    maxNegotiatedRate: number;
    effectiveDate: Date;
    expirationDate?: Date;
  }
  
  export interface NegotiatedRate {
    id: number;
    standardChargeId: number;
    payerName: string;
    planName: string;
    negotiatedRate: number;
    billingClass: 'inpatient' | 'outpatient';
  }
  
  export interface ComplianceStatus {
    providerId: number;
    hasMRFFile: boolean;
    hasHomepageLink: boolean;
    mrfAccessibilityScore: number;
    lastChecked: Date;
    overallScore: number;
  }