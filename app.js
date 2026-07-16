const STORAGE_KEY = "andoro_invoice_route_desk_v2";
const STORES_STORAGE_KEY = "andoro_saved_stores_v1";
const ACCESS_STORAGE_KEY = "andoro_invoice_access_ok_v1";
const ACCESS_CODE = "andoro1957";
const ROUTE_SLOT_COUNT = 25;
const TESSERACT_OPTIONS = {
  workerPath: "assets/vendor/tesseract/worker.min.js?v=84",
  corePath: "assets/vendor/tesseract/core",
  langPath: "assets/vendor/tesseract/lang",
  workerBlobURL: false
};
const TAB_HEADERS = {
  invoices: "Check Store Needs - Build Order - Get Signature - Print / Share",
  scan: "Route Organizer / Summary",
  stores: "Stores / Products / Account Rules",
  products: "Products / Cleanup / Master List",
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
const DEFAULT_DELIVERY_FEE = 0;
const DEFAULT_REP = "J.Ballew";
const FIXED_ROUTE_ORIGIN = {
  address: "92 Produce Row, St. Louis, MO 63102",
  lat: 38.6508865,
  lng: -90.187931
};
let storeAddressChecks = [];

const sampleData = {
  invoices: [],
  stops: [],
  optimizedStopIds: [],
  deletedStoreIds: [],
  deletedProductKeys: [],
  products: [],
  routeDay: {
    date: "",
    rep: DEFAULT_REP,
    startingInvoiceNumber: "",
    leaveHomeTime: "",
    arriveFactoryTime: "",
    startTime: "",
    finishTime: "",
    notes: "",
    deliverySlots: [],
    receipts: [],
    prospects: []
  },
  origin: { lat: FIXED_ROUTE_ORIGIN.lat, lng: FIXED_ROUTE_ORIGIN.lng, address: FIXED_ROUTE_ORIGIN.address },
  scans: [],
  stores: [
    {
      id: "store-mosers-ashland",
      name: "Mosers Foods - Ashland",
      orderBlocked: true,
      orderBlockedReason: "This store is normally ordered by the office. Only make a salesman invoice for an emergency.",
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
      orderBlockedReason: "This store is normally ordered by the office. Only make a salesman invoice for an emergency.",
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
      orderBlockedReason: "This store is normally ordered by the office. Only make a salesman invoice for an emergency.",
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
      orderBlockedReason: "This store is normally ordered by the office. Only make a salesman invoice for an emergency.",
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
  storeManagerLayout: document.querySelector("#storeManagerLayout"),
  storeManagerList: document.querySelector("#storeManagerList"),
  storeManagerForm: document.querySelector("#storeManagerForm"),
  storeManagerTitle: document.querySelector("#storeManagerTitle"),
  storeManagerId: document.querySelector("#storeManagerId"),
  storeManagerName: document.querySelector("#storeManagerName"),
  storeManagerEmail: document.querySelector("#storeManagerEmail"),
  storeManagerAddress: document.querySelector("#storeManagerAddress"),
  storeManagerLat: document.querySelector("#storeManagerLat"),
  storeManagerLng: document.querySelector("#storeManagerLng"),
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
  storeManagerShelfInfo: document.querySelector("#storeManagerShelfInfo"),
  tagStoreLocation: document.querySelector("#tagStoreLocation"),
  checkStoreAddresses: document.querySelector("#checkStoreAddresses"),
  storeAddressCheckStatus: document.querySelector("#storeAddressCheckStatus"),
  storeAddressCheckList: document.querySelector("#storeAddressCheckList"),
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
  routeLeaveHomeTime: document.querySelector("#routeLeaveHomeTime"),
  routeArriveFactoryTime: document.querySelector("#routeArriveFactoryTime"),
  routeStartTime: document.querySelector("#routeStartTime"),
  routeFinishTime: document.querySelector("#routeFinishTime"),
  routeDayNotes: document.querySelector("#routeDayNotes"),
  routeDeliverySlots: document.querySelector("#routeDeliverySlots"),
  routeReceiptFiles: document.querySelector("#routeReceiptFiles"),
  routeReceiptCamera: document.querySelector("#routeReceiptCamera"),
  clearRouteReceipts: document.querySelector("#clearRouteReceipts"),
  manualExpenseName: document.querySelector("#manualExpenseName"),
  manualExpenseAmount: document.querySelector("#manualExpenseAmount"),
  manualExpenseNotes: document.querySelector("#manualExpenseNotes"),
  addManualExpense: document.querySelector("#addManualExpense"),
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
  printRouteSummary: document.querySelector("#printRouteSummary"),
  saveRouteSummaryPdf: document.querySelector("#saveRouteSummaryPdf"),
  productSearch: document.querySelector("#productSearch"),
  productManagerList: document.querySelector("#productManagerList"),
  productManagerForm: document.querySelector("#productManagerForm"),
  productManagerTitle: document.querySelector("#productManagerTitle"),
  productManagerKey: document.querySelector("#productManagerKey"),
  productManagerDescription: document.querySelector("#productManagerDescription"),
  productManagerUpc: document.querySelector("#productManagerUpc"),
  productManagerUnit: document.querySelector("#productManagerUnit"),
  productManagerRate: document.querySelector("#productManagerRate"),
  productManagerFrozenPizza: document.querySelector("#productManagerFrozenPizza"),
  newProductRecord: document.querySelector("#newProductRecord"),
  clearProductManager: document.querySelector("#clearProductManager"),
  saveProductManager: document.querySelector("#saveProductManager"),
  deleteProductManager: document.querySelector("#deleteProductManager")
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
  nextState.origin = fixedRouteOrigin();
  nextState.invoices = (nextState.invoices || []).filter((invoice) => !isDemoInvoice(invoice));
  nextState.stops = (nextState.stops || []).filter((stop) => !["North Lake Supply", "Riverbend Builders"].includes(stop.name));
  nextState.products = mergeProducts([], nextState.products || []);
  nextState.deletedProductKeys = Array.isArray(nextState.deletedProductKeys) ? nextState.deletedProductKeys : [];
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
    const scanIds = Array.isArray(existing.scanIds)
      ? existing.scanIds.filter(Boolean)
      : [existing.scanId].filter(Boolean);
    return {
      slot: slotNumber,
      storeId: existing.storeId || "",
      scanId: scanIds[0] || "",
      scanIds
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

function routeSlotScanIds(slotRecord = {}) {
  const ids = Array.isArray(slotRecord.scanIds) ? slotRecord.scanIds : [];
  if (slotRecord.scanId && !ids.includes(slotRecord.scanId)) ids.unshift(slotRecord.scanId);
  return [...new Set(ids.filter(Boolean))];
}

function setRouteSlotScanIds(slotRecord, ids = []) {
  if (!slotRecord) return;
  const cleanIds = [...new Set(ids.filter(Boolean))];
  slotRecord.scanIds = cleanIds;
  slotRecord.scanId = cleanIds[0] || "";
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

function pieceCount(items = []) {
  return orderedLineItems(items || [])
    .filter((item) => !isDeliveryItem(item))
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);
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
  els.routeLeaveHomeTime.value = state.routeDay?.leaveHomeTime || "";
  els.routeArriveFactoryTime.value = state.routeDay?.arriveFactoryTime || "";
  els.routeStartTime.value = state.routeDay?.startTime || "";
  els.routeFinishTime.value = state.routeDay?.finishTime || "";
  els.routeDayNotes.value = state.routeDay?.notes || "";

  renderAttention();
  renderStores();
  renderStoreManager();
  renderProductsManager();
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
    .replace(/\bc\s*\/?\s*o\b/g, "care of")
    .replace(/\b(missouri|mo)\b/g, "mo")
    .replace(/\b(illinois|il)\b/g, "il")
    .replace(/\b(street|st)\b/g, "st")
    .replace(/\b(road|rd)\b/g, "rd")
    .replace(/\b(drive|dr)\b/g, "dr")
    .replace(/\b(boulevard|blvd)\b/g, "blvd")
    .replace(/\b(highway|hwy)\b/g, "hwy")
    .replace(/\b(avenue|ave)\b/g, "ave")
    .replace(/\b(lane|ln)\b/g, "ln")
    .replace(/\b(court|ct)\b/g, "ct")
    .replace(/\b(place|pl)\b/g, "pl")
    .replace(/\b(suite|ste)\b/g, "ste")
    .replace(/\s+/g, " ")
    .trim();
}

function addressParts(value = "") {
  const address = normalizedAddress(value);
  const streetNumber = address.match(/\b\d{1,6}\b/)?.[0] || "";
  const streetWords = streetNumber
    ? address
      .slice(address.indexOf(streetNumber) + streetNumber.length)
      .split(" ")
      .filter((word) => word.length > 2 && !/^\d+$/.test(word) && !/^(mo|il|st|rd|dr|blvd|hwy|ave|ln|ct|pl|ste|care|of)$/.test(word))
      .slice(0, 4)
    : [];
  return {
    address,
    numbers: address.match(/\b\d+\b/g) || [],
    zip: address.match(/\b\d{5}\b/)?.[0] || "",
    streetNumber,
    streetName: streetWords[0] || "",
    streetWords,
    words: address.split(" ").filter((word) => word.length > 2 && !/^\d+$/.test(word))
  };
}

function sameStoreAddress(a = "", b = "") {
  const left = addressParts(a);
  const right = addressParts(b);
  if (!left.address || !right.address) return false;
  if (left.address === right.address) return true;
  if ((left.address.includes(right.address) || right.address.includes(left.address)) && Math.min(left.address.length, right.address.length) > 10) return true;
  if (left.streetNumber && right.streetNumber && left.streetNumber === right.streetNumber) {
    const sharedStreetWords = left.streetWords.filter((word) => right.streetWords.includes(word));
    if (left.streetName && right.streetName && left.streetName === right.streetName) return true;
    if (sharedStreetWords.length >= 2) return true;
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

function rankedStoreMatches(invoice = {}, stores = state.stores || []) {
  const invoiceAddress = normalizedAddress(invoice.address || "");
  const invoiceName = normalizedName(cleanImportedCustomerName(invoice.customer || "") || invoice.customer || "");
  return [...stores]
    .map((store) => {
      const storeAddress = normalizedAddress(store.address || "");
      const storeName = normalizedName(store.name || "");
      const addressMatch = Boolean(invoiceAddress && storeAddress && sameStoreAddress(store.address || "", invoice.address || ""));
      const exactName = Boolean(invoiceName && storeName && invoiceName === storeName);
      const score = storeMatchScore(store, invoice) + (addressMatch ? 500 : 0) + (exactName ? 80 : 0);
      return { store, score, addressMatch, exactName };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.addressMatch !== a.addressMatch) return Number(b.addressMatch) - Number(a.addressMatch);
      return b.score - a.score;
    });
}

function matchingStoreForInvoice(invoice = {}, stores = state.stores || []) {
  const ranked = rankedStoreMatches(invoice, stores);
  const best = ranked[0];
  if (!best) return null;
  const hasInvoiceAddress = Boolean(normalizedAddress(invoice.address || ""));
  if (best.addressMatch) return best.store;
  if (hasInvoiceAddress) return best.score >= 140 ? best.store : null;
  return best.exactName || best.score >= 100 ? best.store : null;
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
  return scan.delivered === true;
}

function scanPaid(scan = {}) {
  return scan.paid === true;
}

function scanHasInvoice(scan = {}) {
  return Boolean(scan.savedInvoiceId || scan.number || Number(scan.total || scan.amount || scan.balanceDue || 0) || (scan.items || []).length || String(scan.itemsText || "").trim());
}

function applyStoreToScan(scan, store) {
  if (!scan || !store) return;
  scan.matchedStoreId = store.id;
  scan.customer = store.name || scan.customer;
  scan.customerEmail = scan.customerEmail || store.email || "";
  scan.address = scan.address || store.address || "";
  scan.terms = scan.terms || store.terms || "";
  scan.poNumber = scan.poNumber || store.poNumber || "";
  scan.rep = scan.rep || store.rep || "";
  scan.mainPhone = scan.mainPhone || store.mainPhone || "";
  scan.altPhone = scan.altPhone || store.altPhone || "";
  scan.dt = scan.dt || store.dt || "";
  scan.specialInstructions = scan.specialInstructions || store.specialInstructions || "";
  scan.storeNotes = store.specialInstructions || scan.storeNotes || "";
  scan.lat = scan.lat || store.lat || 0;
  scan.lng = scan.lng || store.lng || 0;
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
  if (routeLisaOverride(store)) return "This stop is marked ordered by office today. Only continue if this is an emergency salesman invoice.";
  return store?.orderBlockedReason || "This store is normally ordered by the office. Only continue if this is an emergency salesman invoice.";
}

function setInvoiceActionsEnabled(enabled) {
  [els.saveInvoiceButton, els.saveAndPrintInvoice, els.saveAndShareInvoice].forEach((button) => {
    button.disabled = !enabled;
  });
}

function renderStoreOrderNotice() {
  const store = selectedStore();
  const blocked = storeBlocksOrders(store);
  const feeNotice = store && !storeHasDefaultDeliveryFee(store)
    ? "Check the invoice for the delivery fee. This store does not have a default delivery charge saved."
    : "";
  els.storeOrderNotice.hidden = !blocked && !feeNotice;
  els.storeOrderNotice.textContent = [blocked ? orderBlockedMessage(store) : "", feeNotice].filter(Boolean).join(" ");
  setInvoiceActionsEnabled(true);
}

function invoiceStore(invoice = {}) {
  return matchingStoreForInvoice(invoice);
}

function invoiceBlocksOrders(invoice = {}) {
  return storeBlocksOrders(invoiceStore(invoice));
}

function blockOrderAction(store = selectedStore()) {
  if (!storeBlocksOrders(store)) return false;
  return !confirm(`${orderBlockedMessage(store)}\n\nContinue anyway?`);
}

function productKey(product = {}) {
  const upc = String(product.upc || "").trim().toLowerCase();
  const description = String(product.description || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (isFrozenPizzaProduct(product)) return `pizza:${description}`;
  if (upc) return `upc:${upc}`;
  return `desc:${description}|${String(product.unit || "").trim().toLowerCase()}`;
}

function normalizeProduct(item = {}) {
  const product = {
    description: String(item.description || "").trim(),
    upc: String(item.upc || "").trim(),
    unit: String(item.unit || "ea").trim() || "ea",
    rate: Number(item.rate || 0),
    facings: String(item.facings || item.facing || "").trim(),
    frozenPizza: typeof item.frozenPizza === "boolean" ? item.frozenPizza : isFrozenPizzaProduct(item)
  };
  return {
    id: productKey(product) || crypto.randomUUID(),
    ...product
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
      rate: Number(product.rate || existing.rate || 0),
      facings: product.facings || existing.facings || "",
      frozenPizza: Boolean(product.frozenPizza || existing.frozenPizza)
    });
  });
  return [...byKey.values()].sort(sortProductsForUse);
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
      lat: hasOwn(store, "lat") ? Number(store.lat || 0) : Number(existing.lat || 0),
      lng: hasOwn(store, "lng") ? Number(store.lng || 0) : Number(existing.lng || 0),
      shelfInfo: hasOwn(store, "shelfInfo") ? store.shelfInfo || "" : existing.shelfInfo || "",
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
    name: formatStoreName(existing?.name || invoice.customer, existing?.address || invoice.address || ""),
    email: invoice.customerEmail || existing?.email || "",
    address: existing?.address || invoice.address || "",
    terms: invoice.terms || existing?.terms || "",
    poNumber: invoice.poNumber || existing?.poNumber || "",
    rep: invoice.rep || existing?.rep || "",
    orderBlocked: existing?.orderBlocked || Boolean(invoice.lisaHandled),
    orderBlockedReason: existing?.orderBlockedReason || "",
    mainPhone: invoice.mainPhone || existing?.mainPhone || "",
    altPhone: invoice.altPhone || existing?.altPhone || "",
    dt: invoice.dt || existing?.dt || "",
    specialInstructions: invoice.specialInstructions || existing?.specialInstructions || "",
    lat: existing?.lat || 0,
    lng: existing?.lng || 0,
    shelfInfo: existing?.shelfInfo || "",
    products: mergeProducts(existing?.products || [], [...invoiceItems, ...deliveryProducts])
  };
  const index = targetState.stores.findIndex((item) => item.id === store.id);
  if (index >= 0) targetState.stores[index] = store;
  else targetState.stores.push(store);
}

function invoiceLikeFromScan(scan = {}) {
  return {
    customer: scan.customer || "",
    customerEmail: scan.customerEmail || "",
    address: scan.address || "",
    number: scan.number || "",
    invoiceDate: scan.invoiceDate || routeDate(),
    terms: scan.terms || "",
    poNumber: scan.poNumber || "",
    rep: scan.rep || "",
    specialInstructions: scan.specialInstructions || "",
    mainPhone: scan.mainPhone || "",
    altPhone: scan.altPhone || "",
    dt: scan.dt || "",
    items: scan.items || lineItemsFromText(scan.itemsText || ""),
    total: Number(scan.total || scan.amount || scan.balanceDue || 0),
    balanceDue: Number(scan.balanceDue || scan.total || scan.amount || 0),
    lisaHandled: scanLisaHandled(scan)
  };
}

function possibleStoreForInvoice(invoice = {}, stores = state.stores || []) {
  const ranked = rankedStoreMatches(invoice, stores);
  return ranked.find((match) => match.addressMatch || match.score >= 90)?.store || null;
}

function confirmUsePossibleStore(invoice = {}, possibleStore = null) {
  if (!possibleStore) return null;
  const invoiceName = String(invoice.customer || "").trim() || "Unknown";
  const invoiceAddress = String(invoice.address || "").trim() || "No address read";
  const message = [
    "This invoice may already match a saved store.",
    "",
    `Invoice read: ${invoiceName}`,
    invoiceAddress,
    "",
    `Saved store: ${possibleStore.name}`,
    possibleStore.address || "No saved address",
    "",
    "Use the saved store instead of adding a new one?"
  ].join("\n");
  return confirm(message) ? possibleStore : null;
}

function resolveStoreForInvoiceApproval(invoice = {}, stores = state.stores || []) {
  const matched = matchingStoreForInvoice(invoice, stores);
  if (matched) return matched;
  return confirmUsePossibleStore(invoice, possibleStoreForInvoice(invoice, stores));
}

function approveScanStoreBeforeSave(scan = {}) {
  const selected = (state.stores || []).find((store) => store.id === scan.matchedStoreId);
  if (selected) {
    applyStoreToScan(scan, selected);
    return true;
  }
  const matched = resolveStoreForInvoiceApproval(scan, state.stores || []);
  if (matched) {
    applyStoreToScan(scan, matched);
    return true;
  }
  if (!scan.customer || !scan.address) return false;
  const addNew = confirm(`Add this as a new saved store?\n\nStore: ${scan.customer}\nAddress: ${scan.address}`);
  if (!addNew) return false;
  mergeStoreFromInvoice(state, invoiceLikeFromScan(scan));
  state.stores = mergeStores([], state.stores || []);
  const newStore = matchingStoreForInvoice(scan, state.stores || []);
  if (newStore) applyStoreToScan(scan, newStore);
  return true;
}

function approveStoreFromRouteScan(scan = {}) {
  const matched = resolveStoreForInvoiceApproval(scan, state.stores || []);
  if (matched) return matched;
  const name = String(scan.customer || "").trim();
  const address = String(scan.address || "").trim();
  if (!name || !address) return null;
  const approved = confirm(`This invoice does not match a saved store.\n\nStore: ${name}\nAddress: ${address}\n\nAdd this store to Saved Stores?`);
  if (!approved) return null;
  mergeStoreFromInvoice(state, invoiceLikeFromScan(scan));
  state.stores = mergeStores([], state.stores || []);
  return matchingStoreForInvoice(scan, state.stores || [])
    || (state.stores || []).find((store) => store.name.toLowerCase() === formatStoreName(name, address).toLowerCase())
    || null;
}

function reviewRouteScanFields(scan = {}) {
  const name = prompt("Review store/customer name from invoice:", scan.customer || "");
  if (name === null) return false;
  const address = prompt("Review store/customer address from invoice:", scan.address || "");
  if (address === null) return false;
  const number = prompt("Review invoice number:", scan.number || "");
  if (number === null) return false;
  const total = prompt("Review invoice total:", Number(scan.total || scan.balanceDue || scan.amount || 0) ? Number(scan.total || scan.balanceDue || scan.amount || 0).toFixed(2) : "");
  if (total === null) return false;
  scan.customer = name.trim();
  scan.address = address.trim();
  scan.number = number.trim();
  const parsedTotal = Number(String(total).replace(/[$,]/g, ""));
  if (Number.isFinite(parsedTotal) && parsedTotal >= 0) {
    scan.total = parsedTotal;
    scan.amount = parsedTotal;
    scan.balanceDue = parsedTotal;
    scan.customerTotalBalance = parsedTotal;
  }
  scan.accepted = Boolean(scan.number && (scan.customer || scan.address));
  return true;
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

function orderedLineItems(items = []) {
  return (items || []).filter((item) => {
    const qty = Number(item.qty || 0);
    const amount = Number(item.amount || 0);
    const rate = Number(item.rate || 0);
    if (isDeliveryItem(item)) return amount > 0 || rate > 0;
    return qty > 0 || amount > 0;
  });
}

function deliveryFeeFromItems(items = [], fallback = DEFAULT_DELIVERY_FEE) {
  const delivery = items.find(isDeliveryItem);
  return delivery ? Number(delivery.amount || delivery.rate || 0) : fallback;
}

function storeDeliveryFee(store = selectedStore()) {
  return store ? deliveryFeeFromItems(store.products || [], 0) : DEFAULT_DELIVERY_FEE;
}

function storeHasDefaultDeliveryFee(store = selectedStore()) {
  return Boolean(store && (store.products || []).some(isDeliveryItem));
}

function isPizzaProduct(product = {}) {
  const description = String(product.description || "").toLowerCase();
  return /\bpizza\b/.test(description) || /andoro\s+(?:9|12)"/.test(description) || /st\.?\s*louis\s*style/.test(description);
}

function isFrozenPizzaProduct(product = {}) {
  const description = String(product.description || "").toLowerCase();
  return /andoro/.test(description) && /\b(?:9|12)\s*["']?/.test(description) && /\bpizza\b|st\.?\s*louis\s*style/.test(description) && !/kit|sauce|delivery|fee|charge|credit/.test(description);
}

function sortProductsForUse(a, b) {
  const frozen = Number(Boolean(b.frozenPizza || isFrozenPizzaProduct(b))) - Number(Boolean(a.frozenPizza || isFrozenPizzaProduct(a)));
  if (frozen) return frozen;
  const pizza = Number(isPizzaProduct(b)) - Number(isPizzaProduct(a));
  if (pizza) return pizza;
  return String(a.description || "").localeCompare(String(b.description || ""));
}

function masterProducts() {
  const deleted = new Set(state.deletedProductKeys || []);
  const seeded = Object.values(catalog).map(normalizeProduct);
  const fromStores = (state.stores || []).flatMap((store) => store.products || []);
  return mergeProducts([], [...seeded, ...(state.products || []), ...fromStores])
    .filter((product) => !deleted.has(productKey(product)));
}

function allAvailableProducts(exceptStoreId = "") {
  return mergeProducts([], masterProducts()
    .filter((product) => !isDeliveryItem(product) && isFrozenPizzaProduct(product)));
}

function productsForStore(store = selectedStore()) {
  const products = (store?.products || []).filter((product) => !isDeliveryItem(product));
  return products.length ? products : allAvailableProducts(store?.id || "");
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
  return product.frozenPizza || isFrozenPizzaProduct(product) ? PIZZAS_PER_CASE : 1;
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
  const savedProducts = (store.products || []).filter((product) => !isDeliveryItem(product));
  const products = productsForStore(store);
  if (!products.length) {
    els.storeProductList.innerHTML = `<div class="muted">No products saved yet. Add products on the Stores tab.</div>`;
    return;
  }
  const current = currentOrderMap();
  const title = document.createElement("div");
  title.className = "store-products-title";
  title.textContent = savedProducts.length ? "Available products for this store" : "No store list saved yet - showing all available products";
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
        ${product.facings ? `<span class="case-note">Facings: ${escapeHtml(product.facings)}</span>` : ""}
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
  const items = productsForStore(store).map((product) => {
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
    tr.innerHTML = `<td colspan="8"><div class="empty-state"><strong>No invoices found</strong><span>Add or scan invoices to fill the ledger.</span></div></td>`;
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
      <td>
        <label class="checkbox-label office-sent-label">
          <input data-office-sent="${invoice.id}" type="checkbox" ${invoice.officeSent ? "checked" : ""}>
          ${invoice.officeSent ? "Sent" : "Not sent"}
        </label>
      </td>
      <td><div class="row-actions">
        <button class="icon-action" data-email-invoice="${invoice.id}" type="button">Customer</button>
        <button class="icon-action" data-office-invoice="${invoice.id}" type="button">Office</button>
        <button class="icon-action" data-share-invoice="${invoice.id}" type="button">Share</button>
        <button class="icon-action" data-download-invoice="${invoice.id}" type="button">Save</button>
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
        <label class="checkbox-label"><input data-scan-lisa="${scan.id}" type="checkbox" ${lisaHandled ? "checked" : ""}> Ordered by office</label>
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

function routeSlotScans() {
  const scans = state.scans || [];
  const seen = new Set();
  return routeDeliverySlots()
    .flatMap((slot) => routeScansForSlot(slot))
    .filter((scan) => {
      if (!scan || scan.accepted === false || seen.has(scan.id)) return false;
      seen.add(scan.id);
      return true;
    });
}

function routeScansForSlot(slotRecord = {}) {
  const slotNumber = Number(slotRecord.slot);
  const scans = state.scans || [];
  const byId = routeSlotScanIds(slotRecord)
    .map((id) => scans.find((scan) => scan.id === id))
    .filter(Boolean);
  const byRouteOrder = scans.filter((scan) => Number(scan.routeOrder) === slotNumber);
  const seen = new Set();
  return [...byId, ...byRouteOrder].filter((scan) => {
    if (!scan || seen.has(scan.id)) return false;
    seen.add(scan.id);
    return true;
  });
}

function routeSlotPrimaryScans() {
  const scans = state.scans || [];
  return routeDeliverySlots()
    .map((slot) => routeScansForSlot(slot).find(Boolean))
    .filter((scan) => scan && scan.accepted !== false);
}

function scanLabel(scan = {}) {
  return [scan.customer || "Invoice", scan.number ? `#${scan.number}` : "", scan.fileName || ""].filter(Boolean).join(" - ");
}

function invoiceOptionsHtml(selectedInvoiceId = "") {
  const routeDay = routeDate();
  const invoices = [...(state.invoices || [])]
    .sort((a, b) => {
      const dateCompare = String(invoiceDate(b) || "").localeCompare(String(invoiceDate(a) || ""));
      if (dateCompare) return dateCompare;
      return String(b.number || "").localeCompare(String(a.number || ""));
    });
  return [
    `<option value="">Attach saved invoice</option>`,
    ...invoices.map((invoice) => {
      const sameDay = invoiceDate(invoice) === routeDay ? "today" : formatDate(invoiceDate(invoice));
      const label = [invoice.customer || "Invoice", invoice.number ? `#${invoice.number}` : "", money.format(invoiceTotal(invoice)), sameDay].filter(Boolean).join(" - ");
      return `<option value="${escapeAttribute(invoice.id)}" ${invoice.id === selectedInvoiceId ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
  ].join("");
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
    const scans = routeScansForSlot(slotRecord);
    const assignedScan = assigned.get(slot);
    if (!scans.length && assignedScan) scans.push(assignedScan);
    const scan = scans[0];
    const selectedStoreId = slotRecord.storeId || scan?.matchedStoreId || "";
    const selectedStore = (state.stores || []).find((store) => store.id === selectedStoreId);
    const hasInvoice = scans.some(scanHasInvoice);
    const storeNotes = scan?.storeNotes || selectedStore?.specialInstructions || "";
    const stopNoteValue = scan?.routeNote || "";
    const selectedInvoiceId = scan?.savedInvoiceId || "";
    const scanStatus = scan
      ? [`${scans.length} invoice${scans.length === 1 ? "" : "s"}`, scans.map((item) => item.number ? `#${item.number}` : scanLabel(item)).join(", "), scans.some(scanLisaHandled) ? "Ordered by office" : "Salesman order", scans.every(scanDelivered) ? "Delivered" : "Not delivered", scans.every(scanPaid) ? "Paid" : "Unpaid"].filter(Boolean).join(" - ")
      : selectedStore ? "Store selected - no invoice attached yet." : "Select the store, then attach this stop's invoice.";
    const row = document.createElement("article");
    const officeOrdered = scan ? scanLisaHandled(scan) : Boolean(selectedStore?.orderBlocked);
    row.className = `route-slot${scan ? " filled" : ""}${selectedStore ? " store-selected" : ""}${selectedStore && !hasInvoice ? " missing-invoice" : ""}${officeOrdered ? " office-ordered" : ""}`;
    row.draggable = true;
    row.dataset.routeSlot = String(slot);
    row.innerHTML = `
      <strong class="route-slot-handle" title="Drag to reorder">${slot}</strong>
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
      <div class="route-slot-attach">
        <select data-route-slot-invoice="${slot}" aria-label="Attach saved invoice to delivery spot ${slot}">${invoiceOptionsHtml(selectedInvoiceId)}</select>
        <button class="secondary-button compact-slot-button" data-attach-route-invoice="${slot}" type="button">Attach</button>
      </div>
      ${selectedStore ? `<button class="secondary-button compact-slot-button route-manual-invoice-button" data-add-manual-route-invoice="${slot}" type="button">Add manual invoice</button>` : ""}
      ${scan ? `<button class="ghost-button compact-slot-button" data-clear-route-slot="${slot}" type="button">Clear</button>` : ""}
      <div class="route-slot-move">
        <button class="ghost-button compact-slot-button" data-route-slot-up="${slot}" type="button">Up</button>
        <button class="ghost-button compact-slot-button" data-route-slot-down="${slot}" type="button">Down</button>
      </div>
      ${scans.length ? `
        <div class="route-slot-notes">
          ${scans.map((item, invoiceIndex) => `
            <div class="field-row route-slot-invoice-line">
              <label>Store name<input data-scan-field="customer" data-scan-id="${item.id}" value="${escapeAttribute(item.customer || "")}" placeholder="Store or customer"></label>
              <label>Address<input data-scan-field="address" data-scan-id="${item.id}" value="${escapeAttribute(item.address || "")}" placeholder="Street, city, state"></label>
              <label>Invoice ${invoiceIndex + 1} #<input data-scan-field="number" data-scan-id="${item.id}" value="${escapeAttribute(item.number || "")}" placeholder="Invoice number"></label>
              <label>Invoice ${invoiceIndex + 1} total<input data-scan-field="total" data-scan-id="${item.id}" type="number" step="0.01" value="${Number(item.total || item.amount || item.balanceDue || 0) || ""}" placeholder="0.00"></label>
              <label class="checkbox-label route-delivered-toggle route-delivered-summary-toggle"><input data-scan-delivered="${item.id}" type="checkbox" ${scanDelivered(item) ? "checked" : ""}> Delivered - count in summary</label>
              <label class="checkbox-label route-paid-toggle route-paid-summary-toggle"><input data-scan-paid="${item.id}" type="checkbox" ${scanPaid(item) ? "checked" : ""}> Paid</label>
            </div>
          `).join("")}
          ${storeNotes ? `<div class="store-note-box"><strong>Store notes</strong><span>${escapeHtml(storeNotes)}</span></div>` : ""}
          <label>Stop notes<textarea data-scan-field="routeNote" data-scan-id="${scan.id}" rows="2" placeholder="Anything that happened at this stop">${escapeHtml(stopNoteValue)}</textarea></label>
        </div>
      ` : selectedStore && storeNotes ? `<div class="route-slot-notes"><div class="store-note-box"><strong>Store notes</strong><span>${escapeHtml(storeNotes)}</span></div></div>` : ""}
    `;
    els.routeDeliverySlots.append(row);
  }
}

function renderRouteDayStatus() {
  const prospectsWithAddress = (state.routeDay?.prospects || []).filter((prospect) => prospect.address);
  const stops = [
    ...routeSlotPrimaryScans().filter((scan) => scan.address).map((scan) => ({
      name: scan.customer || "Stop",
      address: scan.address
    })),
    ...prospectsWithAddress.map((prospect) => ({
      name: prospect.name || "New account stop",
      address: prospect.address
    }))
  ];
  const orderedCount = routeSlotScans().length;
  const prospectCount = state.routeDay?.prospects?.length || 0;
  const lisaCount = routeSlotScans().filter((scan) => scanLisaHandled(scan)).length;
  const invoiceCount = routeSlotScans().filter(scanHasInvoice).length;
  const deliveredCount = routeSlotScans().filter((scan) => scanDelivered(scan)).length;
  const paidCount = routeSlotScans().filter((scan) => scanPaid(scan)).length;
  els.routeDayStatus.textContent = orderedCount
    ? `${orderedCount} route stop${orderedCount === 1 ? "" : "s"} loaded, ${invoiceCount} with invoice, ${deliveredCount} delivered, ${paidCount} paid, ${lisaCount} ordered by office, ${prospectCount} new account stop${prospectCount === 1 ? "" : "s"}`
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
        : `<div class="file-preview">${receipt.type === "manual" ? "EXP" : "PDF"}</div>`;
      card.innerHTML = `
        ${preview}
        <div>
          <div>
            <strong>${escapeHtml(receipt.name || "Receipt")}</strong>
            ${Number(receipt.amount || 0) ? `<span>${money.format(Number(receipt.amount || 0))}</span>` : ""}
            ${receipt.notes ? `<span>${escapeHtml(receipt.notes)}</span>` : ""}
          </div>
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

function parseInvoiceText(rawText, fileName, layout = null, zones = null) {
  const text = rawText.replace(/\r/g, "\n");
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const amountMatches = amountsFromText(text);
  const dateMatches = [...text.matchAll(/\b([0-1]?\d[\/\-][0-3]?\d[\/\-](?:20)?\d{2})\b/g)].map((match) => normalizeDate(match[1]));
  const layoutInvoice = parseLayoutInvoice(layout);
  const zoneInvoice = parseZoneInvoice(zones);
  const invoiceNumber = zoneInvoice.number
    || layoutInvoice.number
    || invoiceNumberFromText(text)
    || extractInvoiceNumberFromLine(findValueAfterLabel(lines, /invoice\s*#/i))
    || invoiceNumberNearDate(lines)
    || "";
  const billTo = zoneInvoice.billTo?.customer ? zoneInvoice.billTo : layoutInvoice.billTo?.customer ? layoutInvoice.billTo : parseBillTo(lines);
  const totals = parseTotals(text, amountMatches, { ...layoutInvoice, total: zoneInvoice.total || layoutInvoice.total || 0 });
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
    delivered: false,
    paid: false,
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
  const sameLine = lines[billIndex].replace(/.*bill\s*to[:\s]*/i, "").trim();
  if (sameLine && sameLine !== lines[billIndex] && !isCompanyHeaderLine(sameLine)) block.push(sameLine);
  for (const line of lines.slice(billIndex + 1, billIndex + 8)) {
    if (/special instructions|p\.?o\.?|terms|description|qty|u\/m|rate|amount|invoice|andoro\s*&?\s*sons|appaloosa|high ridge/i.test(line)) break;
    if (/^bill\s*to$/i.test(line)) continue;
    if (isCompanyHeaderLine(line)) continue;
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

function isCompanyHeaderLine(line = "") {
  return /andoro\s*&?\s*sons|2340\s+appaloosa|appaloosa\s+trail|high\s+ridge|tasting\s+is\s+believing|andoropizza|6363329005|1-800-657-0467/i.test(line);
}

function parseLayoutInvoice(layout) {
  if (!layout?.lines?.length) return {};
  return {
    billTo: parseLayoutBillTo(layout),
    number: parseLayoutInvoiceNumber(layout),
    total: parseLayoutTotal(layout)
  };
}

function parseZoneInvoice(zones) {
  if (!zones) return {};
  return {
    billTo: parseZoneBillTo(zones.billTo || ""),
    number: extractInvoiceNumberFromLine(zones.invoiceBox || ""),
    total: parseZoneTotal(zones.totalBox || "")
  };
}

function parseZoneBillTo(text = "") {
  const lines = String(text)
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[^A-Z0-9#]+/i, "").trim())
    .filter(Boolean)
    .filter((line) => !/^bill\s*to$/i.test(line))
    .filter((line) => !isCompanyHeaderLine(line))
    .filter((line) => !/special instructions|invoice|date|terms|description|qty|rate|amount/i.test(line));
  const normalized = [];
  lines.forEach((line) => {
    const cleaned = line.replace(/^bill\s*to[:\s]*/i, "").trim();
    if (cleaned) normalized.push(cleaned);
  });
  const customerIndex = normalized.findIndex((line) => !looksLikeAddressLine(line) && !/\b[A-Z]{2}\s+\d{5}\b/i.test(line));
  const customer = customerIndex >= 0 ? cleanImportedCustomerName(normalized[customerIndex]) : "";
  const address = normalized
    .filter((line, index) => index !== customerIndex)
    .filter((line) => looksLikeAddressLine(line) || /\b[A-Z]{2}\s+\d{5}\b/i.test(line) || /^c\/o\b/i.test(line))
    .join(", ");
  return { customer, address };
}

function parseZoneTotal(text = "") {
  const lines = String(text).split("\n").map((line) => line.trim()).filter(Boolean);
  const balanceLine = lines.find((line) => /balance\s+due/i.test(line));
  const totalLine = lines.find((line) => /^total\b/i.test(line));
  const preferred = balanceLine || totalLine;
  if (preferred) return amountsFromText(preferred).at(-1) || 0;
  return amountsFromText(lines.join("\n")).at(-1) || 0;
}

function parseLayoutBillTo(layout) {
  const pageWidth = Number(layout.width || 0);
  const pageHeight = Number(layout.height || 0);
  const billLine = layout.lines.find((line) => /bill\s*to/i.test(line.text) && line.x < pageWidth * 0.55);
  if (!billLine) return { customer: "", address: "" };
  const bottomLimit = pageHeight * 0.43;
  const rightLimit = Math.max(pageWidth * 0.55, billLine.x + pageWidth * 0.32);
  const block = layout.lines
    .filter((line) => line.y < billLine.y - 4 && line.y > bottomLimit && line.x >= Math.max(0, billLine.x - 35) && line.x < rightLimit)
    .filter((line) => !/special instructions|p\.?o\.?|terms|description|qty|u\/m|rate|amount|invoice/i.test(line.text))
    .map((line) => line.text.trim())
    .filter((line) => line && !isCompanyHeaderLine(line))
    .slice(0, 5);
  const customerIndex = block.findIndex((line) => !looksLikeAddressLine(line) && !/\b[A-Z]{2}\s+\d{5}\b/i.test(line));
  const customer = customerIndex >= 0 ? cleanImportedCustomerName(block[customerIndex]) : "";
  const address = block
    .filter((line, index) => index !== customerIndex)
    .filter((line) => looksLikeAddressLine(line) || /\b[A-Z]{2}\s+\d{5}\b/i.test(line))
    .join(", ");
  return { customer, address };
}

function parseLayoutInvoiceNumber(layout) {
  const pageWidth = Number(layout.width || 0);
  const pageHeight = Number(layout.height || 0);
  const rightTopLines = layout.lines.filter((line) => line.x > pageWidth * 0.55 && line.y > pageHeight * 0.68);
  const label = rightTopLines.find((line) => /invoice\s*#/i.test(line.text));
  if (label) {
    const below = rightTopLines
      .filter((line) => line.y < label.y - 2 && Math.abs(line.x - label.x) < pageWidth * 0.18)
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .map((line) => extractInvoiceNumberFromLine(line.text))
      .find(Boolean);
    if (below) return below;
  }
  const merged = rightTopLines.map((line) => line.text).join("\n");
  return invoiceNumberFromText(merged);
}

function invoiceNumberFromText(text = "") {
  const lines = String(text).split("\n").map((line) => line.trim()).filter(Boolean);
  for (const [index, line] of lines.entries()) {
    if (!/invoice\s*#/i.test(line)) continue;
    const sameLine = line.replace(/.*invoice\s*#\s*[:\-]*/i, "").trim();
    const sameLineNumber = extractInvoiceNumberFromLine(sameLine);
    if (sameLineNumber) return sameLineNumber;
    for (const nearby of lines.slice(index + 1, index + 4)) {
      const nearbyNumber = extractInvoiceNumberFromLine(nearby);
      if (nearbyNumber) return nearbyNumber;
    }
  }
  return "";
}

function extractInvoiceNumberFromLine(line = "") {
  const cleaned = String(line).replace(/\b[0-1]?\d[\/\-][0-3]?\d[\/\-](?:20)?\d{2}\b/g, " ");
  const candidates = [...cleaned.matchAll(/\b([0-9][0-9A-Z-]{2,})\b/gi)]
    .map((match) => match[1])
    .filter((value) => !/^(?:19|20)\d{2}$/.test(value));
  return candidates.at(-1) || "";
}

function parseLayoutTotal(layout) {
  const pageWidth = Number(layout.width || 0);
  const pageHeight = Number(layout.height || 0);
  const lowerRightLines = layout.lines.filter((line) => line.x > pageWidth * 0.56 && line.y < pageHeight * 0.32);
  const balanceLine = lowerRightLines.find((line) => /balance\s+due/i.test(line.text));
  const totalLine = lowerRightLines.find((line) => /^total\b/i.test(line.text));
  const preferred = balanceLine || totalLine;
  if (preferred) {
    const inline = amountsFromText(preferred.text).at(-1);
    if (inline) return inline;
    const sameRow = lowerRightLines
      .filter((line) => Math.abs(line.y - preferred.y) < 8 && line.x > preferred.x)
      .sort((a, b) => b.x - a.x)
      .map((line) => amountsFromText(line.text).at(-1))
      .find((value) => Number(value) > 0);
    if (sameRow) return sameRow;
  }
  const amounts = lowerRightLines.flatMap((line) => amountsFromText(line.text));
  return amounts.at(-1) || 0;
}

function invoiceNumberNearDate(lines) {
  const dateLine = lines.find((line) => /\b[0-1]?\d[\/\-][0-3]?\d[\/\-](?:20)?\d{2}\b/.test(line) && /\b\d{3,}\b/.test(line));
  if (!dateLine) return "";
  return extractInvoiceNumberFromLine(dateLine);
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

function parseTotals(text, amounts, layoutInvoice = {}) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const amountFromLine = (pattern) => {
    const line = lines.find((entry) => pattern.test(entry));
    if (!line) return 0;
    return amountsFromText(line).at(-1) || 0;
  };
  const customerTotalBalance = amountFromLine(/customer\s+total\s+balance/i);
  const paymentsCredits = amountFromLine(/payments\s*\/?\s*credits/i);
  const balanceDue = layoutInvoice.total || amountFromLine(/balance\s+due/i) || amounts.at(-1) || 0;
  const totalLine = lines.find((entry) => /^total\b/i.test(entry));
  const total = layoutInvoice.total || (totalLine ? amountsFromText(totalLine).at(-1) || 0 : amounts.at(-3) || balanceDue);
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
  const origin = fixedRouteOrigin();
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    alert("The starting address could not be read.");
    return;
  }
  state.origin = origin;
  const route = optimizedStopOrder(state.stops, origin);
  state.optimizedStopIds = route.map((stop) => stop.id);
  saveState();
  render();
}

function fixedRouteOrigin() {
  return { ...FIXED_ROUTE_ORIGIN };
}

function optimizedStopOrder(stops = [], origin = fixedRouteOrigin()) {
  const unvisited = stops.filter((stop) => Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng)));
  const route = [];
  let current = origin;
  let currentMinutes = routeStartMinutes();
  while (unvisited.length) {
    unvisited.sort((a, b) => {
      return routeChoiceScore(current, currentMinutes, a) - routeChoiceScore(current, currentMinutes, b);
    });
    const next = unvisited.shift();
    route.push(next);
    currentMinutes += travelMinutes(current, next) + serviceMinutesForStop(next);
    current = next;
  }
  return improveRouteWithTwoOpt(route, origin, routeStartMinutes());
}

function routeChoiceScore(current, currentMinutes, stop) {
  const miles = haversineMiles(current, stop);
  const arrival = currentMinutes + travelMinutes(current, stop);
  const deliveryMinutes = deliveryTimeMinutes(stop);
  if (deliveryMinutes === null) return miles;
  const early = Math.max(0, deliveryMinutes - arrival);
  const late = Math.max(0, arrival - deliveryMinutes);
  return miles + (early > 25 ? early * 0.22 : 0) + late * 1.8;
}

function improveRouteWithTwoOpt(route = [], origin = fixedRouteOrigin(), startMinutes = routeStartMinutes()) {
  const best = [...route];
  let improved = true;
  let passes = 0;
  while (improved && passes < 8) {
    improved = false;
    passes += 1;
    for (let i = 0; i < best.length - 2; i += 1) {
      for (let k = i + 2; k < best.length; k += 1) {
        const candidate = [
          ...best.slice(0, i + 1),
          ...best.slice(i + 1, k + 1).reverse(),
          ...best.slice(k + 1)
        ];
        if (routeScore(candidate, origin, startMinutes) + 0.01 < routeScore(best, origin, startMinutes)) {
          best.splice(0, best.length, ...candidate);
          improved = true;
        }
      }
    }
  }
  return best;
}

function routeScore(stops = [], origin = fixedRouteOrigin(), startMinutes = routeStartMinutes()) {
  let current = origin;
  let minutes = startMinutes;
  return stops.reduce((score, stop) => {
    const miles = haversineMiles(current, stop);
    minutes += travelMinutes(current, stop);
    const deliveryMinutes = deliveryTimeMinutes(stop);
    const early = deliveryMinutes === null ? 0 : Math.max(0, deliveryMinutes - minutes);
    const late = deliveryMinutes === null ? 0 : Math.max(0, minutes - deliveryMinutes);
    const timePenalty = (early > 25 ? early * 0.22 : 0) + late * 1.8;
    current = stop;
    minutes += serviceMinutesForStop(stop);
    return score + miles + timePenalty;
  }, 0);
}

function routeDistance(stops = [], origin = fixedRouteOrigin()) {
  let current = origin;
  const outbound = stops.reduce((total, stop) => {
    const miles = current ? haversineMiles(current, stop) : 0;
    current = stop;
    return total + miles;
  }, 0);
  return outbound + (stops.length ? haversineMiles(current, origin) : 0);
}

function travelMinutes(a, b) {
  return (haversineMiles(a, b) / 42) * 60;
}

function serviceMinutesForStop(stop = {}) {
  return scanHasInvoice(stop.scan || {}) ? 10 : 5;
}

function routeStartMinutes() {
  const saved = state.routeDay?.startTime || "";
  const parsed = timeToMinutes(saved);
  if (parsed !== null) return parsed;
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function minutesBetweenTimes(start = "", end = "") {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return null;
  return endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 1440 - startMinutes;
}

function routeFactoryLoadingLabel() {
  const minutes = minutesBetweenTimes(state.routeDay?.arriveFactoryTime || "", state.routeDay?.startTime || "");
  if (minutes === null) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours} hr ${remainder} min` : `${remainder} min`;
}

function deliveryTimeMinutes(stop = {}) {
  return timeToMinutes(stop.dt || stop.scan?.dt || stop.store?.dt || stop.scan?.specialInstructions || stop.store?.specialInstructions || "");
}

function timeToMinutes(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.replace(/\./g, "");
  if (hours > 24 || minutes > 59) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (!meridiem && hours <= 5) hours += 12;
  return hours * 60 + minutes;
}

function routeMiles(stops) {
  return routeDistance(stops, state.origin || fixedRouteOrigin());
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
  points.push(encodeURIComponent(FIXED_ROUTE_ORIGIN.address));
  points.push(...stops.map((stop) => encodeURIComponent(stop.address || `${stop.lat},${stop.lng}`)));
  points.push(encodeURIComponent(FIXED_ROUTE_ORIGIN.address));
  return `https://www.google.com/maps/dir/${points.join("/")}`;
}

function addressLooksMappable(address = "") {
  const text = String(address || "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  const hasStreetNumber = /\b\d{2,6}\b/.test(text);
  const hasStreetWord = /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|way|hwy|highway|route|rte|trail|row)\b/i.test(text);
  const hasCityStateOrZip = /\b[A-Z]{2}\b\s*\d{5}\b/i.test(text) || /\b(MO|Missouri|IL|Illinois)\b/i.test(text);
  return hasStreetNumber && hasStreetWord && hasCityStateOrZip;
}

function weakRouteAddresses(stops = []) {
  return stops.filter((stop) => !addressLooksMappable(stop.address || ""));
}

function routeInvoices() {
  const scans = routeSlotScans();
  const invoices = scans
    .filter(scanDelivered)
    .map((scan) => routeInvoiceForScan(scan))
    .filter(Boolean);
  const seen = new Set();
  return invoices.filter((invoice) => {
    if (seen.has(invoice.id)) return false;
    seen.add(invoice.id);
    return true;
  });
}

function routeInvoiceForScan(scan = {}) {
  return matchingInvoiceForRouteScan(scan) || null;
}

function matchingInvoiceForRouteScan(scan = {}) {
  const date = routeDate();
  const sameNumber = (invoice) => String(invoice.number || "").trim() && String(invoice.number || "").trim() === String(scan.number || "").trim();
  const sameDate = (invoice) => invoiceDate(invoice) === date;
  const sameStore = (invoice) => {
    const invoiceName = normalizedName(invoice.customer || "");
    const scanName = normalizedName(scan.customer || "");
    return !scanName || !invoiceName || invoiceName === scanName || invoiceName.includes(scanName) || scanName.includes(invoiceName);
  };
  const matches = (state.invoices || []).filter((invoice) => sameNumber(invoice) && sameDate(invoice) && sameStore(invoice));
  if (matches.length) {
    return matches.sort((a, b) => Number(Boolean(b.totalOverride)) - Number(Boolean(a.totalOverride)))[0];
  }
  return (state.invoices || []).find((invoice) => invoice.id === scan.savedInvoiceId && sameDate(invoice)) || null;
}

function routeDayTotal() {
  return routeSummaryInvoiceScans()
    .filter(scanDelivered)
    .reduce((sum, scan) => sum + routeInvoiceTotalForScan(scan), 0);
}

function routeInvoiceTotalForScan(scan = {}) {
  const explicitTotal = Number(scan.total || scan.balanceDue || scan.amount || 0);
  if (Number.isFinite(explicitTotal) && explicitTotal > 0) return explicitTotal;
  const invoice = routeInvoiceForScan(scan);
  if (invoice) return invoiceTotal(invoice);
  const itemTotal = lineItemTotal(scan.items || lineItemsFromText(scan.itemsText || ""));
  return Number.isFinite(itemTotal) && itemTotal > 0 ? itemTotal : 0;
}

function syncRouteInvoiceLineFields(target, scan) {
  const line = target?.closest?.(".route-slot-invoice-line");
  if (!line || !scan) return;
  line.querySelectorAll("[data-scan-field]").forEach((field) => {
    if (field.dataset.scanId !== scan.id) return;
    const key = field.dataset.scanField;
    if (["amount", "customerTotalBalance", "total", "paymentsCredits", "balanceDue", "routeOrder"].includes(key)) {
      scan[key] = Number(field.value || 0);
    } else {
      scan[key] = field.value;
    }
  });
}

function syncAllRouteInvoiceLineFields() {
  document.querySelectorAll(".route-slot-invoice-line").forEach((line) => {
    const delivered = line.querySelector("[data-scan-delivered]");
    const scan = (state.scans || []).find((item) => item.id === delivered?.dataset.scanDelivered);
    if (!scan) return;
    syncRouteInvoiceLineFields(delivered, scan);
    scan.delivered = delivered.checked;
    const paid = line.querySelector("[data-scan-paid]");
    scan.paid = Boolean(paid?.checked);
    scan.accepted = true;
  });
  saveState();
}

function routeSummaryStoreKey(scan = {}) {
  const address = normalizedAddress(scan.address || "");
  if (address) return `address:${address}`;
  if (scan.matchedStoreId) return `store:${scan.matchedStoreId}`;
  return `name:${normalizedName(cleanImportedCustomerName(scan.customer || "") || scan.customer || "unknown")}`;
}

function routeSummaryInvoiceKey(scan = {}) {
  const storeKey = routeSummaryStoreKey(scan);
  const number = String(scan.number || "").trim();
  if (scan.savedInvoiceId) return `saved:${scan.savedInvoiceId}`;
  if (number) return `number:${storeKey}:${number}`;
  const total = routeInvoiceTotalForScan(scan);
  return `manual:${storeKey}:${scan.id || ""}:${total}`;
}

function routeSummaryInvoiceScans() {
  const summaryScans = routeSlotScans().filter((scan) => {
    const hasNumber = Boolean(String(scan.number || "").trim());
    const hasSavedInvoice = Boolean(scan.savedInvoiceId);
    const hasTotal = routeInvoiceTotalForScan(scan) > 0;
    const hasStopInfo = Boolean(scan.customer || scan.address || scan.routeNote);
    return hasNumber || hasSavedInvoice || hasTotal || hasStopInfo;
  });
  const byStore = new Map();
  summaryScans.forEach((scan) => {
    const key = routeSummaryStoreKey(scan);
    if (!byStore.has(key)) byStore.set(key, []);
    byStore.get(key).push(scan);
  });
  const cleaned = [];
  byStore.forEach((storeScans) => {
    const hasDelivered = storeScans.some(scanDelivered);
    const rows = hasDelivered && storeScans.length > 1
      ? storeScans.filter(scanDelivered)
      : storeScans;
    const seenInvoices = new Set();
    rows.forEach((scan) => {
      const invoiceKey = routeSummaryInvoiceKey(scan);
      if (seenInvoices.has(invoiceKey)) return;
      seenInvoices.add(invoiceKey);
      cleaned.push(scan);
    });
  });
  return cleaned;
}

function routeSummaryHtml() {
  const stops = routeSummaryInvoiceScans();
  const receipts = state.routeDay?.receipts || [];
  const receiptRows = receipts.map((receipt, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(receipt.name || "Receipt")}</td>
      <td>${escapeHtml(formatDate(receipt.date || routeDate()))}</td>
      <td class="money">${Number(receipt.amount || 0) ? money.format(Number(receipt.amount || 0)) : ""}</td>
      <td class="note-cell">${escapeHtml(receipt.notes || "")}</td>
    </tr>`).join("");
  const stopRows = stops.map((scan, index) => {
    const storeName = scan.customer || `Stop ${index + 1}`;
    const invoice = routeInvoiceForScan(scan);
    const invoiceNumber = invoice?.number || scan.number || "";
    const delivered = scanDelivered(scan);
    const paid = scanPaid(scan);
    const stopInvoiceTotal = routeInvoiceTotalForScan(scan);
    return `
      <tr class="${delivered ? "" : "not-delivered"}${paid ? "" : " unpaid-stop"}">
        <td>${index + 1}</td>
        <td>
          <strong>${escapeHtml(storeName)}</strong>
          <span>${escapeHtml(scan.address || "")}</span>
        </td>
        <td>${escapeHtml(invoiceNumber)}</td>
        <td>${scanLisaHandled(scan) ? "Office" : "Salesman"}</td>
        <td><strong>${delivered ? "Delivered" : "Not delivered"}</strong></td>
        <td><strong>${paid ? "Paid" : "Not paid"}</strong></td>
        <td class="money">${money.format(stopInvoiceTotal)}</td>
        <td class="note-cell">${escapeHtml(scan.routeNote || "")}</td>
      </tr>`;
  }).join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Andoro Route Summary</title>
  <style>
    body { font-family: Arial, sans-serif; color: #10251d; margin: 0; background: #fff; }
    main { max-width: 8.5in; margin: 0 auto; padding: 0.3in; }
    .preview-actions { position: sticky; top: 0; z-index: 5; display: flex; justify-content: flex-end; padding: 10px; background: #fff; border-bottom: 1px solid #ddd; }
    .preview-actions button { border: 0; border-radius: 8px; background: #d71920; color: #111; font-weight: 900; padding: 10px 16px; cursor: pointer; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #176b4d; padding-bottom: 12px; gap: 16px; }
    img { width: 136px; height: auto; }
    h1 { margin: 0; font-size: 26px; color: #0d3326; }
    .meta { text-align: right; line-height: 1.35; font-size: 12px; font-weight: 700; }
    .total { margin: 14px 0; padding: 11px 12px; border: 2px solid #176b4d; display: flex; justify-content: space-between; font-size: 19px; font-weight: 900; }
    h2 { margin: 16px 0 6px; font-size: 15px; color: #0d3326; }
    .notes { border: 1px solid #176b4d; padding: 9px; min-height: 70px; line-height: 1.35; font-size: 10.5px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #b9d6c4; color: #0d3326; text-align: left; }
    th, td { border: 1px solid #176b4d; padding: 6px; vertical-align: top; font-size: 11px; }
    th { font-size: 10.5px; }
    td span { display: block; color: #4d6158; margin-top: 2px; font-size: 9.5px; }
    .note-cell { color: #203b31; font-size: 9.5px; line-height: 1.25; }
    .money { text-align: right; white-space: nowrap; }
    .not-delivered td { background: #fff1f1; }
    .not-delivered td:nth-child(5) { color: #9f1117; }
    .unpaid-stop td:nth-child(6) { color: #9f1117; }
    @page { size: letter; margin: 0; }
    @media print {
      .preview-actions { display: none; }
      a[href]::after { content: ""; }
      body { margin: 0; }
      main { padding: 0.18in; max-width: none; }
      header { padding-bottom: 6px; }
      img { width: 104px; }
      h1 { font-size: 21px; }
      .meta { font-size: 9.5px; line-height: 1.25; }
      h2 { margin: 10px 0 4px; font-size: 12.5px; }
      .total { margin: 8px 0; padding: 7px 9px; font-size: 15px; }
      .notes { min-height: 64px; padding: 7px; font-size: 8.8px; line-height: 1.22; }
      th, td { padding: 3.5px 4px; font-size: 8.8px; }
      th { font-size: 8.6px; }
      td span { font-size: 7.8px; }
      .note-cell { font-size: 7.7px; line-height: 1.18; }
      tr { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="preview-actions"><button type="button" onclick="window.close()">Exit</button></div>
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
        <div>Arrived factory: ${escapeHtml(state.routeDay?.arriveFactoryTime || "")}</div>
        <div>Route start: ${escapeHtml(state.routeDay?.startTime || "Build time")}</div>
        <div>Van loading time: ${escapeHtml(routeFactoryLoadingLabel() || "")}</div>
        <div>Factory: ${escapeHtml(FIXED_ROUTE_ORIGIN.address)}</div>
        <div>Route finish: ${escapeHtml(state.routeDay?.finishTime || "")}</div>
        <div>Starting invoice #: ${escapeHtml(state.routeDay?.startingInvoiceNumber || "")}</div>
      </div>
    </header>
    <section class="total"><span>Day Invoice Total</span><span>${money.format(routeDayTotal())}</span></section>
    <h2>Day Notes</h2>
    <section class="notes">${escapeHtml(state.routeDay?.notes || "No general day notes.").replace(/\n/g, "<br>")}</section>
    <h2>Today's Route</h2>
    <table>
      <thead><tr><th>Order</th><th>Store</th><th>Invoice #</th><th>Handled By</th><th>Delivered</th><th>Paid</th><th>Invoice Total</th><th>Notes</th></tr></thead>
      <tbody>${stopRows || `<tr><td colspan="8">No route stops loaded.</td></tr>`}</tbody>
    </table>
    <h2>Gas / Expense Receipts</h2>
    <table>
      <thead><tr><th>#</th><th>Expense / Receipt</th><th>Date Added</th><th>Amount</th><th>Notes</th></tr></thead>
      <tbody>${receiptRows || `<tr><td colspan="5">No expenses recorded.</td></tr>`}</tbody>
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
  els.deliveryFee.value = "0.00";
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
      product.rate ?? "",
      product.facings || ""
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
      rate: Number(parts[3] || 0),
      facings: parts[4] || ""
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
    button.className = `store-manager-item${store.id === selectedId ? " active" : ""}${store.orderBlocked ? " office-ordered" : ""}`;
    button.type = "button";
    button.dataset.storeManagerId = store.id;
    const productCount = (store.products || []).filter((product) => !isDeliveryItem(product)).length;
    const hasGeo = Boolean(Number(store.lat) && Number(store.lng));
    const addressStatus = addressLooksMappable(store.address || "") ? "Address ready" : "Check address";
    button.innerHTML = `
      <strong>${escapeHtml(store.name)}</strong>
      <span>${escapeHtml([store.address?.split("\n").at(-1), store.orderBlocked ? "Ordered by office" : "Salesman order allowed"].filter(Boolean).join(" - "))}</span>
      <small>${productCount} product${productCount === 1 ? "" : "s"}${store.orderBlocked ? " - Office" : ""} - ${hasGeo ? "Geo saved" : "Needs geo"} - ${addressStatus}</small>
    `;
    els.storeManagerList.append(button);
  });
}

function renderStoreAddressCheckResults() {
  if (!els.storeAddressCheckList) return;
  els.storeAddressCheckList.replaceChildren();
  if (!storeAddressChecks.length) return;
  storeAddressChecks.forEach((check) => {
    const card = document.createElement("div");
    card.className = `address-check-card ${check.suggestion ? "found" : "missing"}`;
    const savedGeo = check.hadGeo ? "Saved coordinates exist" : "No saved coordinates";
    const addressNote = check.weakAddress ? "Address may be too weak for routing" : "Saved address looks usable";
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(check.name)}</strong>
        <span>${escapeHtml(check.address || "No saved address")}</span>
        <small>${escapeHtml(`${savedGeo} - ${addressNote}`)}</small>
      </div>
      <div>
        ${check.suggestion ? `
          <span class="address-suggestion">${escapeHtml(check.suggestion.displayName || `${check.suggestion.lat}, ${check.suggestion.lng}`)}</span>
          <small>${Number(check.suggestion.lat).toFixed(6)}, ${Number(check.suggestion.lng).toFixed(6)}</small>
          <div class="button-row">
            <button class="secondary-button" data-apply-store-geo="${escapeHtml(check.storeId)}" type="button">Save coordinates</button>
            <button class="ghost-button" data-apply-store-address="${escapeHtml(check.storeId)}" type="button">Use suggested address</button>
          </div>
        ` : "<span>No map match found. Edit the address or tag current location.</span>"}
      </div>
    `;
    els.storeAddressCheckList.append(card);
  });
}

async function checkStoreAddresses() {
  if (!state.stores?.length) {
    alert("No saved stores to check yet.");
    return;
  }
  storeAddressChecks = [];
  renderStoreAddressCheckResults();
  els.checkStoreAddresses.disabled = true;
  els.storeAddressCheckStatus.textContent = `Checking 0 of ${state.stores.length} stores...`;
  for (let index = 0; index < state.stores.length; index += 1) {
    const store = state.stores[index];
    els.storeAddressCheckStatus.textContent = `Checking ${index + 1} of ${state.stores.length}: ${store.name}`;
    let suggestion = null;
    try {
      suggestion = await geocodeAddress(store.address || "", store.name || "");
      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch {
      suggestion = null;
    }
    storeAddressChecks.push({
      storeId: store.id,
      name: store.name || "Saved store",
      address: store.address || "",
      hadGeo: Boolean(Number(store.lat) && Number(store.lng)),
      weakAddress: !addressLooksMappable(store.address || ""),
      suggestion
    });
    renderStoreAddressCheckResults();
  }
  const found = storeAddressChecks.filter((check) => check.suggestion).length;
  const missingGeo = storeAddressChecks.filter((check) => !check.hadGeo).length;
  els.storeAddressCheckStatus.textContent = `Checked ${state.stores.length} stores. ${found} map matches found. ${missingGeo} stores started without saved coordinates.`;
  els.checkStoreAddresses.disabled = false;
}

function applyStoreGeoFromCheck(storeId, includeAddress = false) {
  const check = storeAddressChecks.find((item) => item.storeId === storeId);
  const store = (state.stores || []).find((item) => item.id === storeId);
  if (!check?.suggestion || !store) return;
  if (includeAddress && !confirm(`Replace the saved address for ${store.name} with the suggested map address?`)) return;
  store.lat = Number(check.suggestion.lat);
  store.lng = Number(check.suggestion.lng);
  if (includeAddress) store.address = check.suggestion.displayName || store.address || "";
  check.hadGeo = true;
  check.address = store.address || "";
  check.weakAddress = !addressLooksMappable(store.address || "");
  saveState();
  renderStores();
  renderStoreManager();
  renderStoreAddressCheckResults();
  alert(includeAddress ? "Address and coordinates saved." : "Coordinates saved.");
}

function renderProductsManager() {
  if (!els.productManagerList) return;
  const query = normalizedName(els.productSearch?.value || "");
  const products = masterProducts()
    .filter((product) => !query || normalizedName(`${product.description} ${product.upc}`).includes(query));
  els.productManagerList.replaceChildren();
  if (!products.length) {
    els.productManagerList.append(emptyState());
    return;
  }
  products.forEach((product) => {
    const button = document.createElement("button");
    button.className = `store-manager-item${product.frozenPizza ? " frozen-product" : ""}`;
    button.type = "button";
    button.dataset.productManagerKey = productKey(product);
    button.innerHTML = `
      <strong>${escapeHtml(product.description)}</strong>
      <span>${escapeHtml([product.upc ? `UPC ${product.upc}` : "", product.unit || "ea", money.format(Number(product.rate || 0))].filter(Boolean).join(" - "))}</span>
      <small>${product.frozenPizza ? "Frozen pizza - 2 cases per shelf" : "Other product"}</small>
    `;
    els.productManagerList.append(button);
  });
}

function productFromManagerForm() {
  return normalizeProduct({
    description: els.productManagerDescription.value.trim(),
    upc: els.productManagerUpc.value.trim(),
    unit: els.productManagerUnit.value.trim() || "ea",
    rate: Number(els.productManagerRate.value || 0),
    frozenPizza: els.productManagerFrozenPizza.checked
  });
}

function resetProductManagerForm() {
  els.productManagerForm.reset();
  els.productManagerKey.value = "";
  els.productManagerTitle.textContent = "New Product";
  els.productManagerUnit.value = "ea";
}

function editProductManager(key) {
  const product = masterProducts().find((item) => productKey(item) === key);
  if (!product) return;
  els.productManagerKey.value = productKey(product);
  els.productManagerTitle.textContent = "Edit Product";
  els.productManagerDescription.value = product.description || "";
  els.productManagerUpc.value = product.upc || "";
  els.productManagerUnit.value = product.unit || "ea";
  els.productManagerRate.value = Number(product.rate || 0) || "";
  els.productManagerFrozenPizza.checked = Boolean(product.frozenPizza || isFrozenPizzaProduct(product));
}

function saveProductManagerForm(event) {
  event.preventDefault();
  if (!els.productManagerDescription.value.trim()) {
    alert("Enter the product description first.");
    els.productManagerDescription.focus();
    return;
  }
  const oldKey = els.productManagerKey.value;
  const product = productFromManagerForm();
  state.deletedProductKeys = (state.deletedProductKeys || []).filter((key) => key !== productKey(product));
  state.products = mergeProducts(
    [],
    [...(state.products || []).filter((item) => productKey(item) !== oldKey && productKey(item) !== productKey(product)), product]
  );
  (state.stores || []).forEach((store) => {
    store.products = mergeProducts([], (store.products || []).map((item) => {
      if (oldKey && productKey(item) === oldKey) return { ...item, ...product, facings: item.facings || product.facings || "" };
      return item;
    }));
  });
  saveState();
  renderProductsManager();
  renderStoreProducts();
  editProductManager(productKey(product));
  alert("Product saved.");
}

function deleteProductManager() {
  const key = els.productManagerKey.value;
  if (!key) return;
  const product = masterProducts().find((item) => productKey(item) === key);
  if (!product || !confirm(`Delete ${product.description} from products and store product lists?`)) return;
  state.deletedProductKeys = Array.isArray(state.deletedProductKeys) ? state.deletedProductKeys : [];
  if (!state.deletedProductKeys.includes(key)) state.deletedProductKeys.push(key);
  state.products = (state.products || []).filter((item) => productKey(item) !== key);
  (state.stores || []).forEach((store) => {
    store.products = (store.products || []).filter((item) => productKey(item) !== key);
  });
  saveState();
  resetProductManagerForm();
  renderProductsManager();
  renderStores();
  renderStoreProducts();
}

function showStoreManagerEditor() {
  els.storeManagerLayout?.classList.remove("editor-closed");
  requestAnimationFrame(() => els.storeManagerForm?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function hideStoreManagerEditor() {
  els.storeManagerLayout?.classList.add("editor-closed");
  els.storeManagerForm.reset();
  els.storeManagerId.value = "";
  els.storeManagerTitle.textContent = "Add Store";
  els.storeManagerTerms.value = "Net 10";
  els.storeManagerRep.value = DEFAULT_REP;
  els.storeManagerDeliveryFee.value = "";
  els.storeManagerLat.value = "";
  els.storeManagerLng.value = "";
  els.storeManagerShelfInfo.value = "";
  renderStoreManager();
}

function resetStoreManagerForm() {
  showStoreManagerEditor();
  els.storeManagerForm.reset();
  els.storeManagerId.value = "";
  els.storeManagerTitle.textContent = "Add Store";
  els.storeManagerTerms.value = "Net 10";
  els.storeManagerRep.value = DEFAULT_REP;
  els.storeManagerDeliveryFee.value = "";
  els.storeManagerLat.value = "";
  els.storeManagerLng.value = "";
  els.storeManagerShelfInfo.value = "";
  renderStoreManager();
}

function editStoreManager(id) {
  const store = (state.stores || []).find((item) => item.id === id);
  if (!store) return;
  showStoreManagerEditor();
  els.storeManagerId.value = store.id;
  els.storeManagerTitle.textContent = "Edit Store";
  els.storeManagerName.value = store.name || "";
  els.storeManagerEmail.value = store.email || "";
  els.storeManagerAddress.value = store.address || "";
  els.storeManagerLat.value = Number(store.lat || 0) || "";
  els.storeManagerLng.value = Number(store.lng || 0) || "";
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
  els.storeManagerShelfInfo.value = store.shelfInfo || "";
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
    lat: Number(els.storeManagerLat.value || existing?.lat || 0),
    lng: Number(els.storeManagerLng.value || existing?.lng || 0),
    terms: els.storeManagerTerms.value.trim(),
    poNumber: els.storeManagerPo.value.trim(),
    rep: els.storeManagerRep.value.trim(),
    dt: els.storeManagerDt.value.trim(),
    mainPhone: els.storeManagerMainPhone.value.trim(),
    altPhone: els.storeManagerAltPhone.value.trim(),
    specialInstructions: els.storeManagerInstructions.value.trim(),
    orderBlocked: els.storeManagerBlocked.checked,
    orderBlockedReason: els.storeManagerBlockedReason.value.trim(),
    shelfInfo: els.storeManagerShelfInfo.value.trim(),
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
  hideStoreManagerEditor();
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
  hideStoreManagerEditor();
}

function tagStoreCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Location is not available in this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    els.storeManagerLat.value = position.coords.latitude.toFixed(6);
    els.storeManagerLng.value = position.coords.longitude.toFixed(6);
  }, () => alert("Could not read your location."));
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
    els.deliveryFee.value = "0.00";
    els.lineItemsText.value = lineItemsToText(itemsWithDelivery(productsForStore(store).map((product) => ({
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
  const invoice = saveInvoice({ keepForm: true });
  if (!invoice) return;
  emailOffice(invoice);
}

function saveAndPrintInvoice() {
  if (!els.invoiceForm.reportValidity()) return;
  if (!validateRequiredOrderFields()) return;
  const invoice = saveInvoice({ keepForm: true });
  if (!invoice) return;
  printInvoice(invoice);
}

function saveInvoiceToDevice() {
  if (!els.invoiceForm.reportValidity()) return;
  if (!validateRequiredOrderFields()) return;
  const invoice = saveInvoice({ keepForm: true });
  if (!invoice) return;
  downloadInvoice(invoice);
}

function resetStopForm() {
  els.stopForm.reset();
  els.stopId.value = "";
  els.stopFormTitle.textContent = "Add Stop";
}

function saveInvoiceFromForm(event) {
  event.preventDefault();
  if (!validateRequiredOrderFields()) return;
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
  const store = selectedStore();
  if (store && !storeHasDefaultDeliveryFee(store) && !confirm("Check this invoice for the delivery fee before continuing. This store does not have a default delivery charge saved. Continue?")) {
    els.deliveryFee.focus();
    return false;
  }
  return true;
}

function invoiceFromForm() {
  const existing = state.invoices.find((item) => item.id === els.invoiceId.value);
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
    customerSignature: getSignatureData(),
    officeSent: Boolean(existing?.officeSent),
    officeSentAt: existing?.officeSentAt || ""
  };
}

function saveInvoice({ keepForm = false } = {}) {
  const invoice = invoiceFromForm();
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) {
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
  const invoiceNumber = String(invoice.number || "").trim();
  const invoiceName = normalizedName(invoice.customer || "");
  const scans = (state.scans || []).filter((item) => {
    if (item.savedInvoiceId === invoice.id) return true;
    if (!invoiceNumber || String(item.number || "").trim() !== invoiceNumber) return false;
    if (invoiceDate(invoice) !== (item.invoiceDate || routeDate())) return false;
    const scanName = normalizedName(item.customer || "");
    return !scanName || !invoiceName || invoiceName === scanName || invoiceName.includes(scanName) || scanName.includes(invoiceName);
  });
  scans.forEach((scan) => {
    scan.savedInvoiceId = invoice.id;
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
  });
}

function scanFromSavedInvoice(invoice, slot, store = invoiceStore(invoice)) {
  return {
    id: crypto.randomUUID(),
    fileName: "Created in app",
    customer: invoice.customer || store?.name || "",
    customerEmail: invoice.customerEmail || store?.email || "",
    address: invoice.address || store?.address || "",
    number: invoice.number || "",
    invoiceDate: invoiceDate(invoice),
    terms: invoice.terms || "",
    poNumber: invoice.poNumber || "",
    charge: invoice.charge || "",
    cash: invoice.cash || "",
    rep: invoice.rep || routeRep(),
    mainPhone: invoice.mainPhone || "",
    altPhone: invoice.altPhone || "",
    dt: invoice.dt || "",
    specialInstructions: invoice.specialInstructions || "",
    items: invoice.items || [],
    itemsText: lineItemsToText(invoice.items || []),
    total: invoiceTotal(invoice),
    amount: Number(invoice.amount || invoiceTotal(invoice) || 0),
    balanceDue: invoiceBalance(invoice),
    paymentsCredits: Number(invoice.paymentsCredits || 0),
    customerTotalBalance: Number(invoice.customerTotalBalance || 0),
    rawText: invoiceMessage(invoice),
    accepted: true,
    delivered: false,
    paid: false,
    lisaHandled: Boolean(invoice.lisaHandled || store?.orderBlocked),
    matchedStoreId: store?.id || invoice.matchedStoreId || "",
    savedInvoiceId: invoice.id,
    routeOrder: Number(slot),
    deliverySlot: Number(slot),
    routeNote: ""
  };
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
  state.routeDay.leaveHomeTime = els.routeLeaveHomeTime.value;
  state.routeDay.arriveFactoryTime = els.routeArriveFactoryTime.value;
  state.routeDay.startTime = els.routeStartTime.value;
  state.routeDay.finishTime = els.routeFinishTime.value;
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

function addManualExpense() {
  const name = els.manualExpenseName.value.trim();
  const amount = Number(els.manualExpenseAmount.value || 0);
  const notes = els.manualExpenseNotes.value.trim();
  if (!name && !amount && !notes) {
    alert("Add an expense name, amount, or note first.");
    return;
  }
  state.routeDay = state.routeDay || structuredClone(sampleData.routeDay);
  state.routeDay.receipts = state.routeDay.receipts || [];
  state.routeDay.receipts.push({
    id: crypto.randomUUID(),
    name: name || "Manual expense",
    type: "manual",
    date: todayOffset(0),
    amount,
    notes,
    dataUrl: ""
  });
  els.manualExpenseName.value = "";
  els.manualExpenseAmount.value = "";
  els.manualExpenseNotes.value = "";
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
    leaveHomeTime: "",
    arriveFactoryTime: "",
    startTime: "",
    finishTime: "",
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

function openRouteSummaryPrintView({ savePdf = false } = {}) {
  syncAllRouteInvoiceLineFields();
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocking kept the route summary from opening.");
    return;
  }
  win.document.write(routeSummaryHtml());
  win.document.close();
  win.focus();
  if (savePdf) {
    win.document.title = `Andoro Route Summary ${formatDate(routeDate())}`;
  }
  win.print();
}

function printRouteSummary() {
  openRouteSummaryPrintView();
}

function saveRouteSummaryPdf() {
  openRouteSummaryPrintView({ savePdf: true });
}

function attachEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
  document.querySelectorAll("[data-tab-jump]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tabJump)));
  els.invoiceForm.addEventListener("submit", saveInvoiceFromForm);
  els.storeSelect.addEventListener("change", loadSelectedStore);
  els.saveStore.addEventListener("click", saveStoreFromForm);
  els.storeManagerForm.addEventListener("submit", saveStoreManagerForm);
  els.storeManagerSearch.addEventListener("input", renderStoreManager);
  els.checkStoreAddresses.addEventListener("click", checkStoreAddresses);
  els.newStoreRecord.addEventListener("click", resetStoreManagerForm);
  els.clearStoreManager.addEventListener("click", hideStoreManagerEditor);
  els.deleteStoreManager.addEventListener("click", deleteStoreManager);
  els.tagStoreLocation.addEventListener("click", tagStoreCurrentLocation);
  els.productManagerForm.addEventListener("submit", saveProductManagerForm);
  els.productSearch.addEventListener("input", renderProductsManager);
  els.newProductRecord.addEventListener("click", resetProductManagerForm);
  els.clearProductManager.addEventListener("click", resetProductManagerForm);
  els.deleteProductManager.addEventListener("click", deleteProductManager);
  els.clearInvoiceForm.addEventListener("click", resetInvoiceForm);
  els.clearSignature.addEventListener("click", clearSignaturePad);
  els.saveAndPrintInvoice.addEventListener("click", saveAndPrintInvoice);
  els.saveAndShareInvoice.addEventListener("click", saveAndShareInvoice);
  document.querySelector("#saveInvoiceToDevice")?.addEventListener("click", saveInvoiceToDevice);
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
  els.routeLeaveHomeTime.addEventListener("input", saveRouteDaySettings);
  els.routeArriveFactoryTime.addEventListener("input", saveRouteDaySettings);
  els.routeStartTime.addEventListener("input", saveRouteDaySettings);
  els.routeFinishTime.addEventListener("input", saveRouteDaySettings);
  els.routeDayNotes.addEventListener("input", saveRouteDaySettings);
  els.routeReceiptFiles.addEventListener("change", handleReceiptSelection);
  els.routeReceiptCamera.addEventListener("change", handleReceiptSelection);
  els.clearRouteReceipts.addEventListener("click", clearRouteReceipts);
  els.addManualExpense.addEventListener("click", addManualExpense);
  els.addProspectStop.addEventListener("click", addProspectStop);
  els.clearRouteDay.addEventListener("click", clearRouteDay);
  els.buildRoute.addEventListener("click", buildRouteFromDeliverySlots);
  els.printRouteSummary.addEventListener("click", printRouteSummary);
  els.saveRouteSummaryPdf.addEventListener("click", saveRouteSummaryPdf);

  document.addEventListener("click", (event) => {
    const editInvoice = event.target.closest("[data-edit-invoice]");
    const deleteInvoice = event.target.closest("[data-delete-invoice]");
    const emailInvoice = event.target.closest("[data-email-invoice]");
    const officeInvoice = event.target.closest("[data-office-invoice]");
    const shareInvoice = event.target.closest("[data-share-invoice]");
    const downloadInvoice = event.target.closest("[data-download-invoice]");
    const printInvoice = event.target.closest("[data-print-invoice]");
    const caseButton = event.target.closest("[data-case-key]");
    const storeManagerItem = event.target.closest("[data-store-manager-id]");
    const applyStoreGeo = event.target.closest("[data-apply-store-geo]");
    const applyStoreAddress = event.target.closest("[data-apply-store-address]");
    const productManagerItem = event.target.closest("[data-product-manager-key]");
    const deleteReceipt = event.target.closest("[data-delete-receipt]");
    const deleteProspect = event.target.closest("[data-delete-prospect]");
    const clearRouteSlot = event.target.closest("[data-clear-route-slot]");
    const attachRouteInvoice = event.target.closest("[data-attach-route-invoice]");
    const addManualRouteInvoice = event.target.closest("[data-add-manual-route-invoice]");
    const routeSlotUp = event.target.closest("[data-route-slot-up]");
    const routeSlotDown = event.target.closest("[data-route-slot-down]");
    if (editInvoice) editInvoiceById(editInvoice.dataset.editInvoice);
    if (deleteInvoice) deleteInvoiceById(deleteInvoice.dataset.deleteInvoice);
    if (emailInvoice) emailInvoiceById(emailInvoice.dataset.emailInvoice);
    if (officeInvoice) emailOfficeById(officeInvoice.dataset.officeInvoice);
    if (shareInvoice) shareInvoiceById(shareInvoice.dataset.shareInvoice);
    if (downloadInvoice) downloadInvoiceById(downloadInvoice.dataset.downloadInvoice);
    if (printInvoice) printInvoiceById(printInvoice.dataset.printInvoice);
    if (caseButton) adjustStoreProductQty(caseButton);
    if (applyStoreGeo) {
      applyStoreGeoFromCheck(applyStoreGeo.dataset.applyStoreGeo, false);
      return;
    }
    if (applyStoreAddress) {
      applyStoreGeoFromCheck(applyStoreAddress.dataset.applyStoreAddress, true);
      return;
    }
    if (storeManagerItem) editStoreManager(storeManagerItem.dataset.storeManagerId);
    if (productManagerItem) editProductManager(productManagerItem.dataset.productManagerKey);
    if (clearRouteSlot) {
      clearRouteDeliverySlot(clearRouteSlot.dataset.clearRouteSlot);
      return;
    }
    if (attachRouteInvoice) {
      attachSavedInvoiceToRouteSlot(attachRouteInvoice.dataset.attachRouteInvoice);
      return;
    }
    if (addManualRouteInvoice) {
      addManualInvoiceToRouteSlot(addManualRouteInvoice.dataset.addManualRouteInvoice);
      return;
    }
    if (routeSlotUp) {
      const slot = Number(routeSlotUp.dataset.routeSlotUp);
      moveRouteSlot(slot, slot - 1);
      return;
    }
    if (routeSlotDown) {
      const slot = Number(routeSlotDown.dataset.routeSlotDown);
      moveRouteSlot(slot, slot + 1);
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

  document.addEventListener("dragstart", (event) => {
    const slot = event.target.closest("[data-route-slot]");
    if (!slot || event.target.matches("input, select, textarea, button")) return;
    event.dataTransfer?.setData("text/plain", slot.dataset.routeSlot);
    slot.classList.add("dragging");
  });

  document.addEventListener("dragover", (event) => {
    const slot = event.target.closest("[data-route-slot]");
    if (!slot) return;
    event.preventDefault();
    slot.classList.add("drag-over");
  });

  document.addEventListener("dragleave", (event) => {
    event.target.closest("[data-route-slot]")?.classList.remove("drag-over");
  });

  document.addEventListener("drop", (event) => {
    const slot = event.target.closest("[data-route-slot]");
    if (!slot) return;
    event.preventDefault();
    const fromSlot = event.dataTransfer?.getData("text/plain");
    document.querySelectorAll(".route-slot.drag-over, .route-slot.dragging").forEach((item) => item.classList.remove("drag-over", "dragging"));
    moveRouteSlot(fromSlot, slot.dataset.routeSlot);
  });

  document.addEventListener("dragend", () => {
    document.querySelectorAll(".route-slot.drag-over, .route-slot.dragging").forEach((item) => item.classList.remove("drag-over", "dragging"));
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
      if (field === "total") {
        scan.amount = Number(event.target.value);
        scan.balanceDue = Number(event.target.value);
        scan.customerTotalBalance = Number(event.target.value);
      }
    } else if (field === "itemsText") {
      scan.itemsText = event.target.value;
      scan.items = lineItemsFromText(event.target.value);
    } else {
      scan[field] = event.target.value;
      if (field === "customer" || field === "address") {
        scan.matchedStoreId = "";
        scan.importWarning = scan.number ? "Review store match" : "Needs invoice number";
      }
    }
    saveState();
    if (["routeOrder", "routeNote", "address", "customer", "total", "amount", "balanceDue", "itemsText"].includes(field)) {
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

    const officeSentId = event.target.dataset.officeSent;
    if (officeSentId) {
      setInvoiceOfficeSent(officeSentId, event.target.checked);
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
      syncRouteInvoiceLineFields(event.target, scan);
      scan.delivered = event.target.checked;
      scan.accepted = true;
      saveState();
      renderScans();
      renderRouteDayStatus();
      return;
    }

    const paidId = event.target.dataset.scanPaid;
    if (paidId) {
      const scan = state.scans.find((item) => item.id === paidId);
      if (!scan) return;
      syncRouteInvoiceLineFields(event.target, scan);
      scan.paid = event.target.checked;
      scan.accepted = true;
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
    const keptIds = routeSlotScanIds(slot).filter((scanId) => {
      const scan = (state.scans || []).find((item) => item.id === scanId);
      return scan && scan.savedInvoiceId !== id;
    });
    setRouteSlotScanIds(slot, keptIds);
  });
  saveState();
  render();
}

function emailInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) return;
  if (invoice) emailInvoice(invoice);
}

function emailOfficeById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) return;
  if (invoice) emailOffice(invoice);
}

function setInvoiceOfficeSent(id, sent) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  invoice.officeSent = Boolean(sent);
  invoice.officeSentAt = sent ? new Date().toISOString() : "";
  saveState();
  renderInvoices();
}

async function shareInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) return;
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

function downloadInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) return;
  downloadInvoice(invoice);
}

function printInvoiceById(id) {
  const invoice = state.invoices.find((item) => item.id === id);
  if (!invoice) return;
  if (invoiceBlocksOrders(invoice) && blockOrderAction(invoiceStore(invoice))) return;
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

function downloadInvoice(invoice) {
  const blob = new Blob([printableInvoiceHtml(invoice)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = String(invoice.customer || "andoro-invoice").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "andoro-invoice";
  const safeNumber = String(invoice.number || todayOffset(0)).replace(/[^a-z0-9-]+/gi, "-");
  link.href = url;
  link.download = `${safeName}-${safeNumber}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function attachSavedInvoiceToRouteSlot(slot) {
  const slotRecord = routeDeliverySlot(slot);
  const select = document.querySelector(`[data-route-slot-invoice="${slot}"]`);
  const invoice = (state.invoices || []).find((item) => item.id === select?.value);
  if (!slotRecord || !invoice) {
    alert("Choose a saved invoice to attach first.");
    return;
  }
  const store = (state.stores || []).find((item) => item.id === slotRecord.storeId)
    || invoiceStore(invoice)
    || matchingStoreForInvoice(invoice);
  const approvedStore = store || approveStoreFromRouteScan(invoice);
  const existingScan = routeSlotScanIds(slotRecord)
    .map((scanId) => (state.scans || []).find((item) => item.id === scanId))
    .find((scan) => scan?.savedInvoiceId === invoice.id);
  if (existingScan) {
    alert("That invoice is already attached to this stop.");
    return;
  }
  const scan = scanFromSavedInvoice(invoice, slot, approvedStore);
  if (approvedStore) {
    applyStoreToScan(scan, approvedStore);
    slotRecord.storeId = approvedStore.id;
  }
  assignScanToRouteSlot(scan, slot);
  state.scans = state.scans || [];
  state.scans.push(scan);
  saveState();
  renderScans();
  els.routeDayStatus.textContent = `Delivery spot ${slot} attached to invoice ${invoice.number || ""}.`;
}

function addManualInvoiceToRouteSlot(slot) {
  const slotRecord = routeDeliverySlot(slot);
  const store = (state.stores || []).find((item) => item.id === slotRecord?.storeId);
  if (!slotRecord || !store) {
    alert("Select the store for this delivery spot first.");
    return;
  }
  const scan = placeholderScanForStore(store, slot);
  scan.fileName = "Manual invoice";
  scan.accepted = true;
  state.scans = state.scans || [];
  state.scans.push(scan);
  assignScanToRouteSlot(scan, slot);
  saveState();
  renderScans();
  els.routeDayStatus.textContent = `Manual invoice row added to delivery spot ${slot}.`;
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
  invoice.officeSent = true;
  invoice.officeSentAt = new Date().toISOString();
  saveState();
  renderInvoices();
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
  const orderedItems = orderedLineItems(invoice.items || []);
  const items = orderedItems.length
    ? orderedItems.map((item) => {
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
  const printableItems = orderedLineItems(invoice.items || []);
  const totalPieces = pieceCount(printableItems);
  const itemCount = printableItems.length || 1;
  const printMode = itemCount > 28 ? "micro-compact" : itemCount > 18 ? "ultra-compact" : itemCount > 10 ? "compact" : "";
  const printScale = itemCount > 36 ? 0.76 : itemCount > 30 ? 0.82 : itemCount > 24 ? 0.88 : itemCount > 18 ? 0.93 : 1;
  const rows = printableItems.map((item) => `
    <tr>
      <td>${escapeHtml(item.description || "")}</td>
      <td>${escapeHtml(item.upc || "")}</td>
      <td>${escapeHtml(item.qty || "")}</td>
      <td>${escapeHtml(item.unit || "")}</td>
      <td>${plainAmount(item.rate)}</td>
      <td>${plainAmount(item.amount || item.rate)}</td>
    </tr>
  `).join("") || `<tr><td>Order</td><td></td><td></td><td></td><td></td><td>${plainAmount(invoiceTotal(invoice))}</td></tr>`;
  const targetRows = printMode === "micro-compact" ? itemCount : printMode === "ultra-compact" ? Math.max(itemCount, 8) : printMode ? Math.max(itemCount, 12) : 18;
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
    .preview-actions { position: sticky; top: 0; z-index: 5; display: flex; justify-content: flex-end; padding: 10px; background: #fff; border-bottom: 1px solid #ddd; }
    .preview-actions button { border: 0; border-radius: 8px; background: #d71920; color: #111; font-weight: 900; padding: 10px 16px; cursor: pointer; }
    .sheet {
      --print-scale: ${printScale};
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
    .sheet.micro-compact {
      padding: 0.13in 0.18in 0.08in;
      font-size: 8.2px;
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
    .micro-compact .top { min-height: 0.62in; gap: 6px; grid-template-columns: 1.05in 2.1in 2.2in; }
    .logo-wrap { text-align: center; }
    .logo { width: 1.02in; height: 0.78in; object-fit: contain; display: block; margin: 0 auto 1px; }
    .compact .logo { width: 0.9in; height: 0.68in; }
    .ultra-compact .logo { width: 0.78in; height: 0.58in; }
    .micro-compact .logo { width: 0.62in; height: 0.44in; }
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
    .micro-compact .address { padding-top: 0.08in; font-size: 8.6px; line-height: 1.05; }
    .invoice-panel { padding-top: 0.07in; }
    .compact .invoice-panel { padding-top: 0.04in; }
    .ultra-compact .invoice-panel { padding-top: 0.02in; }
    .micro-compact .invoice-panel { padding-top: 0; }
    .invoice-title { text-align: right; font-size: 21px; font-weight: 900; margin: 0 0 3px; }
    .compact .invoice-title { font-size: 17px; }
    .ultra-compact .invoice-title { font-size: 15px; }
    .micro-compact .invoice-title { font-size: 12px; margin-bottom: 1px; }
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
    .micro-compact .meta-grid { font-size: 7px; border-radius: 3px; }
    .micro-compact .meta-grid div { min-height: 12px; padding: 1px 2px; }
    .micro-compact .meta-grid .value { font-size: 7.3px; }
    .upper {
      display: grid;
      grid-template-columns: 1fr 2.65in;
      gap: 0.38in;
      min-height: 0.96in;
      margin-top: 0.08in;
    }
    .compact .upper { min-height: 0.78in; margin-top: 0.05in; }
    .ultra-compact .upper { min-height: 0.64in; margin-top: 0.03in; }
    .micro-compact .upper { min-height: 0.45in; margin-top: 0.02in; gap: 0.16in; grid-template-columns: 1fr 2.3in; }
    .bill-label { margin-left: 0.24in; font-size: 11px; }
    .bill-body { margin-top: 0.07in; margin-left: 0.12in; font-size: 13px; line-height: 1.06; white-space: pre-wrap; }
    .compact .bill-body { font-size: 11px; line-height: 1.02; margin-top: 0.04in; }
    .ultra-compact .bill-body { font-size: 9.5px; line-height: 1; margin-top: 0.03in; }
    .micro-compact .bill-label { font-size: 8px; }
    .micro-compact .bill-body { font-size: 8.1px; line-height: 0.95; margin-top: 0.01in; }
    .instructions { padding-top: 0; font-style: italic; font-size: 11.5px; line-height: 1.22; }
    .compact .instructions { font-size: 10px; line-height: 1.1; }
    .ultra-compact .instructions { font-size: 8.8px; line-height: 1.02; }
    .micro-compact .instructions { font-size: 7.6px; line-height: 0.96; }
    .instructions h2 { margin: 0 0 2px; font-size: 12px; color: #0d3326; font-style: italic; }
    .compact .instructions h2 { font-size: 10.5px; }
    .ultra-compact .instructions h2 { font-size: 9px; }
    .micro-compact .instructions h2 { font-size: 7.8px; margin-bottom: 1px; }
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
    .micro-compact .pre-table { margin-top: 0.03in; }
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
    .micro-compact .pre-table div { min-height: 16px; padding: 2px 4px; font-size: 8.4px; }
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
    .micro-compact th { padding: 2px 3px; font-size: 8.5px; }
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
    .micro-compact td { height: 9px; padding: 0 2px; font-size: 7.9px; line-height: 1; }
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
    .piece-count {
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 22px 4px 14px;
      color: #0d3326;
      font-size: 13px;
      font-weight: 900;
      border-right: 2px solid var(--green);
      border-top: 2px solid var(--green);
    }
    .compact .customer-balance { min-height: 28px; padding: 3px 12px; font-size: 12px; }
    .ultra-compact .customer-balance { min-height: 24px; padding: 2px 9px; font-size: 10.5px; }
    .micro-compact .customer-balance { min-height: 18px; padding: 1px 7px; font-size: 8.6px; }
    .totals { border-bottom: 0; }
    .totals div {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 34px;
      border-bottom: 2px solid var(--green);
    }
    .compact .totals div { min-height: 27px; }
    .ultra-compact .totals div { min-height: 23px; }
    .micro-compact .totals div { min-height: 18px; }
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
    .micro-compact .totals span,
    .micro-compact .totals strong { padding: 2px 4px; font-size: 8.6px; }
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
    .micro-compact .notice { min-height: 19px; padding: 2px 6px; font-size: 7.5px; }
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
    .micro-compact .footer { font-size: 7px; }
    .micro-compact .footer div { padding: 1px 2px; min-height: 12px; }
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
    .micro-compact .signature-copy { margin-top: 1px; min-height: 0.15in; padding-bottom: 1px; }
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
    .micro-compact .signature-label { font-size: 6.8px; padding-top: 0; }
    @media print {
      .preview-actions { display: none; }
      a[href]::after { content: ""; }
      body { background: #fff; }
      html,
      body {
        width: 8.5in;
        height: 11in;
        overflow: hidden;
      }
      .sheet {
        margin: 0;
        width: 8.5in;
        height: 11in;
        max-height: 11in;
        overflow: hidden;
        box-shadow: none;
        transform: scale(var(--print-scale));
        transform-origin: top left;
      }
    }
  </style>
</head>
<body>
  <div class="preview-actions"><button type="button" onclick="window.close()">Exit</button></div>
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
        <div class="piece-count"><span>Piece Count</span><span>${totalPieces}</span></div>
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
      <div class="foot-head"></div>
      <div>6363329005</div>
      <div>1-800-657-0467</div>
      <div>andoropizza@yahoo.com</div>
      <div></div>
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
        const scan = parseInvoiceText(page.text, page.fileName, page.layout, page.zones);
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
  scan.routeOrder = slotNumber;
  scan.deliverySlot = slotNumber;
  const slotRecord = routeDeliverySlot(slotNumber);
  if (slotRecord) setRouteSlotScanIds(slotRecord, [...routeSlotScanIds(slotRecord), scan.id]);
}

function placeholderScanForStore(store, slot) {
  return {
    id: crypto.randomUUID(),
    fileName: "",
    customer: store.name || "",
    customerEmail: store.email || "",
    address: store.address || "",
    number: "",
    invoiceDate: routeDate(),
    terms: store.terms || "",
    poNumber: store.poNumber || "",
    rep: store.rep || routeRep(),
    mainPhone: store.mainPhone || "",
    altPhone: store.altPhone || "",
    dt: store.dt || "",
    specialInstructions: store.specialInstructions || "",
    items: [],
    itemsText: "",
    total: 0,
    amount: 0,
    balanceDue: 0,
    paymentsCredits: 0,
    customerTotalBalance: 0,
    rawText: "",
    accepted: true,
    delivered: false,
    paid: false,
    lisaHandled: Boolean(store.orderBlocked),
    matchedStoreId: store.id,
    routeOrder: Number(slot),
    deliverySlot: Number(slot),
    routeNote: ""
  };
}

function routeStopFromEntry(entry) {
  const scan = entry.scan || {};
  const store = entry.store || {};
  return {
    id: scan.id,
    scan,
    scans: entry.scans || [scan].filter(Boolean),
    scanIds: (entry.scans || [scan]).map((item) => item.id).filter(Boolean),
    store,
    name: scan.customer || store.name || "Route stop",
    address: scan.address || store.address || "",
    lat: Number(scan.lat || store.lat || 0),
    lng: Number(scan.lng || store.lng || 0),
    dt: scan.dt || store.dt || "",
    priority: scanHasInvoice(scan) ? "high" : "normal"
  };
}

async function geocodeRouteStops(stops = []) {
  const missing = stops.filter((stop) => stop.address && (!Number(stop.lat) || !Number(stop.lng)));
  if (!missing.length) return { updated: 0, missing: 0 };
  let updated = 0;
  for (const stop of missing) {
    try {
      const coords = await geocodeAddress(stop.address, stop.name);
      if (coords) {
        stop.lat = coords.lat;
        stop.lng = coords.lng;
        stop.scan.lat = coords.lat;
        stop.scan.lng = coords.lng;
        (stop.scans || []).forEach((scan) => {
          scan.lat = coords.lat;
          scan.lng = coords.lng;
        });
        if (stop.store?.id) {
          stop.store.lat = coords.lat;
          stop.store.lng = coords.lng;
        }
        updated += 1;
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch {
      // Keep the route usable even if one address cannot be found.
    }
  }
  return { updated, missing: missing.length - updated };
}

async function geocodeAddress(address = "", name = "") {
  const query = [name, address].filter(Boolean).join(", ");
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query || address)}`);
  const results = await response.json();
  if (!results?.[0]) return null;
  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    displayName: results[0].display_name || ""
  };
}

function applyOptimizedRouteStops(stops = []) {
  const slots = routeDeliverySlots();
  slots.forEach((slot) => {
    setRouteSlotScanIds(slot, []);
    slot.storeId = "";
  });
  stops.forEach((stop, index) => {
    const slotNumber = index + 1;
    stop.scan.routeOrder = slotNumber;
    stop.scan.deliverySlot = slotNumber;
    const slot = slots[index];
    if (slot) {
      setRouteSlotScanIds(slot, stop.scanIds?.length ? stop.scanIds : [stop.scan.id]);
      slot.storeId = stop.store?.id || stop.scan.matchedStoreId || "";
    }
  });
  syncRouteOrdersFromSlots();
}

function syncRouteOrdersFromSlots() {
  routeDeliverySlots().forEach((slotRecord) => {
    routeSlotScanIds(slotRecord).forEach((scanId) => {
      const scan = (state.scans || []).find((item) => item.id === scanId);
      if (!scan) return;
      scan.routeOrder = Number(slotRecord.slot);
      scan.deliverySlot = Number(slotRecord.slot);
      if (slotRecord.storeId) scan.matchedStoreId = slotRecord.storeId;
    });
  });
}

function moveRouteSlot(fromSlot, toSlot) {
  const from = Number(fromSlot);
  const to = Number(toSlot);
  if (!from || !to || from === to || from < 1 || to < 1 || from > ROUTE_SLOT_COUNT || to > ROUTE_SLOT_COUNT) return;
  const slots = routeDeliverySlots();
  const records = slots.map((slot) => ({ storeId: slot.storeId || "", scanIds: routeSlotScanIds(slot) }));
  const [moved] = records.splice(from - 1, 1);
  records.splice(to - 1, 0, moved);
  slots.forEach((slot, index) => {
    slot.storeId = records[index]?.storeId || "";
    setRouteSlotScanIds(slot, records[index]?.scanIds || []);
  });
  syncRouteOrdersFromSlots();
  state.stops = routeSlotPrimaryScans().filter((scan) => scan.address).map((scan) => ({
    id: scan.id,
    name: scan.customer || "Stop",
    address: scan.address || "",
    lat: Number(scan.lat || 0),
    lng: Number(scan.lng || 0),
    priority: scanHasInvoice(scan) ? "high" : "normal"
  }));
  state.optimizedStopIds = state.stops.map((stop) => stop.id);
  saveState();
  renderScans();
  renderRoute();
}

async function processRouteSlotFile(file, slot) {
  if (!file) return;
  const slotRecord = routeDeliverySlot(slot);
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
    scan = parseInvoiceText(pages[0]?.text || "", pages[0]?.fileName || file.name, pages[0]?.layout, pages[0]?.zones);
  } else {
    const text = await readImageInvoice(file, file.name);
    scan = parseInvoiceText(text, file.name);
  }
  if (!reviewRouteScanFields(scan)) {
    els.scanStatus.textContent = `Delivery spot ${slot} scan canceled.`;
    return;
  }
  const store = (state.stores || []).find((item) => item.id === slotRecord?.storeId)
    || approveStoreFromRouteScan(scan);
  if (store) {
    applyStoreToScan(scan, store);
    if (slotRecord) slotRecord.storeId = store.id;
  } else if (scan.customer || scan.address) {
    alert(`Invoice read, but no store was added.\n\nStore: ${scan.customer || "Unknown"}\nAddress: ${scan.address || "No address found"}\n\nYou can still select or add the store manually.`);
  }
  assignScanToRouteSlot(scan, slot);
  state.scans = state.scans || [];
  state.scans.push(scan);
  saveState();
  renderScans();
  els.scanStatus.textContent = `Delivery spot ${slot} loaded: ${file.name}`;
}

function setRouteSlotStore(slot, storeId) {
  const slotRecord = routeDeliverySlot(slot);
  if (!slotRecord) return;
  slotRecord.storeId = storeId || "";
  const store = (state.stores || []).find((item) => item.id === storeId);
  if (store) {
    if (!routeScansForSlot(slotRecord).length) {
      const scan = placeholderScanForStore(store, slot);
      scan.fileName = "Manual invoice";
      state.scans = state.scans || [];
      state.scans.push(scan);
      assignScanToRouteSlot(scan, slot);
    }
    routeSlotScanIds(slotRecord).forEach((scanId) => {
      const scan = (state.scans || []).find((item) => item.id === scanId);
      if (scan) applyStoreToScan(scan, store);
    });
  }
}

function clearRouteDeliverySlot(slot) {
  const slotRecord = routeDeliverySlot(slot);
  if (!slotRecord) return;
  const scanIds = routeSlotScanIds(slotRecord);
  setRouteSlotScanIds(slotRecord, []);
  if (scanIds.length) state.scans = (state.scans || []).filter((scan) => !scanIds.includes(scan.id));
  (state.scans || []).forEach((scan) => {
    if (Number(scan.routeOrder) === Number(slot)) scan.routeOrder = "";
  });
  saveState();
  renderScans();
}

async function readImageInvoice(imageSource, label) {
  const result = await Tesseract.recognize(imageSource, "eng", {
    ...TESSERACT_OPTIONS,
    logger: (message) => {
      if (message.status === "recognizing text") {
        els.scanStatus.textContent = `Reading ${label}: ${Math.round(message.progress * 100)}%`;
      }
    }
  });
  return result.data.text;
}

async function readPdfInvoice(file) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdfjs/pdf.worker.min.js?v=84";
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    els.scanStatus.textContent = `Reading ${file.name}: page ${pageNumber} of ${pdf.numPages}`;
    const page = await pdf.getPage(pageNumber);
    const nativeLayout = await readPdfTextLayout(page);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const image = canvas.toDataURL("image/png");
    const zones = await readInvoiceZonesFromCanvas(canvas, `${file.name} page ${pageNumber}`);
    const text = await readImageInvoice(image, `${file.name} page ${pageNumber}`);
    const nativeText = nativeLayout?.text || "";
    pages.push({
      text: nativeText.length > text.length * 0.4 ? `${nativeText}\n${text}` : text,
      fileName: `${file.name} page ${pageNumber}`,
      layout: nativeLayout,
      zones
    });
  }
  return pages;
}

async function readInvoiceZonesFromCanvas(canvas, label) {
  const zones = {
    billTo: { x: 0.08, y: 0.16, w: 0.45, h: 0.15 },
    invoiceBox: { x: 0.60, y: 0.06, w: 0.36, h: 0.13 },
    totalBox: { x: 0.62, y: 0.78, w: 0.35, h: 0.14 }
  };
  const result = {};
  for (const [key, zone] of Object.entries(zones)) {
    const zoneCanvas = cropCanvasZone(canvas, zone);
    const dataUrl = zoneCanvas.toDataURL("image/png");
    result[key] = await readImageInvoice(dataUrl, `${label} ${key}`);
  }
  return result;
}

function cropCanvasZone(canvas, zone) {
  const crop = document.createElement("canvas");
  const x = Math.max(0, Math.floor(canvas.width * zone.x));
  const y = Math.max(0, Math.floor(canvas.height * zone.y));
  const width = Math.min(canvas.width - x, Math.ceil(canvas.width * zone.w));
  const height = Math.min(canvas.height - y, Math.ceil(canvas.height * zone.h));
  crop.width = width;
  crop.height = height;
  const context = crop.getContext("2d", { willReadFrequently: true });
  context.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  return crop;
}

async function readPdfTextLayout(page) {
  try {
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .map((item) => ({
        text: String(item.str || "").trim(),
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0)
      }))
      .filter((item) => item.text);
    if (!items.length) return null;
    const groups = [];
    items
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .forEach((item) => {
        let group = groups.find((entry) => Math.abs(entry.y - item.y) < 4);
        if (!group) {
          group = { y: item.y, items: [] };
          groups.push(group);
        }
        group.items.push(item);
      });
    const lines = groups
      .map((group) => {
        const sorted = group.items.sort((a, b) => a.x - b.x);
        return {
          x: sorted[0]?.x || 0,
          y: group.y,
          text: sorted.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim()
        };
      })
      .filter((line) => line.text)
      .sort((a, b) => b.y - a.y || a.x - b.x);
    return {
      width: viewport.width,
      height: viewport.height,
      lines,
      text: lines.map((line) => line.text).join("\n")
    };
  } catch {
    return null;
  }
}

function clearScans() {
  selectedFiles = [];
  state.scans = [];
  routeDeliverySlots().forEach((slot) => {
    setRouteSlotScanIds(slot, []);
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
  let skippedStoreReview = 0;
  ready.forEach((scan) => {
    if (scan.savedInvoiceId && state.invoices.some((invoice) => invoice.id === scan.savedInvoiceId)) {
      skipped += 1;
      return;
    }
    if (!approveScanStoreBeforeSave(scan)) {
      skippedStoreReview += 1;
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
  return { saved: invoices.length, lisaCount, skipped, skippedStoreReview };
}

async function buildRouteFromDeliverySlots() {
  els.buildRoute.disabled = true;
  const originalLabel = els.buildRoute.textContent;
  els.buildRoute.textContent = "Building...";
  const slots = routeDeliverySlots();
  const filledSlots = slots
    .map((slot) => {
      const scans = routeScansForSlot(slot);
      return {
        slot,
        store: (state.stores || []).find((store) => store.id === slot.storeId),
        scan: scans[0],
        scans
      };
    })
    .filter((entry) => entry.store || entry.scans.length);
  if (!filledSlots.length) {
    alert("Add at least one store to the delivery spots before building the route.");
    els.buildRoute.disabled = false;
    els.buildRoute.textContent = originalLabel;
    return;
  }
  const missingStore = filledSlots.filter((entry) => !entry.store).length;
  if (missingStore) {
    alert(`${missingStore} delivery spot${missingStore === 1 ? "" : "s"} need a store.`);
    els.buildRoute.disabled = false;
    els.buildRoute.textContent = originalLabel;
    return;
  }
  let missingInvoice = 0;
  filledSlots.forEach((entry) => {
    if (!entry.scans.length) {
      const placeholder = placeholderScanForStore(entry.store, entry.slot.slot);
      entry.scan = placeholder;
      entry.scans = [placeholder];
      state.scans = state.scans || [];
      state.scans.push(placeholder);
    }
    entry.scans.forEach((scan) => {
      if (!scanHasInvoice(scan)) missingInvoice += 1;
      applyStoreToScan(scan, entry.store);
      assignScanToRouteSlot(scan, entry.slot.slot);
      scan.accepted = true;
    });
    entry.scan = entry.scans[0];
  });
  els.routeDayStatus.textContent = "Finding stop locations and building the most efficient route...";
  const routeStops = filledSlots.map(routeStopFromEntry);
  const weakAddresses = weakRouteAddresses(routeStops);
  if (weakAddresses.length && !confirm(`Check these store addresses before exporting to Google Maps:\n\n${weakAddresses.map((stop) => `- ${stop.name}: ${stop.address || "No address"}`).join("\n")}\n\nContinue building the route anyway?`)) {
    els.buildRoute.disabled = false;
    els.buildRoute.textContent = originalLabel;
    renderRouteDayStatus();
    return;
  }
  const geocodeResult = await geocodeRouteStops(routeStops);
  const routableStops = routeStops.filter((stop) => Number(stop.lat) && Number(stop.lng));
  if (!routableStops.length) {
    els.buildRoute.disabled = false;
    els.buildRoute.textContent = originalLabel;
    alert("I could not find map locations for the selected stores. Check the store addresses, then build the route again.");
    saveState();
    render();
    return;
  }
  const optimizedStops = optimizedStopOrder(routableStops, fixedRouteOrigin());
  const unroutedStops = routeStops.filter((stop) => !optimizedStops.some((optimized) => optimized.id === stop.id));
  applyOptimizedRouteStops([...optimizedStops, ...unroutedStops]);
  state.origin = fixedRouteOrigin();
  state.stops = optimizedStops.map((stop) => ({
    id: stop.id,
    name: stop.name,
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    dt: stop.dt || "",
    priority: stop.priority
  }));
  state.optimizedStopIds = state.stops.map((stop) => stop.id);
  const allSlotScans = filledSlots.flatMap((entry) => entry.scans);
  const invoiceScans = allSlotScans.filter((scan) => scanHasInvoice(scan) && scanReadyToSave(scan));
  const reviewCount = allSlotScans.filter((scan) => scanHasInvoice(scan) && !scanReadyToSave(scan)).length;
  const result = invoiceScans.length ? saveScansAsInvoices(invoiceScans) : { saved: 0, lisaCount: 0, skipped: 0, skippedStoreReview: 0 };
  if (!result) {
    els.buildRoute.disabled = false;
    els.buildRoute.textContent = originalLabel;
    return;
  }
  saveState();
  render();
  setTab("scan");
  els.buildRoute.disabled = false;
  els.buildRoute.textContent = originalLabel;
  const miles = routeDistance(optimizedStops, fixedRouteOrigin());
  alert(`Route built in the most efficient order from 92 Produce Row and returning to 92 Produce Row. ${optimizedStops.length} stop${optimizedStops.length === 1 ? "" : "s"} routed, about ${miles.toFixed(1)} miles before traffic.${geocodeResult.missing ? ` ${geocodeResult.missing} stop${geocodeResult.missing === 1 ? "" : "s"} could not be mapped and stayed at the end.` : ""} ${result.saved} invoice${result.saved === 1 ? "" : "s"} added.${result.skipped ? ` ${result.skipped} already added.` : ""}${result.skippedStoreReview ? ` ${result.skippedStoreReview} invoice${result.skippedStoreReview === 1 ? "" : "s"} not saved because the store was not approved.` : ""}${missingInvoice ? ` ${missingInvoice} stop${missingInvoice === 1 ? "" : "s"} still need an invoice attached.` : ""}${reviewCount ? ` ${reviewCount} attached invoice${reviewCount === 1 ? "" : "s"} need review before saving.` : ""}${result.lisaCount ? ` ${result.lisaCount} office-ordered stop${result.lisaCount === 1 ? "" : "s"} saved for records/stores.` : ""}`);
}

function saveScannedInvoices() {
  const result = saveScansAsInvoices((state.scans || []).filter((scan) => scan.accepted));
  if (!result) return;
  render();
  setTab("invoices");
  alert(`${result.saved} scanned invoice${result.saved === 1 ? "" : "s"} saved.${result.skipped ? ` ${result.skipped} already saved.` : ""}${result.skippedStoreReview ? ` ${result.skippedStoreReview} invoice${result.skippedStoreReview === 1 ? "" : "s"} not saved because the store was not approved.` : ""}${result.lisaCount ? ` ${result.lisaCount} office-ordered stop${result.lisaCount === 1 ? "" : "s"} saved for records/stores.` : ""}`);
}

setupAccessGate();
attachEvents();
setupSignaturePad();
resetInvoiceForm();
resetStopForm();
render();
