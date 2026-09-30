# DefaultAlive

DefaultAlive helps SaaS teams understand how long their cash may last. It runs 1,000 possible 36-month forecasts in a web worker, so changing an assumption does not block the page.

## Get started

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

## Checks and production build

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The production site is written to `dist/` and can be hosted as a static website.

## Scenarios

Set starting cash, monthly recurring revenue, monthly burn, customer growth, churn, average revenue per account, and volatility. The chart compares the 10th, 50th, and 90th percentile outcomes for cash or revenue. The summary shows median runway and the chance of staying solvent through month 36.

Use **Copy share link** to share the seven inputs. Opening the link restores those inputs and runs a fresh forecast.

Forecasts are estimates for planning, not financial advice.
