const STORAGE_KEY = "andoro_invoice_route_desk_v2";
const STORES_STORAGE_KEY = "andoro_saved_stores_v1";
const ACCESS_STORAGE_KEY = "andoro_invoice_access_ok_v1";
const ACCESS_CODE = "andoro1957";
const ROUTE_SLOT_COUNT = 25;
const TAB_HEADERS = {
  invoices: "Check Store Needs - Build Order - Get Signature - Print / Share",
  scan: "Route Organizer / Summary",
  stores: "Stores / Products / Account Rules",
  settings: "Office Contact / Backup / Reset"
};
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function catalogItem(description, upc = "", rate = 5, unit = "ea") {
  return { description, upc, unit, rate };
}

const catalog = {
  bacon12: catalogItem('Andoro 12" St Louis Style Bacon Pizza', "637599100059"),
  baconSausage12: catalogItem('Andoro 12" St. Louis Style Bacon/Sausage Pizza', "63759910006"),
  bbqChicken12: catalogItem('Andoro 12" St. Louis Style BBQ Bacon Chicken Pizza', "637599300046", 5.35),
  breakfast12: catalogItem('Andoro 12" St. Louis Style Breakfast', "637599300015", 5.35),
  buffaloChicken12: catalogItem('Andoro 12" St. Louis Style Buffalo Style Chicken', "637599300022", 5.35),
  cheese12: catalogItem('Andoro 12" St Louis Style Cheese Pizza', "637599100011"),
  combo12: catalogItem('Andoro 12" St Louis Style Combo Pizza', "637599100073"),
  megaMeat12: catalogItem('Andoro 12" St Louis Style Mega Meat Pizza', "637599100080"),
  pepperoni12: catalogItem('Andoro 12" St Louis Style Pepperoni Pizza', "637599100028"),
  sausage12: catalogItem('Andoro 12" St Louis Style Sausage Pizza', "6375991003"),
  spicySausage12: catalogItem('Andoro 12" St Louis Style Spicy Sausage Pizza', "637599100042"),
  supreme12: catalogItem('Andoro 12" St Louis Style Supreme Pizza', "637599100097"),
  taco12: catalogItem('Andoro 12" Walking Taco Pizza', "637599300053", 5.35),
  pepperoni9: catalogItem('Andoro 9" St Louis Style Pepperoni Pizza', "3759910011", 3.75),
  megaMeat9: catalogItem('Andoro 9" St Louis Style Mega Meat Pizza', "3759910017", 3.75),
  baconSausage9: catalogItem('Andoro 9" St Louis Style Bacon Sausage Pizza', "3759910015", 3.75),
  cheese9: catalogItem('Andoro 9" St Louis Style Cheese Pizza', "3759910010", 3.75),
  alfredoKit: catalogItem("J. Arcobasso Alfredo Sauce Pizza Kit", "632016976743", 5.5),
  buffaloKit: catalogItem("J. Arcobasso Buffalo Pizza Kit", "632016976750", 5.5),
  tomatoKit: catalogItem("J. Arcobasso Savory Tomato Pizza Kit", "632016976736", 5.5)
};

const standardTwelveInch = [
  catalog.bacon12,
  catalog.baconSausage12,
  catalog.cheese12,
  catalog.combo12,
  catalog.megaMeat12,
  catalog.pepperoni12,
  catalog.sausage12,
  catalog.spicySausage12,
  catalog.supreme12,
  catalog.bbqChicken12,
  catalog.breakfast12,
  catalog.buffaloChicken12
].map((item) => ({ ...item, rate: 5 }));

const hyVeeProducts = [
  catalog.pepperoni12,
  catalog.megaMeat12,
  catalog.combo12,
  catalog.sausage12,
  catalog.supreme12,
  catalog.baconSausage12,
  { ...catalog.buffaloChicken12, rate: 5 },
  { ...catalog.breakfast12, rate: 5 },
  { ...catalog.bbqChicken12, rate: 5 },
  catalog.taco12,
  catalog.spicySausage12,
  catalog.bacon12,
  catalog.cheese12,
  catalog.pepperoni9,
  catalog.megaMeat9,
  catalog.baconSausage9,
  catalog.cheese9
];

const delivery10 = catalogItem("Delivery Charge", "", 10);
const delivery15 = catalogItem("Delivery Charge", "", 15);
const PIZZAS_PER_CASE = 12;
const CASES_PER_SHELF = 2;
const DEFAULT_DELIVERY_FEE = 10;
const DEFAULT_REP = "J.Ballew";

const sampleData = {
  invoices: [],
  stops: [],
  optimizedStopIds: [],
  deletedStoreIds: [],
  routeDay: {
    date: "",
    rep: DEFAULT_REP,
    startingInvoiceNumber: "",
    notes: "",
    deliverySlots: [],
    receipts: [],
    prospects: []
  },
  origin: { lat: 41.8781, lng: -87.6298 },
  scans: [],
  stores: [
    {
      id: "store-mosers-ashland",
      name: "Mosers Foods - Ashland",
      orderBlocked: true,
      orderBlockedReason: "Lisa calls this account. Do not create an invoice for this store.",
      address: "Amy-Frozen Food Mgr\n109 Eastside Dr.\nAshland, MO 65010",
      terms: "Net 10",
      rep: "RRM",
      products: [...standardTwelveInch, delivery10]
    },
    {
      id: "store-mosers-fulton",
      name: "Mosers Foods- Fulton",
      orderBlocked: false,
      orderBlockedReason: "",
      address: "2020 N. Bluff\nFulton, MO 65251",
      terms: "Net 10",
      rep: "RRM",
      products: [...standardTwelveInch, catalogItem('Andoro 12" Loaded Baked Potato Pizza', "", 5.35), catalog.taco12, delivery10]
    },
    {
      id: "store-hyvee-osage-beach",
      name: "Hy-Vee (Osage Beach)",
      orderBlocked: false,
      orderBlockedReason: "",
      address: "997 Barry Prewitt Memorial DR\nOsage Beach, MO 65065",
      poNumber: "Using as Order Form",
      rep: "LC",
      products: hyVeeProducts
    },
    {
      id: "store-camdenton-sal",
      name: "Camdenton SAL",
      orderBlocked: true,
      orderBlockedReason: "This store sheet already has an invoice number. Lisa handles this account.",
      address: "709 N Business Rte 5\nCamdenton, MO 65020",
      products: [
        { ...catalog.supreme12, rate: 4.85 },
        { ...catalog.baconSausage12, rate: 4.85 },
        { ...catalog.taco12, rate: 5 },
        { ...catalog.bbqChicken12, rate: 5 },
        delivery15
      ]
    },
    {
      id: "store-woods-sunrise-beach",
      name: "Woods Supermarket- Sunrise Beach",
      orderBlocked: false,
      orderBlockedReason: "",
      address: "13655 N State Highway 5\nSunrise Beach, MO 65079",
      rep: "RRM",
      products: [...standardTwelveInch, delivery10]
    },
    {
      id: "store-woods-lake-ozark",
      name: "Wood's Supermarket",
      orderBlocked: true,
      orderBlockedReason: "This store sheet already has an invoice number. Lisa handles this account.",
      address: "2107 Bagnell Dam Blvd\nLake Ozark, MO 65049",
      products: [
        { ...catalog.bbqChicken12, rate: 5 },
        { ...catalog.buffaloChicken12, rate: 5 },
        catalog.baconSausage12,
        catalog.megaMeat12,
        catalog.spicySausage12,
        catalog.pepperoni12,
        catalog.supreme12,
        delivery10
      ]
    },
    {
      id: "store-hyvee-columbia-nifong",
      name: "Hy-Vee (Columbia- Nifong)",
      orderBlocked: false,
      orderBlockedReason: "",
      address: "405 E. Nifong Blvd.\nColumbia, MO 65201",
      rep: "RRM",
      products: hyVeeProducts
    },
    {
      id: "store-hyvee-columbia-1082",
      name: "Hy-Vee (Columbia) #1082",
      orderBlocked: false,
      orderBlockedReason: "",
      address: "Brian Hayes Frozen Food Mgr\n25 Conley Road\nColumbia, MO 65201",
      products: [
        catalog.pepperoni12,
        catalog.megaMeat12,
        catalog.spicySausage12,
        catalog.combo12,
        catalog.sausage12,
        catalog.supreme12,
        catalog.baconSausage12,
        catalog.bacon12,
        catalog.cheese12,
        catalog.buffaloChicken12,
        catalog.breakfast12,
        catalog.bbqChicken12,
        catalog.alfredoKit,
        catalog.buffaloKit,
        catalog.tomatoKit
      ]
    },
    {
      id: "store-st-louis-county-parks",
      name: "St. Louis County Parks",
      orderBlocked: true,
      orderBlockedReason: "This store sheet already has an invoice number. Lisa handles this account.",
      address: "550 Weidman Road\nManchester, MO 63011",
      products: [
        { ...catalog.pepperoni12, rate: 5.45 },
        { ...catalog.sausage12, rate: 5.7 },
        { ...catalog.cheese12, rate: 5.2 },
        catalogItem("Credit Card Processing Fee", "", 7.85),
        delivery15
      ]
    }
  ],
  settings: {
    officeEmail: "lisa@andoropizza.com",
    ryanEmail: "ryan@andoropizza.com",
    jasonEmail: "safetyjason78@gmail.com"
  }
};

let state = loadState();
let selectedFiles = [];
let signatureIsBlank = true;

const els = {
  accessScreen: document.querySelector("#accessScreen"),
  accessForm: document.querySelector("#accessForm"),
  accessCode: document.querySelector("#accessCode"),
  accessError: document.querySelector("#accessError"),
  appShell: document.querySelector("#appShell"),
  pageHeader: document.querySelector("#pageHeader"),
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
  storeSelect: document.querySelector("#storeSelect"),
  saveStore: document.querySelector("#saveStore"),
  storeProductList: document.querySelector("#storeProductList"),
  storeOrderNotice: document.querySelector("#storeOrderNotice"),
  storeManagerSearch: document.querySelector("#storeManagerSearch"),
  storeManagerList: document.querySelector("#storeManagerList"),
  storeManagerForm: document.querySelector("#storeManagerForm"),
  storeManagerTitle: document.querySelector("#storeManagerTitle"),
  storeManagerId: document.querySelector("#storeManagerId"),
  storeManagerName: document.querySelector("#storeManagerName"),
  storeManagerEmail: document.querySelector("#storeManagerEmail"),
  storeManagerAddress: document.querySelector("#storeManagerAddress"),
  storeManagerTerms: document.querySelector("#storeManagerTerms"),
  storeManagerPo: document.querySelector("#storeManagerPo"),
  storeManagerRep: document.querySelector("#storeManagerRep"),
  storeManagerDt: document.querySelector("#storeManagerDt"),
  storeManagerDeliveryFee: document.querySelector("#storeManagerDeliveryFee"),
  storeManagerMainPhone: document.querySelector("#storeManagerMainPhone"),
  storeManagerAltPhone: document.querySelector("#storeManagerAltPhone"),
  storeManagerInstructions: document.querySelector("#storeManagerInstructions"),
  storeManagerBlocked: document.querySelector("#storeManagerBlocked"),
  storeManagerBlockedReason: document.querySelector("#storeManagerBlockedReason"),
  storeManagerProducts: document.querySelector("#storeManagerProducts"),
  newStoreRecord: document.querySelector("#newStoreRecord"),
  clearStoreManager: document.querySelector("#clearStoreManager"),
  saveStoreManager: document.querySelector("#saveStoreManager"),
  deleteStoreManager: document.querySelector("#deleteStoreManager"),
  customerName: document.querySelector("#customerName"),
  customerEmail: document.querySelector("#customerEmail"),
  serviceAddress: document.querySelector("#serviceAddress"),
  invoiceNumber: document.querySelector("#invoiceNumber"),
  invoiceAmount: document.querySelector("#invoiceAmount"),
  issueDate: document.querySelector("#issueDate"),
  invoiceTerms: document.querySelector("#invoiceTerms"),
  poNumber: document.querySelector("#poNumber"),
  invoiceRep: document.querySelector("#invoiceRep"),
  invoiceCharge: document.querySelector("#invoiceCharge"),
  invoiceCash: document.querySelector("#invoiceCash"),
  specialInstructions: document.querySelector("#specialInstructions"),
  mainPhone: document.querySelector("#mainPhone"),
  altPhone: document.querySelector("#altPhone"),
  invoiceDt: document.querySelector("#invoiceDt"),
  itemDescription: document.querySelector("#itemDescription"),
  itemUpc: document.querySelector("#itemUpc"),
  itemQty: document.querySelector("#itemQty"),
  itemUnit: document.querySelector("#itemUnit"),
  itemRate: document.querySelector("#itemRate"),
  itemAmount: document.querySelector("#itemAmount"),
  addOrderItem: document.querySelector("#addOrderItem"),
  lineItemsText: document.querySelector("#lineItemsText"),
  deliveryFee: document.querySelector("#deliveryFee"),
  customerTotalBalance: document.querySelector("#customerTotalBalance"),
  invoiceTotal: document.querySelector("#invoiceTotal"),
  paymentsCredits: document.querySelector("#paymentsCredits"),
  balanceDue: document.querySelector("#balanceDue"),
  clearInvoiceForm: document.querySelector("#clearInvoiceForm"),
  customerSignaturePad: document.querySelector("#customerSignaturePad"),
  clearSignature: document.querySelector("#clearSignature"),
  saveAndPrintInvoice: document.querySelector("#saveAndPrintInvoice"),
  saveAndShareInvoice: document.querySelector("#saveAndShareInvoice"),
  saveInvoiceButton: document.querySelector("#saveInvoiceButton"),
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
  officeEmail: document.querySelector("#officeEmail"),
  ryanEmail: document.querySelector("#ryanEmail"),
  jasonEmail: document.querySelector("#jasonEmail"),
  saveOfficeSettings: document.querySelector("#saveOfficeSettings"),
  invoiceFiles: document.querySelector("#invoiceFiles"),
  invoiceCamera: document.querySelector("#invoiceCamera"),
  processPhotos: document.querySelector("#processPhotos"),
  clearScanQueue: document.querySelector("#clearScanQueue"),
  scanStatus: document.querySelector("#scanStatus"),
  photoGrid: document.querySelector("#photoGrid"),
  scanResults: document.querySelector("#scanResults"),
  scanSummary: document.querySelector("#scanSummary"),
  saveScannedInvoices: document.querySelector("#saveScannedInvoices"),
  routeDayDate: document.querySelector("#routeDayDate"),
  routeDayRep: document.querySelector("#routeDayRep"),
  routeStartInvoice: document.querySelector("#routeStartInvoice"),
  routeDayNotes: document.querySelector("#routeDayNotes"),
  routeDeliverySlots: document.querySelector("#routeDeliverySlots"),
  routeReceiptFiles: document.querySelector("#routeReceiptFiles"),
  routeReceiptCamera: document.querySelector("#routeReceiptCamera"),
  clearRouteReceipts: document.querySelector("#clearRouteReceipts"),
  routeReceiptGrid: document.querySelector("#routeReceiptGrid"),
  prospectName: document.querySelector("#prospectName"),
  prospectContact: document.querySelector("#prospectContact"),
  prospectAddress: document.querySelector("#prospectAddress"),
  prospectNotes: document.querySelector("#prospectNotes"),
  addProspectStop: document.querySelector("#addProspectStop"),
  prospectList: document.querySelector("#prospectList"),
  routeDayStatus: document.querySelector("#routeDayStatus"),
  routeDayMapsLink: document.querySelector("#routeDayMapsLink"),
  clearRouteDay: document.querySelector("#clearRouteDay"),
  buildRoute: document.querySelector("#buildRoute"),
  printRouteSummary: document.querySelector("#printRouteSummary")
};

