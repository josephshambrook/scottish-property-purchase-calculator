// Default values
const DEFAULT_VALUES = {
  homeReportValue: 250000,
  bidAmount: 265000,
  buyingSolicitorFeesUpfront: 500,
  buyingSolicitorFeesAtSale: 1500,
  expectedSaleValue: 180000,
  existingMortgage: 120000,
  sellingSolicitorFeesUpfront: 500,
  sellingSolicitorFeesAtSale: 1500,
  cashAvailable: 20000,
  interestRate: 4.5,
  mortgageTerm: 25,
};

const STORAGE_KEY = 'scottishPropertyCalculator';
const THEME_STORAGE_KEY = 'scottishPropertyCalculator_theme';

// Map full property names to short URL parameter names
const PARAM_MAP = {
  homeReportValue: 'hrv',
  bidAmount: 'bid',
  buyingSolicitorFeesUpfront: 'bsfu',
  buyingSolicitorFeesAtSale: 'bsfs',
  expectedSaleValue: 'esv',
  existingMortgage: 'em',
  sellingSolicitorFeesUpfront: 'ssfu',
  sellingSolicitorFeesAtSale: 'ssfs',
  cashAvailable: 'cash',
  interestRate: 'ir',
  mortgageTerm: 'mt',
};

// Reverse map for reading URL parameters
const REVERSE_PARAM_MAP = Object.fromEntries(
  Object.entries(PARAM_MAP).map(([key, value]) => [value, key])
);

// Cache DOM elements
const DOM_ELEMENTS = {};

// Helper function to format currency (optimized with Intl.NumberFormat)
const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

// Helper function to get or cache DOM element
function getElement(id) {
  if (!DOM_ELEMENTS[id]) {
    DOM_ELEMENTS[id] = document.getElementById(id);
  }
  return DOM_ELEMENTS[id];
}

// Helper function to get input value
function getInputValue(id) {
  const element = getElement(id);
  if (!element) {
    console.warn(`Element with id "${id}" not found`);
    return 0;
  }
  return parseFloat(element.value) || 0;
}

// Helper function to set output value
function setOutput(id, value, description) {
  getElement(id).textContent = value;
  if (description) {
    getElement(`${id}Desc`).textContent = description;
  }
}

// Helper function to calculate LBTT
function calculateLBTT(bidAmount) {
  const bands = [
    { threshold: 145000, rate: 0 },
    { threshold: 250000, rate: 0.02 },
    { threshold: 325000, rate: 0.05 },
    { threshold: 750000, rate: 0.1 },
    { threshold: Infinity, rate: 0.12 },
  ];

  let lbtt = 0;
  let remainingAmount = bidAmount;
  let previousThreshold = 0;

  for (const band of bands) {
    if (remainingAmount <= 0) break;

    const taxableInBand = Math.min(
      remainingAmount,
      band.threshold - previousThreshold
    );

    lbtt += taxableInBand * band.rate;
    remainingAmount -= taxableInBand;
    previousThreshold = band.threshold;
  }

  return lbtt;
}

// Helper function to calculate monthly mortgage payment
function calculateMonthlyPayment(principal, annualRate, years) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  const numberOfPayments = years * 12;

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return monthlyPayment;
}

// Load values from query string, localStorage (for migration), or use defaults
function loadValues() {
  const params = new URLSearchParams(window.location.search);
  const values = {};
  let hasQueryParams = false;

  // Try to read from query string first
  for (const [shortName, fullName] of Object.entries(REVERSE_PARAM_MAP)) {
    if (params.has(shortName)) {
      hasQueryParams = true;
      const value = parseFloat(params.get(shortName));
      if (!isNaN(value)) {
        values[fullName] = value;
      }
    }
  }

  // If we have query params, use them (merged with defaults)
  if (hasQueryParams) {
    return { ...DEFAULT_VALUES, ...values };
  }

  // Otherwise, check localStorage for migration
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);

      // Migrate old data format: split sellingSolicitorFees into upfront and at-sale
      if (
        parsed.sellingSolicitorFees !== undefined &&
        parsed.sellingSolicitorFeesUpfront === undefined
      ) {
        parsed.sellingSolicitorFeesUpfront = 500;
        parsed.sellingSolicitorFeesAtSale = parsed.sellingSolicitorFees;
        delete parsed.sellingSolicitorFees;
      }

      // Ensure all default values exist
      return { ...DEFAULT_VALUES, ...parsed };
    } catch (e) {
      console.error('Error parsing saved data:', e);
      return DEFAULT_VALUES;
    }
  }

  return DEFAULT_VALUES;
}

