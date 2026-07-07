# DocuMorph 🚀

**AI-Powered Document Automation** — Upload, Analyze, Summarize, Convert.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abhiram9641/documorph)

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 📝 **AI Summarization** | Extract the most important content from any document |
| 📊 **Deep Analysis** | Readability scores, word counts, document statistics |
| 🔍 **Data Extraction** | Automatically find emails, URLs, phone numbers |
| 🔄 **Format Conversion** | Convert between PDF, DOCX, XLSX, TXT |

## 💰 Pricing

| Tier | Price | Documents |
|------|-------|-----------|
| Free | $0/mo | 3/month |
| Pro | $9/mo | 100/month |
| Enterprise | $29/mo | Unlimited |

## 🔗 Live Demo

**Try it now:** [https://8acaf3961018a1.lhr.life](https://8acaf3961018a1.lhr.life)

## 🚀 Quick Deploy

### One-click Vercel Deploy
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Abhiram9641/documorph)

### Manual
```bash
git clone https://github.com/Abhiram9641/documorph.git
cd documorph
npm install
npm start
```

## 📦 Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** Vanilla JS + CSS
- **Payments:** Stripe
- **Auth:** JWT

## 📄 API

```bash
# Summarize a document
curl -X POST https://your-domain.com/api/process \
  -F "document=@report.pdf" \
  -F "action=summarize"

# Extract data
curl -X POST https://your-domain.com/api/process \
  -F "document=@contacts.xlsx" \
  -F "action=extract"

# Analyze
curl -X POST https://your-domain.com/api/process \
  -F "document=@essay.docx" \
  -F "action=analyze"
```

---

**Made with ❤️ by AI** — Fully autonomous build

