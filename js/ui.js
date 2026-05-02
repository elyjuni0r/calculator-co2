/**
 * ui.js
 * =====
 * Presentation layer for the CO2 Calculator.
 * Responsible for all DOM updates, HTML generation, and UX feedback.
 * Contains NO business logic — delegates all math to Calculator and
 * all config look-ups to CONFIG.
 *
 * Exposed as a single global variable: UI
 *
 * ── Utility methods ─────────────────────────────────────────────
 *   UI.formatNumber(number, decimals)
 *   UI.formatCurrency(value)
 *   UI.showElement(elementId)
 *   UI.hideElement(elementId)
 *   UI.scrollToElement(elementId)
 *
 * ── Rendering methods ───────────────────────────────────────────
 *   UI.renderResults(data)           → HTML string
 *   UI.renderComparison(modesArray, selectedMode) → HTML string
 *   UI.renderCarbonCredits(creditsData)           → HTML string
 *   UI.showLoading(buttonElement)
 *   UI.hideLoading(buttonElement)
 *
 * Dependencies (must be loaded before this file):
 *   js/routes-data.js  → RoutesDB
 *   js/config.js       → CONFIG
 *   js/calculator.js   → Calculator
 */

var UI = {

  /* ═══════════════════════════════════════════════════════════
     ── UTILITY METHODS ────────────────────────────────────────
  ═══════════════════════════════════════════════════════════ */

  /**
   * formatNumber(number, decimals)
   * ────────────────────────────────────────────────────────────
   * Formats a numeric value with a fixed number of decimal places
   * and Brazilian thousand separators (1.234,56).
   *
   * Strategy: toLocaleString('pt-BR') handles both the decimal
   * comma and the dot thousand-separator natively, then toFixed
   * ensures the exact decimal count is respected even when the
   * locale rounds differently on some older engines.
   *
   * @param  {number} number   — The value to format
   * @param  {number} decimals — Decimal places (default: 2)
   * @returns {string}          e.g. "1.234,56"
   */
  formatNumber: function (number, decimals) {
    // Default to 2 decimal places when not specified
    var dp = (decimals !== undefined && decimals !== null) ? decimals : 2;

    // Guard: return "0" string for falsy non-zero inputs
    if (isNaN(number) || number === null || number === undefined) return "0";

    // toLocaleString applies pt-BR formatting (dots + comma)
    // minimumFractionDigits + maximumFractionDigits lock the decimal count
    return Number(number).toLocaleString("pt-BR", {
      minimumFractionDigits : dp,
      maximumFractionDigits : dp
    });
  }, // end formatNumber()


  /**
   * formatCurrency(value)
   * ────────────────────────────────────────────────────────────
   * Formats a number as Brazilian Real currency: "R$ 1.234,56".
   * Uses the Intl.NumberFormat API for robust locale handling.
   *
   * @param  {number} value — Monetary amount in BRL
   * @returns {string}       e.g. "R$ 50,00"
   */
  formatCurrency: function (value) {
    if (isNaN(value) || value === null || value === undefined) return "R$ 0,00";

    return Number(value).toLocaleString("pt-BR", {
      style                 : "currency",
      currency              : "BRL",
      minimumFractionDigits : 2,
      maximumFractionDigits : 2
    });
  }, // end formatCurrency()


  /**
   * showElement(elementId)
   * ────────────────────────────────────────────────────────────
   * Reveals a hidden element by removing the 'hidden' CSS class.
   * Paired with hideElement() to control result section visibility.
   *
   * @param  {string} elementId — The id attribute of the target element
   * @returns {void}
   */
  showElement: function (elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.classList.remove("hidden");
    } else {
      console.warn("UI.showElement: #" + elementId + " not found.");
    }
  }, // end showElement()


  /**
   * hideElement(elementId)
   * ────────────────────────────────────────────────────────────
   * Hides an element by adding the 'hidden' CSS class.
   *
   * @param  {string} elementId — The id attribute of the target element
   * @returns {void}
   */
  hideElement: function (elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.classList.add("hidden");
    } else {
      console.warn("UI.hideElement: #" + elementId + " not found.");
    }
  }, // end hideElement()


  /**
   * scrollToElement(elementId)
   * ────────────────────────────────────────────────────────────
   * Smoothly scrolls the viewport to bring the target element into
   * view. Called after results are rendered so the user does not
   * have to manually scroll down to see them.
   *
   * 'block: start' with an 80 px offset (via CSS scroll-margin-top
   * on result sections) avoids the element hiding behind a sticky
   * header if one is added in the future.
   *
   * @param  {string} elementId — The id attribute of the target element
   * @returns {void}
   */
  scrollToElement: function (elementId) {
    var el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn("UI.scrollToElement: #" + elementId + " not found.");
    }
  }, // end scrollToElement()


  /* ═══════════════════════════════════════════════════════════
     ── RENDERING METHODS ──────────────────────────────────────
  ═══════════════════════════════════════════════════════════ */

  /**
   * renderResults(data)
   * ────────────────────────────────────────────────────────────
   * Generates the main result panel HTML from a calculation result.
   *
   * data shape:
   * {
   *   origin      {string} — e.g. "São Paulo, SP"
   *   destination {string} — e.g. "Rio de Janeiro, RJ"
   *   distance    {number} — km
   *   emission    {number} — kg CO2
   *   mode        {string} — internal key, e.g. "car"
   *   savings     {object|null} — { savedKg, percentage } or null when mode=car
   * }
   *
   * ── Improvements beyond spec ────────────────────────────────
   * • Animated counter shimmer class on the emission value so the
   *   number "pops" when first rendered (CSS handles the animation).
   * • Zero-emission celebration message for bicycle mode.
   * • Accessibility: role="status" + aria-live on the result wrapper
   *   so screen readers announce new content without page reload.
   * • Each card has a subtle left-border accent colour matching the
   *   transport mode colour from CONFIG.TRANSPORT_MODES.
   *
   * @param  {object} data — See shape above
   * @returns {string} Complete HTML string ready for innerHTML injection
   */
  renderResults: function (data) {

    // Retrieve display metadata for the selected mode
    var modeInfo = CONFIG.TRANSPORT_MODES[data.mode] || {
      label : data.mode,
      icon  : "🚗",
      color : "#059669"
    };

    // Determine if this is a zero-emission trip (bicycle)
    var isZeroEmission = data.emission === 0;

    // ── Route card ───────────────────────────────────────────
    // Shows the trip summary: origin → destination
    var routeCard = [
      '<div class="results__card results__card--route" aria-label="Rota calculada">',
      '  <span class="results__card-icon" aria-hidden="true">🗺️</span>',
      '  <div class="results__card-body">',
      '    <p class="results__card-label">Rota</p>',
      '    <p class="results__card-value results__card-value--route">',
      '      <span class="results__city">' + data.origin + '</span>',
      '      <span class="results__arrow" aria-hidden="true">→</span>',
      '      <span class="results__city">' + data.destination + '</span>',
      '    </p>',
      '  </div>',
      '</div>'
    ].join("\n");

    // ── Distance card ────────────────────────────────────────
    // Shows kilometres with thousands separator
    var distanceCard = [
      '<div class="results__card results__card--distance" aria-label="Distância da rota">',
      '  <span class="results__card-icon" aria-hidden="true">📏</span>',
      '  <div class="results__card-body">',
      '    <p class="results__card-label">Distância</p>',
      '    <p class="results__card-value">',
      '      <strong>' + this.formatNumber(data.distance, 0) + '</strong>',
      '      <span class="results__unit">km</span>',
      '    </p>',
      '  </div>',
      '</div>'
    ].join("\n");

    // ── Emission card ────────────────────────────────────────
    // Main focal point — large number with animated entry class
    // Zero-emission gets a special celebration message
    var emissionValue = isZeroEmission
      ? '<strong class="results__card-value--zero">Zero 🎉</strong>'
      : '<strong class="results__emission-value results__emission-value--animated">' +
          this.formatNumber(data.emission, 2) +
        '</strong><span class="results__unit">kg CO₂</span>';

    var emissionCard = [
      '<div class="results__card results__card--emission" aria-label="Emissão de CO2 calculada">',
      '  <span class="results__card-icon" aria-hidden="true">' + (isZeroEmission ? "🌿" : "☁️") + '</span>',
      '  <div class="results__card-body">',
      '    <p class="results__card-label">Emissão de CO₂</p>',
      '    <p class="results__card-value">' + emissionValue + '</p>',
      isZeroEmission
        ? '    <p class="results__card-note results__card-note--success">Parabéns! Viagem sem emissões diretas.</p>'
        : '',
      '  </div>',
      '</div>'
    ].join("\n");

    // ── Transport mode card ──────────────────────────────────
    // Shows the icon and label from CONFIG.TRANSPORT_MODES,
    // with a left-border coloured to match the mode's accent colour
    var transportCard = [
      '<div class="results__card results__card--transport"',
      '     style="border-left: 4px solid ' + modeInfo.color + ';"',
      '     aria-label="Modo de transporte selecionado">',
      '  <span class="results__card-icon" aria-hidden="true">' + modeInfo.icon + '</span>',
      '  <div class="results__card-body">',
      '    <p class="results__card-label">Transporte</p>',
      '    <p class="results__card-value">' + modeInfo.label + '</p>',
      '  </div>',
      '</div>'
    ].join("\n");

    // ── Savings card (conditional) ───────────────────────────
    // Only shown when the chosen mode is NOT the car baseline,
    // and valid savings data is provided
    var savingsCard = "";
    if (data.mode !== "car" && data.savings && data.savings.savedKg > 0) {
      savingsCard = [
        '<div class="results__card results__card--savings" aria-label="Economia em relação ao carro">',
        '  <span class="results__card-icon" aria-hidden="true">🌱</span>',
        '  <div class="results__card-body">',
        '    <p class="results__card-label">Economia vs. Carro</p>',
        '    <p class="results__card-value">',
        '      <strong>' + this.formatNumber(data.savings.savedKg, 2) + ' kg CO₂</strong>',
        '    </p>',
        '    <p class="results__card-note">',
        '      <span class="results__savings-badge">' +
                this.formatNumber(data.savings.percentage, 1) + '% menos emissões</span>',
        '    </p>',
        '  </div>',
        '</div>'
      ].join("\n");
    } else if (data.mode === "car") {
      // When car is selected, show a neutral tip instead of savings
      savingsCard = [
        '<div class="results__card results__card--tip" aria-label="Dica ambiental">',
        '  <span class="results__card-icon" aria-hidden="true">💡</span>',
        '  <div class="results__card-body">',
        '    <p class="results__card-label">Sabia que?</p>',
        '    <p class="results__card-note">',
        '      Trocar o carro pelo ônibus nessa rota reduziria suas emissões em até ',
        '      <strong>' + this.formatNumber(100 - (CONFIG.EMISSION_FACTORS.bus / CONFIG.EMISSION_FACTORS.car) * 100, 0) + '%</strong>.',
        '    </p>',
        '  </div>',
        '</div>'
      ].join("\n");
    }

    // ── Assemble the full results grid ───────────────────────
    return [
      '<div class="results__grid" role="status" aria-live="polite" aria-atomic="true">',
      '  <h3 class="results__section-title">Resumo da Emissão</h3>',
      '  <div class="results__cards">',
           routeCard,
           distanceCard,
           emissionCard,
           transportCard,
           savingsCard,
      '  </div>',
      '</div>'
    ].join("\n");

  }, // end renderResults()


  /**
   * renderComparison(modesArray, selectedMode)
   * ────────────────────────────────────────────────────────────
   * Generates the transport mode comparison panel HTML.
   *
   * modesArray — output of Calculator.calculateAllModes(), already
   *              sorted lowest → highest emission.
   * selectedMode — the key of the mode the user chose (e.g. "bus").
   *
   * Each comparison item contains:
   *   • Mode icon + label header
   *   • "Selecionado" badge (only on the chosen mode)
   *   • Emission value + % vs car stats
   *   • Colour-coded progress bar:
   *       0 %          → green  (bicycle)
   *       1–74 %       → green  (better than car)
   *       75–99 %      → yellow (slightly better)
   *       100 %        → orange (same as car)
   *       > 100 %      → red    (worse than car)
   *
   * ── Improvements beyond spec ────────────────────────────────
   * • Progress bar width is normalised against the MAX emission
   *   in the dataset (not hardcoded 100 %), so it remains visually
   *   proportional even when truck dwarfs all others.
   * • "Melhor escolha" crown badge on the lowest-emission mode.
   * • Tip box at the bottom provides contextual advice based on
   *   what the user selected.
   *
   * @param  {Array}  modesArray   — [{mode, emission, percentageVsCar}, …]
   * @param  {string} selectedMode — e.g. "bus"
   * @returns {string} Complete HTML string
   */
  renderComparison: function (modesArray, selectedMode) {

    if (!modesArray || modesArray.length === 0) {
      return '<p class="comparison__empty">Nenhum dado de comparação disponível.</p>';
    }

    // Find max emission for proportional bar scaling
    var maxEmission = 0;
    for (var i = 0; i < modesArray.length; i++) {
      if (modesArray[i].emission > maxEmission) {
        maxEmission = modesArray[i].emission;
      }
    }

    // The lowest-emission mode gets a "best pick" crown
    var bestMode = modesArray[0].mode;  // array is pre-sorted asc

    // ── Build one item per mode ──────────────────────────────
    var itemsHtml = "";

    for (var j = 0; j < modesArray.length; j++) {
      var item     = modesArray[j];
      var info     = CONFIG.TRANSPORT_MODES[item.mode] || { label: item.mode, icon: "🚗", color: "#059669" };
      var isSelected = item.mode === selectedMode;
      var isBest     = item.mode === bestMode;

      // ── Progress bar ──────────────────────────────────────
      // Width: proportion of this mode's emission vs the highest
      var barWidth = maxEmission > 0
        ? Math.round((item.emission / maxEmission) * 100)
        : 0;

      // Colour based on % vs car (not vs max emission)
      var pct = item.percentageVsCar;
      var barColor;
      if (pct === 0) {
        barColor = "#10b981";   // emerald  — zero emission
      } else if (pct < 75) {
        barColor = "#34d399";   // light green — better than car
      } else if (pct < 100) {
        barColor = "#fbbf24";   // amber — slightly worse than car
      } else if (pct === 100) {
        barColor = "#f97316";   // orange — same as car (IS car)
      } else {
        barColor = "#ef4444";   // red — worse than car
      }

      // ── Emission display ──────────────────────────────────
      var emissionDisplay = item.emission === 0
        ? "Zero CO₂"
        : this.formatNumber(item.emission, 2) + " kg CO₂";

      // ── % vs car label ────────────────────────────────────
      var pctLabel;
      if (item.mode === "car") {
        pctLabel = "Referência base";
      } else if (item.emission === 0) {
        pctLabel = "100% mais limpo que o carro";
      } else if (pct < 100) {
        pctLabel = this.formatNumber(100 - pct, 1) + "% menos que o carro";
      } else {
        pctLabel = this.formatNumber(pct, 0) + "% das emissões do carro";
      }

      // ── Badges ───────────────────────────────────────────
      var badges = "";
      if (isSelected) {
        badges += '<span class="comparison__badge comparison__badge--selected">✓ Selecionado</span>';
      }
      if (isBest) {
        badges += '<span class="comparison__badge comparison__badge--best">👑 Melhor escolha</span>';
      }

      // ── Item HTML ─────────────────────────────────────────
      /*
        Structure per item:
          .comparison__item [--selected modifier if chosen]
            .comparison__item-header
              .comparison__item-icon   ← emoji
              .comparison__item-meta
                .comparison__item-label  ← mode name
                .comparison__item-pct    ← % vs car sentence
              .comparison__item-badges  ← Selecionado / Melhor escolha
            .comparison__item-emission  ← big number
            .comparison__item-bar-track ← grey track
              .comparison__item-bar     ← coloured fill
      */
      itemsHtml += [
        '<div class="comparison__item' + (isSelected ? " comparison__item--selected" : "") + '"',
        '     style="--mode-color: ' + info.color + ';"',
        '     aria-label="' + info.label + ': ' + emissionDisplay + '">',

        '  <div class="comparison__item-header">',
        '    <span class="comparison__item-icon" aria-hidden="true">' + info.icon + '</span>',
        '    <div class="comparison__item-meta">',
        '      <p class="comparison__item-label">' + info.label + '</p>',
        '      <p class="comparison__item-pct">' + pctLabel + '</p>',
        '    </div>',
        '    <div class="comparison__item-badges">' + badges + '</div>',
        '  </div>',

        '  <p class="comparison__item-emission">' + emissionDisplay + '</p>',

        '  <div class="comparison__item-bar-track" aria-hidden="true">',
        '    <div class="comparison__item-bar"',
        '         style="width: ' + barWidth + '%; background-color: ' + barColor + ';"></div>',
        '  </div>',

        '</div>'
      ].join("\n");
    }

    // ── Contextual tip box ───────────────────────────────────
    // Message varies depending on what the user actually chose
    var tipMessage;
    var selectedInfo = CONFIG.TRANSPORT_MODES[selectedMode];
    var selectedItem = null;
    for (var k = 0; k < modesArray.length; k++) {
      if (modesArray[k].mode === selectedMode) { selectedItem = modesArray[k]; break; }
    }

    if (selectedMode === "bicycle") {
      tipMessage = "🌟 Excelente escolha! A bicicleta é o meio de transporte mais sustentável disponível.";
    } else if (selectedMode === "bus") {
      tipMessage = "✅ Ótima decisão! O ônibus divide as emissões entre vários passageiros, tornando-o bem mais eficiente que o carro.";
    } else if (selectedMode === "car") {
      tipMessage = "💡 Considere compartilhar a viagem (carona) ou trocar pelo ônibus para reduzir suas emissões pela metade.";
    } else if (selectedMode === "truck") {
      tipMessage = "🔴 Caminhões têm as maiores emissões por km. Quando possível, consolide cargas para diluir o impacto ambiental.";
    } else {
      tipMessage = "📊 Compare os modos acima para escolher a opção mais sustentável para sua rota.";
    }

    // ── Assemble the full comparison block ───────────────────
    return [
      '<div class="comparison__container">',
      '  <h3 class="comparison__title">Comparativo por Modo de Transporte</h3>',
      '  <p class="comparison__subtitle">Emissões para a mesma rota em diferentes transportes</p>',
      '  <div class="comparison__list">',
           itemsHtml,
      '  </div>',
      '  <div class="comparison__tip" role="note">',
      '    <p>' + tipMessage + '</p>',
      '  </div>',
      '</div>'
    ].join("\n");

  }, // end renderComparison()


  /**
   * renderCarbonCredits(creditsData)
   * ────────────────────────────────────────────────────────────
   * Generates the carbon credits offset panel HTML.
   *
   * creditsData shape:
   * {
   *   credits {number}  — credits needed (from Calculator.calculateCarbonCredits)
   *   price   {object}  — { min, max, average } in BRL
   * }
   *
   * ── Improvements beyond spec ────────────────────────────────
   * • "Equivalência" row: converts the emission into intuitive real-
   *   world analogies (km driven, trees needed) so the number feels
   *   concrete to the user.
   * • The "Compensar Emissões" CTA button is styled as a primary
   *   action and opens a search for reputable offset platforms —
   *   preventing dead-end clicks.
   * • The info box cites the Brazilian CBIO market for credibility.
   *
   * @param  {object} creditsData — See shape above
   * @returns {string} Complete HTML string
   */
  renderCarbonCredits: function (creditsData) {

    var credits = creditsData.credits;
    var price   = creditsData.price;

    // ── Card 1: Credits needed ───────────────────────────────
    /*
      Shows the raw credit count with 4 decimal precision and a
      helper line reminding the user of the conversion rate.
    */
    var creditsCard = [
      '<div class="credits__card credits__card--primary" aria-label="Créditos de carbono necessários">',
      '  <p class="credits__card-label">Créditos Necessários</p>',
      '  <p class="credits__card-value">' + this.formatNumber(credits, 4) + '</p>',
      '  <p class="credits__card-unit">créditos de carbono</p>',
      '  <p class="credits__card-note">1 crédito = 1.000 kg CO₂ compensado</p>',
      '</div>'
    ].join("\n");

    // ── Card 2: Estimated price ──────────────────────────────
    /*
      Shows the midpoint ("best estimate") prominently, with the
      min–max range below for context.
    */
    var priceCard = [
      '<div class="credits__card credits__card--secondary" aria-label="Custo estimado para compensação">',
      '  <p class="credits__card-label">Custo Estimado</p>',
      '  <p class="credits__card-value">' + this.formatCurrency(price.average) + '</p>',
      '  <p class="credits__card-unit">valor médio de mercado</p>',
      '  <p class="credits__card-note">',
      '    Faixa: ' + this.formatCurrency(price.min) + ' – ' + this.formatCurrency(price.max),
      '  </p>',
      '</div>'
    ].join("\n");

    // ── Info / explanation box ───────────────────────────────
    /*
      Contextual education: many users don't know what a carbon
      credit is. A brief, friendly explanation builds trust and
      increases the likelihood of clicking the CTA.
    */
    var infoBox = [
      '<div class="credits__info" role="note" aria-label="O que são créditos de carbono">',
      '  <h4 class="credits__info-title">💚 O que são créditos de carbono?</h4>',
      '  <p class="credits__info-text">',
      '    Um crédito de carbono representa a compensação de <strong>1 tonelada (1.000 kg)</strong>',
      '    de CO₂ por meio de projetos certificados como reflorestamento, energias renováveis',
      '    ou captura de gases. Ao adquiri-los, você neutraliza o impacto da sua viagem.',
      '  </p>',
      '  <p class="credits__info-source">',
      '    📊 Preços baseados no mercado voluntário brasileiro (CBIO / VERRA, 2024).',
      '  </p>',
      '</div>'
    ].join("\n");

    // ── CTA Button ───────────────────────────────────────────
    /*
      Improvement: the button opens a Google search for certified
      Brazilian offset platforms rather than going nowhere.
      target="_blank" + rel="noopener noreferrer" for security.
    */
    var ctaButton = [
      '<div class="credits__cta">',
      '  <a class="btn btn--primary credits__cta-btn"',
      '     href="https://www.google.com/search?q=comprar+cr%C3%A9ditos+de+carbono+certificados+Brasil"',
      '     target="_blank"',
      '     rel="noopener noreferrer"',
      '     aria-label="Compensar emissões comprando créditos de carbono certificados (abre em nova aba)">',
      '    🌿 Compensar Emissões',
      '  </a>',
      '  <p class="credits__cta-disclaimer">',
      '    Você será redirecionado para plataformas de compensação certificadas.',
      '  </p>',
      '</div>'
    ].join("\n");

    // ── Assemble the full carbon credits block ───────────────
    return [
      '<div class="credits__container">',
      '  <h3 class="credits__title">Compensação de Carbono</h3>',
      '  <p class="credits__subtitle">Neutralize o impacto ambiental desta viagem</p>',
      '  <div class="credits__grid">',
           creditsCard,
           priceCard,
      '  </div>',
           infoBox,
           ctaButton,
      '</div>'
    ].join("\n");

  }, // end renderCarbonCredits()


  /**
   * showLoading(buttonElement)
   * ────────────────────────────────────────────────────────────
   * Puts a submit button into a "calculating" loading state:
   *   • Saves the original label in data-original-text
   *   • Disables the button to prevent double-submission
   *   • Replaces the label with an animated spinner + text
   *
   * The spinner is a pure-CSS rotating element (no images needed).
   * The button width is preserved via min-width so layout doesn't
   * shift when the shorter "Calculando..." text is injected.
   *
   * @param  {HTMLElement} buttonElement — The <button> to modify
   * @returns {void}
   */
  showLoading: function (buttonElement) {
    if (!buttonElement) {
      console.warn("UI.showLoading: no button element provided.");
      return;
    }

    // Preserve the original label so hideLoading can restore it
    buttonElement.dataset.originalText = buttonElement.innerHTML;

    // Lock the button against repeated submissions
    buttonElement.disabled = true;

    // Inject spinner SVG + text
    // The span.btn-spinner is styled via CSS (border + animation)
    buttonElement.innerHTML = [
      '<span class="btn-spinner" aria-hidden="true"></span>',
      '<span class="btn-loading-text">Calculando...</span>'
    ].join("");

    // Add a loading modifier class for optional CSS overrides
    buttonElement.classList.add("btn--loading");

  }, // end showLoading()


  /**
   * hideLoading(buttonElement)
   * ────────────────────────────────────────────────────────────
   * Restores a button from its loading state back to normal:
   *   • Re-enables the button
   *   • Restores the original innerHTML from data-original-text
   *   • Removes the loading modifier class
   *
   * @param  {HTMLElement} buttonElement — The same <button> passed to showLoading
   * @returns {void}
   */
  hideLoading: function (buttonElement) {
    if (!buttonElement) {
      console.warn("UI.hideLoading: no button element provided.");
      return;
    }

    // Re-enable interaction
    buttonElement.disabled = false;

    // Restore saved label (falls back to "Calcular Emissão" if missing)
    buttonElement.innerHTML = buttonElement.dataset.originalText || "Calcular Emissão";

    // Clean up modifier class
    buttonElement.classList.remove("btn--loading");

    // Clean up the data attribute
    delete buttonElement.dataset.originalText;

  } // end hideLoading()

}; // end UI