import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface BackupFile {
  version: string;
  timestamp: string;
  data: {
    sales?: any[];
    sale_items?: any[];
    customers?: any[];
    [key: string]: any;
  };
}

export function BackupImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [stats, setStats] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".json")) {
      toast.error("শুধুমাত্র JSON ফাইল আপলোড করুন");
      return;
    }

    setFile(selectedFile);
    setStats(null);
    setProgress("");
  };

  const analyzeBackup = async () => {
    if (!file) return;

    try {
      const content = await file.text();
      const backup: BackupFile = JSON.parse(content);

      const analysisResults = {
        version: backup.version,
        timestamp: backup.timestamp,
        tables: Object.keys(backup.data),
        counts: Object.entries(backup.data).reduce((acc: any, [key, value]: [string, any]) => {
          acc[key] = Array.isArray(value) ? value.length : 0;
          return acc;
        }, {}),
      };

      setStats(analysisResults);
      setProgress(`📊 বিশ্লেষণ সম্পন্ন`);
    } catch (error) {
      toast.error("ফাইল পড়তে ব্যর্থ");
      console.error(error);
    }
  };

  const importBackupData = async () => {
    if (!file || !stats) return;

    setImporting(true);
    setProgress("🔄 শুরু করছি...");

    try {
      const content = await file.text();
      const backup: BackupFile = JSON.parse(content);

      let importedCount = {
        sales: 0,
        sale_items: 0,
        customers: 0,
        total: 0,
      };

      // Import customers (if not already exist)
      if (backup.data.customers && backup.data.customers.length > 0) {
        setProgress("👥 কাস্টমার আমদানি করছি...");

        const { data: existing } = await supabase
          .from("customers")
          .select("id");

        const existingIds = new Set(existing?.map((c: any) => c.id) || []);
        const newCustomers = backup.data.customers.filter(
          (c: any) => !existingIds.has(c.id)
        );

        if (newCustomers.length > 0) {
          const customersToInsert = newCustomers.map((c: any) => ({
            id: c.id,
            name: c.name || "Unknown",
            phone: c.phone,
            email: c.email,
            address: c.address,
            city: c.city,
            total_purchases: c.total_purchases || 0,
            created_at: c.created_at,
            updated_at: c.updated_at,
          }));

          for (const batch of chunkArray(customersToInsert, 50)) {
            const { error } = await supabase
              .from("customers")
              .insert(batch);

            if (!error) {
              importedCount.customers += batch.length;
            }
          }
        }
      }

      // Import sales
      if (backup.data.sales && backup.data.sales.length > 0) {
        setProgress("📦 সেলস আমদানি করছি...");

        const { data: existing } = await supabase
          .from("sales")
          .select("id");

        const existingIds = new Set(existing?.map((s: any) => s.id) || []);
        const newSales = backup.data.sales.filter(
          (s: any) => !existingIds.has(s.id)
        );

        if (newSales.length > 0) {
          const salesToInsert = newSales.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            customer_id: s.customer_id,
            total_amount: s.total_amount || 0,
            payment_method: s.payment_method || "cash",
            status: s.status || "completed",
            notes: s.notes,
            instant_customer_name: s.instant_customer_name,
            instant_customer_phone: s.instant_customer_phone,
            paid_amount: s.paid_amount || s.total_amount || 0,
            due_amount: s.due_amount || 0,
            created_at: s.created_at,
            updated_at: s.updated_at,
          }));

          for (const batch of chunkArray(salesToInsert, 50)) {
            const { error } = await supabase
              .from("sales")
              .insert(batch);

            if (!error) {
              importedCount.sales += batch.length;
            } else {
              console.error("Sales import error:", error);
            }
          }
        }
      }

      // Import sale items
      if (backup.data.sale_items && backup.data.sale_items.length > 0) {
        setProgress("🛒 সেলস আইটেম আমদানি করছি...");

        const { data: existing } = await supabase
          .from("sale_items")
          .select("id");

        const existingIds = new Set(existing?.map((si: any) => si.id) || []);
        const newItems = backup.data.sale_items.filter(
          (si: any) => !existingIds.has(si.id)
        );

        if (newItems.length > 0) {
          const itemsToInsert = newItems.map((si: any) => ({
            id: si.id,
            sale_id: si.sale_id,
            product_id: si.product_id,
            quantity: si.quantity || 1,
            unit_price: si.unit_price || 0,
            total_price: si.total_price || 0,
            created_at: si.created_at,
            condition: si.condition,
          }));

          for (const batch of chunkArray(itemsToInsert, 50)) {
            const { error } = await supabase
              .from("sale_items")
              .insert(batch);

            if (!error) {
              importedCount.sale_items += batch.length;
            } else {
              console.error("Sale items import error:", error);
            }
          }
        }
      }

      importedCount.total =
        importedCount.sales +
        importedCount.sale_items +
        importedCount.customers;

      setProgress(
        `✅ সফল! যোগ করা হয়েছে: ${importedCount.sales} সেলস, ${importedCount.sale_items} আইটেম, ${importedCount.customers} কাস্টমার`
      );

      toast.success(
        `আমদানি সম্পন্ন! মোট ${importedCount.total} রেকর্ড যোগ হয়েছে`
      );

      setFile(null);
      setStats(null);
    } catch (error: any) {
      setProgress(`❌ ত্রুটি: ${error.message}`);
      toast.error(`আমদানি ব্যর্থ: ${error.message}`);
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">📂 ব্যাকআপ ফাইল আমদানি</h3>
          <p className="text-sm text-muted-foreground">
            পুরাতন ব্যাকআপ ফাইল থেকে সেলস এবং কাস্টমার ডাটা আমদানি করুন
          </p>
        </div>

        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={importing}
            className="hidden"
            id="backup-file"
          />
          <label
            htmlFor="backup-file"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8 text-blue-500" />
            <span className="text-sm font-medium">
              {file ? file.name : "ফাইল নির্বাচন করুন"}
            </span>
            <span className="text-xs text-muted-foreground">
              বা এখানে ড্র্যাগ করুন
            </span>
          </label>
        </div>

        {stats && (
          <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-medium">ফাইল বিশ্লেষণ:</span>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p>ভার্শন: {stats.version}</p>
              <p>সময়: {new Date(stats.timestamp).toLocaleString("bn-BD")}</p>
              <p>টেবিল: {stats.tables.join(", ")}</p>
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <p className="font-mono">
                  সেলস: {stats.counts.sales || 0} | আইটেম:{" "}
                  {stats.counts.sale_items || 0} | কাস্টমার:{" "}
                  {stats.counts.customers || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {progress && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-900">{progress}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={analyzeBackup}
            disabled={!file || importing}
            variant="outline"
            className="flex-1"
          >
            📊 বিশ্লেষণ করুন
          </Button>
          <Button
            onClick={importBackupData}
            disabled={!stats || importing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {importing ? "আমদানি করছি..." : "✅ আমদানি করুন"}
          </Button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium mb-1">⚠️ গুরুত্বপূর্ণ:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>শুধুমাত্র নতুন ডাটা যোগ হবে, ডুপ্লিকেট এড়ানো হবে</li>
              <li>পুরাতন সেলস এবং কাস্টমার রক্ষা থাকবে</li>
              <li>প্রোডাক্ট ডাটা আগেই মার্জ করা হয়েছে</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
