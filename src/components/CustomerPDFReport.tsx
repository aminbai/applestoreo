import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface CustomerPDFReportProps {
  customer: any;
  dueMap: any;
  allSales: any[];
}

export function CustomerPDFReport({ customer, dueMap, allSales }: CustomerPDFReportProps) {
  const handleDownloadPDF = () => {
    const customerSales = allSales?.filter(s => s.customer_id === customer.id) || [];
    const dueInfo = dueMap[customer.id];
    const totalDue = dueInfo?.totalDue || 0;
    const totalPurchases = dueInfo?.totalPurchases || 0;
    const salesCount = dueInfo?.salesCount || 0;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>কাস্টমার রিপোর্ট - ${customer.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #333; font-size: 12px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; margin-bottom: 4px; }
    .header p { font-size: 11px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; padding: 10px; background: #f9f9f9; border-radius: 6px; }
    .info-grid p { font-size: 11px; }
    .info-grid strong { color: #111; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .summary-card { padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
    .summary-card .label { font-size: 10px; color: #666; }
    .summary-card .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
    .summary-card.due .value { color: #dc2626; }
    .summary-card.purchases .value { color: #2563eb; }
    .summary-card.count .value { color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th { background: #333; color: white; padding: 6px 8px; text-align: left; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    .section-title { font-size: 14px; font-weight: bold; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    .due-badge { color: #dc2626; font-weight: bold; }
    .paid-badge { color: #059669; font-weight: bold; }
    .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 কাস্টমার রিপোর্ট</h1>
    <p>তারিখ: ${format(new Date(), 'dd MMMM yyyy', { locale: bn })}</p>
  </div>

  <div class="info-grid">
    <p><strong>নাম:</strong> ${customer.name}</p>
    <p><strong>ফোন:</strong> ${customer.phone || 'N/A'}</p>
    <p><strong>ইমেইল:</strong> ${customer.email || 'N/A'}</p>
    <p><strong>ঠিকানা:</strong> ${customer.address || 'N/A'}</p>
  </div>

  <div class="summary">
    <div class="summary-card count">
      <div class="label">মোট ক্রয়</div>
      <div class="value">${salesCount} বার</div>
    </div>
    <div class="summary-card purchases">
      <div class="label">মোট পরিমাণ</div>
      <div class="value">৳${totalPurchases.toLocaleString('bn-BD')}</div>
    </div>
    <div class="summary-card due">
      <div class="label">মোট বাকি</div>
      <div class="value">৳${totalDue.toLocaleString('bn-BD')}</div>
    </div>
  </div>

  ${dueInfo?.dueSales?.length > 0 ? `
  <div class="section-title">📌 বাকি থাকা বিক্রয়সমূহ</div>
  <table>
    <thead>
      <tr>
        <th>তারিখ</th>
        <th>মোট</th>
        <th>পরিশোধিত</th>
        <th>বাকি</th>
        <th>পেমেন্ট</th>
      </tr>
    </thead>
    <tbody>
      ${dueInfo.dueSales.map((sale: any) => `
      <tr>
        <td>${format(new Date(sale.created_at), 'dd MMM yyyy', { locale: bn })}</td>
        <td>৳${Number(sale.total_amount).toLocaleString('bn-BD')}</td>
        <td>৳${Number(sale.paid_amount).toLocaleString('bn-BD')}</td>
        <td class="due-badge">৳${Number(sale.due_amount).toLocaleString('bn-BD')}</td>
        <td>${sale.payment_method === 'cash' ? 'নগদ' : sale.payment_method === 'card' ? 'কার্ড' : 'মোবাইল'}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="section-title">🧾 সকল ক্রয়ের ইতিহাস</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>তারিখ</th>
        <th>মোট</th>
        <th>বাকি</th>
        <th>স্ট্যাটাস</th>
      </tr>
    </thead>
    <tbody>
      ${customerSales.map((sale: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${format(new Date(sale.created_at), 'dd MMM yyyy', { locale: bn })}</td>
        <td>৳${Number(sale.total_amount).toLocaleString('bn-BD')}</td>
        <td>${Number(sale.due_amount) > 0 ? `<span class="due-badge">৳${Number(sale.due_amount).toLocaleString('bn-BD')}</span>` : '<span class="paid-badge">সম্পূর্ণ</span>'}</td>
        <td>${Number(sale.due_amount) > 0 ? 'বাকি আছে' : 'পরিশোধিত'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${customerSales.length === 0 ? '<p style="text-align:center;padding:20px;color:#999;">কোনো ক্রয়ের ইতিহাস নেই</p>' : ''}

  <div class="footer">
    <p>স্বয়ংক্রিয়ভাবে তৈরি রিপোর্ট • ${format(new Date(), 'dd MMMM yyyy, hh:mm a', { locale: bn })}</p>
  </div>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleDownloadPDF}>
      <FileDown className="w-3 h-3 mr-1" /> PDF
    </Button>
  );
}
