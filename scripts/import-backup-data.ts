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
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    sales?: any[];
    sale_items?: any[];
    customers?: any[];
    [key: string]: any;
  };
}

async function importSalesData() {
  try {
    console.log('📦 Loading backup file...');
    const backupPath = path.join(process.cwd(), 'stockpro-backup-2026-04-28.json');
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    const backup: BackupData = JSON.parse(backupContent);

    console.log('✅ Backup loaded');
    console.log(`📊 Version: ${backup.version}`);
    console.log(`⏰ Timestamp: ${backup.timestamp}`);
    console.log(`📈 Total sales in backup: ${backup.data.sales?.length || 0}`);
    console.log(`🛒 Total sale items in backup: ${backup.data.sale_items?.length || 0}`);
    console.log(`👥 Total customers in backup: ${backup.data.customers?.length || 0}`);

    // 1. Import Customers (only necessary fields)
    if (backup.data.customers && backup.data.customers.length > 0) {
      console.log('\n👥 Processing customers...');
      
      const customersToInsert = backup.data.customers.map((c: any) => ({
        id: c.id,
        name: c.name || 'Unknown',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        total_purchases: c.total_purchases || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      // Check for existing customers
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id');
      
      const existingIds = new Set(existingCustomers?.map((c: any) => c.id) || []);
      const newCustomers = customersToInsert.filter((c: any) => !existingIds.has(c.id));

      if (newCustomers.length > 0) {
        console.log(`  📊 ${newCustomers.length} new customers to insert`);
        
        let successCount = 0;
        for (const customer of newCustomers) {
          const { error } = await supabase
            .from('customers')
            .insert([customer]);

          if (error) {
            console.log(`    ⚠️ ${customer.name}: ${error.message}`);
          } else {
            successCount++;
          }
        }
        console.log(`  ✅ Inserted ${successCount} customers`);
      } else {
        console.log('  ℹ️ All customers already exist');
      }
    }

    // 2. Import Sales (only standard fields)
    if (backup.data.sales && backup.data.sales.length > 0) {
      console.log('\n📦 Processing sales...');
      
      const salesToInsert = backup.data.sales.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        customer_id: s.customer_id || null,
        total_amount: typeof s.total_amount === 'string' ? parseFloat(s.total_amount) : s.total_amount || 0,
        payment_method: s.payment_method || 'cash',
        status: s.status || 'completed',
        notes: s.notes || null,
        instant_customer_name: s.instant_customer_name || null,
        instant_customer_phone: s.instant_customer_phone || null,
        paid_amount: typeof s.paid_amount === 'string' ? parseFloat(s.paid_amount) : s.paid_amount || 0,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

      // Check for existing sales
      const { data: existingSales } = await supabase
        .from('sales')
        .select('id');
      
      const existingSalesIds = new Set(existingSales?.map((s: any) => s.id) || []);
      const newSales = salesToInsert.filter((s: any) => !existingSalesIds.has(s.id));

      if (newSales.length > 0) {
        console.log(`  📊 ${newSales.length} new sales to insert`);
        
        let successCount = 0;
        for (const sale of newSales) {
          const { error } = await supabase
            .from('sales')
            .insert([sale]);

          if (error) {
            console.log(`    ⚠️ Sale (${sale.id}): ${error.message}`);
          } else {
            successCount++;
          }
        }
        console.log(`  ✅ Inserted ${successCount} sales records`);
      } else {
        console.log('  ℹ️ All sales already exist');
      }
    }

    // 3. Import Sale Items
    if (backup.data.sale_items && backup.data.sale_items.length > 0) {
      console.log('\n🛒 Processing sale items...');
      
      const saleItemsToInsert = backup.data.sale_items.map((si: any) => ({
        id: si.id,
        sale_id: si.sale_id,
        product_id: si.product_id,
        quantity: typeof si.quantity === 'string' ? parseInt(si.quantity) : si.quantity || 1,
        unit_price: typeof si.unit_price === 'string' ? parseFloat(si.unit_price) : si.unit_price || 0,
        total_price: typeof si.total_price === 'string' ? parseFloat(si.total_price) : si.total_price || 0,
        created_at: si.created_at,
        condition: si.condition || 'new',
      }));

      // Check for existing sale items
      const { data: existingItems } = await supabase
        .from('sale_items')
        .select('id');
      
      const existingItemIds = new Set(existingItems?.map((si: any) => si.id) || []);
      const newItems = saleItemsToInsert.filter((si: any) => !existingItemIds.has(si.id));

      if (newItems.length > 0) {
        console.log(`  📊 ${newItems.length} new sale items to insert`);
        
        let successCount = 0;
        for (const item of newItems) {
          const { error } = await supabase
            .from('sale_items')
            .insert([item]);

          if (error) {
            console.log(`    ⚠️ Item (${item.id}): ${error.message}`);
          } else {
            successCount++;
          }
        }
        console.log(`  ✅ Inserted ${successCount} sale items`);
      } else {
        console.log('  ℹ️ All sale items already exist');
      }
    }

    // Get final stats
    console.log('\n📊 Final Database Statistics:');
    
    const { count: totalSales } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalSaleItems } = await supabase
      .from('sale_items')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    console.log(`  📦 Total Sales: ${totalSales}`);
    console.log(`  🛒 Total Sale Items: ${totalSaleItems}`);
    console.log(`  👥 Total Customers: ${totalCustomers}`);

    console.log('\n✨ Import completed!');
    console.log('📍 Data is now visible in:');
    console.log('   - Reports page (সেলস রিপোর্ট)');
    console.log('   - Settings page (ডাটাবেস স্ট্যাটিস্টিক্স)');
    console.log('   - Dashboard (সেলস এনালিটিক্স)');

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importSalesData();
