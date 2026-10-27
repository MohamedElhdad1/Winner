# ShareAssist

واجهة عربية لإنشاء دعوات جلسات دعم فني ومشاركة شاشة بموافقة صريحة من صاحب الجهاز.

## GitHub Pages

المشروع مجهز للنشر في مستودع `MohamedElhdad1/Winner` عبر GitHub Actions. ارفع **كل محتويات هذا المجلد** إلى جذر المستودع، وليس `index.html` وحده، مع الحفاظ على مجلدات `src/` و`.github/workflows/`.

بعد نجاح Actions فعّل/تحقق من Settings → Pages → Build and deployment → Source: GitHub Actions.

رابط الواجهة المتوقع: https://mohamedelhdad1.github.io/Winner/

## تنبيه مهم بخصوص مشاركة الشاشة الفعلية

GitHub Pages يستضيف ملفات الواجهة الثابتة فقط. وسيط الإشارات الموجود هنا يعمل كإضافة لخادم Vite أثناء التطوير، وليس خادم إنتاج دائمًا. لذلك فإن إنشاء رابط من نسخة Pages وحدها لا يضمن اتصالًا حيًا بين جهازين. لتشغيل جلسات حقيقية عبر الإنترنت يلزم نشر خادم signaling منفصل يدعم HTTPS/WSS وتوجيه واجهات `/api/sessions` إليه، وقد يلزم TURN لتجاوز قيود الشبكات. لا تعرض الواجهة الشاشة أو الصوت إلا بعد اختيار المستخدم الصريح من نافذة المتصفح، ويمكنه إيقاف المشاركة في أي وقت.

## Local development

```bash
npm install
npm run dev
```

## Build static UI

```bash
GITHUB_PAGES=true VITE_STATIC_DEMO=true npm run build
```