// Save values to query string
function saveValues() {
  const values = {
    homeReportValue: getInputValue('js-homeReportValue'),
    bidAmount: getInputValue('js-bidAmount'),
    buyingSolicitorFeesUpfront: getInputValue('js-buyingSolicitorFeesUpfront'),
    buyingSolicitorFeesAtSale: getInputValue('js-buyingSolicitorFeesAtSale'),
    expectedSaleValue: getInputValue('js-expectedSaleValue'),
    existingMortgage: getInputValue('js-existingMortgage'),
    sellingSolicitorFeesUpfront: getInputValue(
      'js-sellingSolicitorFeesUpfront'
    ),
    sellingSolicitorFeesAtSale: getInputValue('js-sellingSolicitorFeesAtSale'),
    cashAvailable: getInputValue('js-cashAvailable'),
    interestRate: getInputValue('js-interestRate'),
    mortgageTerm: getInputValue('js-mortgageTerm'),
  };

  // Build query string with short parameter names
  const params = new URLSearchParams();
  for (const [fullName, value] of Object.entries(values)) {
    const shortName = PARAM_MAP[fullName];
    if (shortName && value !== DEFAULT_VALUES[fullName]) {
      // Only include values that differ from defaults to keep URL shorter
      params.set(shortName, value);
    }
  }

  // Update URL without reloading the page or adding to history
  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

// Populate form with values
function populateForm(values) {
  Object.entries(values).forEach(([key, value]) => {
    const element = getElement(`js-${key}`);
    if (element) {
      element.value = value;
    }
  });
}

// Reset to default values
function resetToDefaults() {
  // Clear query string
  window.history.replaceState({}, '', window.location.pathname);
  populateForm(DEFAULT_VALUES);
  calculateAll();
}

// Migrate data from localStorage to query string (one-time migration)
function migrateFromLocalStorage() {
  const params = new URLSearchParams(window.location.search);

  // Only migrate if there are no query params but localStorage has data
  if (params.toString() === '') {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        // Migrate old data format: split sellingSolicitorFees into upfront and at-sale
        if (
          parsed.sellingSolicitorFees !== undefined &&
          parsed.sellingSolicitorFeesUpfront === undefined
        ) {
          parsed.sellingSolicitorFeesUpfront = 500;
          parsed.sellingSolicitorFeesAtSale = parsed.sellingSolicitorFees;
          delete parsed.sellingSolicitorFees;
        }

        // Build query string from localStorage data
        const migrationParams = new URLSearchParams();
        for (const [fullName, value] of Object.entries(parsed)) {
          const shortName = PARAM_MAP[fullName];
          if (shortName && value !== DEFAULT_VALUES[fullName]) {
            // Only include values that differ from defaults
            migrationParams.set(shortName, value);
          }
        }

        // Update URL with migrated data
        if (migrationParams.toString()) {
          const newUrl = `${window.location.pathname}?${migrationParams.toString()}`;
          window.history.replaceState({}, '', newUrl);
        }

        // Clear localStorage after successful migration
        localStorage.removeItem(STORAGE_KEY);
        console.log('Migrated data from localStorage to query string');
      } catch (e) {
        console.error('Error during migration:', e);
      }
    }
  }
}

// Dark mode functions
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  // If user has a saved preference, use that
  if (savedTheme) {
    return savedTheme;
  }

  // Otherwise, detect browser/system preference
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  // Default to light theme
  return 'light';
}

function applyTheme(theme, savePreference = false) {
  let effectiveTheme = theme;

  // If theme is 'auto', determine the effective theme from system preference
  if (theme === 'auto') {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      effectiveTheme = 'dark';
    } else {
      effectiveTheme = 'light';
    }
  }

  // Apply the effective theme
  if (effectiveTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  // Update icon based on the selected mode (not effective theme)
  if (theme === 'auto') {
    getElement('js-themeIcon').textContent = '🌓';
  } else if (theme === 'dark') {
    getElement('js-themeIcon').textContent = '🌙';
  } else {
    getElement('js-themeIcon').textContent = '☀️';
  }

  // Only save to localStorage if explicitly requested (e.g., user clicked toggle)
  if (savePreference) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

function toggleTheme() {
  // Get the current saved theme preference (not the effective theme)
  const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';

  // Cycle through: light -> dark -> auto -> light
  let newTheme;
  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'auto';
  } else {
    newTheme = 'light';
  }

  // Save preference when user manually toggles
  applyTheme(newTheme, true);
}

