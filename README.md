# 🩺 CodeMRI

> **Your codebase is screaming for help and we're here to spill the tea.**  
> An automated architectural MRI scanner that diagnoses spaghetti code, critical CVEs, and tech debt before on-call ruins your weekend. No cap. 💅⚡

---

## ⚡ The Vibe (TL;DR)

Stop guessing why your build takes 14 minutes or why that one 900-line service is holding the whole backend hostage. **CodeMRI** scans your repository’s manifest (`pom.xml`) and source files in real-time, giving you an interactive, high-contrast dashboard with zero corporate fluff.

- 🧠 **Codebase MRI**: Complete health score + tech debt calculator in human hours.
- 🚨 **CVE & Secret Sniffer**: Catches Log4Shell (CVE-2021-44228), SQLi (CWE-89), Jackson deserialization, and sneaky hardcoded secrets instantly.
- 🗺️ **Risk Matrix & Hotspots**: Identifies the chaotic god-classes everyone is terrified to touch.
- 📦 **Supply Chain Intelligence**: Transitive dependency breakdown with instant severity badges.
- 🛠️ **Refactoring Roadmap**: Prioritized backlog of what to fix first so your PR doesn't get roasted.
- 📄 **1-Click Executive Reports**: Export sleek markdown & print-ready audit reports to flex on management.

---

## 📸 Sneak Peek

```
┌─────────────────────────────────────────────────────────────┐
│  CodeMRI Diagnostics                                        │
│  Health Score: 68/100 🟡 (Needs Therapy)                    │
│  [14 Tech Debt Days] • [2 Critical CVEs] • [1 Hotspot Class]│
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack & Aesthetic

Built clean with zero legacy baggage:

- **Frontend**: React 19 + Vite ⚡ (instant HMR)
- **Styling**: Tailwind CSS v4 + Custom "Minimal Colors" palette (`#51E2F5`, `#FFA8B6`, `#9DF9EF`)
- **Typography**: Satoshi (Display) + Plus Jakarta Sans (UI) + JetBrains Mono (Ligatures)
- **Theme**: Pure Dark (`#0a0a0c`) / Clean Light (`#f8fafc`) with persistent toggle
- **Icons**: Lucide React

---

## 🚀 Quickstart (Run It in 30 Seconds)

Got Node 18+? You're good to go:

```bash
# 1. Clone this banger
git clone https://github.com/sidrachaudhari/CodeMRI.git
cd CodeMRI

# 2. Install dependencies
npm install

# 3. Fire up the dev server
npm run dev
```

Open `http://localhost:5173` (or the port Vite prints in your terminal) and watch the magic happen.

---

## 🧪 Try It With Built-in Chaos Files

Don't have a messy repo on hand? We packaged realistic Java testbeds in [`demo-files/`](./demo-files):

| Folder | What’s Inside | What CodeMRI Catches |
| :--- | :--- | :--- |
| **`vulnerable-spring-ecommerce/`** | Messy Spring Boot service | Log4Shell RCE, SQL Injection, Cyclomatic complexity > 15 |
| **`payment-gateway-microservice/`** | Legacy billing microservice | CWE-798 Hardcoded mock tokens & credentials |
| **`clean-architecture-service/`** | Clean DDD reference | 100/100 Health baseline with zero CVEs |

> **How to test**: Click **"Ingest / Switch Repo"** in the header &rarr; paste or upload files from `demo-files/` &rarr; smash **"START CODEMRI SCAN"**.

---

## 🔒 Security & Privacy

CodeMRI runs client-side static analysis in your browser session. Your source files and tokens **never touch external servers or third-party APIs**. Everything stays 100% local.

---

## 🤝 Contributing

Found a bug or want to add support for Go / Python / Rust manifests?
1. Fork it
2. Create your branch (`git checkout -b feature/cool-feature`)
3. Commit (`git commit -m 'feat: add something fire'`)
4. Push & open a PR. Don't be shy!

---

<p align="center">
  Crafted with ❤️ and too much iced coffee. If this saved your repo, drop a ⭐!
</p>
