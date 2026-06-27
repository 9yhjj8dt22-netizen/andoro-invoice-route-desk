const STORAGE_KEY = "andoro_invoice_route_desk_v2";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const sampleData = {
  invoices: [
    {
      id: crypto.randomUUID(),
      customer: "North Lake Supply",
      address: "100 N LaSalle St, Chicago, IL",
      number: "INV-1001",
      amount: 842.5,
      invoiceDate: todayOffset(-8),
      terms: "Net 10",
      poNumber: "",
      rep: "LC",
      specialInstructions: "Morning delivery",
      items: [{ description: "Delivery order", qty: 1, unit: "CS", rate: 842.5, amount: 842.5 }],
      customerTotalBalance: 0,
      total: 842.5,
      paymentsCredits: 0,
      balanceDue: 842.5
    },
    {
      id: crypto.randomUUID(),
      customer: "Riverbend Builders",
      address: "233 S Wacker Dr, Chicago, IL",
      number: "INV-1002",
      amount: 1260,
      invoiceDate: todayOffset(-28),
      terms: "Net 10",
      poNumber: "",
      rep: "LC",
      specialInstructions: "Call before arrival",
      items: [{ description: "Delivery order", qty: 1, unit: "CS", rate: 1260, amount: 1260 }],
      customerTotalBalance: 0,
      total: 1260,
      paymentsCredits: 0,
      balanceDue: 1260
    }
  ],
  stops: [
    {
      id: crypto.randomUUID(),
      name: "North Lake Supply",
      address: "100 N LaSalle St, Chicago, IL",
      lat: 41.8836,
      lng: -87.6325,
      priority: "normal"
    },
    {
      id: crypto.randomUUID(),
      name: "Riverbend Builders",
      address: "233 S Wacker Dr, Chicago, IL",
      lat: 41.8791,
      lng: -87.6358,
      priority: "high"
    }
  ],
  optimizedStopIds: [],
  origin: { lat: 41.8781, lng: -87.6298 },
  scans: []
};

