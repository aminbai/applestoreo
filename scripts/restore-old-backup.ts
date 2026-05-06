import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually
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

console.log('🔗 Supabase URL:', supabaseUrl.substring(0, 30) + '...');
console.log('🔑 Key loaded:', supabaseKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseKey);

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    products?: any[];
    categories?: any[];
    customers?: any[];
    sales?: any[];
    sale_items?: any[];
    suppliers?: any[];
    invoices?: any[];
    returns?: any[];
  };
}

async function restoreNewSalesData() {
  try {
    // Read backup file
    const backupPath = path.join(process.cwd(), 'stockpro-backup-2026-04-28.json');
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    const backup: BackupData = JSON.parse(backupContent);

    console.log('📦 Backup loaded:', {
      version: backup.version,
      timestamp: backup.timestamp,
      tables: Object.keys(backup.data)
    });

    // Get existing sales IDs to avoid duplicates
    const { data: existingSales, error: salesError } = await supabase
      .from('sales')
      .select('id');

    if (salesError) throw salesError;

    const existingSaleIds = new Set(existingSales?.map((s: any) => s.id) || []);
    console.log('✅ Found', existingSaleIds.size, 'existing sales');

    // Filter new sales
    const newSales = (backup.data.sales || []).filter(
      (sale: any) => !existingSaleIds.has(sale.id)
    );

    console.log('➕ New sales to add:', newSales.length);

    if (newSales.length === 0) {
      console.log('✨ No new sales to add');
      return;
    }

    // Prepare sales data (remove extra fields)
    const salesToInsert = newSales.map((sale: any) => ({
      id: sale.id,
      user_id: sale.user_id,
      customer_id: sale.customer_id,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      status: sale.status,
      notes: sale.notes,
      instant_customer_name: sale.instant_customer_name,
      instant_customer_phone: sale.instant_customer_phone,
      paid_amount: sale.paid_amount,
      due_amount: sale.due_amount,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
    }));

    // Insert sales in batches
    const batchSize = 50;
    for (let i = 0; i < salesToInsert.length; i += batchSize) {
      const batch = salesToInsert.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('sales')
          .insert(batch);

        if (error) {
          console.error('❌ Error inserting sales batch:', error.message);
          // Try one by one if batch fails
          console.log('📝 Retrying individually...');
          for (const sale of batch) {
            const { error: singleError } = await supabase
              .from('sales')
              .insert([sale]);
            if (singleError) {
              console.log(`  ⚠️  Skipped sale ${sale.id}: ${singleError.message}`);
            } else {
              console.log(`  ✅ Added sale ${sale.id}`);
            }
          }
        } else {
          console.log(`✅ Inserted ${Math.min(batchSize, salesToInsert.length - i)} sales`);
        }
      } catch (err: any) {
        console.error('❌ Exception:', err.message);
        throw err;
      }
    }

    // Get existing sale items IDs
    const { data: existingSaleItems, error: saleItemsError } = await supabase
      .from('sale_items')
      .select('id');

    if (saleItemsError) throw saleItemsError;

    const existingSaleItemIds = new Set(existingSaleItems?.map((si: any) => si.id) || []);
    console.log('✅ Found', existingSaleItemIds.size, 'existing sale items');

    // Filter new sale items
    const newSaleItems = (backup.data.sale_items || []).filter(
      (item: any) => !existingSaleItemIds.has(item.id)
    );

    console.log('➕ New sale items to add:', newSaleItems.length);

    if (newSaleItems.length > 0) {
      // Prepare sale items
      const saleItemsToInsert = newSaleItems.map((item: any) => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        created_at: item.created_at,
        condition: item.condition,
      }));

      // Insert sale items
      for (let i = 0; i < saleItemsToInsert.length; i += batchSize) {
        const batch = saleItemsToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('sale_items')
          .insert(batch);

        if (error) {
          console.error('❌ Error inserting sale items batch:', error);
          throw error;
        }
        console.log(`✅ Inserted ${Math.min(batchSize, saleItemsToInsert.length - i)} sale items`);
      }
    }

    // Restore customers if needed
    const { data: existingCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id');

    if (customersError) throw customersError;

    const existingCustomerIds = new Set(existingCustomers?.map((c: any) => c.id) || []);
    const newCustomers = (backup.data.customers || []).filter(
      (cust: any) => !existingCustomerIds.has(cust.id)
    );

    if (newCustomers.length > 0) {
      console.log('➕ New customers to add:', newCustomers.length);

      const customersToInsert = newCustomers.map((cust: any) => ({
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        address: cust.address,
        city: cust.city,
        total_purchases: cust.total_purchases || 0,
        created_at: cust.created_at,
        updated_at: cust.updated_at,
      }));

      for (let i = 0; i < customersToInsert.length; i += batchSize) {
        const batch = customersToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('customers')
          .insert(batch);

        if (error) {
          console.error('❌ Error inserting customers batch:', error);
          throw error;
        }
        console.log(`✅ Inserted ${Math.min(batchSize, customersToInsert.length - i)} customers`);
      }
    }

    console.log('🎉 Restoration completed successfully!');
    console.log('✅ Total new sales:', newSales.length);
    console.log('✅ Total new sale items:', newSaleItems.length);
    console.log('✅ Total new customers:', newCustomers.length);

  } catch (error) {
    console.error('❌ Restoration failed:', error);
    process.exit(1);
  }
}

restoreNewSalesData();
