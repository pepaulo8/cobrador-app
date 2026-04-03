# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Cobrador App is a single-file installment sales tracker for door-to-door collectors ("cobradores"). It's a self-contained `index.html` with inline CSS and JavaScript — no build tools, no frameworks, no dependencies.

The app is in Brazilian Portuguese. All UI text, field names, and comments are in pt-BR.

## Architecture

Everything lives in `index.html` (~1390 lines):

- **Lines 1–609**: HTML structure and inline `<style>` block (CSS variables, responsive mobile-first layout, print styles for payment cards)
- **Lines 610–1388**: Single `<script>` block with all application logic

### JavaScript sections (marked with `// ============ ... ============` comments):

| Section | Purpose |
|---------|---------|
| DATA LAYER | CRUD operations on `localStorage` (key: `cobrador_vendas`). All data is a JSON array of "venda" objects. |
| WHATSAPP PARSER | Parses pasted WhatsApp sale cards into structured data. Uses fuzzy field matching with accent-normalized keys. Handles common typos (e.g., "bairo" → "bairro"). |
| PREVIEW | Shows parsed data before saving, with installment table. |
| SAVE | Creates a venda object with generated installment schedule (`parcelas` array). |
| NAVIGATION | SPA routing via `showPage()` — pages: Dashboard, Nova Venda, Detalhe, Relatórios. |
| DASHBOARD | Stats cards, search/filter by status (todos/atrasado/em_dia/quitado), client list sorted by urgency. |
| DETALHE | Client detail view with installment table, mark-as-paid/undo actions, print button, delete. |
| PRINT | Generates printable payment cards (2 copies: cobrador + cliente) using a print-specific layout. |
| RELATÓRIOS | Weekly collection schedule, overdue list, per-salesperson summary. |
| BACKUP / RESTORE | JSON export/import via modal dialog. |

### Data model

A "venda" (sale) stored in localStorage:
- `id`, `criadoEm`, `nome`, `endereco`, `bairro`, `telefone`, `mercadoria`, `vendedor`, `emissao`, `observacao`
- `qtdParcelas`, `valorParcela`, `totalVenda`, `parcelasStr`, `vencimento`
- `parcelas[]` — array of `{ num, vencimento, pago, dataPagamento }`

Status is computed (not stored): `quitado` (all paid), `atrasado` (any overdue unpaid), `em_dia` (otherwise).

### Date format

All dates use `DD/MM/YYYY` format throughout. The `parseDate()` and `formatDate()` helpers handle conversion.

## Development

Open `index.html` directly in a browser — no server needed. Data persists in `localStorage`.

## Key considerations

- No build step, linter, or test suite exists. Changes are made directly to `index.html`.
- The WhatsApp parser (`parseWhatsAppText`) is the most complex logic — it does fuzzy field matching and must tolerate varied input formats and typos.
- Print layout uses `@media print` CSS and `window.print()` — test print changes with browser print preview.
- The app is mobile-first (used by collectors in the field). Maintain touch-friendly UI and small screen compatibility.