let state = loadState();
let selectedFiles = [];

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  openBalance: document.querySelector("#openBalance"),
  openInvoiceCount: document.querySelector("#openInvoiceCount"),
  overdueCount: document.querySelector("#overdueCount"),
  paidThisMonth: document.querySelector("#paidThisMonth"),
  routeStopCount: document.querySelector("#routeStopCount"),
  attentionList: document.querySelector("#attentionList"),
  routePreview: document.querySelector("#routePreview"),
  invoiceForm: document.querySelector("#invoiceForm"),
  invoiceId: document.querySelector("#invoiceId"),
  invoiceFormTitle: document.querySelector("#invoiceFormTitle"),
  customerName: document.querySelector("#customerName"),
  serviceAddress: document.querySelector("#serviceAddress"),
  invoiceNumber: document.querySelector("#invoiceNumber"),
  invoiceAmount: document.querySelector("#invoiceAmount"),
  issueDate: document.querySelector("#issueDate"),
  invoiceTerms: document.querySelector("#invoiceTerms"),
  poNumber: document.querySelector("#poNumber"),
  invoiceRep: document.querySelector("#invoiceRep"),
  specialInstructions: document.querySelector("#specialInstructions"),
  mainPhone: document.querySelector("#mainPhone"),
  altPhone: document.querySelector("#altPhone"),
  invoiceDt: document.querySelector("#invoiceDt"),
  lineItemsText: document.querySelector("#lineItemsText"),
  customerTotalBalance: document.querySelector("#customerTotalBalance"),
  invoiceTotal: document.querySelector("#invoiceTotal"),
  paymentsCredits: document.querySelector("#paymentsCredits"),
  balanceDue: document.querySelector("#balanceDue"),
  clearInvoiceForm: document.querySelector("#clearInvoiceForm"),
  invoiceSearch: document.querySelector("#invoiceSearch"),
  invoiceFilter: document.querySelector("#invoiceFilter"),
  invoiceTable: document.querySelector("#invoiceTable"),
  stopForm: document.querySelector("#stopForm"),
  stopId: document.querySelector("#stopId"),
  stopFormTitle: document.querySelector("#stopFormTitle"),
  stopName: document.querySelector("#stopName"),
  stopAddress: document.querySelector("#stopAddress"),
  stopLat: document.querySelector("#stopLat"),
  stopLng: document.querySelector("#stopLng"),
  stopPriority: document.querySelector("#stopPriority"),
  clearStopForm: document.querySelector("#clearStopForm"),
  originLat: document.querySelector("#originLat"),
  originLng: document.querySelector("#originLng"),
  useCurrentLocation: document.querySelector("#useCurrentLocation"),
  optimizeRoute: document.querySelector("#optimizeRoute"),
  stopsFromInvoices: document.querySelector("#stopsFromInvoices"),
  geocodeStops: document.querySelector("#geocodeStops"),
  routeDistance: document.querySelector("#routeDistance"),
  mapsLink: document.querySelector("#mapsLink"),
  routeList: document.querySelector("#routeList"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  resetData: document.querySelector("#resetData"),
  invoiceFiles: document.querySelector("#invoiceFiles"),
  invoiceCamera: document.querySelector("#invoiceCamera"),
  processPhotos: document.querySelector("#processPhotos"),
  clearScanQueue: document.querySelector("#clearScanQueue"),
  scanStatus: document.querySelector("#scanStatus"),
  photoGrid: document.querySelector("#photoGrid"),
  scanResults: document.querySelector("#scanResults"),
  scanSummary: document.querySelector("#scanSummary"),
  saveScannedInvoices: document.querySelector("#saveScannedInvoices")
};

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(sampleData);
  try {
    return { ...structuredClone(sampleData), ...JSON.parse(saved) };
  } catch {
    return structuredClone(sampleData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function emptyState() {
  return document.querySelector("#emptyStateTemplate").content.cloneNode(true);
}

function statusFor(invoice) {
  return invoiceBalance(invoice) > 0 ? "open" : "paid";
}

function invoiceDate(invoice) {
  return invoice.invoiceDate || invoice.issueDate || todayOffset(0);
}

function invoiceBalance(invoice) {
  const balance = Number(invoice.balanceDue ?? invoice.amount ?? invoice.total ?? 0);
  return Number.isFinite(balance) ? balance : 0;
}

function invoiceTotal(invoice) {
  const total = Number(invoice.total ?? invoice.amount ?? invoice.balanceDue ?? 0);
  return Number.isFinite(total) ? total : 0;
}

function render() {
  els.todayLabel.textContent = dateFormat.format(new Date());
  const openInvoices = state.invoices.filter((invoice) => statusFor(invoice) !== "paid");
  const paidInvoices = state.invoices.filter((invoice) => statusFor(invoice) === "paid");
  const paidThisMonth = state.invoices
    .filter((invoice) => statusFor(invoice) === "paid" && invoiceDate(invoice)?.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((total, invoice) => total + invoiceTotal(invoice), 0);

  els.openBalance.textContent = money.format(openInvoices.reduce((total, invoice) => total + invoiceBalance(invoice), 0));
  els.openInvoiceCount.textContent = openInvoices.length;
  els.overdueCount.textContent = paidInvoices.length;
  els.paidThisMonth.textContent = money.format(paidThisMonth);
  els.routeStopCount.textContent = state.stops.length;
  els.originLat.value = state.origin?.lat ?? "";
  els.originLng.value = state.origin?.lng ?? "";

  renderAttention();
  renderInvoices();
  renderRoute();
  renderScans();
}

function renderAttention() {
  els.attentionList.replaceChildren();
  const items = state.invoices
    .filter((invoice) => statusFor(invoice) !== "paid")
    .sort((a, b) => new Date(invoiceDate(b)) - new Date(invoiceDate(a)))
    .slice(0, 5);
  if (!items.length) {
    els.attentionList.append(emptyState());
    return;
  }
  items.forEach((invoice) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(invoice.customer)}</strong>
        <span>Invoice ${escapeHtml(invoice.number || "")} - ${formatDate(invoiceDate(invoice))}</span>
      </div>
      <strong>${money.format(invoiceBalance(invoice))}</strong>
    `;
    els.attentionList.append(item);
  });
}

function renderInvoices() {
  const term = els.invoiceSearch.value.trim().toLowerCase();
  const filter = els.invoiceFilter.value;
  const rows = state.invoices.filter((invoice) => {
    const searchable = [
      invoice.customer,
      invoice.address,
      invoice.number,
      invoice.terms,
      invoice.poNumber,
      invoice.rep,
      invoice.specialInstructions,
      invoice.mainPhone,
      invoice.altPhone,
      invoice.dt,
      lineItemsToText(invoice.items)
    ].join(" ").toLowerCase();
    return (!term || searchable.includes(term)) && (filter === "all" || statusFor(invoice) === filter);
  });
  els.invoiceTable.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6"><div class="empty-state"><strong>No invoices found</strong><span>Add or scan invoices to fill the ledger.</span></div></td>`;
    els.invoiceTable.append(tr);
    return;
  }
  rows.forEach((invoice) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(invoice.customer)}</strong><br><span class="muted">${escapeHtml(invoice.address || "No address")}</span></td>
      <td>${escapeHtml(invoice.number)}</td>
      <td>${formatDate(invoiceDate(invoice))}</td>
      <td>${escapeHtml(invoice.terms || "")}</td>
      <td class="align-right">${money.format(invoiceBalance(invoice))}</td>
      <td><div class="row-actions">
        <button class="icon-action" data-edit-invoice="${invoice.id}" type="button">Edit</button>
        <button class="icon-action" data-delete-invoice="${invoice.id}" type="button">Delete</button>
      </div></td>
    `;
    els.invoiceTable.append(tr);
  });
}

function renderRoute() {
  const ordered = getOrderedStops();
  els.routeList.replaceChildren();
  els.routePreview.replaceChildren();

  if (!ordered.length) {
    els.routeList.append(emptyState());
    els.routePreview.append(emptyState());
    els.routeDistance.textContent = "No route calculated";
    els.mapsLink.classList.add("disabled");
    els.mapsLink.href = "#";
    return;
  }

  ordered.forEach((stop, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}. ${escapeHtml(stop.name)}</strong><span>${escapeHtml(stop.address)} - <span class="priority-pill priority-${stop.priority}">${stop.priority}</span></span>`;
    els.routeList.append(li);
    if (index < 5) {
      const preview = document.createElement("li");
      preview.innerHTML = `<strong>${escapeHtml(stop.name)}</strong><span>${escapeHtml(stop.address)}</span>`;
      els.routePreview.append(preview);
    }
  });

  const miles = routeMiles(ordered);
  els.routeDistance.textContent = `${miles.toFixed(1)} estimated miles`;
  els.mapsLink.href = googleMapsUrl(ordered);
  els.mapsLink.classList.remove("disabled");
}

