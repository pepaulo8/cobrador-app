# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Cobrador App is a mobile-first collection management system for door-to-door sellers/lenders ("cobradores"). Two single-file HTML apps with inline CSS and JavaScript — no build tools, no frameworks, no dependencies.

The app is in Brazilian Portuguese. All UI text, field names, and comments are in pt-BR.

## Apps

| File | Purpose | Primary color | localStorage keys |
|------|---------|---------------|-------------------|
| `index.html` | Sales tracking (vendas parceladas) | Blue `#1a73e8` | `cobrador_vendas` |
| `emprestimos.html` | Loan management (empréstimos) | Purple `#6C5CE7` | `cobrador_emprestimos`, `cobrador_emprestimos_taxas` |

Both apps share the same design system, component patterns, and navigation structure. They link to each other via header buttons.

## Architecture

Each HTML file follows the same structure:
- **`<style>` block**: CSS variables, responsive mobile-first layout, print styles
- **`<script>` block**: All application logic, organized in labeled sections (`// ============ SECTION ============`)

### Shared sections across both apps

| Section | Purpose |
|---------|---------|
| CLOUD SYNC | Auto-backup to Google Sheets via Google Apps Script. Fire-and-forget POST on every write, debounced 2s. |
| DATA LAYER | CRUD operations on localStorage. Each save function calls `syncToCloud()`. |
| NAVIGATION | SPA routing via `showPage()`. |
| BACKUP / RESTORE | JSON file export/import + cloud restore option. |

### index.html specific sections

| Section | Purpose |
|---------|---------|
| WHATSAPP PARSER | Parses pasted WhatsApp sale cards into structured data. Fuzzy field matching with accent-normalized keys. |
| DASHBOARD | Stats, search/filter by status, client list sorted by urgency. |
| DETALHE | Client detail with installment table, mark-as-paid/undo. |
| PRINT | Printable payment cards (2 copies: cobrador + cliente). |
| RELATÓRIOS | Weekly collections, overdue list, per-salesperson summary. |

### emprestimos.html specific sections

| Section | Purpose |
|---------|---------|
| CALCULATOR | Auto-calculates installment value using configurable interest rates per installment count. |
| IMPORT TEXT | Parses pasted text into loan data (similar to WhatsApp parser). |
| COBRANÇAS (HOME) | Default filter is "Hoje" — shows today's collections + overdue. |
| DETALHE | Loan detail with editable fields, installment table, print. |
| RATES CONFIG | User-configurable interest rates per installment count (stored in `cobrador_emprestimos_taxas`). |
| RELATÓRIOS | Financial summary, referral ranking ("indicações"), status breakdown. |

## Cloud Sync (Google Sheets)

```
App (localStorage) ──> syncToCloud() ──POST──> Google Apps Script ──> Google Sheets
App (localStorage) <── restoreFromCloud() <──GET── Google Apps Script <── Google Sheets
```

- **`gas/Code.gs`**: Google Apps Script deployed as web app. `doPost` saves data, `doGet` reads it.
- **Tab naming**: `{usuario}_{tipo}` (e.g., `jose_vendas`, `jose_emprestimos`, `jose_taxas`)
- **Storage**: Full JSON snapshot in cell A1, timestamp in B1
- **Multi-user**: Each user has a code (`cobrador_usuario` in localStorage), data separated by tabs
- **SYNC_URL**: Hardcoded constant in each HTML file — set after deploying the Apps Script
- **Offline**: Sync silently fails, localStorage still works. Re-syncs on `online` event.
- **Indicator**: 8px colored dot in header (green=synced, yellow=syncing, red=error, gray=offline)

### Setup for new deployment
1. Create Google Sheet → Extensions → Apps Script → paste `gas/Code.gs`
2. Deploy → Web app → Execute as me → Anyone can access
3. Copy URL → paste into `SYNC_URL` constant in both HTML files

## Data models

### Venda (index.html)
`id`, `criadoEm`, `nome`, `endereco`, `bairro`, `telefone`, `mercadoria`, `vendedor`, `emissao`, `observacao`, `qtdParcelas`, `valorParcela`, `totalVenda`, `parcelasStr`, `vencimento`, `parcelas[]` (`{ num, vencimento, pago, dataPagamento }`)

### Empréstimo (emprestimos.html)
`id`, `criadoEm`, `nome`, `telefone`, `endereco`, `indicacao`, `credito`, `qtdParcelas`, `valorParcela`, `diaPagamento`, `totalAPagar`, `obs`, `parcelas[]` (`{ num, vencimento, pago, dataPagamento }`)

### Taxas (emprestimos.html)
Object keyed by installment count: `{ "3": 15, "5": 20, "6": 25 }` (percentage over credit value)

### Status (computed, not stored)
`quitado` (all paid), `atrasado` (any overdue unpaid), `em_dia` (otherwise).

### Date format
All dates use `DD/MM/YYYY`. Helpers: `parseDate()`, `formatDate()`.

## Development

Open any HTML file directly in a browser — no server needed. Data persists in localStorage.

## Key considerations

- No build step, linter, or test suite. Changes are made directly to the HTML files.
- The WhatsApp parser (`parseWhatsAppText` in index.html) does fuzzy field matching and must tolerate varied input formats and typos.
- The loan calculator uses rates from `cobrador_emprestimos_taxas` — percentage applied over credit value.
- The "indicação" (referral) field in emprestimos.html uses a combo-select with accent-normalized dedup.
- Print layouts use `@media print` CSS and `window.print()`.
- The app is mobile-first (used by collectors in the field). Maintain touch-friendly UI.
- Every `save*()` function must call `syncToCloud()` to maintain cloud backup.
