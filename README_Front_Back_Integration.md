
# مشروع اختيار الميزات بالخوارزمية الجينية (Front + Back Integration)


تم تنفيذ هذا الجزء بواسطة [اسمك]، ويتضمن واجهة **React** كاملة لعرض وتشغيل الخوارزمية الجينية
وربطها مع **Django Backend** الذي نفذته الزميلة.

---



### 
1. تأكد من تثبيت المكتبات التالية:
   ```bash
   pip install django django-cors-headers pandas
   ```

2. أضف في `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...,
       'corsheaders',
   ]

   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',
       ...,
   ]

   CORS_ALLOW_ALL_ORIGINS = True
   ```

3. أضف المسارات في `urls.py` داخل التطبيق:
   ```python
   from django.urls import path
   from . import views

   urlpatterns = [
       path('api/upload/', views.api_upload, name='api_upload'),
       path('api/preview/', views.api_preview, name='api_preview'),
       path('api/run_ga/', views.api_run_ga, name='api_run_ga'),
       path('api/traditional/', views.api_traditional, name='api_traditional'),
       path('api/results/', views.api_results, name='api_results'),
   ]
   ```

4. شغّل السيرفر:
   ```bash
   python manage.py runserver
   ```

---

### 2️⃣ إعداد الفرونت (React)
1. ثبّت المكتبات:
   ```bash
   npm install
   npm install papaparse
   ```

2. شغّل المشروع:
   ```bash
   npm run dev
   ```

3. تأكد أن عنوان الـ API في ملف `App.jsx` هو:
   ```js
   const API_BASE = "http://127.0.0.1:8000/api";
   ```

---

## 📡 واجهات API المدعومة

| المسار | الوظيفة |
|--------|----------|
| `/api/upload/` | رفع ملف CSV وحفظه في قاعدة البيانات |
| `/api/preview/` | عرض معلومات عامة عن الملف المرفوع |
| `/api/run_ga/` | تشغيل الخوارزمية الجينية وإرجاع النتائج |
| `/api/traditional/` | تشغيل الطريقة التقليدية للمقارنة |
| `/api/results/` | عرض آخر نتائج محفوظة في قاعدة البيانات |

---

##  التكامل بين React وDjango

- عند رفع ملف في React → يتم إرساله إلى `/api/upload/` في Django.
- عند الضغط على تشغيل الخوارزمية الجينية → يتم استدعاء `/api/run_ga/`.
- عند عرض الطريقة التقليدية → يتم استدعاء `/api/traditional/`.
- النتائج تظهر مباشرة في صفحات React.

---

##  ملاحظات مهمة
- تأكد من تشغيل Django على المنفذ `8000` وReact على `3000` أو `5173`.
- يسمح الإعداد `CORS_ALLOW_ALL_ORIGINS = True` للاتصال بين الطرفين أثناء التطوير.
- يمكن لاحقًا استبدال كود الخوارزمية في Django بكود فعلي من ملف `genetic_algorithm.py`.