function getOrderedStops() {
  if (!state.optimizedStopIds.length) return [...state.stops];
  const byId = new Map(state.stops.map((stop) => [stop.id, stop]));
  return state.optimizedStopIds.map((id) => byId.get(id)).filter(Boolean);
}

function renderScans() {
  els.scanResults.replaceChildren();
  els.scanSummary.replaceChildren();
  if (!state.scans.length) {
    els.scanResults.append(emptyState());
    els.scanSummary.append(emptyState());
    return;
  }

  const categories = state.scans.reduce((map, scan) => {
    const key = scan.terms || "No terms";
    if (!map.has(key)) map.set(key, { count: 0, total: 0 });
    const entry = map.get(key);
    entry.count += 1;
    entry.total += Number(scan.balanceDue ?? scan.total ?? scan.amount ?? 0);
    return map;
  }, new Map());

  const grid = document.createElement("div");
  grid.className = "category-grid";
  categories.forEach((entry, category) => {
    const chip = document.createElement("div");
    chip.className = "category-chip";
    chip.innerHTML = `<strong>${escapeHtml(category)}</strong><span>${entry.count} invoice${entry.count === 1 ? "" : "s"} - ${money.format(entry.total)}</span>`;
    grid.append(chip);
  });
  els.scanSummary.append(grid);

  state.scans.forEach((scan) => {
    const card = document.createElement("article");
    card.className = "scan-card";
    card.innerHTML = `
      <header>
        <strong>${escapeHtml(scan.fileName || "Invoice photo")}</strong>
        <label><input data-scan-accepted="${scan.id}" type="checkbox" ${scan.accepted ? "checked" : ""}> Accept</label>
      </header>
      <div class="field-row">
        <label>Customer<input data-scan-field="customer" data-scan-id="${scan.id}" value="${escapeAttribute(scan.customer)}"></label>
        <label>Invoice #<input data-scan-field="number" data-scan-id="${scan.id}" value="${escapeAttribute(scan.number)}"></label>
      </div>
      <label>Address<input data-scan-field="address" data-scan-id="${scan.id}" value="${escapeAttribute(scan.address)}"></label>
      <div class="field-row">
        <label>Invoice date<input data-scan-field="invoiceDate" data-scan-id="${scan.id}" type="date" value="${escapeAttribute(scan.invoiceDate)}"></label>
        <label>Terms<input data-scan-field="terms" data-scan-id="${scan.id}" value="${escapeAttribute(scan.terms)}"></label>
      </div>
      <div class="field-row">
        <label>P.O. No.<input data-scan-field="poNumber" data-scan-id="${scan.id}" value="${escapeAttribute(scan.poNumber)}"></label>
        <label>Rep<input data-scan-field="rep" data-scan-id="${scan.id}" value="${escapeAttribute(scan.rep)}"></label>
      </div>
      <div class="field-row">
        <label>Main phone<input data-scan-field="mainPhone" data-scan-id="${scan.id}" value="${escapeAttribute(scan.mainPhone)}"></label>
        <label>Alt phone<input data-scan-field="altPhone" data-scan-id="${scan.id}" value="${escapeAttribute(scan.altPhone)}"></label>
      </div>
      <label>D/T<input data-scan-field="dt" data-scan-id="${scan.id}" value="${escapeAttribute(scan.dt)}"></label>
      <label>Special instructions<textarea data-scan-field="specialInstructions" data-scan-id="${scan.id}">${escapeHtml(scan.specialInstructions)}</textarea></label>
      <label>Line items<textarea data-scan-field="itemsText" data-scan-id="${scan.id}">${escapeHtml(scan.itemsText || lineItemsToText(scan.items))}</textarea></label>
      <div class="field-row">
        <label>Customer total balance<input data-scan-field="customerTotalBalance" data-scan-id="${scan.id}" type="number" step="0.01" value="${Number(scan.customerTotalBalance || 0)}"></label>
        <label>Total<input data-scan-field="total" data-scan-id="${scan.id}" type="number" step="0.01" value="${Number(scan.total || 0)}"></label>
      </div>
      <div class="field-row">
        <label>Payments/Credits<input data-scan-field="paymentsCredits" data-scan-id="${scan.id}" type="number" step="0.01" value="${Number(scan.paymentsCredits || 0)}"></label>
        <label>Balance due<input data-scan-field="balanceDue" data-scan-id="${scan.id}" type="number" step="0.01" value="${Number(scan.balanceDue || 0)}"></label>
      </div>
      <label>Recognized text<textarea data-scan-field="rawText" data-scan-id="${scan.id}">${escapeHtml(scan.rawText)}</textarea></label>
    `;
    els.scanResults.append(card);
  });
}

