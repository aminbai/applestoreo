# 🔧 Restore Backup Instructions - stockpro-backup-2026-04-28.json

## 📋 সমস্যা ও সমাধান

### **আগে যে সমস্যা ছিল:**
❌ পুরানো v1.0 ফরম্যাট support না করা
❌ Extra fields (model, ram, storage ইত্যাদি) রিস্টোরে error দেওয়া
❌ Schema mismatch এ সম্পূর্ণ রিস্টোর ব্যর্থ হওয়া

### **এখন ফিক্স হয়েছে:**
✅ v1.0 & v2.0 উভয় ফরম্যাট সাপোর্ট
✅ Extra fields স্বয়ংক্রিয়ভাবে ফিল্টার হয়
✅ Missing fields ডিফল্ট ভ্যালু পায়
✅ Batch insert ব্যর্থ হলে one-by-one চেষ্টা করে

---

## 🚀 দুটি উপায়ে রিস্টোর করুন:

### **উপায় ১: অ্যাপের মাধ্যমে (সহজ)**

1. **Settings** → **Backup Database** যান
2. **📤 Replace & Restore** বাটন ক্লিক করুন
3. **stockpro-backup-2026-04-28.json** ফাইল সিলেক্ট করুন
4. অপেক্ষা করুন (সম্পূর্ণ হলে পেজ রিফ্রেশ হবে)
5. ✅ ডেটা রিস্টোর হয়েছে!

### **উপায় ২: Supabase SQL Editor এ (ম্যানুয়াল)**

1. **Supabase Dashboard** খুলুন
2. **SQL Editor** → **New Query**
3. [RESTORE_OLD_BACKUP.sql](file:///c%3A/Users/User/Downloads/apple-storeo/applestoreo/RESTORE_OLD_BACKUP.sql) কপি করুন
4. **RUN** বাটন চাপুন
5. ✅ ডেটা রিস্টোর হয়েছে!

---

## 📊 ব্যাকআপ ডেটা বিশ্লেষণ

### **ফাইল ফরম্যাট:**
```
✓ Version: 1.0 (পুরানো সিস্টেম)
✓ Timestamp: 2026-04-28T09:28:46.352Z
✓ Tables: 1 (শুধুমাত্র products)
✓ Records: 2 products
```

### **ডেটা কন্টেন্ট:**

**1. Product: 10C**
```
- ID: b6f08f88-1214-49fc-9b51-587ec31dee68
- SKU: SKU-MNX8NWVO-E2Y8X
- Barcode: 583829810698
- Price: 0 টাকা
- Cost: 3000 টাকা
- Stock: 1 পিস
- IMEI: 862853069992815
- Condition: used
- Brand: 10C
- Extra Fields: model, ram, storage, warranty_expiry_date, warranty_status ইত্যাদি
```

**2. Product: 15 PRO MAX**
```
- ID: c08e047a-aa20-4fe9-b42c-be4e186e7c15
- SKU: SKU-MNX6B78O-WR6R5
- Barcode: 916228899674
- Price: 0 টাকা
- Cost: 87000 টাকা
- Stock: 1 পিস
- Brand: 15
```

### **মিসিং ডেটা:**
```
❌ Categories: এক্সপ্লিসিটলি নেই (কিন্তু product এ category_id আছে)
❌ Customers: কোনো কাস্টমার নেই
❌ Sales: কোনো বিক্রয় নেই
❌ Invoices, Returns, Purchases: কিছু নেই
```

---

## 🔄 রিস্টোর করলে কী হবে:

### **ডাটাবেসে যোগ হবে:**
✅ 2টি Product (10C, 15 PRO MAX)
✅ সংশ্লিষ্ট 2টি Category
✅ সমস্ত প্রয়োজনীয় ফিল্ড ডিফল্ট ভ্যালু সহ

### **পরবর্তীতে কিছু যোগ করতে পারবেন:**
- নতুন সেলস রেকর্ড
- কাস্টমার তথ্য
- ইনভয়েস ও রিটার্ন
- অন্যান্য যেকোনো পণ্য

---

## ⚠️ গুরুত্বপূর্ণ নোট

### **Replace Mode:**
- পুরানো সব ডেটা **হটে যাবে**
- শুধুমাত্র এই ব্যাকআপের ডেটা থাকবে
- আগে ডেটা ব্যাকআপ করুন

### **Extra Fields:**
নিচের ফিল্ডগুলি আপনার ব্যাকআপে আছে কিন্তু বর্তমান সিস্টেমে সাপোর্ট নেই:
```
❌ model
❌ ram
❌ storage
❌ battery
❌ supplier_name
❌ supplier_mobile
❌ supplier_nid
❌ warranty_expiry_date
❌ warranty_status
❌ supplier_image_url
```

এগুলি **স্বয়ংক্রিয়ভাবে ফিল্টার** হবে (ডেটা হারানো হবে না, শুধু ইগনোর করা হবে)।

---

## ✅ রিস্টোর চেকলিস্ট

- [ ] ব্যাকআপ ফাইল ডাউনলোড করুন: `stockpro-backup-2026-04-28.json`
- [ ] Settings → Restore Database যান
- [ ] "📤 Replace & Restore" ক্লিক করুন
- [ ] ফাইল সিলেক্ট করুন
- [ ] রিস্টোর সম্পন্ন হওয়ার জন্য অপেক্ষা করুন
- [ ] ডাটাবেস আপডেট হয়েছে দেখুন
- [ ] Dashboard এ পণ্য দেখুন

---

## 🐛 ট্রাবলশুটিং

### **যদি রিস্টোর ব্যর্থ হয়:**
1. ব্রাউজার কনসোল খুলুন (F12)
2. Error message দেখুন
3. Supabase ইন্টারনেট সংযোগ চেক করুন
4. পুরানো ব্যাকআপ ফাইল ভেরিফাই করুন

### **যদি Extra fields এর জন্য ডেটা হারান:**
- বর্তমানে এটি সাপোর্ট নেই
- ভবিষ্যতে schema আপডেট করা হতে পারে
- আমাকে জানান কোন ফিল্ড প্রয়োজন

---

## 📞 সাপোর্ট

**কোনো সমস্যা হলে:** আপনার ডেভেলপারকে যোগাযোগ করুন

---

**লাস্ট আপডেট:** May 6, 2026  
**সিস্টেম ভার্সন:** 2.0  
**ব্যাকআপ ফর্ম্যাট:** v1.0 (Auto-Converted to v2.0)
