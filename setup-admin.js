import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hvdjroxjssccfjhtpvjv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CU8F4810Gt4UCZ9CHAZ6aA_VI1Uf4ke';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || '';

// You'll need to get the SERVICE_ROLE_KEY from Supabase Settings
if (!SERVICE_ROLE_KEY) {
  console.error('❌ SERVICE_ROLE_KEY environment variable is not set!');
  console.log('\n📋 To get SERVICE_ROLE_KEY:');
  console.log('1. Go to: https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy the "service_role" key');
  console.log('\n Then run: SERVICE_ROLE_KEY="your_key_here" node setup-admin.js');
  process.exit(1);
}

async function createAdminUser() {
  try {
    // Use service role key to create user
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('🔄 Creating admin user...');
    
    // Create auth user
    const { data: { user }, error: signUpError } = await admin.auth.admin.createUser({
      email: 'admin@applestore.com',
      password: 'A#112233@s',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (signUpError) {
      console.error('❌ Error creating auth user:', signUpError);
      process.exit(1);
    }

    console.log('✅ Auth user created:', user?.id);

    // Add to users table with admin role
    const { data, error: dbError } = await admin
      .from('users')
      .insert({
        id: user?.id,
        email: 'admin@applestore.com',
        full_name: 'Admin User',
        role: 'admin'
      });

    if (dbError) {
      console.error('❌ Error adding to users table:', dbError);
      process.exit(1);
    }

    console.log('✅ Admin user added to database');
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Login Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@applestore.com');
    console.log('Password: A#112233@s');
    console.log('Role:     Admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdminUser();