function parseInvoiceText(rawText, fileName) {
  const text = rawText.replace(/\r/g, "\n");
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const amountMatches = amountsFromText(text);
  const dateMatches = [...text.matchAll(/\b([0-1]?\d[\/\-][0-3]?\d[\/\-](?:20)?\d{2})\b/g)].map((match) => normalizeDate(match[1]));
  const invoiceNumber = text.match(/invoice\s*#?\s*[:\-]?\s*([0-9A-Z-]{3,})/i)?.[1]
    || findValueAfterLabel(lines, /invoice\s*#/i)
    || invoiceNumberNearDate(lines)
    || "";
  const billTo = parseBillTo(lines);
  const totals = parseTotals(text, amountMatches);
  const items = parseLineItems(lines);
  const terms = findValueAfterLabel(lines, /^terms$/i) || text.match(/\bNet\s*\d+\b/i)?.[0] || "";
  return {
    id: crypto.randomUUID(),
    accepted: true,
    fileName,
    customer: billTo.customer || findCustomer(lines, invoiceNumber),
    address: billTo.address || findAddress(lines),
    number: invoiceNumber,
    invoiceDate: dateMatches[0] || todayOffset(0),
    terms,
    poNumber: findValueAfterLabel(lines, /p\.?o\.?\s*no/i),
    charge: findValueAfterLabel(lines, /^charge$/i),
    cash: findValueAfterLabel(lines, /^cash$/i),
    rep: findValueAfterLabel(lines, /^rep$/i) || text.match(/\bRep\s+([A-Z]{1,4})\b/i)?.[1] || "",
    specialInstructions: parseSpecialInstructions(lines),
    mainPhone: text.match(/Main\s+Tele[:\s]+([0-9()\-\s]+)/i)?.[1]?.trim() || "",
    altPhone: text.match(/Alt\s+Tele[:\s]+([0-9()\-\s]+)/i)?.[1]?.trim() || "",
    dt: text.match(/\bD\/T[:\s]*([^\n]+)/i)?.[1]?.trim() || "",
    items,
    itemsText: lineItemsToText(items),
    customerTotalBalance: totals.customerTotalBalance,
    total: totals.total,
    paymentsCredits: totals.paymentsCredits,
    balanceDue: totals.balanceDue,
    amount: totals.balanceDue || totals.total || (amountMatches.length ? amountMatches.at(-1) : 0),
    rawText: text
  };
}

function amountsFromText(text) {
  return [...text.matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
}

function parseBillTo(lines) {
  const billIndex = lines.findIndex((line) => /bill\s*to/i.test(line));
  if (billIndex < 0) return { customer: "", address: "" };
  const block = lines.slice(billIndex + 1, billIndex + 5).filter((line) => !/special instructions|p\.?o\.?|terms|description/i.test(line));
  return { customer: block[0] || "", address: block.slice(1).join(", ") };
}

function invoiceNumberNearDate(lines) {
  const dateLine = lines.find((line) => /\b[0-1]?\d[\/\-][0-3]?\d[\/\-](?:20)?\d{2}\b/.test(line) && /\b\d{3,}\b/.test(line));
  if (!dateLine) return "";
  const numbers = [...dateLine.matchAll(/\b\d{3,}\b/g)].map((match) => match[0]);
  return numbers.at(-1) || "";
}

function findValueAfterLabel(lines, pattern) {
  const index = lines.findIndex((line) => pattern.test(line));
  if (index < 0) return "";
  const sameLine = lines[index].replace(pattern, "").replace(/^[:#\-\s]+/, "").trim();
  if (sameLine) return sameLine;
  return lines[index + 1] && !/description|qty|amount|special/i.test(lines[index + 1]) ? lines[index + 1] : "";
}

function parseSpecialInstructions(lines) {
  const start = lines.findIndex((line) => /special instructions/i.test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /p\.?o\.?\s*no|terms|description/i.test(line));
  return lines.slice(start + 1, end > start ? end : start + 5).join("\n");
}

function parseTotals(text, amounts) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const amountFromLine = (pattern) => {
    const line = lines.find((entry) => pattern.test(entry));
    if (!line) return 0;
    return amountsFromText(line).at(-1) || 0;
  };
  const customerTotalBalance = amountFromLine(/customer\s+total\s+balance/i);
  const paymentsCredits = amountFromLine(/payments\s*\/?\s*credits/i);
  const balanceDue = amountFromLine(/balance\s+due/i) || amounts.at(-1) || 0;
  const totalLine = lines.find((entry) => /^total\b/i.test(entry));
  const total = totalLine ? amountsFromText(totalLine).at(-1) || 0 : amounts.at(-3) || balanceDue;
  return { customerTotalBalance, total, paymentsCredits, balanceDue };
}

function parseLineItems(lines) {
  const items = [];
  const candidateLines = lines.filter((line) => !/invoice|bill to|date|terms|total|payments|balance|phone|fax|email|website|special instructions|description|qty|rate|amount|customer total/i.test(line));
  candidateLines.forEach((line) => {
    const amounts = amountsFromText(line);
    if (!amounts.length && !/andoro|delivery/i.test(line)) return;
    const numbers = [...line.matchAll(/\b\d+(?:\.\d+)?\b/g)].map((match) => Number(match[0]));
    const amount = amounts.at(-1) || 0;
    const rate = amounts.length > 1 ? amounts.at(-2) : amount;
    const qty = numbers.find((value) => value > 0 && value < 1000) || "";
    const unit = /\b(CS|EA|BX|LB|CT)\b/i.exec(line)?.[1]?.toUpperCase() || "";
    const description = line.replace(/\$?\s*[0-9,]+\.\d{2}/g, "").replace(/\b(CS|EA|BX|LB|CT)\b/gi, "").replace(/\s+\d+\s*$/, "").trim();
    if (description) items.push({ description, qty, unit, rate, amount });
  });
  return items.slice(0, 20);
}

function findCustomer(lines, invoiceNumber) {
  const ignored = /invoice|amount|total|balance|due|date|qty|quantity|description|address|bill to|ship to/i;
  const candidate = lines.find((line) => line.length > 2 && !ignored.test(line) && line !== invoiceNumber);
  return candidate || "Unknown customer";
}

function findAddress(lines) {
  const addressLine = lines.find((line) => /\d{2,6}\s+.+\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|hwy|highway)\b/i.test(line));
  if (!addressLine) return "";
  const index = lines.indexOf(addressLine);
  const next = lines[index + 1] || "";
  return /\b[A-Z]{2}\b\s*\d{5}/i.test(next) ? `${addressLine}, ${next}` : addressLine;
}

function normalizeDate(value) {
  const parts = value.replace(/-/g, "/").split("/");
  if (parts.length !== 3) return "";
  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
  const date = new Date(Number(year), Number(parts[0]) - 1, Number(parts[1]));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function optimizeStops() {
  const missingCoordinates = state.stops.filter((stop) => !Number(stop.lat) || !Number(stop.lng));
  if (missingCoordinates.length) {
    alert(`Find coordinates for ${missingCoordinates.length} stop${missingCoordinates.length === 1 ? "" : "s"} before optimizing.`);
    return;
  }
  const origin = {
    lat: Number(els.originLat.value || state.origin?.lat),
    lng: Number(els.originLng.value || state.origin?.lng)
  };
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    alert("Add a starting latitude and longitude first.");
    return;
  }
  state.origin = origin;
  const unvisited = [...state.stops];
  const route = [];
  let current = origin;
  while (unvisited.length) {
    unvisited.sort((a, b) => {
      const priorityA = a.priority === "high" ? -15 : a.priority === "low" ? 15 : 0;
      const priorityB = b.priority === "high" ? -15 : b.priority === "low" ? 15 : 0;
      return haversineMiles(current, a) + priorityA - (haversineMiles(current, b) + priorityB);
    });
    const next = unvisited.shift();
    route.push(next);
    current = next;
  }
  state.optimizedStopIds = route.map((stop) => stop.id);
  saveState();
  render();
}

function routeMiles(stops) {
  let current = state.origin;
  return stops.reduce((total, stop) => {
    const miles = current ? haversineMiles(current, stop) : 0;
    current = stop;
    return total + miles;
  }, 0);
}

function haversineMiles(a, b) {
  const radius = 3958.8;
  const dLat = degreesToRadians(Number(b.lat) - Number(a.lat));
  const dLng = degreesToRadians(Number(b.lng) - Number(a.lng));
  const lat1 = degreesToRadians(Number(a.lat));
  const lat2 = degreesToRadians(Number(b.lat));
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function googleMapsUrl(stops) {
  const points = [];
  if (state.origin) points.push(`${state.origin.lat},${state.origin.lng}`);
  points.push(...stops.map((stop) => encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`)));
  return `https://www.google.com/maps/dir/${points.join("/")}`;
}

function formatDate(value) {
  return value ? dateFormat.format(new Date(`${value}T00:00:00`)) : "No date";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function lineItemsToText(items = []) {
  return items.map((item) => [
    item.description || "",
    item.qty || "",
    item.unit || "",
    item.rate ?? "",
    item.amount ?? ""
  ].join(" | ")).join("\n");
}

function lineItemsFromText(text = "") {
  return text.split("\n").map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (!parts[0]) return null;
    return {
      description: parts[0],
      qty: parts[1] || "",
      unit: parts[2] || "",
      rate: Number(parts[3] || 0),
      amount: Number(parts[4] || parts[3] || 0)
    };
  }).filter(Boolean);
}

function resetInvoiceForm() {
  els.invoiceForm.reset();
  els.invoiceId.value = "";
  els.invoiceFormTitle.textContent = "Add Invoice";
  els.issueDate.value = todayOffset(0);
  els.invoiceTerms.value = "Net 10";
  els.customerTotalBalance.value = "";
  els.invoiceTotal.value = "";
  els.paymentsCredits.value = "";
  els.balanceDue.value = "";
}

function resetStopForm() {
  els.stopForm.reset();
  els.stopId.value = "";
  els.stopFormTitle.textContent = "Add Stop";
}

function saveInvoiceFromForm(event) {
  event.preventDefault();
  const items = lineItemsFromText(els.lineItemsText.value);
  const total = Number(els.invoiceTotal.value || els.invoiceAmount.value);
  const balanceDue = Number(els.balanceDue.value || total);
  const invoice = {
    id: els.invoiceId.value || crypto.randomUUID(),
    customer: els.customerName.value.trim(),
    address: els.serviceAddress.value.trim(),
    number: els.invoiceNumber.value.trim(),
    amount: balanceDue,
    invoiceDate: els.issueDate.value,
    terms: els.invoiceTerms.value.trim(),
    poNumber: els.poNumber.value.trim(),
    rep: els.invoiceRep.value.trim(),
    specialInstructions: els.specialInstructions.value.trim(),
    mainPhone: els.mainPhone.value.trim(),
    altPhone: els.altPhone.value.trim(),
    dt: els.invoiceDt.value.trim(),
    items,
    customerTotalBalance: Number(els.customerTotalBalance.value || 0),
    total,
    paymentsCredits: Number(els.paymentsCredits.value || 0),
    balanceDue
  };
  const index = state.invoices.findIndex((item) => item.id === invoice.id);
  if (index >= 0) state.invoices[index] = invoice;
  else state.invoices.unshift(invoice);
  saveState();
  resetInvoiceForm();
  render();
}

function saveStopFromForm(event) {
  event.preventDefault();
  const stop = {
    id: els.stopId.value || crypto.randomUUID(),
    name: els.stopName.value.trim(),
    address: els.stopAddress.value.trim(),
    lat: Number(els.stopLat.value),
    lng: Number(els.stopLng.value),
    priority: els.stopPriority.value
  };
  const index = state.stops.findIndex((item) => item.id === stop.id);
  if (index >= 0) state.stops[index] = stop;
  else state.stops.push(stop);
  state.optimizedStopIds = [];
  saveState();
  resetStopForm();
  render();
}

function attachEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
  document.querySelectorAll("[data-tab-jump]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tabJump)));
  els.invoiceForm.addEventListener("submit", saveInvoiceFromForm);
  els.clearInvoiceForm.addEventListener("click", resetInvoiceForm);
  els.invoiceSearch.addEventListener("input", renderInvoices);
  els.invoiceFilter.addEventListener("change", renderInvoices);
  els.stopForm.addEventListener("submit", saveStopFromForm);
  els.clearStopForm.addEventListener("click", resetStopForm);
  els.optimizeRoute.addEventListener("click", optimizeStops);
  els.useCurrentLocation.addEventListener("click", useCurrentLocation);
  els.stopsFromInvoices.addEventListener("click", buildStopsFromInvoices);
  els.geocodeStops.addEventListener("click", geocodeStops);
  els.exportData.addEventListener("click", exportData);
  els.importData.addEventListener("change", importData);
  els.resetData.addEventListener("click", resetData);
  els.invoiceFiles.addEventListener("change", handlePhotoSelection);
  els.invoiceCamera.addEventListener("change", handlePhotoSelection);
  els.processPhotos.addEventListener("click", processPhotos);
  els.clearScanQueue.addEventListener("click", clearScans);
  els.saveScannedInvoices.addEventListener("click", saveScannedInvoices);

  document.addEventListener("click", (event) => {
    const editInvoice = event.target.closest("[data-edit-invoice]");
    const deleteInvoice = event.target.closest("[data-delete-invoice]");
    if (editInvoice) editInvoiceById(editInvoice.dataset.editInvoice);
    if (deleteInvoice) deleteInvoiceById(deleteInvoice.dataset.deleteInvoice);
  });

  document.addEventListener("input", (event) => {
    const field = event.target.dataset.scanField;
    const id = event.target.dataset.scanId;
    if (!field || !id) return;
    const scan = state.scans.find((item) => item.id === id);
    if (!scan) return;
    if (["amount", "customerTotalBalance", "total", "paymentsCredits", "balanceDue"].includes(field)) {
      scan[field] = Number(event.target.value);
    } else if (field === "itemsText") {
      scan.itemsText = event.target.value;
      scan.items = lineItemsFromText(event.target.value);
    } else {
      scan[field] = event.target.value;
    }
    saveState();
  });

  document.addEventListener("change", (event) => {
    const id = event.target.dataset.scanAccepted;
    if (!id) return;
    const scan = state.scans.find((item) => item.id === id);
    if (!scan) return;
    scan.accepted = event.target.checked;
    saveState();
    renderScans();
  });
}

function editInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  els.invoiceId.value = invoice.id;
  els.customerName.value = invoice.customer;
  els.serviceAddress.value = invoice.address || "";
  els.invoiceNumber.value = invoice.number;
  els.invoiceAmount.value = invoiceBalance(invoice);
  els.issueDate.value = invoiceDate(invoice);
  els.invoiceTerms.value = invoice.terms || "";
  els.poNumber.value = invoice.poNumber || "";
  els.invoiceRep.value = invoice.rep || "";
  els.specialInstructions.value = invoice.specialInstructions || "";
  els.mainPhone.value = invoice.mainPhone || "";
  els.altPhone.value = invoice.altPhone || "";
  els.invoiceDt.value = invoice.dt || "";
  els.lineItemsText.value = lineItemsToText(invoice.items);
  els.customerTotalBalance.value = invoice.customerTotalBalance || "";
  els.invoiceTotal.value = invoiceTotal(invoice) || "";
  els.paymentsCredits.value = invoice.paymentsCredits || "";
  els.balanceDue.value = invoiceBalance(invoice) || "";
  els.invoiceFormTitle.textContent = "Edit Invoice";
  setTab("invoices");
}

function deleteInvoiceById(id) {
  if (!confirm("Delete this invoice?")) return;
  state.invoices = state.invoices.filter((invoice) => invoice.id !== id);
  saveState();
  render();
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Location is not available in this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    state.origin = {
      lat: Number(position.coords.latitude.toFixed(6)),
      lng: Number(position.coords.longitude.toFixed(6))
    };
    saveState();
    render();
  }, () => alert("Could not read your location."));
}

function buildStopsFromInvoices() {
  const invoicesWithAddress = state.invoices.filter((invoice) => invoice.address);
  const existingAddresses = new Set(state.stops.map((stop) => stop.address.toLowerCase()));
  const newStops = invoicesWithAddress
    .filter((invoice) => !existingAddresses.has(invoice.address.toLowerCase()))
    .map((invoice) => ({
      id: crypto.randomUUID(),
      name: invoice.customer,
      address: invoice.address,
      lat: 0,
      lng: 0,
      priority: invoiceBalance(invoice) > 0 ? "high" : "normal"
    }));
  state.stops.push(...newStops);
  state.optimizedStopIds = [];
  saveState();
  render();
  alert(`${newStops.length} invoice address${newStops.length === 1 ? "" : "es"} added as route stops. Use Find coordinates before optimizing.`);
}

async function geocodeStops() {
  const missing = state.stops.filter((stop) => stop.address && (!Number(stop.lat) || !Number(stop.lng)));
  if (!missing.length) {
    alert("All route stops already have coordinates.");
    return;
  }
  els.geocodeStops.disabled = true;
  els.geocodeStops.textContent = "Finding...";
  let updated = 0;
  for (const stop of missing) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(stop.address)}`;
      const response = await fetch(url);
      const results = await response.json();
      if (results[0]) {
        stop.lat = Number(results[0].lat);
        stop.lng = Number(results[0].lon);
        updated += 1;
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch {
      // Keep going so one hard-to-read invoice address does not stop the batch.
    }
  }
  els.geocodeStops.disabled = false;
  els.geocodeStops.textContent = "Find coordinates";
  state.optimizedStopIds = [];
  saveState();
  render();
  alert(`Coordinates found for ${updated} of ${missing.length} stop${missing.length === 1 ? "" : "s"}.`);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `andoro-invoice-route-backup-${todayOffset(0)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(reader.result);
      saveState();
      render();
    } catch {
      alert("That backup file could not be imported.");
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("Reset all local invoice and route data?")) return;
  state = structuredClone(sampleData);
  saveState();
  render();
}

function handlePhotoSelection(event) {
  selectedFiles = [...event.target.files];
  els.scanStatus.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`;
  els.photoGrid.replaceChildren();
  selectedFiles.forEach((file) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    if (file.type === "application/pdf") {
      const badge = document.createElement("div");
      badge.className = "file-preview";
      badge.textContent = "PDF";
      card.append(badge);
    } else {
      const img = document.createElement("img");
      img.alt = file.name;
      img.src = URL.createObjectURL(file);
      card.append(img);
    }
    const label = document.createElement("span");
    label.textContent = file.name;
    card.append(label);
    els.photoGrid.append(card);
  });
}

async function processPhotos() {
  if (!selectedFiles.length) {
    alert("Choose saved invoice files or photos first.");
    return;
  }
  if (!window.Tesseract) {
    alert("The photo reader could not load. Check your internet connection and try again.");
    return;
  }
  if (selectedFiles.some((file) => file.type === "application/pdf") && !window.pdfjsLib) {
    alert("The PDF reader could not load. Check your internet connection and try again.");
    return;
  }
  els.processPhotos.disabled = true;
  state.scans = [];
  for (const [index, file] of selectedFiles.entries()) {
    els.scanStatus.textContent = `Reading ${index + 1} of ${selectedFiles.length}: ${file.name}`;
    if (file.type === "application/pdf") {
      const pages = await readPdfInvoice(file);
      pages.forEach((page) => state.scans.push(parseInvoiceText(page.text, page.fileName)));
    } else {
      const text = await readImageInvoice(file, file.name);
      state.scans.push(parseInvoiceText(text, file.name));
    }
    saveState();
    renderScans();
  }
  els.processPhotos.disabled = false;
  els.scanStatus.textContent = `Finished reading ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`;
}

async function readImageInvoice(imageSource, label) {
  const result = await Tesseract.recognize(imageSource, "eng", {
    logger: (message) => {
      if (message.status === "recognizing text") {
        els.scanStatus.textContent = `Reading ${label}: ${Math.round(message.progress * 100)}%`;
      }
    }
  });
  return result.data.text;
}

async function readPdfInvoice(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    els.scanStatus.textContent = `Reading ${file.name}: page ${pageNumber} of ${pdf.numPages}`;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const image = canvas.toDataURL("image/png");
    const text = await readImageInvoice(image, `${file.name} page ${pageNumber}`);
    pages.push({ text, fileName: `${file.name} page ${pageNumber}` });
  }
  return pages;
}

function clearScans() {
  selectedFiles = [];
  state.scans = [];
  els.invoiceFiles.value = "";
  els.invoiceCamera.value = "";
  els.photoGrid.replaceChildren();
  els.scanStatus.textContent = "No files selected";
  saveState();
  renderScans();
}

function saveScannedInvoices() {
  const accepted = state.scans.filter((scan) => scan.accepted);
  const invoices = accepted.map((scan) => ({
    id: crypto.randomUUID(),
    customer: scan.customer || "Unknown customer",
    address: scan.address || "",
    number: scan.number || `SCAN-${Date.now()}`,
    amount: Number(scan.balanceDue ?? scan.total ?? scan.amount ?? 0),
    invoiceDate: scan.invoiceDate || todayOffset(0),
    terms: scan.terms || "",
    poNumber: scan.poNumber || "",
    charge: scan.charge || "",
    cash: scan.cash || "",
    rep: scan.rep || "",
    specialInstructions: scan.specialInstructions || "",
    mainPhone: scan.mainPhone || "",
    altPhone: scan.altPhone || "",
    dt: scan.dt || "",
    items: scan.items || lineItemsFromText(scan.itemsText),
    customerTotalBalance: Number(scan.customerTotalBalance || 0),
    total: Number(scan.total || 0),
    paymentsCredits: Number(scan.paymentsCredits || 0),
    balanceDue: Number(scan.balanceDue ?? scan.total ?? scan.amount ?? 0),
    sourceFile: scan.fileName || ""
  }));
  state.invoices.unshift(...invoices);
  saveState();
  render();
  setTab("invoices");
}

attachEvents();
resetInvoiceForm();
resetStopForm();
render();
