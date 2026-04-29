import { supabase } from '@/lib/supabase';

export type BusinessType = 'individual' | 'sarl' | 'sa' | 'auto_entrepreneur' | 'other';

export type KycSubmission = {
  id?: string;
  user_id: string;
  business_name: string;
  business_type: BusinessType;
  ice_number: string;
  rc_number?: string | null;
  patente_number?: string | null;
  cnss_number?: string | null;
  legal_rep_name: string;
  legal_rep_cin: string;
  legal_rep_phone: string;
  business_address: string;
  business_city: string;
  region_id?: string | null;
  cin_front_url?: string | null;
  cin_back_url?: string | null;
  rc_document_url?: string | null;
  patente_document_url?: string | null;
  ice_document_url?: string | null;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  submitted_at?: string;
};

export type KycStatus = 'none' | 'pending' | 'under_review' | 'approved' | 'rejected';

export type KycDocumentType = 'cin_front' | 'cin_back' | 'rc' | 'patente' | 'ice';

export type Region = {
  id: string;
  name_fr: string;
  name_ar: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

/**
 * Récupère la candidature KYC active de l'utilisateur (s'il en a une).
 */
export async function fetchUserKycStatus(userId: string): Promise<{
  status: KycStatus;
  submission: KycSubmission | null;
}> {
  const { data, error } = await supabase
    .from('pro_kyc_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[kycService] fetchUserKycStatus error:', error);
    return { status: 'none', submission: null };
  }

  if (!data || data.length === 0) {
    return { status: 'none', submission: null };
  }

  const row = data[0] as KycSubmission;
  return { status: (row.status ?? 'pending') as KycStatus, submission: row };
}

/**
 * Upload un document KYC dans le bucket privé `kyc-documents`.
 * Path: <userId>/<documentType>_<timestamp>.<ext>
 * Returns the storage path (not a URL).
 */
export async function uploadKycDocument(
  userId: string,
  documentType: KycDocumentType,
  file: { uri: string; name: string; type: string; size?: number }
): Promise<string> {
  if (file.size != null && file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  let blob: Blob;
  try {
    const response = await fetch(file.uri);
    blob = await response.blob();
  } catch (err) {
    console.error('[kycService] uploadKycDocument fetch failed:', err);
    throw new Error('FETCH_FAILED');
  }

  const path = `${userId}/${documentType}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('kyc-documents')
    .upload(path, blob, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });

  if (error) {
    console.error('[kycService] uploadKycDocument error:', error);
    throw error;
  }

  return path;
}

/**
 * Crée une nouvelle candidature KYC (status='pending' par défaut côté DB).
 */
export async function submitKycApplication(
  submission: KycSubmission
): Promise<{ id: string }> {
  const payload = {
    user_id: submission.user_id,
    business_name: submission.business_name,
    business_type: submission.business_type,
    ice_number: submission.ice_number,
    rc_number: submission.rc_number ?? null,
    patente_number: submission.patente_number ?? null,
    cnss_number: submission.cnss_number ?? null,
    legal_rep_name: submission.legal_rep_name,
    legal_rep_cin: submission.legal_rep_cin,
    legal_rep_phone: submission.legal_rep_phone,
    business_address: submission.business_address,
    business_city: submission.business_city,
    region_id: submission.region_id ?? null,
    cin_front_url: submission.cin_front_url ?? null,
    cin_back_url: submission.cin_back_url ?? null,
    rc_document_url: submission.rc_document_url ?? null,
    patente_document_url: submission.patente_document_url ?? null,
    ice_document_url: submission.ice_document_url ?? null,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('pro_kyc_submissions')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.error('[kycService] submitKycApplication error:', error);
    throw error;
  }

  return { id: (data as { id: string }).id };
}

/**
 * Liste les régions du Maroc pour le select dans Step 3.
 */
export async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name_fr, name_ar')
    .order('name_fr');

  if (error) {
    console.error('[kycService] fetchRegions error:', error);
    return [];
  }

  return (data as Region[]) ?? [];
}