// Main calculation function
function calculateAll() {
  // Get all input values (optimized with helper function)
  const homeReportValue = getInputValue('js-homeReportValue');
  const bidAmount = getInputValue('js-bidAmount');
  const buyingSolicitorFeesUpfront = getInputValue(
    'js-buyingSolicitorFeesUpfront'
  );
  const buyingSolicitorFeesAtSale = getInputValue(
    'js-buyingSolicitorFeesAtSale'
  );
  const expectedSaleValue = getInputValue('js-expectedSaleValue');
  const existingMortgage = getInputValue('js-existingMortgage');
  const sellingSolicitorFeesUpfront = getInputValue(
    'js-sellingSolicitorFeesUpfront'
  );
  const sellingSolicitorFeesAtSale = getInputValue(
    'js-sellingSolicitorFeesAtSale'
  );
  const cashAvailable = getInputValue('js-cashAvailable');
  const interestRate = getInputValue('js-interestRate');
  const mortgageTerm = getInputValue('js-mortgageTerm');

  // 1. Calculate overbid
  const overbidAmount = bidAmount - homeReportValue;

  // 2. Calculate LBTT (paid at purchase completion)
  const lbtt = calculateLBTT(bidAmount);

  // 3. Calculate cash used before purchase (overbid + all upfront fees)
  const cashUsedBeforePurchase =
    Math.max(0, overbidAmount) +
    buyingSolicitorFeesUpfront +
    sellingSolicitorFeesUpfront;

  // 4. Calculate equity from old house sale (after selling costs at sale)
  const equityFromSale =
    expectedSaleValue - existingMortgage - sellingSolicitorFeesAtSale;

  // 5. Calculate total funds available after sale
  const totalFundsAfterSale = cashAvailable + equityFromSale;

  // 6. Calculate available for deposit (use all remaining funds after costs)
  const availableForDeposit =
    totalFundsAfterSale -
    cashUsedBeforePurchase -
    lbtt -
    buyingSolicitorFeesAtSale;

  // 7. Calculate deposit and mortgage
  const requiredDeposit = Math.max(0, availableForDeposit);
  const mortgageAmount = homeReportValue - requiredDeposit;

  // 8. Calculate monthly payment
  const monthlyPayment = calculateMonthlyPayment(
    mortgageAmount,
    interestRate,
    mortgageTerm
  );

  // 9. Calculate LTV
  const ltvPercentage =
    homeReportValue > 0 ? (mortgageAmount / homeReportValue) * 100 : 0;

  // 10. Calculate overbid percentage
  const overbidPercentage =
    homeReportValue > 0
      ? ((bidAmount - homeReportValue) / homeReportValue) * 100
      : 0;

  // 11. Calculate remaining cash after purchase (should be 0 if using all available)
  const remainingCash =
    totalFundsAfterSale -
    cashUsedBeforePurchase -
    requiredDeposit -
    lbtt -
    buyingSolicitorFeesAtSale;

  // Batch DOM updates using requestAnimationFrame to minimize reflows
  requestAnimationFrame(() => {
    setOutput(
      'js-monthlyPayment',
      formatCurrency(monthlyPayment),
      `Based on mortgage of ${formatCurrency(mortgageAmount)} at ${interestRate}% over ${mortgageTerm} years`
    );

    setOutput(
      'js-overbidAmount',
      formatCurrency(Math.max(0, overbidAmount)),
      `${formatCurrency(bidAmount)} (bid) - ${formatCurrency(homeReportValue)} (home report)`
    );

    setOutput(
      'js-cashUsedBeforePurchase',
      formatCurrency(cashUsedBeforePurchase),
      `${formatCurrency(Math.max(0, overbidAmount))} (overbid) + ${formatCurrency(buyingSolicitorFeesUpfront)} (buying fees upfront) + ${formatCurrency(sellingSolicitorFeesUpfront)} (selling fees upfront)`
    );

    setOutput(
      'js-mortgageAmount',
      formatCurrency(mortgageAmount),
      `${formatCurrency(homeReportValue)} (home report) - ${formatCurrency(requiredDeposit)} (deposit)`
    );

    setOutput(
      'js-lbtt',
      formatCurrency(lbtt),
      `Calculated on ${formatCurrency(bidAmount)} using Scottish LBTT bands`
    );

    setOutput(
      'js-equityFromSale',
      formatCurrency(equityFromSale),
      `${formatCurrency(expectedSaleValue)} (sale value) - ${formatCurrency(existingMortgage)} (mortgage) - ${formatCurrency(sellingSolicitorFeesAtSale)} (selling fees at sale)`
    );

    setOutput(
      'js-totalFundsAfterSale',
      formatCurrency(totalFundsAfterSale),
      `${formatCurrency(cashAvailable)} (cash) + ${formatCurrency(equityFromSale)} (equity from sale)`
    );

    setOutput(
      'js-requiredDeposit',
      formatCurrency(requiredDeposit),
      `${formatCurrency(totalFundsAfterSale)} (funds) - ${formatCurrency(cashUsedBeforePurchase)} (used before) - ${formatCurrency(lbtt)} (LBTT) - ${formatCurrency(buyingSolicitorFeesAtSale)} (fees)`
    );

    setOutput(
      'js-ltvPercentage',
      `${ltvPercentage.toFixed(2)}%`,
      `${formatCurrency(mortgageAmount)} (mortgage) ÷ ${formatCurrency(homeReportValue)} (home report) × 100`
    );

    setOutput(
      'js-overbidPercentage',
      `${overbidPercentage.toFixed(2)}%`,
      `${formatCurrency(bidAmount)} (bid) - ${formatCurrency(homeReportValue)} (home report) ÷ ${formatCurrency(homeReportValue)} (home report) × 100`
    );
  });

  // Save values after calculation
  saveValues();
}

