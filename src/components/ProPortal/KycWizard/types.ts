import type { BusinessType } from '@/lib/services/kycService';

export type KycFormData = {
  business_type: BusinessType;
  business_name: string;
  ice_number: string;
  rc_number: string;
  patente_number: string;
  cnss_number: string;
  legal_rep_name: string;
  legal_rep_cin: string;
  legal_rep_phone: string;
  business_address: string;
  business_city: string;
  region_id: string | null;
  cin_front_url: string | null;
  cin_back_url: string | null;
  rc_document_url: string | null;
  patente_document_url: string | null;
  ice_document_url: string | null;
};

export type StepProps = {
  formData: KycFormData;
  setFormData: React.Dispatch<React.SetStateAction<KycFormData>>;
};

export function validateStep(step: number, data: KycFormData): boolean {
  switch (step) {
    case 1:
      return (
        data.business_name.trim().length > 0 &&
        /^\d{15}$/.test(data.ice_number.trim())
      );
    case 2:
      return (
        data.legal_rep_name.trim().length > 0 &&
        data.legal_rep_cin.trim().length > 0 &&
        data.legal_rep_phone.trim().length > 0
      );
    case 3:
      return (
        data.business_address.trim().length > 0 &&
        data.business_city.trim().length > 0 &&
        !!data.region_id
      );
    case 4:
      return !!data.cin_front_url && !!data.cin_back_url;
    default:
      return true;
  }
}
