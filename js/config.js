/**
 * config.js
 * =========
 * Central configuration for the CO2 Calculator.
 *
 * Exposed as a single global variable: CONFIG
 *
 * Sections:
 *   CONFIG.EMISSION_FACTORS        → kg CO2 per km, per transport mode
 *   CONFIG.TRANSPORT_MODES         → display metadata (label, icon, colour)
 *   CONFIG.CARBON_CREDIT           → constants for carbon-credit estimation
 *   CONFIG.RADIO_VALUE_MAP         → maps HTML radio values → internal keys
 *   CONFIG.populateDatalist()      → fills <datalist id="cities-list"> from RoutesDB
 *   CONFIG.setupDistanceAutofill() → wires city inputs to auto-fill distance field
 *
 * Dependencies (must be loaded before this file):
 *   js/routes-data.js  → exposes RoutesDB
 */

var CONFIG = {

  /* ═══════════════════════════════════════════════════════════
     EMISSION_FACTORS
     Average CO2 emissions in kilograms per kilometre travelled.
     Sources: IPCC Transport Chapter / CETESB Brasil averages.

       bicycle → 0      kg CO2/km  (zero direct emissions)
       car     → 0.12   kg CO2/km  (average Brazilian flex-fuel car)
       bus     → 0.089  kg CO2/km  (intercity diesel bus, per passenger)
       truck   → 0.96   kg CO2/km  (heavy freight truck, loaded)
  ═══════════════════════════════════════════════════════════ */
  EMISSION_FACTORS: {
    bicycle : 0,
    car     : 0.12,
    bus     : 0.089,
    truck   : 0.96
  },


  /* ═══════════════════════════════════════════════════════════
     TRANSPORT_MODES
     UI metadata for each transport mode.

     Each entry:
       label  {string} — Portuguese display name
       icon   {string} — Emoji shown in the transport grid
       color  {string} — Hex accent colour used by the UI layer
  ═══════════════════════════════════════════════════════════ */
  TRANSPORT_MODES: {

    bicycle: {
      label : "Bicicleta",
      icon  : "🚲",
      color : "#10b981"    // emerald — zero emission
    },

    car: {
      label : "Carro",
      icon  : "🚗",
      color : "#f59e0b"    // amber — moderate emission
    },

    bus: {
      label : "Ônibus",
      icon  : "🚌",
      color : "#0ea5e9"    // sky — collective / efficient
    },

    truck: {
      label : "Caminhão",
      icon  : "🚛",
      color : "#ef4444"    // red — high emission
    }

  }, // end TRANSPORT_MODES


  /* ═══════════════════════════════════════════════════════════
     CARBON_CREDIT
     Constants used to estimate the monetary value of offsetting
     the calculated CO2 emissions through carbon credits.

       KG_PER_CREDIT  — 1 credit offsets 1 000 kg of CO2
       PRICE_MIN_BRL  — Minimum market price per credit (R$)
       PRICE_MAX_BRL  — Maximum market price per credit (R$)
  ═══════════════════════════════════════════════════════════ */
  CARBON_CREDIT: {
    KG_PER_CREDIT : 1000,
    PRICE_MIN_BRL : 50,
    PRICE_MAX_BRL : 150
  },


  /* ═══════════════════════════════════════════════════════════
     RADIO_VALUE_MAP
     Bridges the HTML radio values (set in index.html) to the
     internal keys used across EMISSION_FACTORS and TRANSPORT_MODES.

     HTML value  →  internal key
     "Bicicleta" →  "bicycle"
     "carro"     →  "car"
     "onibus"    →  "bus"
     "caminhão"  →  "truck"
  ═══════════════════════════════════════════════════════════ */
  RADIO_VALUE_MAP: {
    "Bicicleta" : "bicycle",
    "carro"     : "car",
    "onibus"    : "bus",
    "caminhão"  : "truck"
  },


  /* ═══════════════════════════════════════════════════════════
     populateDatalist()
     Reads all unique, sorted city names from RoutesDB and injects
     them as <option> elements into <datalist id="cities-list">.
     Uses a DocumentFragment for a single, efficient DOM write.
     Safe to call multiple times — clears the list before refilling.

     @returns {void}
  ═══════════════════════════════════════════════════════════ */
  populateDatalist: function () {

    // Locate the shared datalist used by both city inputs
    var datalist = document.getElementById("cities-list");
    if (!datalist) {
      console.warn("CONFIG.populateDatalist: #cities-list not found in DOM.");
      return;
    }

    // Fetch the sorted, deduplicated city array from RoutesDB
    var cities = RoutesDB.getAllCities();
    if (!cities || cities.length === 0) {
      console.warn("CONFIG.populateDatalist: RoutesDB returned no cities.");
      return;
    }

    // Wipe any stale options before inserting fresh ones
    datalist.innerHTML = "";

    // Build all <option> nodes in memory, then do one DOM write
    var fragment = document.createDocumentFragment();
    cities.forEach(function (cityName) {
      var option       = document.createElement("option");
      option.value     = cityName;
      option.textContent = cityName; // accessible label for screen readers
      fragment.appendChild(option);
    });
    datalist.appendChild(fragment);

    console.info("CONFIG.populateDatalist: " + cities.length + " cities loaded.");

  }, // end populateDatalist()


  /* ═══════════════════════════════════════════════════════════
     setupDistanceAutofill()
     Wires 'change' event listeners to the Origin and Destination
     inputs so that, whenever both contain known city names,
     the distance field is auto-populated via RoutesDB.findDistance().

     Detailed behaviour:
       Route found
         → Fill #distance with the km value
         → Set readonly (prevents accidental edits)
         → Turn helper text green with a success message

       Route NOT found
         → Clear #distance
         → Update helper text to prompt manual input

       Manual checkbox checked
         → Remove readonly from #distance so user can type freely
         → Reset helper text to its neutral hint

       Manual checkbox unchecked
         → Restore readonly + try autofill again with current values

     @returns {void}
  ═══════════════════════════════════════════════════════════ */
  setupDistanceAutofill: function () {

    // ── Grab DOM references ──────────────────────────────────
    var originInput      = document.getElementById("Origin");
    var destinationInput = document.getElementById("Destination");
    var distanceInput    = document.getElementById("distance");
    var manualCheckbox   = document.getElementById("manual-distance");
    var hintEl           = document.getElementById("distance-auto-hint");

    // Bail out clearly if the HTML structure is not yet ready
    if (!originInput || !destinationInput || !distanceInput || !manualCheckbox) {
      console.warn("CONFIG.setupDistanceAutofill: required input elements not found.");
      return;
    }

    // ── Hint text constants ──────────────────────────────────
    var HINT_DEFAULT = "A distância será preenchida automaticamente";
    var HINT_SUCCESS = "✓ Distância encontrada na base de rotas";
    var HINT_NOT_FOUND = "Rota não encontrada — marque a opção acima para inserir manualmente";

    // ── Helper: apply success state to the distance field ────
    function applySuccess(km) {
      distanceInput.value = km;
      distanceInput.setAttribute("readonly", true);
      distanceInput.removeAttribute("data-autofilled-error");
      distanceInput.setAttribute("data-autofilled", "true");

      // Style the input to signal success
      distanceInput.style.borderColor = "#10b981";  // emerald
      distanceInput.style.color       = "#065f46";  // emerald-900

      if (hintEl) {
        hintEl.textContent  = HINT_SUCCESS;
        hintEl.style.color  = "#059669";  // emerald-600
        hintEl.style.fontStyle = "normal";
      }
    }

    // ── Helper: apply "not found" state ──────────────────────
    function applyNotFound() {
      distanceInput.value = "";
      distanceInput.setAttribute("readonly", true);
      distanceInput.removeAttribute("data-autofilled");
      distanceInput.setAttribute("data-autofilled-error", "true");

      // Neutral/warning styling
      distanceInput.style.borderColor = "";
      distanceInput.style.color       = "";

      if (hintEl) {
        hintEl.textContent = HINT_NOT_FOUND;
        hintEl.style.color = "#f59e0b";   // amber — soft warning
        hintEl.style.fontStyle = "italic";
      }
    }

    // ── Helper: reset distance field to default state ────────
    function applyDefault() {
      distanceInput.value = "";
      distanceInput.setAttribute("readonly", true);
      distanceInput.removeAttribute("data-autofilled");
      distanceInput.removeAttribute("data-autofilled-error");
      distanceInput.style.borderColor = "";
      distanceInput.style.color       = "";

      if (hintEl) {
        hintEl.textContent = HINT_DEFAULT;
        hintEl.style.color = "";
        hintEl.style.fontStyle = "italic";
      }
    }

    // ── Helper: reset to manual-entry state ──────────────────
    function applyManualMode() {
      distanceInput.value = "";
      distanceInput.removeAttribute("readonly");
      distanceInput.removeAttribute("data-autofilled");
      distanceInput.removeAttribute("data-autofilled-error");
      distanceInput.style.borderColor = "";
      distanceInput.style.color       = "";
      distanceInput.disabled          = false;
      distanceInput.focus();

      if (hintEl) {
        hintEl.textContent = HINT_DEFAULT;
        hintEl.style.color = "";
        hintEl.style.fontStyle = "italic";
      }
    }

    // ── Core autofill logic ───────────────────────────────────
    function attemptAutofill() {

      // Skip if the user has opted in to manual input
      if (manualCheckbox.checked) return;

      var originVal = originInput.value.trim();
      var destVal   = destinationInput.value.trim();

      // Both fields must have content before querying
      if (!originVal || !destVal) {
        applyDefault();
        return;
      }

      // Query RoutesDB for a known distance between these cities
      var km = RoutesDB.findDistance(originVal, destVal);

      if (km !== null) {
        // ✅ Route found
        applySuccess(km);
        console.info(
          "CONFIG.setupDistanceAutofill: " + originVal +
          " → " + destVal + " = " + km + " km"
        );
      } else {
        // ⚠️ No route in the database
        applyNotFound();
        console.info(
          "CONFIG.setupDistanceAutofill: no route found for " +
          originVal + " → " + destVal
        );
      }

    } // end attemptAutofill()

    // ── Bind 'change' to both city inputs ────────────────────
    // 'change' fires on blur AND on datalist selection — ideal timing.
    originInput.addEventListener("change",      attemptAutofill);
    destinationInput.addEventListener("change", attemptAutofill);

    // ── Run immediately in case fields are pre-populated ─────
    attemptAutofill();

    // ── Manual checkbox toggle ───────────────────────────────
    manualCheckbox.addEventListener("change", function () {

      if (manualCheckbox.checked) {
        // ✏️ Manual mode ON — let the user type freely
        applyManualMode();

      } else {
        // 🔒 Manual mode OFF — restore readonly and re-run autofill
        distanceInput.setAttribute("readonly", true);
        attemptAutofill();
      }

    }); // end checkbox listener

    console.info("CONFIG.setupDistanceAutofill: listeners attached.");

  } // end setupDistanceAutofill()

}; // end CONFIG