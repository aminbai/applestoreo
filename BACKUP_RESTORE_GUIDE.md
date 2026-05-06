# 🔒 Advanced Backup & Restore System

## Overview

এই সিস্টেম একটি robust backup/restore সমাধান প্রদান করে যা:

✅ **সম্পূর্ণ ডেটা ব্যাকআপ** - সব টেবিল এবং রেকর্ড  
✅ **স্মার্ট রিস্টোর** - মিসিং ফিল্ড অটোমেটিক্যালি ফিল করে  
✅ **মার্জ মোড** - শুধুমাত্র নতুন ডেটা যোগ করে (existing হটায় না)  
✅ **স্কিমা ভ্যালিডেশন** - ডেটা consistency নিশ্চিত করে  
✅ **এরর হ্যান্ডলিং** - ব্যর্থ রেকর্ড স্বয়ংক্রিয়ভাবে ফিলটার করে

---

## 📋 ফিচার

### 1. **Full Backup**
সব ডেটা JSON ফাইলে এক্সপোর্ট করুন।

**ফাইল স্ট্রাকচার:**
```json
{
  "metadata": {
    "version": "2.0",
    "timestamp": "2026-05-06T10:30:00Z",
    "appVersion": "1.0.0",
    "tables": [...],
    "recordCounts": {...},
    "checksums": {...}
  },
  "data": {
    "categories": [...],
    "products": [...],
    "customers": [...],
    "sales": [...],
    ...
  }
}
```

**কিভাবে ব্যবহার করবেন:**
1. Settings → Backup Database
2. "📥 Download Backup" বাটন ক্লিক করুন
3. JSON ফাইল ডাউনলোড হবে

---

### 2. **Replace & Restore**
পুরানো ডেটা হটিয়ে নতুন ব্যাকআপ থেকে রিস্টোর করুন।

**বৈশিষ্ট্য:**
- ✅ সব পুরানো ডেটা হটায় (Foreign key order মেনে)
- ✅ মিসিং ফিল্ড ডিফল্ট ভ্যালু দিয়ে পূরণ করে
- ✅ Schema validation চালায়
- ✅ একটি সম্পূর্ণ ডেটাবেস স্ন্যাপশট রিস্টোর করে

**কিভাবে ব্যবহার করবেন:**
1. Settings → Restore Database
2. "📤 Replace & Restore" বাটন ক্লিক
3. ব্যাকআপ JSON ফাইল সিলেক্ট করুন
4. ডেটা রিস্টোর হবে এবং পেজ রিফ্রেশ হবে

**⚠️ সতর্কতা:**
- এটি সমস্ত বিদ্যমান ডেটা প্রতিস্থাপন করে
- শুধুমাত্র নিশ্চিত থাকলে ব্যবহার করুন

---

### 3. **Merge & Add New (Incremental Restore)**
শুধুমাত্র নতুন রেকর্ড যোগ করুন, বিদ্যমান ডেটা রক্ষা করুন।

**বৈশিষ্ট্য:**
- ✅ Existing ডেটা সম্পূর্ণ সুরক্ষিত থাকে
- ✅ শুধুমাত্র নতুন রেকর্ড (নতুন ID) যোগ হয়
- ✅ ডুপ্লিকেট প্রতিরোধ করে
- ✅ আপনার ডেটা যোগ করার জন্য নিরাপদ উপায়

**কিভাবে ব্যবহার করবেন:**
1. Settings → Restore Database
2. "📥 Merge & Add New" বাটন ক্লিক
3. ব্যাকআপ JSON ফাইল সিলেক্ট করুন
4. শুধুমাত্র নতুন রেকর্ড যোগ হবে

**ব্যবহারের ক্ষেত্র:**
- অন্য ব্র্যাঞ্চ থেকে নতুন ডেটা মার্জ করা
- পুরানো সিস্টেম থেকে ডেটা ম্যাইগ্রেট করা
- একাধিক ব্যাকআপ কম্বাইন করা

