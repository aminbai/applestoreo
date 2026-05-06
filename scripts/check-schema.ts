#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || '';
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('📋 Checking database schema...\n');

    // Get a sample row to see columns
    const { data: customerSample } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customerSample && customerSample.length > 0) {
      console.log('👥 Customers table columns:');
      console.log(Object.keys(customerSample[0]));
    }

    const { data: salesSample } = await supabase
      .from('sales')
      .select('*')
      .limit(1);

    if (salesSample && salesSample.length > 0) {
      console.log('\n📦 Sales table columns:');
      console.log(Object.keys(salesSample[0]));
    }

    const { data: saleItemsSample } = await supabase
      .from('sale_items')
      .select('*')
      .limit(1);

    if (saleItemsSample && saleItemsSample.length > 0) {
      console.log('\n🛒 Sale Items table columns:');
      console.log(Object.keys(saleItemsSample[0]));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
