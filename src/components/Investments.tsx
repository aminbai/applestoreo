import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowDownCircle, ArrowUpCircle, Trash2, Building2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

export function Investments() {
  const queryClient = useQueryClient();
  const [showAddSector, setShowAddSector] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showEditSector, setShowEditSector] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [showEditIncome, setShowEditIncome] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState("");
  const [filterSector, setFilterSector] = useState("all");

  // Form states
  const [sectorName, setSectorName] = useState("");
  const [sectorDesc, setSectorDesc] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryType, setEntryType] = useState("deposit");
  const [entryPurpose, setEntryPurpose] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [incomePurpose, setIncomePurpose] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit IDs
  const [editSectorId, setEditSectorId] = useState("");
  const [editEntryId, setEditEntryId] = useState("");
  const [editIncomeId, setEditIncomeId] = useState("");

  const { data: sectors } = useQuery({
    queryKey: ["investment-sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_sectors").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["investment-entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_entries").select("*, investment_sectors(name)").order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: incomes } = useQuery({
    queryKey: ["investment-incomes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_incomes").select("*, investment_sectors(name)").order("income_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ---- SECTOR CRUD ----
  const addSectorMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("investment_sectors").insert({ name: sectorName, description: sectorDesc });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-sectors"] });
      toast.success("নতুন খাত যোগ হয়েছে");
      setSectorName(""); setSectorDesc(""); setShowAddSector(false);
    },
    onError: () => toast.error("খাত যোগ করতে ব্যর্থ"),
  });

  const updateSectorMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("investment_sectors").update({ name: sectorName, description: sectorDesc }).eq("id", editSectorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-sectors"] });
      toast.success("খাত আপডেট হয়েছে");
      setSectorName(""); setSectorDesc(""); setEditSectorId(""); setShowEditSector(false);
    },
    onError: () => toast.error("খাত আপডেট করতে ব্যর্থ"),
  });

  const deleteSectorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_sectors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-sectors"] });
      toast.success("খাত মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("খাত মুছতে ব্যর্থ — প্রথমে এই খাতের সকল এন্ট্রি ও আয় মুছুন"),
  });

  // ---- ENTRY CRUD ----
  const addEntryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("investment_entries").insert({
        sector_id: selectedSectorId, amount: Number(entryAmount), entry_type: entryType,
        purpose: entryPurpose, notes: entryNotes, entry_date: entryDate, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-entries"] });
      toast.success("ইনভেস্টমেন্ট এন্ট্রি যোগ হয়েছে");
      resetEntryForm(); setShowAddEntry(false);
    },
    onError: () => toast.error("এন্ট্রি যোগ করতে ব্যর্থ"),
  });

  const updateEntryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("investment_entries").update({
        sector_id: selectedSectorId, amount: Number(entryAmount), entry_type: entryType,
        purpose: entryPurpose, notes: entryNotes, entry_date: entryDate,
      }).eq("id", editEntryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-entries"] });
      toast.success("এন্ট্রি আপডেট হয়েছে");
      resetEntryForm(); setEditEntryId(""); setShowEditEntry(false);
    },
    onError: () => toast.error("এন্ট্রি আপডেট করতে ব্যর্থ"),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-entries"] });
      toast.success("এন্ট্রি মুছে ফেলা হয়েছে");
    },
  });

  // ---- INCOME CRUD ----
  const addIncomeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("investment_incomes").insert({
        sector_id: selectedSectorId, amount: Number(incomeAmount), source: incomeSource,
        purpose: incomePurpose, notes: incomeNotes, income_date: incomeDate, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-incomes"] });
      toast.success("আয় এন্ট্রি যোগ হয়েছে");
      resetIncomeForm(); setShowAddIncome(false);
    },
    onError: () => toast.error("আয় যোগ করতে ব্যর্থ"),
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("investment_incomes").update({
        sector_id: selectedSectorId, amount: Number(incomeAmount), source: incomeSource,
        purpose: incomePurpose, notes: incomeNotes, income_date: incomeDate,
      }).eq("id", editIncomeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-incomes"] });
      toast.success("আয় আপডেট হয়েছে");
      resetIncomeForm(); setEditIncomeId(""); setShowEditIncome(false);
    },
    onError: () => toast.error("আয় আপডেট করতে ব্যর্থ"),
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investment-incomes"] });
      toast.success("আয় এন্ট্রি মুছে ফেলা হয়েছে");
    },
  });

  const resetEntryForm = () => {
    setEntryAmount(""); setEntryType("deposit"); setEntryPurpose(""); setEntryNotes("");
    setEntryDate(new Date().toISOString().split('T')[0]);
  };

  const resetIncomeForm = () => {
    setIncomeAmount(""); setIncomeSource(""); setIncomePurpose(""); setIncomeNotes("");
    setIncomeDate(new Date().toISOString().split('T')[0]);
  };

  const startEditSector = (sector: any) => {
    setEditSectorId(sector.id);
    setSectorName(sector.name);
    setSectorDesc(sector.description || "");
    setShowEditSector(true);
  };

  const startEditEntry = (entry: any) => {
    setEditEntryId(entry.id);
    setSelectedSectorId(entry.sector_id);
    setEntryAmount(String(entry.amount));
    setEntryType(entry.entry_type);
    setEntryPurpose(entry.purpose || "");
    setEntryNotes(entry.notes || "");
    setEntryDate(entry.entry_date);
    setShowEditEntry(true);
  };

  const startEditIncome = (income: any) => {
    setEditIncomeId(income.id);
    setSelectedSectorId(income.sector_id);
    setIncomeAmount(String(income.amount));
    setIncomeSource(income.source || "");
    setIncomePurpose(income.purpose || "");
    setIncomeNotes(income.notes || "");
    setIncomeDate(income.income_date);
    setShowEditIncome(true);
  };

  // Calculate stats
  const sectorStats = sectors?.map(sector => {
    const sectorEntries = entries?.filter(e => e.sector_id === sector.id) || [];
    const sectorIncomes = incomes?.filter(i => i.sector_id === sector.id) || [];
    const totalDeposit = sectorEntries.filter(e => e.entry_type === 'deposit').reduce((s, e) => s + Number(e.amount), 0);
    const totalWithdraw = sectorEntries.filter(e => e.entry_type === 'withdraw').reduce((s, e) => s + Number(e.amount), 0);
    const totalIncome = sectorIncomes.reduce((s, i) => s + Number(i.amount), 0);
    const netInvestment = totalDeposit - totalWithdraw;
    return { ...sector, totalDeposit, totalWithdraw, totalIncome, netInvestment };
  }) || [];

  const grandTotalInvestment = sectorStats.reduce((s, sec) => s + sec.netInvestment, 0);
  const grandTotalIncome = sectorStats.reduce((s, sec) => s + sec.totalIncome, 0);
  const filteredEntries = filterSector === "all" ? entries : entries?.filter(e => e.sector_id === filterSector);
  const filteredIncomes = filterSector === "all" ? incomes : incomes?.filter(i => i.sector_id === filterSector);

  const EntryFormFields = () => (
    <div className="space-y-4">
      <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
        <SelectTrigger><SelectValue placeholder="খাত নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>{sectors?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={entryType} onValueChange={setEntryType}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="deposit">➕ জমা (Deposit)</SelectItem>
          <SelectItem value="withdraw">➖ উত্তোলন (Withdraw)</SelectItem>
        </SelectContent>
      </Select>
      <Input type="number" placeholder="পরিমাণ (৳)" value={entryAmount} onChange={e => setEntryAmount(e.target.value)} />
      <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
      <Input placeholder="উদ্দেশ্য" value={entryPurpose} onChange={e => setEntryPurpose(e.target.value)} />
      <Textarea placeholder="নোটস (ঐচ্ছিক)" value={entryNotes} onChange={e => setEntryNotes(e.target.value)} />
    </div>
  );

  const IncomeFormFields = () => (
    <div className="space-y-4">
      <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
        <SelectTrigger><SelectValue placeholder="খাত নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>{sectors?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
      </Select>
      <Input type="number" placeholder="পরিমাণ (৳)" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
      <Input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} />
      <Input placeholder="উৎস (কোথা থেকে এসেছে)" value={incomeSource} onChange={e => setIncomeSource(e.target.value)} />
      <Input placeholder="উদ্দেশ্য" value={incomePurpose} onChange={e => setIncomePurpose(e.target.value)} />
      <Textarea placeholder="নোটস (ঐচ্ছিক)" value={incomeNotes} onChange={e => setIncomeNotes(e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">💼 ইনভেস্টমেন্ট ট্র্যাকার</h1>
          <p className="text-sm text-muted-foreground">খাতওয়ারি বিনিয়োগ ও আয় হিসাব</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddSector} onOpenChange={setShowAddSector}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Building2 className="w-4 h-4 mr-1" /> নতুন খাত</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>নতুন ইনভেস্টমেন্ট খাত</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="খাতের নাম" value={sectorName} onChange={e => setSectorName(e.target.value)} />
                <Textarea placeholder="বিবরণ (ঐচ্ছিক)" value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} />
                <Button onClick={() => addSectorMutation.mutate()} disabled={!sectorName}>যোগ করুন</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddEntry} onOpenChange={(open) => { setShowAddEntry(open); if (!open) resetEntryForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><PiggyBank className="w-4 h-4 mr-1" /> ইনভেস্টমেন্ট</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ইনভেস্টমেন্ট এন্ট্রি</DialogTitle></DialogHeader>
              <EntryFormFields />
              <Button onClick={() => addEntryMutation.mutate()} disabled={!selectedSectorId || !entryAmount}>যোগ করুন</Button>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddIncome} onOpenChange={(open) => { setShowAddIncome(open); if (!open) resetIncomeForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary"><TrendingUp className="w-4 h-4 mr-1" /> আয় যোগ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>আয় এন্ট্রি</DialogTitle></DialogHeader>
              <IncomeFormFields />
              <Button onClick={() => addIncomeMutation.mutate()} disabled={!selectedSectorId || !incomeAmount}>যোগ করুন</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialogs */}
      <Dialog open={showEditSector} onOpenChange={(open) => { setShowEditSector(open); if (!open) { setSectorName(""); setSectorDesc(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>খাত সম্পাদনা</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="খাতের নাম" value={sectorName} onChange={e => setSectorName(e.target.value)} />
            <Textarea placeholder="বিবরণ" value={sectorDesc} onChange={e => setSectorDesc(e.target.value)} />
            <Button onClick={() => updateSectorMutation.mutate()} disabled={!sectorName}>আপডেট করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditEntry} onOpenChange={(open) => { setShowEditEntry(open); if (!open) resetEntryForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>এন্ট্রি সম্পাদনা</DialogTitle></DialogHeader>
          <EntryFormFields />
          <Button onClick={() => updateEntryMutation.mutate()} disabled={!selectedSectorId || !entryAmount}>আপডেট করুন</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditIncome} onOpenChange={(open) => { setShowEditIncome(open); if (!open) resetIncomeForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>আয় সম্পাদনা</DialogTitle></DialogHeader>
          <IncomeFormFields />
          <Button onClick={() => updateIncomeMutation.mutate()} disabled={!selectedSectorId || !incomeAmount}>আপডেট করুন</Button>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">মোট বিনিয়োগ</p>
            </div>
            <p className="text-2xl font-bold text-primary">৳{grandTotalInvestment.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-sm text-muted-foreground">মোট আয়</p>
            </div>
            <p className="text-2xl font-bold text-accent">৳{grandTotalIncome.toLocaleString('bn-BD')}</p>
          </CardContent>
        </Card>
        <Card className="border-muted bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-foreground" />
              <p className="text-sm text-muted-foreground">মোট খাত</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{sectors?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sector-wise Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectorStats.map(sector => (
          <Card key={sector.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{sector.name}</CardTitle>
                <div className="flex gap-1">
                  {sector.is_default && <Badge variant="secondary" className="text-[10px]">ডিফল্ট</Badge>}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditSector(sector)}>
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  {!sector.is_default && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      if (confirm("এই খাত মুছে ফেলতে চান?")) deleteSectorMutation.mutate(sector.id);
                    }}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {sector.description && <p className="text-xs text-muted-foreground">{sector.description}</p>}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-primary/5">
                  <p className="text-[10px] text-muted-foreground">বিনিয়োগ</p>
                  <p className="text-sm font-bold text-primary">৳{sector.netInvestment.toLocaleString('bn-BD')}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/5">
                  <p className="text-[10px] text-muted-foreground">আয়</p>
                  <p className="text-sm font-bold text-accent">৳{sector.totalIncome.toLocaleString('bn-BD')}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-[10px] text-muted-foreground">লাভ/ক্ষতি</p>
                  <p className={`text-sm font-bold ${sector.totalIncome - sector.netInvestment >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    ৳{(sector.totalIncome - sector.netInvestment).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-48"><SelectValue placeholder="খাত ফিল্টার" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল খাত</SelectItem>
            {sectors?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Recent Entries & Incomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-primary" /> ইনভেস্টমেন্ট এন্ট্রি
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEntries?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">কোনো এন্ট্রি নেই</p>}
            {filteredEntries?.map(entry => (
              <div key={entry.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.entry_type === 'deposit' ? 'default' : 'destructive'} className="text-[10px]">
                      {entry.entry_type === 'deposit' ? '➕ জমা' : '➖ উত্তোলন'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{(entry as any).investment_sectors?.name}</span>
                  </div>
                  {entry.purpose && <p className="text-xs mt-1 text-foreground">{entry.purpose}</p>}
                  <p className="text-[10px] text-muted-foreground">{format(new Date(entry.entry_date), 'dd MMM yyyy', { locale: bn })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-sm ${entry.entry_type === 'deposit' ? 'text-primary' : 'text-destructive'}`}>
                    {entry.entry_type === 'deposit' ? '+' : '-'}৳{Number(entry.amount).toLocaleString('bn-BD')}
                  </p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditEntry(entry)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    if (confirm("এই এন্ট্রি মুছে ফেলতে চান?")) deleteEntryMutation.mutate(entry.id);
                  }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-accent" /> আয়ের তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {filteredIncomes?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">কোনো আয় নেই</p>}
            {filteredIncomes?.map(income => (
              <div key={income.id} className="flex justify-between items-center p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-accent">{(income as any).investment_sectors?.name}</span>
                  </div>
                  {income.source && <p className="text-xs text-foreground">উৎস: {income.source}</p>}
                  {income.purpose && <p className="text-xs text-muted-foreground">{income.purpose}</p>}
                  <p className="text-[10px] text-muted-foreground">{format(new Date(income.income_date), 'dd MMM yyyy', { locale: bn })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-accent">+৳{Number(income.amount).toLocaleString('bn-BD')}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditIncome(income)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    if (confirm("এই আয় এন্ট্রি মুছে ফেলতে চান?")) deleteIncomeMutation.mutate(income.id);
                  }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
