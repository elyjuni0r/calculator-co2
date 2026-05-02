/**
 * app.js
 * ======
 * Application entry point for the CO2 Calculator.
 * Wires together CONFIG, Calculator, and UI into a complete workflow.
 *
 * Pattern: IIFE (Immediately Invoked Function Expression) wrapping a
 * DOMContentLoaded listener.
 *   • The IIFE creates a private scope — no internal variables leak
 *     onto the global window object.
 *   • DOMContentLoaded guarantees every HTML element exists before
 *     we attempt to query or attach listeners to them.
 *
 * Full calculation pipeline (triggered on form submit):
 *   Validate → showLoading → [1 500 ms delay] → Calculate →
 *   Render → showElement × 3 → scrollToResults → hideLoading
 *
 * Dependencies (must be loaded before this file):
 *   js/routes-data.js  → RoutesDB
 *   js/config.js       → CONFIG
 *   js/calculator.js   → Calculator
 *   js/ui.js           → UI
 */

(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════
     CONSTANTS
     Centralised IDs and timing values — easy to update without
     hunting through the code.
  ═══════════════════════════════════════════════════════════ */
  var FORM_ID             = "calculator-form";
  var RESULT_SECTION_ID   = "results";
  var COMPARISON_SECTION_ID = "comparison";
  var CREDITS_SECTION_ID  = "carbon-credits";
  var RESULT_CONTENT_ID   = "results-content";
  var COMPARISON_CONTENT_ID = "comparison-content";
  var CREDITS_CONTENT_ID  = "carbon-credits-content";
  var LOADING_DELAY_MS    = 1500; // simulated async processing delay


  /* ═══════════════════════════════════════════════════════════
     INITIALIZATION
     Runs as soon as the browser has fully parsed the HTML.
  ═══════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", function () {

    // ── Step 1: Populate the <datalist> with city names ──────
    // CONFIG reads from RoutesDB.getAllCities() and injects
    // <option> elements into #cities-list so both city inputs
    // get autocomplete suggestions.
    CONFIG.populateDatalist();

    // ── Step 2: Wire the distance auto-fill feature ──────────
    // CONFIG attaches 'change' listeners to #Origin and
    // #Destination. When both contain a known city pair, it
    // queries RoutesDB.findDistance() and fills #distance
    // automatically, setting it to readonly.
    CONFIG.setupDistanceAutofill();

    // ── Step 3: Get the form element ─────────────────────────
    var form = document.getElementById(FORM_ID);

    if (!form) {
      console.error("app.js: Form #" + FORM_ID + " not found. Aborting init.");
      return;
    }

    // ── Step 4: Attach the submit handler ────────────────────
    form.addEventListener("submit", handleFormSubmit);

    // ── Step 5: Confirm successful initialisation ─────────────
    console.info("✅ Calculadora inicializada!");

  }); // end DOMContentLoaded


  /* ═══════════════════════════════════════════════════════════
     VALIDATION HELPERS
  ═══════════════════════════════════════════════════════════ */

  /**
   * validateInputs(origin, destination, distance)
   * Returns null if everything is valid, or a user-friendly
   * error string describing the first problem found.
   *
   * @param  {string} origin
   * @param  {string} destination
   * @param  {number} distance
   * @returns {string|null}
   */
  function validateInputs(origin, destination, distance) {

    if (!origin) {
      return "⚠️ Por favor, informe a cidade de origem.";
    }

    if (!destination) {
      return "⚠️ Por favor, informe a cidade de destino.";
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      return "⚠️ A origem e o destino não podem ser a mesma cidade.";
    }

    if (isNaN(distance) || distance === null || distance === undefined) {
      return "⚠️ Por favor, informe a distância da viagem.";
    }

    if (distance <= 0) {
      return "⚠️ A distância deve ser maior que zero.";
    }

    if (distance > 20000) {
      return "⚠️ A distância informada parece muito alta. Verifique o valor (máximo: 20 000 km).";
    }

    // All checks passed
    return null;
  }


  /**
   * getSelectedTransportMode(form)
   * Finds the checked radio button inside the form and maps its
   * HTML value to the internal CONFIG key via CONFIG.RADIO_VALUE_MAP.
   * Falls back to "car" if nothing is checked.
   *
   * @param  {HTMLFormElement} form
   * @returns {string} Internal mode key, e.g. "bus"
   */
  function getSelectedTransportMode(form) {
    var checkedRadio = form.querySelector('input[name="transport"]:checked');
    if (!checkedRadio) return "car"; // safe default

    // Map "Bicicleta" → "bicycle", "carro" → "car", etc.
    var mappedKey = CONFIG.RADIO_VALUE_MAP[checkedRadio.value];
    return mappedKey || "car";
  }


  /* ═══════════════════════════════════════════════════════════
     FORM SUBMIT HANDLER
  ═══════════════════════════════════════════════════════════ */

  /**
   * handleFormSubmit(event)
   * Main orchestrator: reads, validates, and processes the form.
   *
   * @param  {Event} event — The form 'submit' event
   */
  function handleFormSubmit(event) {

    // ── Step 1: Block native form submission / page reload ───
    event.preventDefault();


    /* ── Step 2: Collect and parse all form values ─────────── */

    var origin      = document.getElementById("Origin").value.trim();
    var destination = document.getElementById("Destination").value.trim();
    var distanceRaw = document.getElementById("distance").value;
    var distanceKm  = parseFloat(distanceRaw);

    // Get the transport mode and map it to the internal key
    var form          = event.target;
    var transportMode = getSelectedTransportMode(form);


    /* ── Step 3: Validate ───────────────────────────────────── */

    var validationError = validateInputs(origin, destination, distanceKm);

    if (validationError) {
      alert(validationError);
      return; // Stop processing — do NOT show loading or results
    }


    /* ── Step 4: Get the submit button reference ────────────── */

    var submitButton = form.querySelector('button[type="submit"]');


    /* ── Step 5: Enter loading state ───────────────────────── */
    // Disables the button and shows a spinner so the user knows
    // the app is working (even during the simulated delay).
    UI.showLoading(submitButton);


    /* ── Step 6: Hide any previously rendered result sections ─ */
    // Ensures stale data is never visible alongside new results.
    UI.hideElement(RESULT_SECTION_ID);
    UI.hideElement(COMPARISON_SECTION_ID);
    UI.hideElement(CREDITS_SECTION_ID);


    /* ── Step 7: Simulate async processing with a delay ──────── */
    // In production this delay would be replaced by an actual
    // API call (e.g. to a routing service). Here it gives the UI
    // time to paint the loading state before the heavy rendering.
    setTimeout(function () {

      try {

        /* ── CALCULATION PIPELINE ─────────────────────────── */

        // 7a. Emission for the user's chosen transport mode
        var selectedEmission = Calculator.calculateEmission(distanceKm, transportMode);

        // 7b. Car emission as the universal baseline for comparisons
        //     (even when the user chose a different mode)
        var carEmission = Calculator.calculateEmission(distanceKm, "car");

        // 7c. How much CO2 is saved vs driving a car?
        //     Returns { savedKg, percentage }
        var savings = Calculator.calculateSavings(selectedEmission, carEmission);

        // 7d. Emission for ALL modes on the same route, sorted by
        //     lowest emission first — used in the comparison panel
        var allModesComparison = Calculator.calculateAllModes(distanceKm);

        // 7e. Carbon credits needed to fully offset this trip
        //     Returns a number with 4 decimal precision
        var creditsNeeded = Calculator.calculateCarbonCredits(selectedEmission);

        // 7f. Estimated market price range in BRL for those credits
        //     Returns { min, max, average }
        var creditPrice = Calculator.estimateCreditPrice(creditsNeeded);


        /* ── BUILD DATA OBJECTS FOR EACH RENDERER ─────────── */

        // Object for renderResults() — summary panel
        var resultsData = {
          origin      : origin,
          destination : destination,
          distance    : distanceKm,
          emission    : selectedEmission,
          mode        : transportMode,
          savings     : savings
        };

        // Object for renderCarbonCredits() — offset panel
        var creditsData = {
          credits : creditsNeeded,
          price   : creditPrice
        };


        /* ── RENDER INTO THE DOM ──────────────────────────── */

        // 7g. Main results panel
        var resultsContent = document.getElementById(RESULT_CONTENT_ID);
        if (resultsContent) {
          resultsContent.innerHTML = UI.renderResults(resultsData);
        }

        // 7h. Mode comparison panel
        //     allModesComparison is the sorted array from Calculator
        var comparisonContent = document.getElementById(COMPARISON_CONTENT_ID);
        if (comparisonContent) {
          comparisonContent.innerHTML = UI.renderComparison(allModesComparison, transportMode);
        }

        // 7i. Carbon credits / offset panel
        var creditsContent = document.getElementById(CREDITS_CONTENT_ID);
        if (creditsContent) {
          creditsContent.innerHTML = UI.renderCarbonCredits(creditsData);
        }


        /* ── REVEAL THE RESULT SECTIONS ───────────────────── */
        // Removes the 'hidden' class from all three sections so
        // the rendered HTML becomes visible in the viewport.
        UI.showElement(RESULT_SECTION_ID);
        UI.showElement(COMPARISON_SECTION_ID);
        UI.showElement(CREDITS_SECTION_ID);


        /* ── SCROLL TO THE RESULTS ─────────────────────────── */
        // Smoothly brings the first result section into view so
        // the user does not have to manually scroll.
        UI.scrollToElement(RESULT_SECTION_ID);


        /* ── RESTORE THE BUTTON ────────────────────────────── */
        UI.hideLoading(submitButton);

        // Confirm successful render in the dev console
        console.info(
          "✅ Cálculo concluído | " +
          origin + " → " + destination +
          " | " + distanceKm + " km" +
          " | Modo: " + transportMode +
          " | Emissão: " + selectedEmission + " kg CO₂"
        );

      } catch (error) {

        /* ── ERROR HANDLING ───────────────────────────────── */

        // Log full technical detail for the developer
        console.error("app.js: Erro durante o cálculo:", error);

        // Show a friendly, non-technical message to the user
        alert(
          "❌ Ocorreu um erro ao processar o cálculo.\n\n" +
          "Por favor, verifique os dados informados e tente novamente.\n\n" +
          "Se o problema persistir, recarregue a página."
        );

        // Always restore the button — even on failure — so the
        // user can correct their input and try again
        UI.hideLoading(submitButton);

      } // end try-catch

    }, LOADING_DELAY_MS); // end setTimeout

  } // end handleFormSubmit()

})(); // end IIFE