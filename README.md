# Random Values Generator

Save time and speed up your workflow by generating random values and dates with a single click. Whether you're prototyping, testing input fields, or designing layouts, this plugin produces realistic placeholder data tailored to your needs — fast.

The plugin has two tabs: **Values** and **Dates**.

## Values

Generate random values and write them straight into your selected text layers.

1. Run the **Random Values Generator** plugin.
2. Select one or more text layers.
3. Pick a value type, configure the options, and click **Generate values**.
4. Each selected layer is filled with its own freshly generated value.

Value types:

- **Numeric** — random digits only (e.g. `4820157396`).
- **Alphanumeric** — a random mix of letters and digits, with selectable letter case (uppercase / lowercase).
- **Pattern** — define the structure of the output:
  - `X` → a random letter
  - `#` → a random number
  - Separators `-` (dash), `.` (dot) and `_` (underscore) are kept as-is.

  Example patterns: `X#XX##` → `D3FR53`, `##XX#X-XX##` → `06CO2M-FC92`.

A **Prefix** and **Suffix** can be added to any value type (e.g. `INV-`, `-END`).

## Dates

Generate random, always-valid calendar dates in the format and time window you need, written straight into your selected text layers.

1. Open the **Dates** tab.
2. Select one or more text layers.
3. Choose a **date format** — a live preview updates as you change it.
4. Set the time window with the **From** and **To** month + year pickers (From must be on or before To). Pick past years, future years, or any span you like — the window handles it all.
5. Click **Generate dates** — each selected layer is filled with a random date from within that window.

Supported formats:

| Format          | Example         |
| --------------- | --------------- |
| `YYYY-MM-DD`    | `2026-06-17`    |
| `DD/MM/YYYY`    | `17/06/2026`    |
| `MM/DD/YYYY`    | `06/17/2026`    |
| `DD-MM-YYYY`    | `17-06-2026`    |
| `MMM DD, YYYY`  | `Jun 17, 2026`  |
| `Month DD, YYYY`| `June 17, 2026` |

All generated dates are guaranteed valid — month lengths and leap years are respected, so impossible dates such as `2025-02-29` are never produced.

## Use cases

- Populate placeholder data for prototypes — serial numbers, order numbers, product codes.
- Fill form fields such as usernames, passwords, or verification codes.
- Simulate real-world data — license plates, invoice numbers, customer IDs, coupons, gift cards, event tickets, and dates.
- Test UI scalability by checking how components handle varying value lengths and types.

## Development

The plugin is built from two parts:

- `code.ts` — the plugin sandbox (main thread). Compiled to `code.js` with `npm run build` (`tsc`).
- `ui.html` — the self-contained plugin UI (HTML/CSS/JS, Geist typography, dark theme).

```bash
npm run build      # compile code.ts -> code.js
npm run watch      # rebuild on change
npm run lint       # lint the TypeScript sources
```