---

## 🛠️ Technical Details

### Supported Tables
```
- categories
- products
- customers
- suppliers
- sales
- sale_items
- purchases
- purchase_items
- returns
- invoices
```

### Default Field Values

ব্যাকআপ ফাইলে যদি কিছু ফিল্ড না থাকে, এগুলি অটোমেটিক্যালি যুক্ত হয়:

**Products:**
- `price`: 0
- `cost`: 0
- `stock_quantity`: 0
- `condition`: 'new'

**Sales:**
- `total_amount`: 0
- `payment_status`: 'pending'
- `payment_method`: 'cash'

**Customers:**
- `total_purchases`: 0
- `purchase_count`: 0

সম্পূর্ণ তালিকা দেখুন: `src/lib/backup-restore.ts`

---

## 🔄 Restore Modes

### Mode 1: Replace (সম্পূর্ণ প্রতিস্থাপন)
```
Old Database        Backup File         Result
[All Data] ──────────────────────────→ [Backup Data]
হটায়                  রিস্টোর করে
```

### Mode 2: Merge (মার্জ)
```
Old Database        Backup File         Result
[Existing] ─────────────────────────→ [Existing + New]
রক্ষা করে          নতুন যোগ করে
```

---

## 📊 Verification

রিস্টোর সফল হয়েছে কিনা যাচাই করুন:

1. **Dashboard** এ রেকর্ড কাউন্ট চেক করুন
2. **Reports** এ ডেটা যাচাই করুন
3. **Activity Log** এ ডেটা রিস্টোর ইভেন্ট দেখুন

---

## ⚠️ গুরুত্বপূর্ণ নোট

### উভয় মোডে সফল:
- ✅ Missing fields automatically handled
- ✅ Foreign key order maintained
- ✅ Timestamps preserved
- ✅ All transactions logged

### সমস্যা হলে:
1. কনসোল এরর চেক করুন
2. ব্যাকআপ ফাইল ফরম্যাট যাচাই করুন
3. ইন্টারনেট সংযোগ চেক করুন
4. পুরানো ব্যাকআপ দিয়ে পুনরায় চেষ্টা করুন

---

## 🚀 Best Practices

1. **নিয়মিত ব্যাকআপ করুন**
   - প্রতি সপ্তাহে একবার
   - গুরুত্বপূর্ণ পরিবর্তনের পর

2. **একাধিক স্থানে সংরক্ষণ করুন**
   - আপনার ডিভাইসে
   - ক্লাউড স্টোরেজে
   - বাহ্যিক ড্রাইভে

3. **Replace এর আগে**
   - সর্বদা একটি ব্যাকআপ রাখুন
   - পুরানো ডেটা নিরাপদ স্থানে রাখুন
   - Replace করার আগে পরীক্ষা করুন

4. **ডেটা মাইগ্রেশনে**
   - Merge mode ব্যবহার করুন
   - বিভিন্ন ব্যাকআপ একে একে মার্জ করুন
   - প্রতিটি ধাপ যাচাই করুন

---

## 📝 Code Reference

### Import करने
```typescript
import { 
  createBackup, 
  restoreBackup, 
  incrementalRestore 
} from '@/lib/backup-restore';
```

### Full Backup
```typescript
await createBackup();
```

### Replace Restore
```typescript
await restoreBackup(file, {
  mergeMode: 'replace',
  validateSchema: true
});
```

### Incremental Restore
```typescript
await incrementalRestore(file);
```

---

## ✅ Tested Scenarios

- ✅ Empty database থেকে restore
- ✅ Partial data সহ restore
- ✅ Missing fields হ্যান্ডেল করা
- ✅ Large backups (>10MB)
- ✅ Multiple incremental restores
- ✅ Schema mismatches

---

**সর্বশেষ আপডেট:** May 6, 2026  
**ভার্সন:** 2.0
