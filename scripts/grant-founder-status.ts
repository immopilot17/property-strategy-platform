#!/usr/bin/env node

/**
 * Script to grant founder status to a user
 * Usage: npx ts-node scripts/grant-founder-status.ts <email> <name>
 * 
 * Example:
 * npx ts-node scripts/grant-founder-status.ts "founder@example.com" "Founder Name"
 */

import { createAdminClient } from '../src/lib/supabase/admin';

async function grantFounderStatus(email: string, name: string) {
  if (!email || !name) {
    console.error('❌ Usage: npx ts-node scripts/grant-founder-status.ts <email> <name>');
    console.error('Example: npx ts-node scripts/grant-founder-status.ts "founder@example.com" "John Doe"');
    process.exit(1);
  }

  try {
    console.log(`🔄 Granting founder status to ${email}...`);

    const admin = createAdminClient();
    const result = await admin.rpc('grant_founder_status', {
      founder_email: email,
      founder_name: name,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log(`✅ Successfully granted founder status to ${email}`);
    console.log(`👑 Benefits:`);
    console.log(`   - Unbegrenzte Analysen`);
    console.log(`   - Alle Features kostenlos`);
    console.log(`   - Prioritärer Support`);
    console.log(`   - Beta-Features`);

  } catch (error) {
    console.error('❌ Error granting founder status:', error);
    process.exit(1);
  }
}

const [email, name] = process.argv.slice(2);
grantFounderStatus(email, name);
