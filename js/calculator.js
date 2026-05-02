/**
 * calculator.js
 * =============
 * Pure calculation engine for the CO2 Calculator.
 * Contains no DOM manipulation — only math and data transformation.
 *
 * Exposed as a single global variable: Calculator
 *
 * Methods:
 *   Calculator.calculateEmission(distanceKm, transportMode)
 *     → number  (kg CO2 for one mode)
 *
 *   Calculator.calculateAllModes(distanceKm)
 *     → Array   (emission for every mode, sorted lowest → highest)
 *
 *   Calculator.calculateSavings(emission, baselineEmission)
 *     → object  { savedKg, percentage }
 *
 *   Calculator.calculateCarbonCredits(emissionKg)
 *     → number  (credits needed to offset the emission)
 *
 *   Calculator.estimateCreditPrice(credits)
 *     → object  { min, max, average } in BRL
 *
 * Dependencies (must be loaded before this file):
 *   js/routes-data.js  → RoutesDB
 *   js/config.js       → CONFIG
 */

var Calculator = {

  /* ═══════════════════════════════════════════════════════════
     calculateEmission(distanceKm, transportMode)
     ───────────────────────────────────────────────────────────
     Formula: emission (kg CO2) = distance (km) × factor (kg CO2/km)

     The emission factor represents how many kilograms of CO2 are
     released per kilometre for a given transport mode.
     Factors are defined in CONFIG.EMISSION_FACTORS.

     @param  {number} distanceKm     — Trip distance in kilometres
     @param  {string} transportMode  — Key into CONFIG.EMISSION_FACTORS
                                       (e.g. "car", "bus", "bicycle")
     @returns {number} Emission in kg CO2, rounded to 2 decimal places.
                       Returns 0 if the mode has no factor defined.
  ═══════════════════════════════════════════════════════════ */
  calculateEmission: function (distanceKm, transportMode) {

    // Retrieve the CO2 factor for the requested transport mode.
    // Falls back to 0 if the key is not found, avoiding NaN results.
    var factor = CONFIG.EMISSION_FACTORS[transportMode];
    if (factor === undefined || factor === null) {
      console.warn(
        "Calculator.calculateEmission: unknown transport mode '" +
        transportMode + "'. Defaulting factor to 0."
      );
      factor = 0;
    }

    // Core formula: distance (km) × emission factor (kg CO2/km)
    var rawEmission = distanceKm * factor;

    // Round to 2 decimal places for clean display (e.g. 51.60 kg)
    return Math.round(rawEmission * 100) / 100;

  }, // end calculateEmission()


  /* ═══════════════════════════════════════════════════════════
     calculateAllModes(distanceKm)
     ───────────────────────────────────────────────────────────
     Calculates CO2 emission for every transport mode available in
     CONFIG.EMISSION_FACTORS and benchmarks each against the car
     baseline (car = 100 %).

     The car is used as the baseline because it is the most common
     individual transport mode and provides an intuitive reference:
       bicycle →   0 % of car emission  (100 % cleaner)
       bus     →  74 % of car emission  (26 % cleaner)
       truck   → 800 % of car emission  (8× more polluting)

     When car emission is 0 (distanceKm = 0), percentageVsCar is
     set to 0 for all modes to avoid division by zero.

     @param  {number} distanceKm — Trip distance in kilometres
     @returns {Array}  Sorted array (lowest emission first) of objects:
                       {
                         mode            {string} — e.g. "car"
                         emission        {number} — kg CO2, 2 dp
                         percentageVsCar {number} — % vs car, 2 dp
                       }
  ═══════════════════════════════════════════════════════════ */
  calculateAllModes: function (distanceKm) {

    var results = [];

    // Pre-calculate the car emission once — used as the shared baseline
    var carEmission = this.calculateEmission(distanceKm, "car");

    // Iterate over every key defined in EMISSION_FACTORS
    var modes = Object.keys(CONFIG.EMISSION_FACTORS);
    for (var i = 0; i < modes.length; i++) {
      var mode     = modes[i];
      var emission = this.calculateEmission(distanceKm, mode);

      // Percentage vs car:
      //   - Car itself       → always 100 %
      //   - Bicycle (0 kg)   → 0 %
      //   - Bus (less than car) → < 100 %
      //   - Truck (more)     → > 100 %
      // Guard: if car emission is 0 (zero-km trip), keep 0 % for all
      var percentageVsCar =
        carEmission > 0
          ? Math.round((emission / carEmission) * 10000) / 100   // 2 dp
          : 0;

      results.push({
        mode            : mode,
        emission        : emission,
        percentageVsCar : percentageVsCar
      });
    }

    // Sort ascending by emission so the UI can render a
    // green-to-red ranking without extra logic
    results.sort(function (a, b) {
      return a.emission - b.emission;
    });

    return results;

  }, // end calculateAllModes()


  /* ═══════════════════════════════════════════════════════════
     calculateSavings(emission, baselineEmission)
     ───────────────────────────────────────────────────────────
     Quantifies how much CO2 the user saves compared to a baseline
     (usually the car emission for the same route).

     Formula:
       savedKg    = baseline - emission
       percentage = (savedKg / baseline) × 100

     Edge cases:
       • If emission >= baseline → savedKg will be 0 or negative.
         Negative values are clamped to 0 (no "negative savings").
       • If baseline is 0 → percentage is set to 0 to avoid ÷ 0.

     @param  {number} emission         — Actual mode emission (kg CO2)
     @param  {number} baselineEmission — Reference emission, typically car (kg CO2)
     @returns {object} { savedKg: number, percentage: number }
                        Both values rounded to 2 decimal places.
  ═══════════════════════════════════════════════════════════ */
  calculateSavings: function (emission, baselineEmission) {

    // How many kg of CO2 are avoided compared to the baseline?
    var rawSavedKg = baselineEmission - emission;

    // Clamp to 0: if the chosen mode emits MORE than the baseline,
    // we report zero savings rather than a confusing negative number.
    var savedKg = Math.max(0, Math.round(rawSavedKg * 100) / 100);

    // Percentage of the baseline emission that is avoided.
    // Guard against division by zero when baseline = 0 (e.g. bicycle vs bicycle).
    var percentage =
      baselineEmission > 0
        ? Math.round((savedKg / baselineEmission) * 10000) / 100
        : 0;

    return {
      savedKg    : savedKg,
      percentage : percentage
    };

  }, // end calculateSavings()


  /* ═══════════════════════════════════════════════════════════
     calculateCarbonCredits(emissionKg)
     ───────────────────────────────────────────────────────────
     Converts a CO2 emission (in kg) into the equivalent number of
     carbon credits needed to fully offset it.

     1 carbon credit offsets CONFIG.CARBON_CREDIT.KG_PER_CREDIT kg
     of CO2 (default: 1 000 kg = 1 tonne).

     Formula:
       credits = emissionKg / KG_PER_CREDIT

     Result is rounded to 4 decimal places to preserve meaningful
     precision for small trips (e.g. 51.6 kg → 0.0516 credits).

     @param  {number} emissionKg — CO2 emission to offset (kg)
     @returns {number} Credits required, rounded to 4 decimal places.
  ═══════════════════════════════════════════════════════════ */
  calculateCarbonCredits: function (emissionKg) {

    var kgPerCredit = CONFIG.CARBON_CREDIT.KG_PER_CREDIT;

    // Guard: avoid division by zero if KG_PER_CREDIT is misconfigured
    if (!kgPerCredit || kgPerCredit <= 0) {
      console.warn("Calculator.calculateCarbonCredits: KG_PER_CREDIT is invalid.");
      return 0;
    }

    // credits = kg emitted ÷ kg offset per credit
    var rawCredits = emissionKg / kgPerCredit;

    // 4 decimal places: small trips produce fractions like 0.0516
    return Math.round(rawCredits * 10000) / 10000;

  }, // end calculateCarbonCredits()


  /* ═══════════════════════════════════════════════════════════
     estimateCreditPrice(credits)
     ───────────────────────────────────────────────────────────
     Estimates the monetary cost (in BRL) of purchasing enough
     carbon credits to offset an emission, using the market price
     range defined in CONFIG.CARBON_CREDIT.

     Formula:
       min     = credits × PRICE_MIN_BRL
       max     = credits × PRICE_MAX_BRL
       average = (min + max) / 2

     The range reflects real market variability — carbon credit
     prices in Brazil fluctuate between roughly R$ 50 and R$ 150
     per tonne (CBIO / voluntary market, 2024).

     @param  {number} credits — Carbon credits (from calculateCarbonCredits)
     @returns {object} {
                  min:     {number} — Minimum cost in BRL (2 dp)
                  max:     {number} — Maximum cost in BRL (2 dp)
                  average: {number} — Mid-point cost in BRL (2 dp)
                }
  ═══════════════════════════════════════════════════════════ */
  estimateCreditPrice: function (credits) {

    var priceMin = CONFIG.CARBON_CREDIT.PRICE_MIN_BRL;
    var priceMax = CONFIG.CARBON_CREDIT.PRICE_MAX_BRL;

    // Minimum cost: using the lowest market price per credit
    var min = Math.round(credits * priceMin * 100) / 100;

    // Maximum cost: using the highest market price per credit
    var max = Math.round(credits * priceMax * 100) / 100;

    // Average: midpoint of the price range for a single "best estimate"
    var average = Math.round(((min + max) / 2) * 100) / 100;

    return {
      min     : min,
      max     : max,
      average : average
    };

  } // end estimateCreditPrice()

}; // end Calculator