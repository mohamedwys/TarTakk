import { supabase } from '@/lib/supabase';

export type AdminKycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type AdminKycRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  business_name: string;
  business_type: string;
  business_city: string;
  ice_number: string;
  status: AdminKycStatus;
  submitted_at: string;
  reviewed_at: string | null;
};

export type AdminKycDetail = AdminKycRow & {
  rc_number: string | null;
  patente_number: string | null;
  cnss_number: string | null;
  legal_rep_name: string;
  legal_rep_cin: string;
  legal_rep_phone: string;
  business_address: string;
  region_id: string | null;
  region_name: string | null;
  cin_front_url: string | null;
  cin_back_url: string | null;
  rc_document_url: string | null;
  patente_document_url: string | null;
  ice_document_url: string | null;
  rejection_reason: string | null;
  review_notes: string | null;
};

export type AdminKycStats = {
  total: number;
  pending: number;
  approved_this_month: number;
  rejected: number;
};

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) return false;
  return (data as any).role === 'admin';
}

export async function fetchAllKycSubmissions(
  filter: 'all' | AdminKycStatus = 'all'
): Promise<AdminKycRow[]> {
  let query = supabase
    .from('pro_kyc_submissions')
    .select(`
      id, user_id, business_name, business_type, business_city, ice_number,
      status, submitted_at, reviewed_at,
      profiles!user_id (email, name)
    `)
    .order('submitted_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    user_email: row.profiles?.email ?? null,
    user_name: row.profiles?.name ?? null,
    business_name: row.business_name,
    business_type: row.business_type,
    business_city: row.business_city,
    ice_number: row.ice_number,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
  }));
}

export async function fetchKycDetail(id: string): Promise<AdminKycDetail | null> {
  const { data, error } = await supabase
    .from('pro_kyc_submissions')
    .select(`
      *,
      profiles!user_id (email, name),
      regions!region_id (name_fr)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[adminKyc] fetchKycDetail error:', error);
    return null;
  }

  const row = data as any;

  return {
    id: row.id,
    user_id: row.user_id,
    user_email: row.profiles?.email ?? null,
    user_name: row.profiles?.name ?? null,
    business_name: row.business_name,
    business_type: row.business_type,
    business_city: row.business_city,
    ice_number: row.ice_number,
    rc_number: row.rc_number,
    patente_number: row.patente_number,
    cnss_number: row.cnss_number,
    legal_rep_name: row.legal_rep_name,
    legal_rep_cin: row.legal_rep_cin,
    legal_rep_phone: row.legal_rep_phone,
    business_address: row.business_address,
    region_id: row.region_id,
    region_name: row.regions?.name_fr ?? null,
    cin_front_url: row.cin_front_url,
    cin_back_url: row.cin_back_url,
    rc_document_url: row.rc_document_url,
    patente_document_url: row.patente_document_url,
    ice_document_url: row.ice_document_url,
    status: row.status,
    rejection_reason: row.rejection_reason,
    review_notes: row.review_notes,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
  };
}

export async function fetchKycStats(): Promise<AdminKycStats> {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const [totalRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
    supabase.from('pro_kyc_submissions').select('*', { count: 'exact', head: true }),
    supabase
      .from('pro_kyc_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('pro_kyc_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('approved_at', startOfMonth),
    supabase
      .from('pro_kyc_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
  ]);

  return {
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    approved_this_month: approvedRes.count ?? 0,
    rejected: rejectedRes.count ?? 0,
  };
}

export async function approveKyc(id: string, reviewNotes?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('pro_kyc_submissions')
    .update({
      status: 'approved',
      reviewer_id: user?.id ?? null,
      review_notes: reviewNotes ?? null,
    } as any)
    .eq('id', id);

  if (error) throw error;
}

export async function rejectKyc(
  id: string,
  rejectionReason: string,
  reviewNotes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('pro_kyc_submissions')
    .update({
      status: 'rejected',
      reviewer_id: user?.id ?? null,
      rejection_reason: rejectionReason,
      review_notes: reviewNotes ?? null,
    } as any)
    .eq('id', id);

  if (error) throw error;
}

export async function getSignedDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, 3600);

  if (error || !data) {
    console.error('[adminKyc] signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}