function normalizeAccessCode(value = "") {
  return String(value).trim().toLowerCase();
}

function unlockApp() {
  els.appShell.hidden = false;
  document.body.classList.remove("access-locked");
  els.accessError.textContent = "";
}

function setupAccessGate() {
  if (localStorage.getItem(ACCESS_STORAGE_KEY) === "yes") {
    unlockApp();
    return;
  }
  els.accessCode.focus();
  els.accessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (normalizeAccessCode(els.accessCode.value) === ACCESS_CODE) {
      localStorage.setItem(ACCESS_STORAGE_KEY, "yes");
      unlockApp();
      return;
    }
    els.accessError.textContent = "Wrong code.";
    els.accessCode.select();
  });
}

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const savedStores = loadSavedStores();
  if (!saved) return normalizeState({ ...structuredClone(sampleData), stores: mergeStores(structuredClone(sampleData.stores), savedStores) });
  try {
    const parsed = JSON.parse(saved);
    return normalizeState({
      ...structuredClone(sampleData),
      ...parsed,
      stores: mergeStores(parsed.stores || [], savedStores),
      settings: { ...structuredClone(sampleData.settings), ...(parsed.settings || {}) }
    });
  } catch {
    return normalizeState({ ...structuredClone(sampleData), stores: mergeStores(structuredClone(sampleData.stores), savedStores) });
  }
}

function loadSavedStores() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORES_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function normalizeState(nextState) {
  nextState.routeDay = {
    ...structuredClone(sampleData.routeDay),
    ...(nextState.routeDay || {})
  };
  if (!nextState.routeDay.date) nextState.routeDay.date = todayOffset(0);
  if (!nextState.routeDay.rep) nextState.routeDay.rep = DEFAULT_REP;
  nextState.routeDay.deliverySlots = normalizeRouteDeliverySlots(nextState.routeDay.deliverySlots || []);
  nextState.invoices = (nextState.invoices || []).filter((invoice) => !isDemoInvoice(invoice));
  nextState.stops = (nextState.stops || []).filter((stop) => !["North Lake Supply", "Riverbend Builders"].includes(stop.name));
  nextState.deletedStoreIds = Array.isArray(nextState.deletedStoreIds) ? nextState.deletedStoreIds : [];
  const deletedStoreIds = new Set(nextState.deletedStoreIds);
  const seededStores = structuredClone(sampleData.stores).filter((store) => !deletedStoreIds.has(store.id));
  nextState.stores = mergeStores(seededStores, nextState.stores || [])
    .filter((store) => !deletedStoreIds.has(store.id))
    .map((store) => ({ ...store, name: formatStoreName(store.name, store.address) }));
  nextState.invoices.forEach((invoice) => mergeStoreFromInvoice(nextState, invoice));
  return nextState;
}

function normalizeRouteDeliverySlots(slots = []) {
  const bySlot = new Map((Array.isArray(slots) ? slots : [])
    .map((slot) => [Number(slot.slot), slot])
    .filter(([slot]) => slot >= 1 && slot <= ROUTE_SLOT_COUNT));
  return Array.from({ length: ROUTE_SLOT_COUNT }, (_, index) => {
    const slotNumber = index + 1;
    const existing = bySlot.get(slotNumber) || {};
    return {
      slot: slotNumber,
      storeId: existing.storeId || "",
      scanId: existing.scanId || ""
    };
  });
}

function routeDeliverySlots() {
  state.routeDay = {
    ...structuredClone(sampleData.routeDay),
    ...(state.routeDay || {})
  };
  state.routeDay.deliverySlots = normalizeRouteDeliverySlots(state.routeDay.deliverySlots || []);
  return state.routeDay.deliverySlots;
}

function routeDeliverySlot(slotNumber) {
  return routeDeliverySlots().find((slot) => Number(slot.slot) === Number(slotNumber));
}

function isDemoInvoice(invoice) {
  return ["North Lake Supply", "Riverbend Builders"].includes(invoice.customer)
    && ["INV-1001", "INV-1002"].includes(invoice.number);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(state.stores || []));
}

function setTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
  els.pageHeader.textContent = TAB_HEADERS[tabId] || TAB_HEADERS.invoices;
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

