# Andoro Invoice Route Desk

Current live app version: v68 route summary syncs visible invoice rows before printing.

A phone-friendly invoice and route planning app for Andoro & Sons.

## What It Does

- Lets salespeople fill out an Andoro invoice digitally instead of handwriting it.
- Works as an order form for any customer, not just one route.
- Lets the salesperson select a saved store or save a new store from the invoice screen.
- Starts with the stores and available products pulled from the provided Andoro invoices.
- Shows that store's available products with ordered quantity set to `0` by default.
- Lets pizza quantities move by full cases: `12`, `24`, `36`, and so on.
- Defaults new invoices to rep `J.Ballew` unless changed during the order.
- Adds a delivery fee automatically, defaulting to `$10.00` unless changed.
- Requires a simple access code before opening the form.
- Blocks invoice creation for Lisa-only stores that already have invoice-numbered sheets.
- Adds products manually with optional UPC, quantity, unit, rate, and amount.
- Opens a customer copy that can be printed or saved as a PDF before leaving.
- Captures the customer's digital signature on the invoice.
- Sends a copy of the invoice details to Lisa and Ryan at the office.
- Sends Jason a copy of office emails until his Andoro email is ready.
- Keeps saved invoices on the device for resending later.

## Route Workflow

1. Open `Office` and save Lisa and Ryan's email addresses once.
2. Select the store, or enter a new store and tap `Save store`.
3. Set quantities for the store's available products. Leave unordered products at `0`.
4. Add any missing product manually; saving the invoice teaches that product to the store.
5. Have the customer sign in the signature box.
6. Tap `Print customer copy` before leaving.
7. Tap `Send to Office` to email Lisa and Ryan the office copy.

## Run Locally

Open `index.html` in a browser, or serve the folder with any simple static web server.

## Publish

This app can be published with GitHub Pages, Netlify, or Vercel because it only uses static files.
