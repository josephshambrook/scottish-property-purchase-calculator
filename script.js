// Default values
const DEFAULT_VALUES = {
  homeReportValue: 250000,
  bidAmount: 265000,
  buyingSolicitorFeesUpfront: 500,
  buyingSolicitorFeesAtSale: 1500,
  expectedSaleValue: 180000,
  existingMortgage: 120000,
  sellingSolicitorFees: 1500,
  cashAvailable: 20000,
  interestRate: 4.5,
  mortgageTerm: 25,
};

const STORAGE_KEY = 'scottishPropertyCalculator';
const THEME_STORAGE_KEY = 'scottishPropertyCalculator_theme';

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
  return parseFloat(getElement(id).value) || 0;
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

// Load values from localStorage or use defaults
function loadValues() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved data:', e);
      return DEFAULT_VALUES;
    }
  }
  return DEFAULT_VALUES;
}

// Save values to localStorage
function saveValues() {
  const values = {
    homeReportValue: getInputValue('js-homeReportValue'),
    bidAmount: getInputValue('js-bidAmount'),
    buyingSolicitorFeesUpfront: getInputValue('js-buyingSolicitorFeesUpfront'),
    buyingSolicitorFeesAtSale: getInputValue('js-buyingSolicitorFeesAtSale'),
    expectedSaleValue: getInputValue('js-expectedSaleValue'),
    existingMortgage: getInputValue('js-existingMortgage'),
    sellingSolicitorFees: getInputValue('js-sellingSolicitorFees'),
    cashAvailable: getInputValue('js-cashAvailable'),
    interestRate: getInputValue('js-interestRate'),
    mortgageTerm: getInputValue('js-mortgageTerm'),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
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
  localStorage.removeItem(STORAGE_KEY);
  populateForm(DEFAULT_VALUES);
  calculateAll();
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
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    getElement('js-themeIcon').textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    getElement('js-themeIcon').textContent = '🌙';
  }

  // Only save to localStorage if explicitly requested (e.g., user clicked toggle)
  if (savePreference) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
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
  const sellingSolicitorFees = getInputValue('js-sellingSolicitorFees');
  const cashAvailable = getInputValue('js-cashAvailable');
  const interestRate = getInputValue('js-interestRate');
  const mortgageTerm = getInputValue('js-mortgageTerm');

  // 1. Calculate overbid
  const overbidAmount = bidAmount - homeReportValue;

  // 2. Calculate LBTT (paid at purchase completion)
  const lbtt = calculateLBTT(bidAmount);

  // 3. Calculate cash used before purchase (overbid + upfront fees)
  const cashUsedBeforePurchase =
    Math.max(0, overbidAmount) + buyingSolicitorFeesUpfront;

  // 4. Calculate equity from old house sale (after selling costs)
  const equityFromSale =
    expectedSaleValue - existingMortgage - sellingSolicitorFees;

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

  // 10. Calculate remaining cash after purchase (should be 0 if using all available)
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
      `${formatCurrency(Math.max(0, overbidAmount))} (overbid) + ${formatCurrency(buyingSolicitorFeesUpfront)} (upfront fees)`
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
      `${formatCurrency(expectedSaleValue)} (sale value) - ${formatCurrency(existingMortgage)} (mortgage) - ${formatCurrency(sellingSolicitorFees)} (selling fees)`
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
  });

  // Save values after calculation
  saveValues();
}

// Initialize the calculator
function init() {
  // Load and apply saved theme
  const savedTheme = loadTheme();
  applyTheme(savedTheme);

  // Listen for system theme changes (only if user hasn't set a preference)
  if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      // Only apply system preference if user hasn't manually set a theme
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light', false);
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

  // Initial calculation
  calculateAll();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