function lineItemTotal(items = []) {
  return (items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function invoiceTotal(invoice) {
  const explicitTotal = Number(invoice.total || invoice.amount || invoice.balanceDue || 0);
  if (Number.isFinite(explicitTotal) && explicitTotal > 0) return explicitTotal;
  const itemTotal = lineItemTotal(invoice.items || []);
  return Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : 0;
}

function routeDate() {
  return state.routeDay?.date || todayOffset(0);
}

function routeRep() {
  return state.routeDay?.rep || DEFAULT_REP;
}

function nextRouteInvoiceNumber(currentInvoiceId = "") {
  const start = Number(state.routeDay?.startingInvoiceNumber || 0);
  if (!start) return "";
  const usedToday = state.invoices
    .filter((invoice) => invoice.id !== currentInvoiceId && invoiceDate(invoice) === routeDate())
    .filter((invoice) => String(invoice.number || "").trim())
    .length;
  return String(start + usedToday);
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
  els.officeEmail.value = state.settings?.officeEmail || sampleData.settings.officeEmail;
  els.ryanEmail.value = state.settings?.ryanEmail || sampleData.settings.ryanEmail;
  els.jasonEmail.value = state.settings?.jasonEmail || sampleData.settings.jasonEmail;
  els.routeDayDate.value = routeDate();
  els.routeDayRep.value = routeRep();
  els.routeStartInvoice.value = state.routeDay?.startingInvoiceNumber || "";
  els.routeDayNotes.value = state.routeDay?.notes || "";

  renderAttention();
  renderStores();
  renderStoreManager();
  renderInvoices();
  renderRoute();
  renderScans();
  renderRouteDayCapture();
}

function renderStores() {
  const selected = els.storeSelect.value;
  els.storeSelect.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "New / unsaved store";
  els.storeSelect.append(empty);
  const stores = [...(state.stores || [])].sort((a, b) => a.name.localeCompare(b.name));
  stores.forEach((store) => {
    const option = document.createElement("option");
    option.value = store.id;
    option.textContent = store.name;
    els.storeSelect.append(option);
  });
  els.storeSelect.value = stores.some((store) => store.id === selected) ? selected : "";
  renderStoreProducts();
  renderStoreOrderNotice();
}

function selectedStore() {
  return (state.stores || []).find((store) => store.id === els.storeSelect.value);
}

function normalizedName(value = "") {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizedAddress(value = "") {
  return normalizedName(value)
    .replace(/\b(missouri|mo)\b/g, "mo")
    .replace(/\b(street|st)\b/g, "st")
    .replace(/\b(road|rd)\b/g, "rd")
    .replace(/\b(drive|dr)\b/g, "dr")
    .replace(/\b(boulevard|blvd)\b/g, "blvd")
    .replace(/\b(highway|hwy)\b/g, "hwy")
    .replace(/\s+/g, " ")
    .trim();
}

function addressParts(value = "") {
  const address = normalizedAddress(value);
  return {
    address,
    numbers: address.match(/\b\d+\b/g) || [],
    zip: address.match(/\b\d{5}\b/)?.[0] || "",
    streetNumber: address.match(/^\D*(\d+)/)?.[1] || "",
    words: address.split(" ").filter((word) => word.length > 2 && !/^\d+$/.test(word))
  };
}

function sameStoreAddress(a = "", b = "") {
  const left = addressParts(a);
  const right = addressParts(b);
  if (!left.address || !right.address) return false;
  if (left.address === right.address) return true;
  if (left.address.includes(right.address) || right.address.includes(left.address)) return true;
  if (left.streetNumber && right.streetNumber && left.streetNumber === right.streetNumber) {
    const sharedWords = left.words.filter((word) => right.words.includes(word));
    if (sharedWords.length >= 2) return true;
    if (left.zip && right.zip && left.zip === right.zip && sharedWords.length >= 1) return true;
  }
  return false;
}

function locationFromAddress(address = "") {
  const cityStateLine = String(address).split(/\n|,/).map((line) => line.trim()).find((line) => /\b[A-Z]{2}\s+\d{5}\b/i.test(line));
  if (!cityStateLine) return "";
  return cityStateLine.replace(/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/i, "").replace(/^[,\s]+|[,\s]+$/g, "").trim();
}

function formatStoreName(name = "", address = "") {
  const cleanName = String(name).replace(/\s+/g, " ").trim().replace(/^Hy,\s*Vee\b/i, "Hy-Vee");
  if (!cleanName || cleanName.includes(",")) return cleanName;
  const paren = cleanName.match(/^(.+?)\s*\((.+?)\)\s*(.*)$/);
  if (paren) {
    const location = paren[2].replace(/[-#]+/g, " ").replace(/\s+/g, " ").trim();
    const suffix = paren[3]?.trim();
    return `${paren[1].trim()}, ${[location, suffix].filter(Boolean).join(" ")}`;
  }
  const dash = cleanName.match(/^(.+?)\s*[-–]\s+(.+)$/);
  if (dash) return `${dash[1].trim()}, ${dash[2].trim()}`;
  const city = locationFromAddress(address);
  if (!city) return cleanName;
  const normalizedCity = normalizedName(city);
  const normalizedStore = normalizedName(cleanName);
  if (normalizedStore.startsWith(`${normalizedCity} `)) {
    const storePart = cleanName.slice(city.length).trim();
    return storePart ? `${storePart}, ${city}` : cleanName;
  }
  return normalizedStore.includes(normalizedCity) ? cleanName : `${cleanName}, ${city}`;
}

function cleanImportedCustomerName(value = "") {
  const lines = String(value).split(/\n|,/).map((line) => line.trim()).filter(Boolean);
  const blocked = /^(bill\s*to|invoice|date|invoice\s*#|special instructions|main tele|alt tele|d\/t|p\.?o\.?|terms|charge|cash|rep|description|qty|u\/m|rate|amount)$/i;
  return (lines.find((line) => !blocked.test(line) && !looksLikeAddressLine(line) && !/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(line)) || "").trim();
}

function looksLikeAddressLine(line = "") {
  return /^\d+\s+/.test(line) || /\b(mo|missouri|il|street|st\.?|road|rd\.?|drive|dr\.?|boulevard|blvd\.?|highway|hwy|trail|lane|ln\.?|route|rte)\b/i.test(line);
}

function storeMatchScore(store = {}, invoice = {}) {
  const storeName = normalizedName(store.name);
  const invoiceName = normalizedName(cleanImportedCustomerName(invoice.customer || ""));
  const storeAddress = normalizedAddress(store.address || "");
  const invoiceAddress = normalizedAddress(invoice.address || "");
  const invoiceText = normalizedName(invoice.rawText || "");
  let score = 0;
  if (storeName && invoiceName) {
    if (storeName === invoiceName) score += 100;
    else if (storeName.includes(invoiceName) || invoiceName.includes(storeName)) score += 70;
    else {
      const storeTokens = new Set(storeName.split(" ").filter((token) => token.length > 2));
      const invoiceTokens = invoiceName.split(" ").filter((token) => token.length > 2);
      const matches = invoiceTokens.filter((token) => storeTokens.has(token)).length;
      score += matches * 14;
    }
  }
  if (storeAddress && invoiceAddress) {
    if (sameStoreAddress(store.address || "", invoice.address || "")) score += 150;
    else if (storeAddress === invoiceAddress) score += 120;
    else if (storeAddress.includes(invoiceAddress) || invoiceAddress.includes(storeAddress)) score += 90;
    const storeNums = storeAddress.match(/\b\d+\b/g) || [];
    const invoiceNums = invoiceAddress.match(/\b\d+\b/g) || [];
    if (storeNums.some((num) => invoiceNums.includes(num))) score += 45;
    const storeCity = storeAddress.split(" ").slice(-3).join(" ");
    const invoiceCity = invoiceAddress.split(" ").slice(-3).join(" ");
    if (storeCity && invoiceCity && (storeCity.includes(invoiceCity) || invoiceCity.includes(storeCity))) score += 20;
  }
  if (invoiceText) {
    if (storeName && invoiceText.includes(storeName)) score += 90;
    const parts = addressParts(store.address || "");
    if (parts.streetNumber && invoiceText.includes(parts.streetNumber)) {
      const sharedWords = parts.words.filter((word) => invoiceText.includes(word));
      if (sharedWords.length >= 2) score += 140;
      else if (parts.zip && invoiceText.includes(parts.zip) && sharedWords.length >= 1) score += 120;
    }
  }
  return score;
}

function matchingStoreForInvoice(invoice = {}, stores = state.stores || []) {
  const ranked = [...stores]
    .map((store) => ({ store, score: storeMatchScore(store, invoice) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 70 ? ranked[0].store : null;
}

function canonicalizeImportedInvoice(invoice = {}, stores = state.stores || []) {
  const cleanedCustomer = cleanImportedCustomerName(invoice.customer || "") || invoice.customer || "";
  const candidate = { ...invoice, customer: cleanedCustomer };
  const store = stores.find((item) => item.id === invoice.matchedStoreId) || matchingStoreForInvoice(candidate, stores);
  if (!store) return { ...invoice, customer: cleanedCustomer };
  return {
    ...invoice,
    customer: store.name,
    customerEmail: invoice.customerEmail || store.email || "",
    address: store.address || invoice.address || "",
    terms: invoice.terms || store.terms || "",
    poNumber: invoice.poNumber || store.poNumber || "",
    rep: invoice.rep || store.rep || "",
    mainPhone: invoice.mainPhone || store.mainPhone || "",
    altPhone: invoice.altPhone || store.altPhone || "",
    dt: invoice.dt || store.dt || "",
    specialInstructions: invoice.specialInstructions || store.specialInstructions || "",
    matchedStoreId: store.id
  };
}

function routeScanForStore(store = selectedStore()) {
  if (!store?.name) return null;
  const storeName = normalizedName(store.name);
  return (state.scans || []).find((scan) => {
    const scanName = normalizedName(scan.customer);
    return scan.accepted !== false && scanName && (scanName === storeName || scanName.includes(storeName) || storeName.includes(scanName));
  }) || null;
}

function routeLisaOverride(store = selectedStore()) {
  const scan = routeScanForStore(store);
  return scan && typeof scan.lisaHandled === "boolean" ? scan.lisaHandled : null;
}

function scanLisaHandled(scan = {}) {
  if (typeof scan.lisaHandled === "boolean") return scan.lisaHandled;
  return Boolean(invoiceStore({ customer: scan.customer })?.orderBlocked);
}

function scanDelivered(scan = {}) {
  return scan.delivered !== false;
}

function applyStoreToScan(scan, store) {
  if (!scan || !store) return;
  scan.matchedStoreId = store.id;
  scan.customer = store.name || scan.customer;
  scan.customerEmail = scan.customerEmail || store.email || "";
  scan.address = store.address || scan.address || "";
  scan.terms = scan.terms || store.terms || "";
  scan.poNumber = scan.poNumber || store.poNumber || "";
  scan.rep = scan.rep || store.rep || "";
  scan.mainPhone = scan.mainPhone || store.mainPhone || "";
  scan.altPhone = scan.altPhone || store.altPhone || "";
  scan.dt = scan.dt || store.dt || "";
  scan.specialInstructions = scan.specialInstructions || store.specialInstructions || "";
  scan.lisaHandled = Boolean(store.orderBlocked);
  scan.importWarning = scan.number ? "" : "Needs invoice number";
  scan.accepted = Boolean(scan.number);
}

function storeBlocksOrders(store = selectedStore()) {
  const routeOverride = routeLisaOverride(store);
  if (routeOverride !== null) return routeOverride;
  return Boolean(store?.orderBlocked);
}

function orderBlockedMessage(store = selectedStore()) {
  if (routeLisaOverride(store)) return "Lisa handles this stop today. Do not create, print, or share a salesman order for this store.";
  return store?.orderBlockedReason || "This store is marked Lisa only. Do not create a salesman order for this store.";
}

function setInvoiceActionsEnabled(enabled) {
  [els.saveInvoiceButton, els.saveAndPrintInvoice, els.saveAndShareInvoice].forEach((button) => {
    button.disabled = !enabled;
  });
}

function renderStoreOrderNotice() {
  const store = selectedStore();
  const blocked = storeBlocksOrders(store);
  els.storeOrderNotice.hidden = !blocked;
  els.storeOrderNotice.textContent = blocked ? orderBlockedMessage(store) : "";
  setInvoiceActionsEnabled(!blocked);
}

function invoiceStore(invoice = {}) {
  return matchingStoreForInvoice(invoice);
}

function invoiceBlocksOrders(invoice = {}) {
  return storeBlocksOrders(invoiceStore(invoice));
}

function blockOrderAction(store = selectedStore()) {
  if (!storeBlocksOrders(store)) return false;
  alert(orderBlockedMessage(store));
  return true;
}

function productKey(product = {}) {
  const upc = String(product.upc || "").trim().toLowerCase();
  if (upc) return `upc:${upc}`;
  return `desc:${String(product.description || "").trim().toLowerCase()}|${String(product.unit || "").trim().toLowerCase()}`;
}

function normalizeProduct(item = {}) {
  return {
    id: productKey(item) || crypto.randomUUID(),
    description: String(item.description || "").trim(),
    upc: String(item.upc || "").trim(),
    unit: String(item.unit || "ea").trim() || "ea",
    rate: Number(item.rate || 0)
  };
}

function mergeProducts(products = [], items = []) {
  const byKey = new Map(products.map((product) => [productKey(product), normalizeProduct(product)]));
  items.forEach((item) => {
    if (!item.description) return;
    const product = normalizeProduct(item);
    const key = productKey(product);
    const existing = byKey.get(key) || {};
    byKey.set(key, {
      ...existing,
      ...product,
      rate: Number(product.rate || existing.rate || 0)
    });
  });
  return [...byKey.values()].sort((a, b) => a.description.localeCompare(b.description));
}

function mergeStores(baseStores = [], incomingStores = []) {
  const stores = [];
  const hasOwn = (item, key) => Object.prototype.hasOwnProperty.call(item, key);
  const upsertStore = (store) => {
    if (!store?.name) return;
    const formattedName = formatStoreName(store.name, store.address);
    const existingIndex = stores.findIndex((item) => item.id === store.id || item.name.toLowerCase() === formattedName.toLowerCase() || item.name.toLowerCase() === store.name.toLowerCase() || sameStoreAddress(item.address || "", store.address || ""));
    const existing = existingIndex >= 0 ? stores[existingIndex] : {};
    const incomingOrderRule = hasOwn(store, "orderBlocked");
    const incomingProducts = hasOwn(store, "products");
    const address = hasOwn(store, "address") ? store.address || "" : existing.address || "";
    const merged = {
      ...existing,
      ...store,
      id: existing.id || store.id || crypto.randomUUID(),
      name: formatStoreName(store.name || existing.name || formattedName, address),
      address,
      orderBlocked: incomingOrderRule ? Boolean(store.orderBlocked) : Boolean(existing.orderBlocked),
      orderBlockedReason: incomingOrderRule ? store.orderBlockedReason || "" : existing.orderBlockedReason || "",
      products: incomingProducts ? mergeProducts([], store.products || []) : mergeProducts(existing.products || [], [])
    };
    if (existingIndex >= 0) stores[existingIndex] = merged;
    else stores.push(merged);
  };
  baseStores.forEach((store) => {
    upsertStore({
      ...store,
      products: mergeProducts([], store.products || [])
    });
  });
  incomingStores.forEach(upsertStore);
  return stores.sort((a, b) => a.name.localeCompare(b.name));
}

function mergeStoreFromInvoice(targetState, invoice) {
  if (!invoice?.customer) return;
  targetState.stores = targetState.stores || [];
  const matched = matchingStoreForInvoice(invoice, targetState.stores);
  const existing = matched || targetState.stores.find((store) => store.name.toLowerCase() === invoice.customer.toLowerCase());
  const invoiceItems = invoice.items || [];
  const invoiceDelivery = invoiceItems.find(isDeliveryItem);
  const deliveryProducts = invoiceDelivery
    ? [{ description: "Delivery Charge", upc: "", unit: "ea", rate: Number(invoiceDelivery.amount || invoiceDelivery.rate || 0) }]
    : [];
  const store = {
    id: existing?.id || crypto.randomUUID(),
    name: formatStoreName(existing?.name || invoice.customer, invoice.address || existing?.address || ""),
    email: invoice.customerEmail || existing?.email || "",
    address: invoice.address || existing?.address || "",
    terms: invoice.terms || existing?.terms || "",
    poNumber: invoice.poNumber || existing?.poNumber || "",
    rep: invoice.rep || existing?.rep || "",
    orderBlocked: existing?.orderBlocked || Boolean(invoice.lisaHandled),
    orderBlockedReason: existing?.orderBlockedReason || "",
    mainPhone: invoice.mainPhone || existing?.mainPhone || "",
    altPhone: invoice.altPhone || existing?.altPhone || "",
    dt: invoice.dt || existing?.dt || "",
    specialInstructions: invoice.specialInstructions || existing?.specialInstructions || "",
    products: mergeProducts(existing?.products || [], [...invoiceItems, ...deliveryProducts])
  };
  const index = targetState.stores.findIndex((item) => item.id === store.id);
  if (index >= 0) targetState.stores[index] = store;
  else targetState.stores.push(store);
}

function currentOrderMap() {
  return new Map(nonDeliveryItems(lineItemsFromText(els.lineItemsText.value)).map((item) => [productKey(item), item]));
}

function isDeliveryItem(item = {}) {
  return /delivery\s+charge|delivery\s+fee/i.test(item.description || "");
}

function nonDeliveryItems(items = []) {
  return items.filter((item) => !isDeliveryItem(item));
}

function deliveryFeeFromItems(items = [], fallback = DEFAULT_DELIVERY_FEE) {
  const delivery = items.find(isDeliveryItem);
  return delivery ? Number(delivery.amount || delivery.rate || 0) : fallback;
}

function storeDeliveryFee(store = selectedStore()) {
  return store ? deliveryFeeFromItems(store.products || []) : DEFAULT_DELIVERY_FEE;
}

function itemsWithDelivery(items = []) {
  const deliveryFee = Number(els.deliveryFee?.value || 0);
  const cleanItems = nonDeliveryItems(items);
  if (deliveryFee > 0) {
    cleanItems.push({
      description: "Delivery Charge",
      upc: "",
      qty: "1",
      unit: "ea",
      rate: deliveryFee,
      amount: deliveryFee
    });
  }
  return cleanItems;
}

function productCaseSize(product = {}) {
  const description = String(product.description || "").toLowerCase();
  if (/delivery|fee|charge|subtotal|credit/.test(description)) return 1;
  return /pizza|andoro\s+(?:9|12)"|st\.?\s*louis\s*style/.test(description) ? PIZZAS_PER_CASE : 1;
}

function productShelfLabel(qty, caseSize) {
  if (caseSize <= 1) return "";
  const cases = Number(qty || 0) / caseSize;
  const shelves = cases / CASES_PER_SHELF;
  const caseText = `${cases.toFixed(cases % 1 === 0 ? 0 : 1)} case${cases === 1 ? "" : "s"}`;
  const shelfText = `${shelves.toFixed(shelves % 1 === 0 ? 0 : 1)} ${shelves === 1 ? "shelf" : "shelves"}`;
  return `${caseText} / ${shelfText}`;
}

function adjustStoreProductQty(button) {
  const input = [...els.storeProductList.querySelectorAll("[data-store-product]")]
    .find((field) => field.dataset.storeProduct === button.dataset.caseKey);
  if (!input) return;
  const increment = Number(button.dataset.caseIncrement || PIZZAS_PER_CASE);
  const nextValue = Math.max(0, Number(input.value || 0) + increment);
  input.value = String(nextValue);
  updateOrderFromStoreProducts();
}

function renderStoreProducts() {
  els.storeProductList.replaceChildren();
  const store = selectedStore();
  if (!store) {
    els.storeProductList.innerHTML = `<div class="muted">Select a store to show its available products.</div>`;
    return;
  }
  const products = (store.products || []).filter((product) => !isDeliveryItem(product));
  if (!products.length) {
    els.storeProductList.innerHTML = `<div class="muted">No products saved for this store yet. Add products below, then save the invoice.</div>`;
    return;
  }
  const current = currentOrderMap();
  const title = document.createElement("div");
  title.className = "store-products-title";
  title.textContent = "Available products for this store";
  els.storeProductList.append(title);
  products.forEach((product) => {
    const key = productKey(product);
    const item = current.get(key);
    const qty = item?.qty ?? "0";
    const caseSize = productCaseSize(product);
    const shelfLabel = productShelfLabel(qty, caseSize);
    const row = document.createElement("div");
    row.className = "store-product-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(product.description)}</strong>
        <span>${product.upc ? `UPC ${escapeHtml(product.upc)} - ` : ""}${escapeHtml(product.unit || "ea")} - ${money.format(Number(product.rate || 0))}</span>
        ${caseSize > 1 ? `<span class="case-note">1 case = ${caseSize}; 2 cases per shelf</span>` : ""}
      </div>
      <div class="qty-cell">
        ${caseSize > 1 ? `
          <button class="case-button" data-case-key="${escapeAttribute(key)}" data-case-increment="-${caseSize}" type="button">- Case</button>
        ` : ""}
        <label>
          Qty
          <input data-store-product="${escapeAttribute(key)}" data-case-size="${caseSize}" inputmode="decimal" min="0" step="${caseSize > 1 ? caseSize : "0.01"}" type="number" value="${escapeAttribute(qty)}">
        </label>
        ${caseSize > 1 ? `
          <button class="case-button" data-case-key="${escapeAttribute(key)}" data-case-increment="${caseSize}" type="button">+ Case</button>
          <span class="shelf-count">${escapeHtml(shelfLabel)}</span>
        ` : ""}
      </div>
    `;
    els.storeProductList.append(row);
  });
}

function updateOrderFromStoreProducts() {
  const store = selectedStore();
  if (!store) return;
  const rows = [...els.storeProductList.querySelectorAll("[data-store-product]")];
  const qtyByKey = new Map(rows.map((input) => [input.dataset.storeProduct, input.value || "0"]));
  rows.forEach((input) => {
    const label = input.closest(".qty-cell")?.querySelector(".shelf-count");
    if (label) label.textContent = productShelfLabel(input.value, Number(input.dataset.caseSize || 1));
  });
  const items = (store.products || []).filter((product) => !isDeliveryItem(product)).map((product) => {
    const qty = qtyByKey.get(productKey(product)) || "0";
    const rate = Number(product.rate || 0);
    const amount = Number(qty || 0) * rate;
    return {
      description: product.description,
      upc: product.upc || "",
      qty,
      unit: product.unit || "ea",
      rate,
      amount
    };
  });
  els.lineItemsText.value = lineItemsToText(itemsWithDelivery(items));
  updateTotalsFromLineItems();
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
      invoice.customerEmail,
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
    tr.innerHTML = `<td colspan="7"><div class="empty-state"><strong>No invoices found</strong><span>Add or scan invoices to fill the ledger.</span></div></td>`;
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
        <button class="icon-action" data-email-invoice="${invoice.id}" type="button">Customer</button>
        <button class="icon-action" data-office-invoice="${invoice.id}" type="button">Office</button>
        <button class="icon-action" data-share-invoice="${invoice.id}" type="button">Share</button>
        <button class="icon-action" data-print-invoice="${invoice.id}" type="button">Print</button>
      </div></td>
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
    renderRouteDeliverySlots();
    renderRouteDayStatus();
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
    const lisaHandled = scanLisaHandled(scan);
    const delivered = scanDelivered(scan);
    const matchedStore = scan.matchedStoreId
      ? (state.stores || []).find((store) => store.id === scan.matchedStoreId)
      : invoiceStore(scan);
    const canCreateStore = Boolean(scan.customer && scan.address);
    const importReady = Boolean(scan.number && (matchedStore || canCreateStore));
    const storeOptions = [
      `<option value="">Choose store match</option>`,
      ...(state.stores || []).map((store) => `<option value="${escapeAttribute(store.id)}" ${store.id === matchedStore?.id ? "selected" : ""}>${escapeHtml(store.name)}</option>`)
    ].join("");
    const card = document.createElement("article");
    card.className = "scan-card";
    card.innerHTML = `
      <header>
        <strong>${escapeHtml(scan.fileName || "Invoice photo")}</strong>
        <label><input data-scan-accepted="${scan.id}" type="checkbox" ${scan.accepted ? "checked" : ""} ${importReady ? "" : "disabled"}> Accept</label>
      </header>
      <div class="import-status ${importReady ? "ready" : "needs-review"}">${importReady ? `${matchedStore ? `Matched: ${escapeHtml(matchedStore.name)}` : "Ready: will save as a new store"}` : escapeHtml(scan.importWarning || "Needs invoice number plus store/address before saving")}</div>
      <label>Matched saved store<select data-scan-store="${scan.id}">${storeOptions}</select></label>
      <div class="route-stop-tools">
        <label>Route order<input data-scan-field="routeOrder" data-scan-id="${scan.id}" inputmode="numeric" type="number" min="1" step="1" value="${escapeAttribute(scan.routeOrder || "")}"></label>
        <label class="checkbox-label"><input data-scan-lisa="${scan.id}" type="checkbox" ${lisaHandled ? "checked" : ""}> Lisa handles</label>
        <label class="checkbox-label"><input data-scan-delivered="${scan.id}" type="checkbox" ${delivered ? "checked" : ""}> Delivered</label>
      </div>
      <label>Stop notes<textarea data-scan-field="routeNote" data-scan-id="${scan.id}" placeholder="Notes for this stop">${escapeHtml(scan.routeNote || "")}</textarea></label>
      <div class="field-row">
        <label>Customer<input data-scan-field="customer" data-scan-id="${scan.id}" value="${escapeAttribute(scan.customer)}"></label>
        <label>Invoice #<input data-scan-field="number" data-scan-id="${scan.id}" value="${escapeAttribute(scan.number)}"></label>
      </div>
      <label>Customer email<input data-scan-field="customerEmail" data-scan-id="${scan.id}" type="email" value="${escapeAttribute(scan.customerEmail || "")}"></label>
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
  renderRouteDeliverySlots();
  renderRouteDayStatus();
}

function routeScans() {
  return [...(state.scans || [])]
    .filter((scan) => scan.accepted !== false)
    .sort((a, b) => {
      const orderA = Number(a.routeOrder || 9999);
      const orderB = Number(b.routeOrder || 9999);
      if (orderA !== orderB) return orderA - orderB;
      return String(a.customer || "").localeCompare(String(b.customer || ""));
    });
}

function scanLabel(scan = {}) {
  return [scan.customer || "Invoice", scan.number ? `#${scan.number}` : "", scan.fileName || ""].filter(Boolean).join(" - ");
}

function storeOptionsHtml(selectedId = "") {
  return [
    `<option value="">Select store</option>`,
    ...(state.stores || []).map((store) => `<option value="${escapeAttribute(store.id)}" ${store.id === selectedId ? "selected" : ""}>${escapeHtml(store.name)}</option>`)
  ].join("");
}

function scansByRouteSlot() {
  return new Map(routeScans()
    .filter((scan) => Number(scan.routeOrder) >= 1 && Number(scan.routeOrder) <= ROUTE_SLOT_COUNT)
    .map((scan) => [Number(scan.routeOrder), scan]));
}

function renderRouteDeliverySlots() {
  if (!els.routeDeliverySlots) return;
  const assigned = scansByRouteSlot();
  const slots = routeDeliverySlots();
  els.routeDeliverySlots.replaceChildren();
  for (const slotRecord of slots) {
    const slot = Number(slotRecord.slot);
    const scan = (state.scans || []).find((item) => item.id === slotRecord.scanId) || assigned.get(slot);
    const selectedStoreId = slotRecord.storeId || scan?.matchedStoreId || "";
    const selectedStore = (state.stores || []).find((store) => store.id === selectedStoreId);
    const scanStatus = scan
      ? [scanLabel(scan), scan.number ? "read" : "needs invoice #", scanLisaHandled(scan) ? "Lisa handles" : "Salesman order", scanDelivered(scan) ? "Delivered" : "Not delivered"].filter(Boolean).join(" - ")
      : "Select the store, then attach this stop's invoice.";
    const row = document.createElement("article");
    row.className = `route-slot${scan ? " filled" : ""}${selectedStore ? " store-selected" : ""}`;
    row.innerHTML = `
      <strong>${slot}</strong>
      <div class="route-slot-body">
        <label>
          Store
          <select data-route-slot-store="${slot}" aria-label="Delivery spot ${slot} store">${storeOptionsHtml(selectedStoreId)}</select>
        </label>
        <span>${escapeHtml(scanStatus)}</span>
      </div>
      <label class="file-button compact-file-button">
        Attach invoice
        <input data-route-slot-file="${slot}" accept="image/*,application/pdf" type="file">
      </label>
      ${scan ? `<label class="checkbox-label route-delivered-toggle"><input data-scan-delivered="${scan.id}" type="checkbox" ${scanDelivered(scan) ? "checked" : ""}> Delivered</label>` : ""}
      ${scan ? `<button class="ghost-button compact-slot-button" data-clear-route-slot="${slot}" type="button">Clear</button>` : ""}
    `;
    els.routeDeliverySlots.append(row);
  }
}

function renderRouteDayStatus() {
  const prospectsWithAddress = (state.routeDay?.prospects || []).filter((prospect) => prospect.address);
  const stops = [
    ...routeScans().filter((scan) => scan.address).map((scan) => ({
      name: scan.customer || "Stop",
      address: scan.address
    })),
    ...prospectsWithAddress.map((prospect) => ({
      name: prospect.name || "New account stop",
      address: prospect.address
    }))
  ];
  const orderedCount = routeScans().length;
  const prospectCount = state.routeDay?.prospects?.length || 0;
  const lisaCount = routeScans().filter((scan) => scanLisaHandled(scan)).length;
  const deliveredCount = routeScans().filter((scan) => scanDelivered(scan)).length;
  els.routeDayStatus.textContent = orderedCount
    ? `${orderedCount} route stop${orderedCount === 1 ? "" : "s"} loaded, ${deliveredCount} delivered, ${lisaCount} Lisa handled, ${prospectCount} new account stop${prospectCount === 1 ? "" : "s"}`
    : `${prospectCount} new account stop${prospectCount === 1 ? "" : "s"}`;
  if (!stops.length) {
    els.routeDayMapsLink.classList.add("disabled");
    els.routeDayMapsLink.href = "#";
    return;
  }
  els.routeDayMapsLink.href = googleMapsUrl(stops);
  els.routeDayMapsLink.classList.remove("disabled");
}

function renderRouteDayCapture() {
  renderRouteDeliverySlots();
  const receipts = state.routeDay?.receipts || [];
  els.routeReceiptGrid.replaceChildren();
  if (!receipts.length) {
    els.routeReceiptGrid.append(emptyState());
  } else {
    receipts.forEach((receipt) => {
      const card = document.createElement("article");
      card.className = "receipt-card";
      const preview = receipt.dataUrl?.startsWith("data:image/")
        ? `<img src="${escapeAttribute(receipt.dataUrl)}" alt="${escapeAttribute(receipt.name || "Receipt")}">`
        : `<div class="file-preview">PDF</div>`;
      card.innerHTML = `
        ${preview}
        <div>
          <strong>${escapeHtml(receipt.name || "Receipt")}</strong>
          <button class="ghost-button" data-delete-receipt="${receipt.id}" type="button">Remove</button>
        </div>`;
      els.routeReceiptGrid.append(card);
    });
  }

  const prospects = state.routeDay?.prospects || [];
  els.prospectList.replaceChildren();
  if (!prospects.length) {
    els.prospectList.append(emptyState());
  } else {
    prospects.forEach((prospect, index) => {
      const card = document.createElement("article");
      card.className = "prospect-card";
      card.innerHTML = `
        <div>
          <strong>${escapeHtml(prospect.name || `New account stop ${index + 1}`)}</strong>
          <span>${escapeHtml([prospect.contact, prospect.address].filter(Boolean).join(" - "))}</span>
          ${prospect.notes ? `<p>${escapeHtml(prospect.notes)}</p>` : ""}
        </div>
        <button class="ghost-button" data-delete-prospect="${prospect.id}" type="button">Remove</button>`;
      els.prospectList.append(card);
    });
  }
  renderRouteDayStatus();
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
  const rawCustomer = billTo.customer || findCustomer(lines, invoiceNumber);
  const imported = canonicalizeImportedInvoice({
    customer: rawCustomer,
    address: billTo.address || findAddress(lines),
    customerEmail: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "",
    terms,
    poNumber: findValueAfterLabel(lines, /p\.?o\.?\s*no/i),
    rep: findValueAfterLabel(lines, /^rep$/i) || text.match(/\bRep\s+([A-Z]{1,4})\b/i)?.[1] || "",
    specialInstructions: parseSpecialInstructions(lines),
    mainPhone: text.match(/Main\s+Tele[:\s]+([0-9()\-\s]+)/i)?.[1]?.trim() || "",
    altPhone: text.match(/Alt\s+Tele[:\s]+([0-9()\-\s]+)/i)?.[1]?.trim() || "",
    dt: text.match(/\bD\/T[:\s]*([^\n]+)/i)?.[1]?.trim() || "",
    rawText: text
  });
  const matchedStore = invoiceStore(imported);
  return {
    id: crypto.randomUUID(),
    accepted: Boolean(matchedStore && invoiceNumber),
    fileName,
    customer: imported.customer,
    matchedStoreId: matchedStore?.id || imported.matchedStoreId || "",
    importWarning: !matchedStore ? "Needs store match" : !invoiceNumber ? "Needs invoice number" : "",
    lisaHandled: Boolean(matchedStore?.orderBlocked),
    delivered: true,
    customerEmail: imported.customerEmail || "",
    address: imported.address || "",
    number: invoiceNumber,
    invoiceDate: dateMatches[0] || todayOffset(0),
    terms: imported.terms || "",
    poNumber: imported.poNumber || "",
    charge: findValueAfterLabel(lines, /^charge$/i),
    cash: findValueAfterLabel(lines, /^cash$/i),
    rep: imported.rep || "",
    specialInstructions: imported.specialInstructions || "",
    mainPhone: imported.mainPhone || "",
    altPhone: imported.altPhone || "",
    dt: imported.dt || "",
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
  const block = [];
  for (const line of lines.slice(billIndex + 1, billIndex + 8)) {
    if (/special instructions|p\.?o\.?|terms|description|qty|u\/m|rate|amount|invoice/i.test(line)) break;
    if (/^bill\s*to$/i.test(line)) continue;
    block.push(line);
  }
  const customerIndex = block.findIndex((line) => !looksLikeAddressLine(line));
  const customer = customerIndex >= 0 ? cleanImportedCustomerName(block[customerIndex]) : "";
  const address = block
    .filter((line, index) => index !== customerIndex)
    .filter((line) => looksLikeAddressLine(line) || /\b[A-Z]{2}\s+\d{5}\b/i.test(line))
    .join(", ");
  return { customer, address };
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
  const deliveryLine = lines.find((line) => /delivery\s+(charge|fee)/i.test(line));
  if (deliveryLine && !items.some(isDeliveryItem)) {
    const deliveryAmount = amountsFromText(deliveryLine).at(-1) || 0;
    items.push({
      description: "Delivery Charge",
      qty: "1",
      unit: "ea",
      rate: deliveryAmount,
      amount: deliveryAmount
    });
  }
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

function routeInvoices() {
  const scans = routeScans();
  const routeScanByInvoiceId = new Map(scans
    .filter((scan) => scan.savedInvoiceId && scanDelivered(scan))
    .map((scan) => [scan.savedInvoiceId, scan]));
  return state.invoices
    .filter((invoice) => routeScanByInvoiceId.has(invoice.id) && invoiceDate(invoice) === routeDate())
    .sort((a, b) => {
      const scanA = routeScanByInvoiceId.get(a.id);
      const scanB = routeScanByInvoiceId.get(b.id);
      return Number(scanA?.routeOrder || 9999) - Number(scanB?.routeOrder || 9999);
    });
}

function routeInvoiceForScan(scan = {}) {
  if (!scan.savedInvoiceId || !scanDelivered(scan)) return null;
  return state.invoices.find((invoice) => invoice.id === scan.savedInvoiceId && invoiceDate(invoice) === routeDate()) || null;
}

function routeDayTotal() {
  return routeInvoices().reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
}

function routeSummaryHtml() {
  const stops = routeScans();
  const receipts = state.routeDay?.receipts || [];
  const prospects = state.routeDay?.prospects || [];
  const prospectRows = prospects.map((prospect, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${escapeHtml(prospect.name || "New account stop")}</strong>
        <span>${escapeHtml(prospect.address || "")}</span>
      </td>
      <td>${escapeHtml(prospect.contact || "")}</td>
      <td>${escapeHtml(prospect.notes || "")}</td>
    </tr>`).join("");
  const receiptRows = receipts.map((receipt, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(receipt.name || "Receipt")}</td>
      <td>${escapeHtml(formatDate(receipt.date || routeDate()))}</td>
    </tr>`).join("");
  const stopRows = stops.map((scan, index) => {
    const storeName = scan.customer || `Stop ${index + 1}`;
    const invoice = routeInvoiceForScan(scan);
    const stopInvoiceTotal = invoice ? invoiceTotal(invoice) : 0;
    return `
      <tr>
        <td>${escapeHtml(scan.routeOrder || index + 1)}</td>
        <td>
          <strong>${escapeHtml(storeName)}</strong>
          <span>${escapeHtml(scan.address || "")}</span>
        </td>
        <td>${scanLisaHandled(scan) ? "Lisa" : "Salesman"}</td>
        <td>${scanDelivered(scan) ? "Yes" : "No"}</td>
        <td class="money">${money.format(stopInvoiceTotal)}</td>
        <td>${escapeHtml(scan.routeNote || "")}</td>
      </tr>`;
  }).join("");
  const invoiceRows = routeInvoices().map((invoice) => `
    <tr>
      <td>${escapeHtml(invoice.customer || "")}</td>
      <td>${escapeHtml(invoice.number || "")}</td>
      <td class="money">${money.format(invoiceTotal(invoice))}</td>
    </tr>`).join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Andoro Route Summary</title>
  <style>
    body { font-family: Arial, sans-serif; color: #10251d; margin: 0; background: #fff; }
    main { max-width: 8.5in; margin: 0 auto; padding: 0.35in; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #176b4d; padding-bottom: 14px; gap: 18px; }
    img { width: 150px; height: auto; }
    h1 { margin: 0; font-size: 30px; color: #0d3326; }
    .meta { text-align: right; line-height: 1.5; font-weight: 700; }
    .total { margin: 18px 0; padding: 14px; border: 2px solid #176b4d; display: flex; justify-content: space-between; font-size: 22px; font-weight: 900; }
    h2 { margin: 22px 0 8px; font-size: 18px; color: #0d3326; }
    .notes { border: 1px solid #176b4d; padding: 10px; min-height: 56px; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #b9d6c4; color: #0d3326; text-align: left; }
    th, td { border: 1px solid #176b4d; padding: 8px; vertical-align: top; }
    td span { display: block; color: #4d6158; margin-top: 3px; }
    .money { text-align: right; white-space: nowrap; }
    @media print { main { padding: 0.25in; } }
  </style>
</head>
<body>
  <main>
    <header>
      <img src="assets/andoro-pizza-logo.jpg" alt="Andoro & Sons Pizza">
      <div>
        <h1>Route Summary</h1>
        <div>Andoro & Sons Pizza</div>
      </div>
      <div class="meta">
        <div>${escapeHtml(formatDate(routeDate()))}</div>
        <div>Rep: ${escapeHtml(routeRep())}</div>
        <div>Starting invoice #: ${escapeHtml(state.routeDay?.startingInvoiceNumber || "")}</div>
      </div>
    </header>
    <section class="total"><span>Day Invoice Total</span><span>${money.format(routeDayTotal())}</span></section>
    <h2>Day Notes</h2>
    <section class="notes">${escapeHtml(state.routeDay?.notes || "No general day notes.").replace(/\n/g, "<br>")}</section>
    <h2>Stops And Notes</h2>
    <table>
      <thead><tr><th>Order</th><th>Store</th><th>Handled By</th><th>Delivered</th><th>Invoice Total Counted</th><th>Notes</th></tr></thead>
      <tbody>${stopRows || `<tr><td colspan="6">No route stops loaded.</td></tr>`}</tbody>
    </table>
    <h2>New Account Stops</h2>
    <table>
      <thead><tr><th>#</th><th>Business</th><th>Contact</th><th>Notes</th></tr></thead>
      <tbody>${prospectRows || `<tr><td colspan="4">No new account stops recorded.</td></tr>`}</tbody>
    </table>
    <h2>Gas / Expense Receipts</h2>
    <table>
      <thead><tr><th>#</th><th>Receipt</th><th>Date Added</th></tr></thead>
      <tbody>${receiptRows || `<tr><td colspan="3">No receipts captured.</td></tr>`}</tbody>
    </table>
    <h2>Today's Route Invoices</h2>
    <table>
      <thead><tr><th>Store</th><th>Invoice #</th><th>Invoice Total</th></tr></thead>
      <tbody>${invoiceRows || `<tr><td colspan="3">No route invoices saved for this date.</td></tr>`}</tbody>
    </table>
  </main>
</body>
</html>`;
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
    item.upc || "",
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
    if (parts.length >= 6) {
      return {
        description: parts[0],
        upc: parts[1] || "",
        qty: parts[2] || "",
        unit: parts[3] || "",
        rate: Number(parts[4] || 0),
        amount: Number(parts[5] || parts[4] || 0)
      };
    }
    return {
      description: parts[0],
      qty: parts[1] || "",
      unit: parts[2] || "",
      rate: Number(parts[3] || 0),
      amount: Number(parts[4] || parts[3] || 0)
    };
  }).filter(Boolean);
}

function updateItemAmount() {
  const qty = Number(els.itemQty.value || 0);
  const rate = Number(els.itemRate.value || 0);
  if (qty && rate) els.itemAmount.value = (qty * rate).toFixed(2);
}

function addOrderItem() {
  const description = els.itemDescription.value.trim();
  if (!description) {
    alert("Add an item description first.");
    return;
  }
  const qty = els.itemQty.value.trim();
  const rate = Number(els.itemRate.value || 0);
  const amount = Number(els.itemAmount.value || (Number(qty || 0) * rate));
  const item = {
    description,
    upc: els.itemUpc.value.trim(),
    qty,
    unit: els.itemUnit.value,
    rate,
    amount
  };
  const store = selectedStore();
  if (store) {
    store.products = mergeProducts(store.products || [], [item]);
    saveState();
  }
  const current = els.lineItemsText.value.trim();
  els.lineItemsText.value = [current, lineItemsToText([item])].filter(Boolean).join("\n");
  els.itemDescription.value = "";
  els.itemUpc.value = "";
  els.itemQty.value = "";
  els.itemRate.value = "";
  els.itemAmount.value = "";
  els.itemDescription.focus();
  updateTotalsFromLineItems();
  renderStoreProducts();
  if (store) updateOrderFromStoreProducts();
}

function updateTotalsFromLineItems() {
  const items = itemsWithDelivery(lineItemsFromText(els.lineItemsText.value));
  els.lineItemsText.value = lineItemsToText(items);
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  els.invoiceTotal.value = total ? total.toFixed(2) : "";
  els.invoiceAmount.value = total ? total.toFixed(2) : "";
  updateBalanceDue();
}

function updateBalanceDue() {
  const total = Number(els.invoiceTotal.value || els.invoiceAmount.value || 0);
  const credits = Number(els.paymentsCredits.value || 0);
  const balance = Math.max(total - credits, 0);
  els.balanceDue.value = balance ? balance.toFixed(2) : "";
}

function setupSignaturePad() {
  const canvas = els.customerSignaturePad;
  const context = canvas.getContext("2d");
  let drawing = false;
  let lastPoint = null;

  const resize = () => {
    const saved = signatureIsBlank ? "" : canvas.toDataURL("image/png");
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.lineWidth = 2.3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#10251d";
    if (saved) loadSignature(saved);
  };

  const pointFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const start = (event) => {
    event.preventDefault();
    drawing = true;
    lastPoint = pointFromEvent(event);
  };

  const draw = (event) => {
    if (!drawing || !lastPoint) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint = point;
    signatureIsBlank = false;
  };

  const stop = () => {
    drawing = false;
    lastPoint = null;
  };

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  canvas.addEventListener("pointerleave", stop);
  window.addEventListener("resize", resize);
  resize();
}

function clearSignaturePad() {
  const canvas = els.customerSignaturePad;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  signatureIsBlank = true;
}

function getSignatureData() {
  return signatureIsBlank ? "" : els.customerSignaturePad.toDataURL("image/png");
}

function loadSignature(dataUrl) {
  clearSignaturePad();
  if (!dataUrl) return;
  const image = new Image();
  image.onload = () => {
    const canvas = els.customerSignaturePad;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    context.drawImage(image, 0, 0, rect.width, rect.height);
    signatureIsBlank = false;
  };
  image.src = dataUrl;
}

function resetInvoiceForm() {
  els.invoiceForm.reset();
  els.invoiceId.value = "";
  els.invoiceFormTitle.textContent = "Add Invoice";
  els.storeSelect.value = "";
  els.invoiceNumber.value = nextRouteInvoiceNumber();
  els.issueDate.value = routeDate();
  els.invoiceTerms.value = "Net 10";
  els.invoiceRep.value = routeRep();
  els.deliveryFee.value = "";
  els.customerTotalBalance.value = "";
  els.invoiceTotal.value = "";
  els.paymentsCredits.value = "";
  els.balanceDue.value = "";
  clearSignaturePad();
  renderStoreProducts();
  renderStoreOrderNotice();
}

function storeFromForm(existingId = "") {
  const existing = (state.stores || []).find((store) => store.id === existingId);
  const address = els.serviceAddress.value.trim();
  return {
    id: existingId || crypto.randomUUID(),
    name: formatStoreName(els.customerName.value.trim(), address),
    email: els.customerEmail.value.trim(),
    address,
    terms: els.invoiceTerms.value.trim(),
    poNumber: els.poNumber.value.trim(),
    rep: els.invoiceRep.value.trim(),
    orderBlocked: existing?.orderBlocked || false,
    orderBlockedReason: existing?.orderBlockedReason || "",
    mainPhone: els.mainPhone.value.trim(),
    altPhone: els.altPhone.value.trim(),
    dt: els.invoiceDt.value.trim(),
    specialInstructions: els.specialInstructions.value.trim(),
    products: existing?.products || []
  };
}

function storeProductsToText(products = []) {
  return (products || [])
    .filter((product) => !isDeliveryItem(product))
    .map((product) => [
      product.description || "",
      product.upc || "",
      product.unit || "ea",
      product.rate ?? ""
    ].join(" | "))
    .join("\n");
}

function storeProductsFromText(text = "") {
  return text.split("\n").map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (!parts[0]) return null;
    return normalizeProduct({
      description: parts[0],
      upc: parts[1] || "",
      unit: parts[2] || "ea",
      rate: Number(parts[3] || 0)
    });
  }).filter(Boolean);
}

function renderStoreManager() {
  const query = normalizedName(els.storeManagerSearch?.value || "");
  const selectedId = els.storeManagerId?.value || "";
  const stores = [...(state.stores || [])]
    .filter((store) => !query || normalizedName(`${store.name} ${store.address}`).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
  els.storeManagerList.replaceChildren();
  if (!stores.length) {
    els.storeManagerList.append(emptyState());
    return;
  }
  stores.forEach((store) => {
    const button = document.createElement("button");
    button.className = `store-manager-item${store.id === selectedId ? " active" : ""}`;
    button.type = "button";
    button.dataset.storeManagerId = store.id;
    button.innerHTML = `
      <strong>${escapeHtml(store.name)}</strong>
      <span>${escapeHtml([store.address?.split("\n").at(-1), store.orderBlocked ? "Lisa handles" : "Salesman orders"].filter(Boolean).join(" - "))}</span>
      <small>${(store.products || []).filter((product) => !isDeliveryItem(product)).length} product${(store.products || []).length === 1 ? "" : "s"}</small>
    `;
    els.storeManagerList.append(button);
  });
}

function resetStoreManagerForm() {
  els.storeManagerForm.reset();
  els.storeManagerId.value = "";
  els.storeManagerTitle.textContent = "Add Store";
  els.storeManagerTerms.value = "Net 10";
  els.storeManagerRep.value = DEFAULT_REP;
  els.storeManagerDeliveryFee.value = "";
  renderStoreManager();
}

function editStoreManager(id) {
  const store = (state.stores || []).find((item) => item.id === id);
  if (!store) return;
  els.storeManagerId.value = store.id;
  els.storeManagerTitle.textContent = "Edit Store";
  els.storeManagerName.value = store.name || "";
  els.storeManagerEmail.value = store.email || "";
  els.storeManagerAddress.value = store.address || "";
  els.storeManagerTerms.value = store.terms || "";
  els.storeManagerPo.value = store.poNumber || "";
  els.storeManagerRep.value = store.rep || "";
  els.storeManagerDt.value = store.dt || "";
  els.storeManagerDeliveryFee.value = storeDeliveryFee(store).toFixed(2);
  els.storeManagerMainPhone.value = store.mainPhone || "";
  els.storeManagerAltPhone.value = store.altPhone || "";
  els.storeManagerInstructions.value = store.specialInstructions || "";
  els.storeManagerBlocked.checked = Boolean(store.orderBlocked);
  els.storeManagerBlockedReason.value = store.orderBlockedReason || "";
  els.storeManagerProducts.value = storeProductsToText(store.products || []);
  renderStoreManager();
}

function storeFromManagerForm() {
  const existing = (state.stores || []).find((store) => store.id === els.storeManagerId.value);
  const deliveryFee = Number(els.storeManagerDeliveryFee.value || 0);
  const address = els.storeManagerAddress.value.trim();
  const deliveryProducts = deliveryFee > 0
    ? [{ description: "Delivery Charge", upc: "", unit: "ea", rate: deliveryFee }]
    : [];
  return {
    id: els.storeManagerId.value || crypto.randomUUID(),
    name: formatStoreName(els.storeManagerName.value.trim(), address),
    email: els.storeManagerEmail.value.trim(),
    address,
    terms: els.storeManagerTerms.value.trim(),
    poNumber: els.storeManagerPo.value.trim(),
    rep: els.storeManagerRep.value.trim(),
    dt: els.storeManagerDt.value.trim(),
    mainPhone: els.storeManagerMainPhone.value.trim(),
    altPhone: els.storeManagerAltPhone.value.trim(),
    specialInstructions: els.storeManagerInstructions.value.trim(),
    orderBlocked: els.storeManagerBlocked.checked,
    orderBlockedReason: els.storeManagerBlockedReason.value.trim(),
    products: mergeProducts([], [...storeProductsFromText(els.storeManagerProducts.value), ...deliveryProducts])
  };
}

function saveStoreManagerForm(event) {
  event.preventDefault();
  if (!els.storeManagerName.value.trim()) {
    alert("Enter the store name first.");
    els.storeManagerName.focus();
    return;
  }
  const store = storeFromManagerForm();
  const duplicate = (state.stores || []).find((item) => item.id !== store.id && (item.name.toLowerCase() === store.name.toLowerCase() || sameStoreAddress(item.address || "", store.address || "")));
  if (duplicate && !confirm("A store with that name or address already exists. Save this one anyway?")) return;
  state.stores = state.stores || [];
  const index = state.stores.findIndex((item) => item.id === store.id);
  if (index >= 0) state.stores[index] = store;
  else state.stores.push(store);
  state.stores = mergeStores([], state.stores);
  saveState();
  renderStores();
  editStoreManager(store.id);
  alert("Store saved.");
}

function deleteStoreManager() {
  const id = els.storeManagerId.value;
  if (!id) return;
  const store = (state.stores || []).find((item) => item.id === id);
  if (!store || !confirm(`Delete ${store.name}?`)) return;
  state.deletedStoreIds = Array.isArray(state.deletedStoreIds) ? state.deletedStoreIds : [];
  if (!state.deletedStoreIds.includes(id)) state.deletedStoreIds.push(id);
  state.stores = state.stores.filter((item) => item.id !== id);
  saveState();
  renderStores();
  resetStoreManagerForm();
}

function saveStoreFromForm() {
  if (!els.customerName.value.trim()) {
    alert("Enter the store name first.");
    return;
  }
  state.stores = state.stores || [];
  const selectedId = els.storeSelect.value;
  const formName = formatStoreName(els.customerName.value.trim(), els.serviceAddress.value.trim());
  const duplicate = state.stores.find((store) => store.name.toLowerCase() === formName.toLowerCase() || sameStoreAddress(store.address || "", els.serviceAddress.value.trim()));
  const id = selectedId || duplicate?.id || "";
  const store = storeFromForm(id);
  const index = state.stores.findIndex((item) => item.id === store.id);
  if (index >= 0) state.stores[index] = store;
  else state.stores.push(store);
  saveState();
  renderStores();
  renderStoreManager();
  els.storeSelect.value = store.id;
  alert("Store saved.");
}

function loadSelectedStore() {
  const store = (state.stores || []).find((item) => item.id === els.storeSelect.value);
  if (!store) {
    renderStoreProducts();
    renderStoreOrderNotice();
    return;
  }
  els.customerName.value = store.name || "";
  els.customerEmail.value = store.email || "";
  els.serviceAddress.value = store.address || "";
  els.invoiceTerms.value = store.terms || "Net 10";
  els.poNumber.value = store.poNumber || "";
  if (!els.invoiceId.value) els.invoiceRep.value = routeRep();
  else els.invoiceRep.value = store.rep || "";
  els.mainPhone.value = store.mainPhone || "";
  els.altPhone.value = store.altPhone || "";
  els.invoiceDt.value = store.dt || "";
  els.specialInstructions.value = store.specialInstructions || "";
  if (!els.invoiceId.value) {
    els.deliveryFee.value = storeDeliveryFee(store).toFixed(2);
    els.lineItemsText.value = lineItemsToText(itemsWithDelivery((store.products || []).filter((product) => !isDeliveryItem(product)).map((product) => ({
      description: product.description,
      upc: product.upc || "",
      qty: "0",
      unit: product.unit || "ea",
      rate: Number(product.rate || 0),
      amount: 0
    }))));
    updateTotalsFromLineItems();
  }
  renderStoreProducts();
  renderStoreOrderNotice();
}

function saveAndShareInvoice() {
  if (!els.invoiceForm.reportValidity()) return;
  if (!validateRequiredOrderFields()) return;
  if (blockOrderAction()) return;
  const invoice = saveInvoice({ keepForm: true });
  if (!invoice) return;
  emailOffice(invoice);
}

function saveAndPrintInvoice() {
  if (!els.invoiceForm.reportValidity()) return;
  if (!validateRequiredOrderFields()) return;
  if (blockOrderAction()) return;
  const invoice = saveInvoice({ keepForm: true });
  if (!invoice) return;
  printInvoice(invoice);
}

function resetStopForm() {
  els.stopForm.reset();
  els.stopId.value = "";
  els.stopFormTitle.textContent = "Add Stop";
}

function saveInvoiceFromForm(event) {
  event.preventDefault();
  if (!validateRequiredOrderFields()) return;
  if (blockOrderAction()) return;
  saveInvoice();
}

function validateRequiredOrderFields() {
  if (!els.invoiceNumber.value.trim()) {
    alert("Enter the invoice number from Lisa before saving, printing, or sharing.");
    els.invoiceNumber.focus();
    return false;
  }
  if (els.deliveryFee.value === "") {
    alert("Enter the delivery charge before saving, printing, or sharing. Use 0 only if there is no delivery charge.");
    els.deliveryFee.focus();
    return false;
  }
  return true;
}

function invoiceFromForm() {
  const items = itemsWithDelivery(lineItemsFromText(els.lineItemsText.value));
  const computedTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const enteredTotal = Number(els.invoiceTotal.value || els.invoiceAmount.value || 0);
  const total = enteredTotal || computedTotal;
  const balanceDue = Number(els.balanceDue.value || total);
  return {
    id: els.invoiceId.value || crypto.randomUUID(),
    customer: els.customerName.value.trim(),
    customerEmail: els.customerEmail.value.trim(),
    address: els.serviceAddress.value.trim(),
    number: els.invoiceNumber.value.trim(),
    amount: balanceDue,
    invoiceDate: els.issueDate.value,
    terms: els.invoiceTerms.value.trim(),
    poNumber: els.poNumber.value.trim(),
    charge: els.invoiceCharge.value.trim(),
    cash: els.invoiceCash.value.trim(),
    rep: els.invoiceRep.value.trim(),
    specialInstructions: els.specialInstructions.value.trim(),
    mainPhone: els.mainPhone.value.trim(),
    altPhone: els.altPhone.value.trim(),
    dt: els.invoiceDt.value.trim(),
    items,
    deliveryFee: Number(els.deliveryFee.value || 0),
    customerTotalBalance: Number(els.customerTotalBalance.value || 0),
    total,
    totalOverride: true,
    paymentsCredits: Number(els.paymentsCredits.value || 0),
    balanceDue,
    customerSignature: getSignatureData()
  };
}

function saveInvoice({ keepForm = false } = {}) {
  const invoice = invoiceFromForm();
  if (invoiceBlocksOrders(invoice)) {
    alert(orderBlockedMessage(invoiceStore(invoice)));
    return null;
  }
  const index = state.invoices.findIndex((item) => item.id === invoice.id);
  if (index >= 0) state.invoices[index] = invoice;
  else state.invoices.unshift(invoice);
  syncRouteScanFromInvoice(invoice);
  upsertStoreFromInvoice(invoice);
  saveState();
  if (!keepForm) resetInvoiceForm();
  render();
  return invoice;
}

function syncRouteScanFromInvoice(invoice) {
  const scan = (state.scans || []).find((item) => item.savedInvoiceId === invoice.id);
  if (!scan) return;
  scan.customer = invoice.customer || scan.customer;
  scan.address = invoice.address || scan.address;
  scan.number = invoice.number || scan.number;
  scan.invoiceDate = invoiceDate(invoice);
  scan.items = invoice.items || scan.items || [];
  scan.itemsText = lineItemsToText(scan.items);
  scan.total = Number(invoice.total || 0);
  scan.amount = Number(invoice.amount || invoice.total || 0);
  scan.balanceDue = Number(invoice.balanceDue || invoice.amount || invoice.total || 0);
  scan.paymentsCredits = Number(invoice.paymentsCredits || 0);
}

function upsertStoreFromInvoice(invoice) {
  if (!invoice.customer) return;
  const selectedId = els.storeSelect.value;
  mergeStoreFromInvoice(state, invoice);
  const store = (state.stores || []).find((item) => item.id === selectedId)
    || (state.stores || []).find((item) => item.name.toLowerCase() === invoice.customer.toLowerCase());
  if (store) els.storeSelect.value = store.id;
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

function saveOfficeSettings() {
  state.settings = state.settings || {};
  state.settings.officeEmail = els.officeEmail.value.trim();
  state.settings.ryanEmail = els.ryanEmail.value.trim();
  state.settings.jasonEmail = els.jasonEmail.value.trim();
  saveState();
  alert("Office emails saved.");
}

function saveRouteDaySettings() {
  state.routeDay = state.routeDay || structuredClone(sampleData.routeDay);
  state.routeDay.date = els.routeDayDate.value || todayOffset(0);
  state.routeDay.rep = els.routeDayRep.value.trim() || DEFAULT_REP;
  state.routeDay.startingInvoiceNumber = els.routeStartInvoice.value.trim();
  state.routeDay.notes = els.routeDayNotes.value;
  state.routeDay.receipts = state.routeDay.receipts || [];
  state.routeDay.prospects = state.routeDay.prospects || [];
  if (!els.invoiceId.value) {
    els.issueDate.value = routeDate();
    els.invoiceRep.value = routeRep();
    if (state.routeDay.startingInvoiceNumber) els.invoiceNumber.value = nextRouteInvoiceNumber();
  }
  saveState();
  renderRouteDayStatus();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleReceiptSelection(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  state.routeDay = state.routeDay || structuredClone(sampleData.routeDay);
  state.routeDay.receipts = state.routeDay.receipts || [];
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    state.routeDay.receipts.push({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      date: todayOffset(0),
      dataUrl
    });
  }
  event.target.value = "";
  saveState();
  renderRouteDayCapture();
}

function clearRouteReceipts() {
  if (!confirm("Clear today's receipt scans?")) return;
  state.routeDay = state.routeDay || structuredClone(sampleData.routeDay);
  state.routeDay.receipts = [];
  saveState();
  renderRouteDayCapture();
}

function addProspectStop() {
  const name = els.prospectName.value.trim();
  const address = els.prospectAddress.value.trim();
  const notes = els.prospectNotes.value.trim();
  if (!name && !address && !notes) {
    alert("Add a store name, address, or note for the new account stop first.");
    return;
  }
  state.routeDay = state.routeDay || structuredClone(sampleData.routeDay);
  state.routeDay.prospects = state.routeDay.prospects || [];
  state.routeDay.prospects.push({
    id: crypto.randomUUID(),
    name,
    contact: els.prospectContact.value.trim(),
    address,
    notes
  });
  els.prospectName.value = "";
  els.prospectContact.value = "";
  els.prospectAddress.value = "";
  els.prospectNotes.value = "";
  saveState();
  renderRouteDayCapture();
}

function clearRouteDay() {
  if (!confirm("Clear today's scanned route stops and route settings?")) return;
  selectedFiles = [];
  state.scans = [];
  state.routeDay = {
    date: todayOffset(0),
    rep: DEFAULT_REP,
    startingInvoiceNumber: "",
    notes: "",
    receipts: [],
    prospects: []
  };
  els.invoiceFiles.value = "";
  els.invoiceCamera.value = "";
  els.photoGrid.replaceChildren();
  els.scanStatus.textContent = "No files selected";
  saveState();
  render();
}

function printRouteSummary() {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocking kept the route summary from opening.");
    return;
  }
  win.document.write(routeSummaryHtml());
  win.document.close();
  win.focus();
  win.print();
}

function attachEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
  document.querySelectorAll("[data-tab-jump]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tabJump)));
  els.invoiceForm.addEventListener("submit", saveInvoiceFromForm);
  els.storeSelect.addEventListener("change", loadSelectedStore);
  els.saveStore.addEventListener("click", saveStoreFromForm);
  els.storeManagerForm.addEventListener("submit", saveStoreManagerForm);
  els.storeManagerSearch.addEventListener("input", renderStoreManager);
  els.newStoreRecord.addEventListener("click", resetStoreManagerForm);
  els.clearStoreManager.addEventListener("click", resetStoreManagerForm);
  els.deleteStoreManager.addEventListener("click", deleteStoreManager);
  els.clearInvoiceForm.addEventListener("click", resetInvoiceForm);
  els.clearSignature.addEventListener("click", clearSignaturePad);
  els.saveAndPrintInvoice.addEventListener("click", saveAndPrintInvoice);
  els.saveAndShareInvoice.addEventListener("click", saveAndShareInvoice);
  els.addOrderItem.addEventListener("click", addOrderItem);
  els.itemQty.addEventListener("input", updateItemAmount);
  els.itemRate.addEventListener("input", updateItemAmount);
  els.lineItemsText.addEventListener("input", updateTotalsFromLineItems);
  els.deliveryFee.addEventListener("input", updateTotalsFromLineItems);
  els.invoiceTotal.addEventListener("input", updateBalanceDue);
  els.paymentsCredits.addEventListener("input", updateBalanceDue);
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
  els.saveOfficeSettings.addEventListener("click", saveOfficeSettings);
  els.invoiceFiles.addEventListener("change", handlePhotoSelection);
  els.invoiceCamera.addEventListener("change", handlePhotoSelection);
  els.processPhotos.addEventListener("click", processPhotos);
  els.clearScanQueue.addEventListener("click", clearScans);
  els.saveScannedInvoices.addEventListener("click", saveScannedInvoices);
  els.routeDayDate.addEventListener("input", saveRouteDaySettings);
  els.routeDayRep.addEventListener("input", saveRouteDaySettings);
  els.routeStartInvoice.addEventListener("input", saveRouteDaySettings);
  els.routeDayNotes.addEventListener("input", saveRouteDaySettings);
  els.routeReceiptFiles.addEventListener("change", handleReceiptSelection);
  els.routeReceiptCamera.addEventListener("change", handleReceiptSelection);
  els.clearRouteReceipts.addEventListener("click", clearRouteReceipts);
  els.addProspectStop.addEventListener("click", addProspectStop);
  els.clearRouteDay.addEventListener("click", clearRouteDay);
  els.buildRoute.addEventListener("click", buildRouteFromDeliverySlots);
  els.printRouteSummary.addEventListener("click", printRouteSummary);

  document.addEventListener("click", (event) => {
    const editInvoice = event.target.closest("[data-edit-invoice]");
    const deleteInvoice = event.target.closest("[data-delete-invoice]");
    const emailInvoice = event.target.closest("[data-email-invoice]");
    const officeInvoice = event.target.closest("[data-office-invoice]");
    const shareInvoice = event.target.closest("[data-share-invoice]");
    const printInvoice = event.target.closest("[data-print-invoice]");
    const caseButton = event.target.closest("[data-case-key]");
    const storeManagerItem = event.target.closest("[data-store-manager-id]");
    const deleteReceipt = event.target.closest("[data-delete-receipt]");
    const deleteProspect = event.target.closest("[data-delete-prospect]");
    const clearRouteSlot = event.target.closest("[data-clear-route-slot]");
    if (editInvoice) editInvoiceById(editInvoice.dataset.editInvoice);
    if (deleteInvoice) deleteInvoiceById(deleteInvoice.dataset.deleteInvoice);
    if (emailInvoice) emailInvoiceById(emailInvoice.dataset.emailInvoice);
    if (officeInvoice) emailOfficeById(officeInvoice.dataset.officeInvoice);
    if (shareInvoice) shareInvoiceById(shareInvoice.dataset.shareInvoice);
    if (printInvoice) printInvoiceById(printInvoice.dataset.printInvoice);
    if (caseButton) adjustStoreProductQty(caseButton);
    if (storeManagerItem) editStoreManager(storeManagerItem.dataset.storeManagerId);
    if (clearRouteSlot) {
      clearRouteDeliverySlot(clearRouteSlot.dataset.clearRouteSlot);
      return;
    }
    if (deleteReceipt) {
      state.routeDay.receipts = (state.routeDay?.receipts || []).filter((receipt) => receipt.id !== deleteReceipt.dataset.deleteReceipt);
      saveState();
      renderRouteDayCapture();
    }
    if (deleteProspect) {
      state.routeDay.prospects = (state.routeDay?.prospects || []).filter((prospect) => prospect.id !== deleteProspect.dataset.deleteProspect);
      saveState();
      renderRouteDayCapture();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-store-product]")) {
      updateOrderFromStoreProducts();
      return;
    }
    const field = event.target.dataset.scanField;
    const id = event.target.dataset.scanId;
    if (!field || !id) return;
    const scan = state.scans.find((item) => item.id === id);
    if (!scan) return;
    if (["amount", "customerTotalBalance", "total", "paymentsCredits", "balanceDue", "routeOrder"].includes(field)) {
      scan[field] = Number(event.target.value);
    } else if (field === "itemsText") {
      scan.itemsText = event.target.value;
      scan.items = lineItemsFromText(event.target.value);
    } else {
      scan[field] = event.target.value;
    }
    saveState();
    if (field === "routeOrder" || field === "routeNote" || field === "address" || field === "customer") {
      if (field === "routeOrder") renderRouteDeliverySlots();
      renderRouteDayStatus();
    }
  });

  document.addEventListener("change", (event) => {
    const routeSlotFile = event.target.dataset.routeSlotFile;
    if (routeSlotFile) {
      processRouteSlotFile(event.target.files?.[0], routeSlotFile);
      event.target.value = "";
      return;
    }

    const routeSlotStore = event.target.dataset.routeSlotStore;
    if (routeSlotStore) {
      setRouteSlotStore(routeSlotStore, event.target.value);
      saveState();
      renderScans();
      return;
    }

    const storeScanId = event.target.dataset.scanStore;
    if (storeScanId) {
      const scan = state.scans.find((item) => item.id === storeScanId);
      const store = (state.stores || []).find((item) => item.id === event.target.value);
      if (!scan) return;
      if (store) applyStoreToScan(scan, store);
      else {
        scan.matchedStoreId = "";
        scan.accepted = false;
        scan.importWarning = "Needs store match";
      }
      saveState();
      renderScans();
      return;
    }

    const lisaId = event.target.dataset.scanLisa;
    if (lisaId) {
      const scan = state.scans.find((item) => item.id === lisaId);
      if (!scan) return;
      scan.lisaHandled = event.target.checked;
      saveState();
      renderScans();
      renderStoreOrderNotice();
      return;
    }

    const deliveredId = event.target.dataset.scanDelivered;
    if (deliveredId) {
      const scan = state.scans.find((item) => item.id === deliveredId);
      if (!scan) return;
      scan.delivered = event.target.checked;
      saveState();
      renderScans();
      renderRouteDayStatus();
      return;
    }

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
  const store = (state.stores || []).find((item) => item.name.toLowerCase() === String(invoice.customer || "").toLowerCase());
  renderStores();
  els.storeSelect.value = store?.id || "";
  els.invoiceId.value = invoice.id;
  els.customerName.value = invoice.customer;
  els.customerEmail.value = invoice.customerEmail || "";
  els.serviceAddress.value = invoice.address || "";
  els.invoiceNumber.value = invoice.number;
  els.invoiceAmount.value = invoiceBalance(invoice);
  els.issueDate.value = invoiceDate(invoice);
  els.invoiceTerms.value = invoice.terms || "";
  els.poNumber.value = invoice.poNumber || "";
  els.invoiceCharge.value = invoice.charge || "";
  els.invoiceCash.value = invoice.cash || "";
  els.invoiceRep.value = invoice.rep || "";
  els.specialInstructions.value = invoice.specialInstructions || "";
  els.mainPhone.value = invoice.mainPhone || "";
  els.altPhone.value = invoice.altPhone || "";
  els.invoiceDt.value = invoice.dt || "";
  els.deliveryFee.value = deliveryFeeFromItems(invoice.items).toFixed(2);
  els.lineItemsText.value = lineItemsToText(nonDeliveryItems(invoice.items));
  els.customerTotalBalance.value = invoice.customerTotalBalance || "";
  els.invoiceTotal.value = invoiceTotal(invoice) || "";
  els.paymentsCredits.value = invoice.paymentsCredits || "";
  els.balanceDue.value = invoiceBalance(invoice) || "";
  loadSignature(invoice.customerSignature || "");
  els.invoiceFormTitle.textContent = "Edit Invoice";
  renderStoreProducts();
  renderStoreOrderNotice();
  setTab("invoices");
}

function deleteInvoiceById(id) {
  if (!confirm("Delete this invoice?")) return;
  state.invoices = state.invoices.filter((invoice) => invoice.id !== id);
  (state.scans || []).forEach((scan) => {
    if (scan.savedInvoiceId === id) {
      scan.savedInvoiceId = "";
      scan.accepted = false;
    }
  });
  routeDeliverySlots().forEach((slot) => {
    const scan = (state.scans || []).find((item) => item.id === slot.scanId);
    if (scan?.savedInvoiceId === id || (!scan && slot.scanId)) slot.scanId = "";
  });
  saveState();
  render();
}

function emailInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (invoiceBlocksOrders(invoice)) return alert(orderBlockedMessage(invoiceStore(invoice)));
  if (invoice) emailInvoice(invoice);
}

function emailOfficeById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (invoiceBlocksOrders(invoice)) return alert(orderBlockedMessage(invoiceStore(invoice)));
  if (invoice) emailOffice(invoice);
}

async function shareInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  if (invoiceBlocksOrders(invoice)) return alert(orderBlockedMessage(invoiceStore(invoice)));
  const text = invoiceMessage(invoice);
  if (navigator.share) {
    try {
      await navigator.share({
        title: invoiceSubject(invoice),
        text
      });
      return;
    } catch {
      // Fall back to copying when the share sheet is dismissed or unavailable.
    }
  }
  await navigator.clipboard?.writeText(text);
  alert("Invoice text copied. You can paste it into a text, email, or note.");
}

function printInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  if (invoiceBlocksOrders(invoice)) return alert(orderBlockedMessage(invoiceStore(invoice)));
  printInvoice(invoice);
}

function printInvoice(invoice) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocking kept the print view from opening.");
    return;
  }
  win.document.write(printableInvoiceHtml(invoice));
  win.document.close();
  win.focus();
  win.print();
}

function officeRecipients() {
  return [...new Set([
    state.settings?.officeEmail || sampleData.settings.officeEmail,
    state.settings?.ryanEmail || sampleData.settings.ryanEmail,
    state.settings?.jasonEmail || sampleData.settings.jasonEmail
  ].map((email) => String(email || "").trim()).filter(Boolean))];
}

function emailOffice(invoice) {
  const recipients = officeRecipients();
  if (!recipients.length) {
    alert("Add Lisa and Ryan's emails in Office first.");
    setTab("settings");
    return;
  }
  const params = new URLSearchParams({
    subject: invoiceSubject(invoice),
    body: invoiceMessage(invoice)
  });
  window.location.href = `mailto:${recipients.map(encodeURIComponent).join(",")}?${params.toString()}`;
}

function emailInvoice(invoice) {
  const customerEmail = invoice.customerEmail || "";
  const officeEmails = officeRecipients();
  const params = new URLSearchParams({
    subject: invoiceSubject(invoice),
    body: invoiceMessage(invoice)
  });
  if (officeEmails.length) params.set("cc", officeEmails.join(","));
  window.location.href = `mailto:${encodeURIComponent(customerEmail)}?${params.toString()}`;
}

function invoiceSubject(invoice) {
  return `${invoice.customer || "Andoro Order"} - ${formatDate(invoiceDate(invoice))}`.trim();
}

function invoiceMessage(invoice) {
  const items = invoice.items?.length
    ? invoice.items.map((item) => {
      const qty = item.qty ? `${item.qty} ` : "";
      const unit = item.unit ? `${item.unit} ` : "";
      const amount = Number(item.amount || item.rate || 0);
      const upc = item.upc ? ` UPC ${item.upc}` : "";
      return `- ${qty}${unit}${item.description}${upc}: ${money.format(amount)}`;
    }).join("\n")
    : "- Order";
  return [
    "Andoro & Sons",
    "",
    `Invoice: ${invoice.number || ""}`,
    `Date: ${formatDate(invoiceDate(invoice))}`,
    `Customer: ${invoice.customer || ""}`,
    invoice.address ? `Address: ${invoice.address}` : "",
    invoice.terms ? `Terms: ${invoice.terms}` : "",
    invoice.poNumber ? `P.O. No.: ${invoice.poNumber}` : "",
    "",
    "Items:",
    items,
    "",
    `Total: ${money.format(invoiceTotal(invoice))}`,
    `Payments/Credits: ${money.format(Number(invoice.paymentsCredits || 0))}`,
    `Balance Due: ${money.format(invoiceBalance(invoice))}`,
    `Customer Signed: ${invoice.customerSignature ? "Yes" : "No"}`,
    invoice.specialInstructions ? `\nNotes:\n${invoice.specialInstructions}` : "",
    "",
    "Thank you,"
  ].filter((line) => line !== "").join("\n");
}

function printableInvoiceHtml(invoice) {
  const plainAmount = (value) => Number(value || 0).toFixed(2);
  const itemCount = invoice.items?.length || 1;
  const printMode = itemCount > 24 ? "ultra-compact" : itemCount > 14 ? "compact" : "";
  const rows = (invoice.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.description || "")}</td>
      <td>${escapeHtml(item.upc || "")}</td>
      <td>${escapeHtml(item.qty || "")}</td>
      <td>${escapeHtml(item.unit || "")}</td>
      <td>${plainAmount(item.rate)}</td>
      <td>${plainAmount(item.amount || item.rate)}</td>
    </tr>
  `).join("") || `<tr><td>Order</td><td></td><td></td><td></td><td></td><td>${plainAmount(invoiceTotal(invoice))}</td></tr>`;
  const targetRows = printMode === "ultra-compact" ? 10 : printMode ? 14 : 18;
  const blankRows = Array.from({ length: Math.max(0, targetRows - itemCount) }, () => `
    <tr class="blank-row"><td></td><td></td><td></td><td></td><td></td><td></td></tr>
  `).join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(invoiceSubject(invoice))}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: letter; margin: 0; }
    body { margin: 0; background: #f1f1f1; color: #10251d; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
    .sheet {
      width: 8.5in;
      height: 10.76in;
      overflow: hidden;
      margin: 20px auto;
      padding: 0.34in 0.42in 0.2in;
      background: #fff;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
    }
    .sheet.compact {
      padding: 0.23in 0.3in 0.14in;
      font-size: 10.5px;
    }
    .sheet.ultra-compact {
      padding: 0.18in 0.25in 0.12in;
      font-size: 9.3px;
    }
    :root { --green: #1f6d48; --green-light: #a8d3b4; --gray-row: #e7e7e2; --red: #9b1f38; }
    .top {
      display: grid;
      grid-template-columns: 1.55in 2.5in 2.65in;
      gap: 18px;
      align-items: start;
      min-height: 1.32in;
    }
    .compact .top { min-height: 0.98in; gap: 10px; }
    .ultra-compact .top { min-height: 0.86in; gap: 8px; grid-template-columns: 1.28in 2.2in 2.35in; }
    .logo-wrap { text-align: center; }
    .logo { width: 1.02in; height: 0.78in; object-fit: contain; display: block; margin: 0 auto 1px; }
    .compact .logo { width: 0.9in; height: 0.68in; }
    .ultra-compact .logo { width: 0.78in; height: 0.58in; }
    .tagline { font-family: Georgia, serif; font-size: 10px; font-weight: 700; color: #111; }
    .address {
      color: #0d3326;
      font-size: 13px;
      font-weight: 900;
      line-height: 1.24;
      padding-top: 0.32in;
    }
    .compact .address { padding-top: 0.2in; font-size: 11px; }
    .ultra-compact .address { padding-top: 0.16in; font-size: 10px; }
    .invoice-panel { padding-top: 0.07in; }
    .compact .invoice-panel { padding-top: 0.04in; }
    .ultra-compact .invoice-panel { padding-top: 0.02in; }
    .invoice-title { text-align: right; font-size: 21px; font-weight: 900; margin: 0 0 3px; }
    .compact .invoice-title { font-size: 17px; }
    .ultra-compact .invoice-title { font-size: 15px; }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1.5px solid var(--green);
      border-radius: 7px;
      overflow: hidden;
      text-align: center;
      font-size: 10.5px;
    }
    .meta-grid .head { background: var(--green-light); font-weight: 900; border-bottom: 1.5px solid var(--green); }
    .meta-grid div { padding: 3px 5px; border-right: 1.5px solid var(--green); min-height: 20px; }
    .meta-grid div:nth-child(2n) { border-right: 0; }
    .meta-grid .value { background: #f3f4ef; font-size: 11px; }
    .compact .meta-grid { font-size: 9px; border-radius: 5px; }
    .compact .meta-grid div { min-height: 17px; padding: 2px 4px; }
    .compact .meta-grid .value { font-size: 9.5px; }
    .ultra-compact .meta-grid { font-size: 8px; border-radius: 4px; }
    .ultra-compact .meta-grid div { min-height: 15px; padding: 1px 3px; }
    .ultra-compact .meta-grid .value { font-size: 8.5px; }
    .upper {
      display: grid;
      grid-template-columns: 1fr 2.65in;
      gap: 0.38in;
      min-height: 0.96in;
      margin-top: 0.08in;
    }
    .compact .upper { min-height: 0.78in; margin-top: 0.05in; }
    .ultra-compact .upper { min-height: 0.64in; margin-top: 0.03in; }
    .bill-label { margin-left: 0.24in; font-size: 11px; }
    .bill-body { margin-top: 0.07in; margin-left: 0.12in; font-size: 13px; line-height: 1.06; white-space: pre-wrap; }
    .compact .bill-body { font-size: 11px; line-height: 1.02; margin-top: 0.04in; }
    .ultra-compact .bill-body { font-size: 9.5px; line-height: 1; margin-top: 0.03in; }
    .instructions { padding-top: 0; font-style: italic; font-size: 11.5px; line-height: 1.22; }
    .compact .instructions { font-size: 10px; line-height: 1.1; }
    .ultra-compact .instructions { font-size: 8.8px; line-height: 1.02; }
    .instructions h2 { margin: 0 0 2px; font-size: 12px; color: #0d3326; font-style: italic; }
    .compact .instructions h2 { font-size: 10.5px; }
    .ultra-compact .instructions h2 { font-size: 9px; }
    .instructions .row { display: grid; grid-template-columns: 0.72in 1fr; gap: 5px; }
    .pre-table {
      display: grid;
      grid-template-columns: 1.5fr 1.35fr 1.05fr 1.1fr 0.95fr;
      border: 2px solid var(--green);
      border-bottom: 0;
      margin-top: 0.15in;
    }
    .compact .pre-table { margin-top: 0.08in; }
    .ultra-compact .pre-table { margin-top: 0.05in; }
    .pre-table div {
      min-height: 32px;
      border-right: 2px solid var(--green);
      border-bottom: 2px solid var(--green);
      padding: 6px 8px;
      text-align: center;
      font-size: 14px;
    }
    .compact .pre-table div { min-height: 25px; padding: 4px 6px; font-size: 11px; }
    .ultra-compact .pre-table div { min-height: 21px; padding: 3px 5px; font-size: 10px; }
    .pre-table div:nth-child(5n) { border-right: 0; }
    .pre-head {
      background: var(--green-light);
      font-weight: 900;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border-left: 2px solid var(--green);
      border-right: 2px solid var(--green);
    }
    th {
      background: var(--green-light);
      border-right: 2px solid var(--green);
      border-bottom: 2px solid var(--green);
      padding: 7px 6px;
      font-size: 14px;
      text-align: center;
      font-weight: 900;
    }
    .compact th { padding: 4px 5px; font-size: 11px; }
    .ultra-compact th { padding: 3px 4px; font-size: 10px; }
    th:last-child, td:last-child { border-right: 0; }
    td {
      border-right: 2px solid var(--green);
      height: 19px;
      padding: 2px 6px;
      vertical-align: top;
      font-size: 14px;
    }
    .compact td { height: 15px; padding: 1px 4px; font-size: 10.7px; }
    .ultra-compact td { height: 12px; padding: 1px 3px; font-size: 9.5px; }
    tbody tr:nth-child(odd) td { background: var(--gray-row); }
    th:nth-child(1), td:nth-child(1) { width: 39%; }
    th:nth-child(2), td:nth-child(2) { width: 17%; text-align: center; }
    th:nth-child(3), td:nth-child(3) { width: 8%; text-align: right; }
    th:nth-child(4), td:nth-child(4) { width: 9%; text-align: center; }
    th:nth-child(5), td:nth-child(5),
    th:nth-child(6), td:nth-child(6) { width: 13.5%; text-align: right; }
    .blank-row td { color: transparent; }
    .balance-row {
      display: grid;
      grid-template-columns: 1fr 2.45in;
      border: 2px solid var(--green);
      border-top: 0;
    }
    .customer-balance {
      min-height: 34px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 22px 5px 14px;
      color: var(--red);
      font-size: 16px;
      font-weight: 900;
      border-right: 2px solid var(--green);
    }
    .compact .customer-balance { min-height: 28px; padding: 3px 12px; font-size: 12px; }
    .ultra-compact .customer-balance { min-height: 24px; padding: 2px 9px; font-size: 10.5px; }
    .totals { border-bottom: 0; }
    .totals div {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 34px;
      border-bottom: 2px solid var(--green);
    }
    .compact .totals div { min-height: 27px; }
    .ultra-compact .totals div { min-height: 23px; }
    .totals span,
    .totals strong {
      padding: 7px 9px;
    }
    .totals span {
      font-weight: 900;
      color: #0d3326;
      font-size: 16px;
    }
    .compact .totals span,
    .compact .totals strong { padding: 4px 7px; font-size: 12px; }
    .ultra-compact .totals span,
    .ultra-compact .totals strong { padding: 3px 5px; font-size: 10.5px; }
    .totals strong {
      text-align: right;
      font-size: 15px;
      color: #111;
    }
    .notice {
      border-left: 2px solid var(--green);
      border-right: 2px solid var(--green);
      border-bottom: 2px solid var(--green);
      min-height: 48px;
      display: flex;
      align-items: center;
      padding: 8px 13px;
      font-weight: 700;
    }
    .compact .notice { min-height: 34px; padding: 5px 10px; font-size: 10px; }
    .ultra-compact .notice { min-height: 28px; padding: 4px 8px; font-size: 9px; }
    .footer {
      display: grid;
      grid-template-columns: 1fr 1fr 1.9fr 1.7fr;
      margin: 0 auto;
      width: 86%;
      border-left: 2px solid var(--green);
      border-bottom: 2px solid var(--green);
      text-align: center;
      font-size: 10.5px;
    }
    .footer div { border-right: 2px solid var(--green); border-top: 2px solid var(--green); padding: 4px 5px; min-height: 21px; }
    .compact .footer { font-size: 9px; }
    .compact .footer div { padding: 3px 4px; min-height: 18px; }
    .ultra-compact .footer { font-size: 8px; }
    .ultra-compact .footer div { padding: 2px 3px; min-height: 15px; }
    .footer .foot-head {
      background: #edf3eb;
      color: #0d3326;
      font-style: italic;
    }
    .signature-copy {
      margin-top: 5px;
      width: 3.1in;
      margin-left: auto;
      border-bottom: 2px solid var(--green);
      min-height: 0.44in;
      display: grid;
      align-items: end;
      justify-items: center;
      padding-bottom: 4px;
    }
    .compact .signature-copy { margin-top: 3px; min-height: 0.3in; }
    .ultra-compact .signature-copy { margin-top: 2px; min-height: 0.22in; }
    .signature-copy img {
      max-width: 100%;
      max-height: 0.34in;
      object-fit: contain;
    }
    .signature-label {
      width: 3.1in;
      margin-left: auto;
      padding-top: 3px;
      text-align: center;
      color: #0d3326;
      font-weight: 900;
      font-size: 10px;
    }
    .compact .signature-label { font-size: 8.5px; padding-top: 1px; }
    .ultra-compact .signature-label { font-size: 7.5px; padding-top: 1px; }
    @media print {
      body { background: #fff; }
      .sheet {
        margin: 0;
        width: 8.5in;
        height: 10.76in;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="sheet ${printMode}">
    <header class="top">
      <section class="logo-wrap">
        <img class="logo" src="assets/andoro-pizza-logo.jpg" alt="Andoro & Sons">
        <div class="tagline">Tasting is Believing!</div>
      </section>
      <section class="address">
        <div>2340 Appaloosa Trail</div>
        <div>High Ridge, MO 63049</div>
      </section>
      <section class="invoice-panel">
        <div class="invoice-title">Invoice</div>
        <div class="meta-grid">
          <div class="head">Date</div>
          <div class="head">Invoice #</div>
          <div class="value">${escapeHtml(formatDate(invoiceDate(invoice)))}</div>
          <div class="value">${escapeHtml(invoice.number || "")}</div>
        </div>
      </section>
    </header>

    <section class="upper">
      <section>
        <div class="bill-label">Bill To</div>
        <div class="bill-body">${escapeHtml(invoice.customer || "")}
${escapeHtml(invoice.address || "")}
${escapeHtml(invoice.customerEmail || "")}</div>
      </section>
      <section class="instructions">
        <h2>Special Instructions:</h2>
        <div class="row"><span>Main Tele</span><span>${escapeHtml(invoice.mainPhone || "")}</span></div>
        <div class="row"><span>Alt Tele:</span><span>${escapeHtml(invoice.altPhone || "")}</span></div>
        <div class="row"><span>D/T:</span><span>${escapeHtml(invoice.dt || "")}</span></div>
        ${invoice.specialInstructions ? `<div>${escapeHtml(invoice.specialInstructions).replace(/\n/g, "<br>")}</div>` : ""}
      </section>
    </section>

    <section class="pre-table">
      <div class="pre-head">P.O. No.</div>
      <div class="pre-head">Terms</div>
      <div class="pre-head">Charge</div>
      <div class="pre-head">Cash</div>
      <div class="pre-head">Rep</div>
      <div>${escapeHtml(invoice.poNumber || "")}</div>
      <div>${escapeHtml(invoice.terms || "")}</div>
      <div>${escapeHtml(invoice.charge || "")}</div>
      <div>${escapeHtml(invoice.cash || "")}</div>
      <div>${escapeHtml(invoice.rep || "")}</div>
    </section>

    <table>
      <thead><tr><th>Description</th><th>UPC #</th><th>Qty</th><th>U/M</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${rows}${blankRows}</tbody>
    </table>

    <section class="balance-row">
      <div>
        <div class="customer-balance"><span>Customer Total Balance</span><span>${money.format(Number(invoice.customerTotalBalance || invoiceBalance(invoice)))}</span></div>
      </div>
      <div class="totals">
        <div><span>Total</span><strong>${money.format(invoiceTotal(invoice))}</strong></div>
        <div><span>Payments/Credits</span><strong>${money.format(Number(invoice.paymentsCredits || 0))}</strong></div>
        <div class="due"><span>Balance Due</span><strong>${money.format(invoiceBalance(invoice))}</strong></div>
      </div>
    </section>

    <section class="notice">A CHARGE OF $40 WILL BE MADE FOR ANY CHECK RETURNED BY YOUR BANK FOR ANY REASON.</section>

    <section>
      <div class="signature-copy">
        ${invoice.customerSignature ? `<img src="${escapeAttribute(invoice.customerSignature)}" alt="Customer signature">` : ""}
      </div>
      <div class="signature-label">Customer Signature</div>
    </section>

    <section class="footer">
      <div class="foot-head">Phone #</div>
      <div class="foot-head">Fax #</div>
      <div class="foot-head">E-mail</div>
      <div class="foot-head">Web Site</div>
      <div>6363329005</div>
      <div>1-800-657-0467</div>
      <div>andoropizza@yahoo.com</div>
      <div>www.andoropizza.com</div>
    </section>
  </main>
</body>
</html>`;
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
      state = normalizeState(JSON.parse(reader.result));
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
      pages.forEach((page, pageIndex) => {
        const scan = parseInvoiceText(page.text, page.fileName);
        if (index + pageIndex < ROUTE_SLOT_COUNT) assignScanToRouteSlot(scan, index + pageIndex + 1);
        state.scans.push(scan);
      });
    } else {
      const text = await readImageInvoice(file, file.name);
      const scan = parseInvoiceText(text, file.name);
      if (index < ROUTE_SLOT_COUNT) assignScanToRouteSlot(scan, index + 1);
      state.scans.push(scan);
    }
    saveState();
    renderScans();
  }
  els.processPhotos.disabled = false;
  els.scanStatus.textContent = `Finished reading ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}`;
}

function assignScanToRouteSlot(scan, slot) {
  const slotNumber = Math.max(1, Math.min(ROUTE_SLOT_COUNT, Number(slot) || 1));
  (state.scans || []).forEach((item) => {
    if (item.id !== scan.id && Number(item.routeOrder) === slotNumber) item.routeOrder = "";
  });
  scan.routeOrder = slotNumber;
  scan.deliverySlot = slotNumber;
  const slotRecord = routeDeliverySlot(slotNumber);
  if (slotRecord) slotRecord.scanId = scan.id;
}

async function processRouteSlotFile(file, slot) {
  if (!file) return;
  const slotRecord = routeDeliverySlot(slot);
  const oldScanId = slotRecord?.scanId || "";
  const store = (state.stores || []).find((item) => item.id === slotRecord?.storeId);
  if (!store) {
    alert("Select the store for this delivery spot before attaching the invoice.");
    return;
  }
  if (!window.Tesseract) {
    alert("The photo reader could not load. Check your internet connection and try again.");
    return;
  }
  if (file.type === "application/pdf" && !window.pdfjsLib) {
    alert("The PDF reader could not load. Check your internet connection and try again.");
    return;
  }
  els.scanStatus.textContent = `Reading delivery spot ${slot}: ${file.name}`;
  let scan;
  if (file.type === "application/pdf") {
    const pages = await readPdfInvoice(file);
    scan = parseInvoiceText(pages[0]?.text || "", pages[0]?.fileName || file.name);
  } else {
    const text = await readImageInvoice(file, file.name);
    scan = parseInvoiceText(text, file.name);
  }
  applyStoreToScan(scan, store);
  assignScanToRouteSlot(scan, slot);
  state.scans = state.scans || [];
  if (oldScanId) state.scans = state.scans.filter((item) => item.id !== oldScanId);
  state.scans.push(scan);
  saveState();
  renderScans();
  els.scanStatus.textContent = `Delivery spot ${slot} loaded: ${file.name}`;
}

function setRouteSlotStore(slot, storeId) {
  const slotRecord = routeDeliverySlot(slot);
  if (!slotRecord) return;
  slotRecord.storeId = storeId || "";
  const scan = (state.scans || []).find((item) => item.id === slotRecord.scanId);
  const store = (state.stores || []).find((item) => item.id === storeId);
  if (scan && store) applyStoreToScan(scan, store);
}

function clearRouteDeliverySlot(slot) {
  const slotRecord = routeDeliverySlot(slot);
  if (!slotRecord) return;
  const scanId = slotRecord.scanId;
  slotRecord.scanId = "";
  if (scanId) state.scans = (state.scans || []).filter((scan) => scan.id !== scanId);
  (state.scans || []).forEach((scan) => {
    if (Number(scan.routeOrder) === Number(slot)) scan.routeOrder = "";
  });
  saveState();
  renderScans();
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
  routeDeliverySlots().forEach((slot) => {
    slot.scanId = "";
  });
  els.invoiceFiles.value = "";
  els.invoiceCamera.value = "";
  els.photoGrid.replaceChildren();
  els.scanStatus.textContent = "No files selected";
  saveState();
  renderScans();
}

function scanReadyToSave(scan = {}) {
  return Boolean(scan.number && (scan.matchedStoreId || (scan.customer && scan.address)));
}

function saveScansAsInvoices(scans = []) {
  const accepted = scans.filter((scan) => scan.accepted !== false);
  const notReadyCount = accepted.filter((scan) => !scanReadyToSave(scan)).length;
  if (notReadyCount) {
    alert(`${notReadyCount} accepted scan${notReadyCount === 1 ? "" : "s"} need an invoice number and either a matched store or a store name/address before saving.`);
    return null;
  }
  const ready = accepted.filter(scanReadyToSave);
  const lisaCount = ready.filter((scan) => scanLisaHandled(scan)).length;
  const invoices = [];
  let skipped = 0;
  ready.forEach((scan) => {
    if (scan.savedInvoiceId && state.invoices.some((invoice) => invoice.id === scan.savedInvoiceId)) {
      skipped += 1;
      return;
    }
    const scanItems = scan.items || lineItemsFromText(scan.itemsText);
    const scanItemTotal = lineItemTotal(scanItems);
    const explicitScanTotal = Number(scan.total || scan.balanceDue || scan.amount || 0);
    const scanTotal = explicitScanTotal > 0 ? explicitScanTotal : scanItemTotal;
    const invoice = canonicalizeImportedInvoice({
      id: crypto.randomUUID(),
      customer: scan.customer || "Unknown customer",
      matchedStoreId: scan.matchedStoreId || "",
      customerEmail: scan.customerEmail || "",
      address: scan.address || "",
      number: scan.number || `SCAN-${Date.now()}`,
      amount: scanTotal,
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
      items: scanItems,
      deliveryFee: deliveryFeeFromItems(scanItems, 0),
      customerTotalBalance: Number(scan.customerTotalBalance || 0),
      total: scanTotal,
      paymentsCredits: Number(scan.paymentsCredits || 0),
      balanceDue: Math.max(scanTotal - Number(scan.paymentsCredits || 0), 0),
      sourceFile: scan.fileName || "",
      lisaHandled: scanLisaHandled(scan)
    });
    invoices.push(invoice);
    scan.savedInvoiceId = invoice.id;
    mergeStoreFromInvoice(state, invoice);
  });
  state.invoices.unshift(...invoices);
  state.stores = mergeStores([], state.stores || []);
  saveState();
  return { saved: invoices.length, lisaCount, skipped };
}

function buildRouteFromDeliverySlots() {
  const slots = routeDeliverySlots();
  const filledSlots = slots
    .map((slot) => ({
      slot,
      store: (state.stores || []).find((store) => store.id === slot.storeId),
      scan: (state.scans || []).find((scan) => scan.id === slot.scanId)
    }))
    .filter((entry) => entry.store || entry.scan);
  if (!filledSlots.length) {
    alert("Add at least one store and invoice to the delivery spots before building the route.");
    return;
  }
  const missingStore = filledSlots.filter((entry) => !entry.store).length;
  const missingInvoice = filledSlots.filter((entry) => entry.store && !entry.scan).length;
  if (missingStore || missingInvoice) {
    alert(`${missingStore ? `${missingStore} delivery spot${missingStore === 1 ? "" : "s"} need a store. ` : ""}${missingInvoice ? `${missingInvoice} delivery spot${missingInvoice === 1 ? "" : "s"} need an attached invoice.` : ""}`.trim());
    return;
  }
  filledSlots.forEach((entry) => {
    applyStoreToScan(entry.scan, entry.store);
    assignScanToRouteSlot(entry.scan, entry.slot.slot);
    entry.scan.accepted = true;
  });
  const result = saveScansAsInvoices(filledSlots.map((entry) => entry.scan));
  if (!result) return;
  render();
  setTab("scan");
  alert(`Route built. ${result.saved} invoice${result.saved === 1 ? "" : "s"} added.${result.skipped ? ` ${result.skipped} already added.` : ""}${result.lisaCount ? ` ${result.lisaCount} Lisa-handled stop${result.lisaCount === 1 ? "" : "s"} saved for records/stores only.` : ""}`);
}

function saveScannedInvoices() {
  const result = saveScansAsInvoices((state.scans || []).filter((scan) => scan.accepted));
  if (!result) return;
  render();
  setTab("invoices");
  alert(`${result.saved} scanned invoice${result.saved === 1 ? "" : "s"} saved.${result.skipped ? ` ${result.skipped} already saved.` : ""}${result.lisaCount ? ` ${result.lisaCount} Lisa-handled stop${result.lisaCount === 1 ? "" : "s"} saved for records/stores only.` : ""}`);
}

setupAccessGate();
attachEvents();
setupSignaturePad();
resetInvoiceForm();
resetStopForm();
render();
