<div dir="rtl" align="right">

# dsh-client-rtl

**چیدمان راست‌به‌چپ برای فضای مکالمه‌ی [DeepSeek Harness][dsh] — فارسی، عربی و عبری داخل یک اپلیکیشن چپ‌به‌راست.**

**فارسی** | [English](README.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform: DeepSeek Harness](https://img.shields.io/badge/platform-DeepSeek%20Harness-black)](https://github.com/deepseek-ai)
[![Plugin: client](https://img.shields.io/badge/plugin-client%20side-a855f7)](#نحوهی-کار)

---

## مشکل

رابط DeepSeek Harness فقط چپ‌به‌راست است. حالت RTL ندارد، تنظیم `direction` ندارد، و پلاگین locale آن هم فیلدی برای جهت متن نمی‌شناسد. اگر فارسی، عربی یا عبری بنویسی، *حروف* به‌خاطر bidi یونیکد راست‌به‌چپ می‌شوند — ولی هیچ‌چیز اطرافشان نمی‌شود:

- پاراگراف‌ها از لبه‌ی چپ شروع می‌شوند و سمت راست دندانه‌دار تمام می‌شوند؛
- حباب پیام خودت سمت اشتباه می‌نشیند؛
- نشانگر لیست‌ها، نقل‌قول‌ها و سلول‌های جدول به چپ چنگ زده‌اند؛
- خطوط ترکیبی فارسی/انگلیسی به‌هم‌ریخته به نظر می‌رسند.

نتیجه همان حس آشنای «متنم وارونه است» است، در حالی که خودِ متن درست است.

## این پلاگین چه می‌کند

فقط **سطح مکالمه** را راست‌به‌چپ می‌کند:

| بخش | جهت |
|---|---|
| متن پاسخ‌ها، تیترها، لیست‌ها، جدول‌ها، نقل‌قول‌ها | **راست‌به‌چپ** — شروع از لبه‌ی راست |
| حباب پیام خودت | با قفسه آینه می‌شود و داخلش می‌ماند |
| بلوک‌های کد، کد درون‌خطی، مسیرها، نام کلیدها | **چپ‌به‌راست** — عمداً قفل‌شده |
| سایدبار، پنل‌ها، تنظیمات، کامپوزر | دست‌نخورده (چپ‌به‌راست) |

کد هیچ‌وقت آینه نمی‌شود. یک دستور شل، یک مسیر فایل یا یک diff متن فارسی نیست، و آینه‌کردنشان همان چیزی است که «پشتیبانی RTL» را معمولاً به آشغالِ ناخوانا تبدیل می‌کند.

> این پلاگین فقط چیدمان را عوض می‌کند. هیچ درخواست شبکه‌ای نمی‌فرستد، هیچ پکیج Harness را ایمپورت نمی‌کند، هیچ فایلی نمی‌خواند، و دقیقاً یک عنصر `<style>` به سند اضافه می‌کند.

## نصب

### پیش‌نیازها

- نسخه‌ی دسکتاپ یا وب DeepSeek Harness با پشتیبانی از پلاگین کلاینت (`dsh.client`) — هر نسخه‌ای که باندل‌ها را از `/plugins` سرو می‌کند.
- یک پوشه‌ی پروفایل قابل نوشتن: `$DSH_HOME/profiles/<profile>` (پیش‌فرض در ویندوز `‎~/.dsh/profiles/desktop` و برای پروفایل وب `‎~/.dsh/profiles/web`).

### روش الف — دستی (همه‌جا کار می‌کند)

۱. پکیج را داخل `node_modules` پروفایل کپی کن:

```
~/.dsh/profiles/desktop/node_modules/dsh-client-rtl/
├── package.json
├── index.js
└── client.js
```

در ویندوز، از داخل یک کلون از همین ریپو:

```powershell
$dest = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-client-rtl"
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item package.json, index.js, client.js $dest -Force
```

۲. ردیف را در لایه‌ی پچ پروفایل ثبت کن، `‎~/.dsh/profiles/desktop/cordis.patch.yml`:

```yaml
- insert:
    - id: rtl
      name: "dsh-client-rtl"
```

**وجود `insert:` اجباری است.** یک ردیف ساده‌ی `- id: … / name: …` به‌معنای *override* یک شناسه‌ی موجود است و Harness بی‌صدا پیام `entry "rtl" not found` می‌دهد.

۳. اپلیکیشن را ریاستارت کن (یا پنجره را با `Ctrl+R` ریلود کن).

### روش ب — اسکریپتی (ویندوز)

```powershell
.\scripts\install.ps1                 # کپی می‌کند و پروفایل را پچ می‌کند
.\scripts\install.ps1 -WhatIfCopy     # فقط نقشه را نشان می‌دهد، چیزی را تغییر نمی‌دهد
```

اسکریپت قبل از ویرایش از `cordis.patch.yml` بکاپ می‌گیرد (`cordis.patch.yml.bak`) و idempotent است: اجرای دوباره ردیف تکراری نمی‌سازد.

### حذف

بلوک `- insert:` را از `cordis.patch.yml` بردار و ریاستارت کن. پاک‌کردن پوشه‌ی پکیج اختیاری است — پکیجی که ارجاعی به آن نمانده هرگز لود نمی‌شود.

## تأیید اینکه لود شده

۱. یک سشن با حداقل یک پاسخ دستیار باز کن.
۲. متن فارسی باید از لبه‌ی راست شروع شود و بازه‌های `code` همچنان چپ‌به‌راست بمانند.
۳. اگر چیزی عوض نشد، [docs/troubleshooting.md](docs/troubleshooting.md) را ببین. شایع‌ترین علت، تورفتگی `insert:` است.

## نحوه‌ی کار

<pre dir="ltr">

┌──────────────────┐   boot    ┌────────────────────────────┐
│ Harness desktop  │ ────────► │ Loader composes the        │
│ app (Electron)   │           │ profile tree + patch layers│
└──────────────────┘           └─────────────┬──────────────┘
                                             │ scans `dsh.client`
                                             ▼
                               ┌────────────────────────────┐
                               │ dsh-client-modules serves  │
                               │ /plugins/dsh-client-rtl.js │
                               └─────────────┬──────────────┘
                                             │ <script> in renderer
                                             ▼
                               ┌────────────────────────────┐
                               │ window.__ModuleLoader__    │
                               │ .load({ id, factory })     │
                               └─────────────┬──────────────┘
                                             │ factory() → apply(ctx)
                                             ▼
                    ┌───────────────────────────────────────────┐
                    │ 1. inject one <style>                     │
                    │ 2. find the scroll container of the       │
                    │    transcript / first message row         │
                    │ 3. mark it  data-dsh-rtl-pane             │
                    │ 4. MutationObserver → re-mark on rerender │
                    └───────────────────────────────────────────┘

</pre>

جزئیات کامل کامپوننت‌ها و چرخه‌ی عمر: [docs/architecture.md](docs/architecture.md).
استراتژی سلکتور و دلیل استفاده از تشخیص در زمان اجرا: [docs/how-it-works.md](docs/how-it-works.md).

**چرا تشخیص در زمان اجرا و نه سلکتور ساده؟** باندل Harness از CSS module هش‌شده استفاده می‌کند (`LOmM4q_userRow`، `xeixwq_table`) و این هش‌ها بین بیلدها عوض می‌شوند. استایل‌شیتِ متکی به `[class*="_transcript"]` هم ماژول‌های بی‌ربط را می‌گیرد — در یک بیلد، `contentColumn` در واقع یک سلول از جدول Trajectory بود. پیدا کردن کانتینر اسکرول در زمان اجرا و علامت‌گذاری آن، بین بیلدها پایدار است و نبودِ anchor را تحمل می‌کند.

## سازگاری

| | |
|---|---|
| تست‌شده روی | DeepSeek Harness `0.2.1-rc.5`، ویندوز ۱۱ ۲۴H2–۲۶H1، Chromium 156 |
| باید کار کند روی | هر بیلدی که پسوند کلاس‌های `_transcript` / `_userRow` را حفظ کرده باشد |
| شکست امن | اگر anchor‌ها ناپدید شوند، پلاگین چیزی را علامت نمی‌زند و رابط LTR می‌ماند — هرگز به هاست خطا پرتاب نمی‌کند |
| پروفایل‌ها | `desktop` (تأییدشده)، `web`؛ `tui` خارج از دامنه است — DOM ندارد |

## ساختار پروژه

```
dsh-client-rtl/
├── package.json          # اعلان dsh.client + exports
├── index.js              # نیمه‌ی هاست: عمداً no-op
├── client.js             # نیمه‌ی مرورگر: marker + stylesheet
├── docs/
│   ├── architecture.md   # کامپوننت‌ها، توالی بوت، چرخه‌ی عمر، حالت‌های خرابی
│   ├── how-it-works.md   # استراتژی سلکتور، چرا marker، چه چیزی LTR می‌ماند
│   └── troubleshooting.md
├── scripts/
│   └── install.ps1       # نصب idempotent برای ویندوز
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

> مستندات تخصصی داخل `docs/` فعلاً انگلیسی هستند. اگر نسخه‌ی فارسی‌شان را خواستی، issue باز کن.

## مشارکت

ایشو و پول‌ریکوئست خوش‌آمد است — مخصوصاً نام anchorها از بیلدهایی که پلاگین در آن‌ها از کار افتاده. [CONTRIBUTING.md](CONTRIBUTING.md) را ببین.

## لایسنس

[MIT](LICENSE) © ۲۰۲۶ میثم میرزاپور

</div>

[dsh]: https://github.com/deepseek-ai
