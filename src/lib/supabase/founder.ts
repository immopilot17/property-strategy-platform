import { createAdminClient } from './admin';

/**
 * Grants founder status to a user by email
 * This is an admin-only function that should be called from secure backend contexts
 */
export async function grantFounderStatus(email: string, name: string) {
  const admin = createAdminClient();
  
  const { data, error } = await admin.rpc('grant_founder_status', {
    founder_email: email,
    founder_name: name,
  });
  
  if (error) {
    console.error('Failed to grant founder status:', error);
    throw new Error(`Failed to grant founder status: ${error.message}`);
  }
  
  return data;
}

/**
 * Check if a user is a founder
 */
export async function isFounder(userId: string, client = createAdminClient()) {
  const { data, error } = await client.rpc('is_founder', { user_id: userId });
  
  if (error) {
    console.error('Failed to check founder status:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Get the user tier (includes founder check)
 */
export async function getUserTier(userId: string, client = createAdminClient()) {
  const { data, error } = await client.rpc('get_user_tier', { user_id: userId });
  
  if (error) {
    console.error('Failed to get user tier:', error);
    return 'free';
  }
  
  return data as 'free' | 'starter' | 'plus' | 'pro' | 'premium' | 'founder';
}

/**
 * Check if user has sufficient analysis credits (founders always have unlimited)
 */
export async function hasAnalysisCredits(
  userId: string,
  requiredCredits = 1,
  client = createAdminClient()
) {
  const { data, error } = await client.rpc('has_analysis_credits', {
    user_id: userId,
    required_credits: requiredCredits,
  });
  
  if (error) {
    console.error('Failed to check credits:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Get founder benefits for a founder
 */
export async function getFounderBenefits(userId: string, client = createAdminClient()) {
  const { data, error } = await client
    .from('founder_benefits')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

/**
 * List all founders (admin only)
 */
export async function listFounders(client = createAdminClient()) {
  const { data, error } = await client
    .from('founder_users')
    .select('*')
    .order('verified_at', { ascending: false });
  
  if (error) {
    console.error('Failed to list founders:', error);
    return [];
  }
  
  return data;
}

/**
 * Remove founder status (admin only)
 */
export async function removeFounderStatus(userId: string, client = createAdminClient()) {
  const { error } = await client.rpc('revoke_founder_status', {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to remove founder status: ${error.message}`);
  }
}