// Copy current URL to clipboard
function copyUrlToClipboard() {
  const url = window.location.href;
  const button = getElement('js-copyUrlButton');
  const iconElement = getElement('js-copyUrlIcon');
  const textElement = getElement('js-copyUrlText');

  // Use the modern Clipboard API
  navigator.clipboard
    .writeText(url)
    .then(() => {
      // Show success feedback
      button.classList.add('copied');
      button.setAttribute('aria-label', 'URL copied to clipboard successfully');
      iconElement.textContent = '✓';
      textElement.textContent = 'URL Copied!';

      // Reset button after 2 seconds
      setTimeout(() => {
        button.classList.remove('copied');
        button.setAttribute(
          'aria-label',
          'Copy current URL with all settings to clipboard for sharing'
        );
        iconElement.textContent = '🔗';
        textElement.textContent = 'Copy URL to Share';
      }, 2000);
    })
    .catch((err) => {
      console.error('Failed to copy URL:', err);
      // Fallback feedback
      button.setAttribute('aria-label', 'Failed to copy URL to clipboard');
      textElement.textContent = 'Failed to copy';
      setTimeout(() => {
        button.setAttribute(
          'aria-label',
          'Copy current URL with all settings to clipboard for sharing'
        );
        textElement.textContent = 'Copy URL to Share';
      }, 2000);
    });
}

// Initialize the calculator
function init() {
  // Migrate data from localStorage to query string if needed
  migrateFromLocalStorage();

  // Load and apply saved theme
  const savedTheme = loadTheme();
  applyTheme(savedTheme);

  // Listen for system theme changes
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // Only apply system preference if user has 'auto' mode or hasn't set a preference
      if (!savedTheme || savedTheme === 'auto') {
        applyTheme(savedTheme || 'auto', false);
      }
    };

    // Use both addEventListener (modern) and addListener (older browsers)
    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener('change', handleThemeChange);
    } else if (darkModeQuery.addListener) {
      darkModeQuery.addListener(handleThemeChange);
    }
  }

  // Load saved values or defaults
  const values = loadValues();
  populateForm(values);

  // Use event delegation for input listeners (more efficient)
  document.body.addEventListener('input', (event) => {
    if (event.target.tagName === 'INPUT') {
      calculateAll();
    }
  });

  // Add theme toggle button listener
  getElement('js-themeToggle').addEventListener('click', toggleTheme);

  // Add reset button listener
  getElement('js-resetButton').addEventListener('click', resetToDefaults);

  // Add copy URL button listener
  getElement('js-copyUrlButton').addEventListener('click', copyUrlToClipboard);

  // Initial calculation
  calculateAll();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
