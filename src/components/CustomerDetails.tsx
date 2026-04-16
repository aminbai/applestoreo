import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { Users, Wallet, TrendingUp, AlertTriangle, Phone, Mail, MapPin, FileText } from "lucide-react";
import { DueCollection } from "./DueCollection";
import { CustomerPDFReport } from "./CustomerPDFReport";

export function CustomerDetails() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch all customers
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all sales (for selected customer)
  const { data: customerSales } = useQuery({
    queryKey: ["customer-sales", selectedCustomerId],
    enabled: !!selectedCustomerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*, products(name, sku, imei, brand, model, condition, cost))")
        .eq("customer_id", selectedCustomerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch due payments for this customer's sales
  const { data: duePayments } = useQuery({
    queryKey: ["customer-due-payments", selectedCustomerId],
    enabled: !!selectedCustomerId,
    queryFn: async () => {
      if (!customerSales?.length) return [];
      const saleIds = customerSales.map(s => s.id);
      const { data, error } = await supabase
        .from("due_payments")
        .select("*")
        .in("sale_id", saleIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selectedCustomer = useMemo(() => {
    return customers?.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Calculate summary
  const summary = useMemo(() => {
    if (!customerSales) return { totalPurchases: 0, totalPaid: 0, totalDue: 0, salesCount: 0, totalProfit: 0 };
    
    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalProfit = 0;

    customerSales.forEach(sale => {
      totalPurchases += Number(sale.total_amount);
      totalPaid += Number(sale.paid_amount);
      totalDue += Number(sale.due_amount);
      
      sale.sale_items?.forEach((item: any) => {
        const cost = Number(item.products?.cost || 0);
        const revenue = Number(item.total_price);
        totalProfit += revenue - (cost * item.quantity);
      });
    });

    return { totalPurchases, totalPaid, totalDue, salesCount: customerSales.length, totalProfit };
  }, [customerSales]);

  const dueSales = useMemo(() => {
    return customerSales?.filter(s => Number(s.due_amount) > 0) || [];
  }, [customerSales]);

  const paidSales = useMemo(() => {
    return customerSales?.filter(s => Number(s.due_amount) <= 0) || [];
  }, [customerSales]);

  // Build dueMap for PDF report
  const dueMap = useMemo(() => {
    if (!selectedCustomer || !customerSales) return {};
    return {
      [selectedCustomer.id]: {
        totalDue: summary.totalDue,
        totalPurchases: summary.totalPurchases,
        salesCount: summary.salesCount,
        dueSales: dueSales,
      }
    };
  }, [selectedCustomer, customerSales, summary, dueSales]);

  return (
    <div className="space-y-4 lg:space-y-6 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              কাস্টমার ডিটেইলস
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1">কাস্টমার নির্বাচন করে সম্পূর্ণ লেনদেন ও বাকি হিসাব দেখুন</p>
          </div>
          {selectedCustomer && (
            <CustomerPDFReport 
              customer={selectedCustomer} 
              dueMap={dueMap} 
              allSales={customerSales || []} 
            />
          )}
        </div>

        {/* Customer Selector */}
        <div className="mt-4">
          <Select value={selectedCustomerId} onValueChange={(val) => {
            setSelectedCustomerId(val);
            queryClient.invalidateQueries({ queryKey: ["customer-sales", val] });
          }}>
            <SelectTrigger className="h-11 text-base">
              <SelectValue placeholder="🔍 কাস্টমার নির্বাচন করুন..." />
            </SelectTrigger>
            <SelectContent>
              {customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{customer.name}</span>
                    {customer.phone && <span className="text-muted-foreground text-xs">({customer.phone})</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No customer selected */}
      {!selectedCustomerId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">কাস্টমার নির্বাচন করুন</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">উপরের ড্রপডাউন থেকে একজন কাস্টমার নির্বাচন করলে তার সম্পূর্ণ তথ্য দেখতে পাবেন</p>
        </div>
      )}

      {/* Customer Info + Summary */}
      {selectedCustomer && (
        <>
          {/* Customer Info Card */}
          <Card className="border-primary/20">
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-bold text-foreground">{selectedCustomer.name}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}</span>
                    )}
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}</span>
                    )}
                    {selectedCustomer.address && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedCustomer.address}</span>
                    )}
                  </div>
                  {selectedCustomer.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">{selectedCustomer.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">মোট লেনদেন</span>
                </div>
                <p className="text-lg font-bold text-foreground">৳{summary.totalPurchases.toLocaleString('bn-BD')}</p>
                <p className="text-xs text-muted-foreground">{summary.salesCount.toLocaleString('bn-BD')} টি বিক্রয়</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">মোট পরিশোধ</span>
                </div>
                <p className="text-lg font-bold text-green-600">৳{summary.totalPaid.toLocaleString('bn-BD')}</p>
              </CardContent>
            </Card>
            <Card className={summary.totalDue > 0 ? "border-destructive/30" : ""}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">মোট বাকি</span>
                </div>
                <p className={`text-lg font-bold ${summary.totalDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ৳{summary.totalDue.toLocaleString('bn-BD')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">মোট লাভ</span>
                </div>
                <p className="text-lg font-bold text-accent">৳{summary.totalProfit.toLocaleString('bn-BD')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">বাকি বিক্রয়</span>
                </div>
                <p className="text-lg font-bold text-foreground">{dueSales.length.toLocaleString('bn-BD')} টি</p>
              </CardContent>
            </Card>
          </div>

          {/* Due Sales Section - Collection */}
          {dueSales.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                বাকি বিক্রয় ও আদায় ({dueSales.length.toLocaleString('bn-BD')} টি)
              </h3>
              <div className="space-y-3">
                {dueSales.map(sale => (
                  <Card key={sale.id} className="border-destructive/20">
                    <CardContent className="pt-4 pb-4 space-y-3">
                      {/* Sale Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            বিক্রয় #{sale.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sale.created_at), 'dd MMMM yyyy, hh:mm a', { locale: bn })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            মোট: ৳{Number(sale.total_amount).toLocaleString('bn-BD')}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            পরিশোধ: ৳{Number(sale.paid_amount).toLocaleString('bn-BD')}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            বাকি: ৳{Number(sale.due_amount).toLocaleString('bn-BD')}
                          </Badge>
                        </div>
                      </div>

                      {/* Products in this sale */}
                      {sale.sale_items && sale.sale_items.length > 0 && (
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">পণ্যসমূহ:</p>
                          {sale.sale_items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs py-0.5">
                              <span className="text-foreground">
                                {item.products?.name || 'পণ্য'} 
                                {item.products?.imei && <span className="text-muted-foreground ml-1">(IMEI: {item.products.imei})</span>}
                                <span className="text-muted-foreground"> x{item.quantity}</span>
                              </span>
                              <span className="font-medium">৳{Number(item.total_price).toLocaleString('bn-BD')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {/* Due Collection */}
                      <DueCollection saleId={sale.id} currentDue={Number(sale.due_amount)} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          {duePayments && duePayments.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                বাকি আদায়ের ইতিহাস ({duePayments.length.toLocaleString('bn-BD')} টি)
              </h3>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {duePayments.map(payment => {
                      const relatedSale = customerSales?.find(s => s.id === payment.sale_id);
                      return (
                        <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 border-b border-border last:border-0 gap-1">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              ৳{Number(payment.amount).toLocaleString('bn-BD')}
                              <span className="text-xs text-muted-foreground ml-2">
                                ({payment.payment_method === 'cash' ? 'নগদ' : payment.payment_method === 'card' ? 'কার্ড' : 'মোবাইল'})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              বিক্রয় #{payment.sale_id.slice(0, 8)} 
                              {relatedSale && ` • মোট: ৳${Number(relatedSale.total_amount).toLocaleString('bn-BD')}`}
                            </p>
                            {payment.notes && <p className="text-xs text-muted-foreground/70 italic mt-0.5">{payment.notes}</p>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a', { locale: bn })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* All Sales History */}
          <div>
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              সম্পূর্ণ বিক্রয় ইতিহাস ({(customerSales?.length || 0).toLocaleString('bn-BD')} টি)
            </h3>
            {customerSales && customerSales.length > 0 ? (
              <div className="space-y-2">
                {customerSales.map(sale => (
                  <Card key={sale.id} className={Number(sale.due_amount) > 0 ? "border-destructive/10" : ""}>
                    <CardContent className="py-3 px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            #{sale.id.slice(0, 8)}
                            <span className="text-xs text-muted-foreground ml-2">
                              {format(new Date(sale.created_at), 'dd MMM yyyy, hh:mm a', { locale: bn })}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sale.sale_items?.map((item: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px] py-0">
                                {item.products?.name || 'পণ্য'} x{item.quantity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">৳{Number(sale.total_amount).toLocaleString('bn-BD')}</span>
                          {Number(sale.due_amount) > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">
                              বাকি: ৳{Number(sale.due_amount).toLocaleString('bn-BD')}
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">পরিশোধিত</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">এই কাস্টমারের কোনো বিক্রয় নেই</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
