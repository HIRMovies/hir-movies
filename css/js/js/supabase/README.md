# Hir Movies — النسخة الأولى (Version 1)

موقع أفلام بالصومالية: صفحة رئيسية + كتالوج (بحث، تصفية بالقسم، ترتيب) + بيانات تجريبية.
لم يتم بعد: صفحة المشاهدة (Bunny)، لوحة الأدمن.

## هيكل المشروع
```
hir-movies/
├─ index.html
├─ css/style.css
├─ js/config.js      ← رابط Supabase + المفتاح العام (publishable) فقط
├─ js/app.js
├─ supabase/schema.sql
└─ .gitignore
```

## التشغيل محليًا (VS Code)
1. افتح المجلد في VS Code.
2. ثبّت إضافة **Live Server** ثم اضغط "Go Live" (أو شغّل `npx serve` في الطرفية).
3. افتح الرابط الذي يظهر. سترى بيانات تجريبية مع تنبيه "Xog tijaabo ah".

## ربط Supabase
1. في Supabase: **SQL Editor → New query**، الصق محتوى `supabase/schema.sql` ثم **Run**.
2. أضف فيلمًا تجريبيًا من **Table Editor → movies** وفعّل `published`.
3. أعد تحميل الموقع: إذا اختفى تنبيه البيانات التجريبية فالاتصال يعمل.

## الأدمن (للمرحلة القادمة)
Authentication → Users → Add user، ثم نفّذ آخر سطر في `schema.sql` (مع تعديل البريد).

## النشر
ارفع المجلد إلى GitHub ثم اربطه بـ Vercel أو Netlify (موقع ثابت، بدون build).
لا ترفع أي secret key أو كلمة سر قاعدة البيانات.
