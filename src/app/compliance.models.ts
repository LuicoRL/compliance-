export type ApplicationStatus = 'NOT_APPROVED' | 'PENDING' | 'APPROVED';

export interface ComplianceDocument {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  size: number;
  content: Blob;
}

export interface ComplianceApplication {
  id: string;
  clientName: string;
  constitutionRecord: string;
  nit: string;
  commercialRegistration: string;
  representativeDocument: string;
  representativePower: string;
  bankCertification: string;
  website: string;
  status: ApplicationStatus;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  documents: ComplianceDocument[];
  reportPdf?: Blob;
}

export const EMPTY_APPLICATION = (): ComplianceApplication => ({
  id: crypto.randomUUID(), clientName: '', constitutionRecord: '', nit: '',
  commercialRegistration: '', representativeDocument: '', representativePower: '',
  bankCertification: '', website: '', status: 'NOT_APPROVED',
  createdAt: new Date().toISOString(), documents: []
});
