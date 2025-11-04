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

// Helper function to format currency
function formatCurrency(value) {
  return `£${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
    homeReportValue:
      parseFloat(document.getElementById('js-homeReportValue').value) || 0,
    bidAmount: parseFloat(document.getElementById('js-bidAmount').value) || 0,
    buyingSolicitorFeesUpfront:
      parseFloat(
        document.getElementById('js-buyingSolicitorFeesUpfront').value
      ) || 0,
    buyingSolicitorFeesAtSale:
      parseFloat(
        document.getElementById('js-buyingSolicitorFeesAtSale').value
      ) || 0,
    expectedSaleValue:
      parseFloat(document.getElementById('js-expectedSaleValue').value) || 0,
    existingMortgage:
      parseFloat(document.getElementById('js-existingMortgage').value) || 0,
    sellingSolicitorFees:
      parseFloat(document.getElementById('js-sellingSolicitorFees').value) || 0,
    cashAvailable:
      parseFloat(document.getElementById('js-cashAvailable').value) || 0,
    interestRate:
      parseFloat(document.getElementById('js-interestRate').value) || 0,
    mortgageTerm:
      parseFloat(document.getElementById('js-mortgageTerm').value) || 0,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

// Populate form with values
function populateForm(values) {
  document.getElementById('js-homeReportValue').value = values.homeReportValue;
  document.getElementById('js-bidAmount').value = values.bidAmount;
  document.getElementById('js-buyingSolicitorFeesUpfront').value =
    values.buyingSolicitorFeesUpfront;
  document.getElementById('js-buyingSolicitorFeesAtSale').value =
    values.buyingSolicitorFeesAtSale;
  document.getElementById('js-expectedSaleValue').value =
    values.expectedSaleValue;
  document.getElementById('js-existingMortgage').value =
    values.existingMortgage;
  document.getElementById('js-sellingSolicitorFees').value =
    values.sellingSolicitorFees;
  document.getElementById('js-cashAvailable').value = values.cashAvailable;
  document.getElementById('js-interestRate').value = values.interestRate;
  document.getElementById('js-mortgageTerm').value = values.mortgageTerm;
}

// Reset to default values
function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEY);
  populateForm(DEFAULT_VALUES);
  calculateAll();
}

// Main calculation function
function calculateAll() {
  // Get all input values
  const homeReportValue =
    parseFloat(document.getElementById('js-homeReportValue').value) || 0;
  const bidAmount =
    parseFloat(document.getElementById('js-bidAmount').value) || 0;
  const buyingSolicitorFeesUpfront =
    parseFloat(
      document.getElementById('js-buyingSolicitorFeesUpfront').value
    ) || 0;
  const buyingSolicitorFeesAtSale =
    parseFloat(document.getElementById('js-buyingSolicitorFeesAtSale').value) ||
    0;
  const expectedSaleValue =
    parseFloat(document.getElementById('js-expectedSaleValue').value) || 0;
  const existingMortgage =
    parseFloat(document.getElementById('js-existingMortgage').value) || 0;
  const sellingSolicitorFees =
    parseFloat(document.getElementById('js-sellingSolicitorFees').value) || 0;
  const cashAvailable =
    parseFloat(document.getElementById('js-cashAvailable').value) || 0;
  const interestRate =
    parseFloat(document.getElementById('js-interestRate').value) || 0;
  const mortgageTerm =
    parseFloat(document.getElementById('js-mortgageTerm').value) || 0;

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

  // Update all output fields
  document.getElementById('js-monthlyPayment').textContent =
    formatCurrency(monthlyPayment);
  document.getElementById('js-monthlyPaymentDesc').textContent =
    `Based on mortgage of ${formatCurrency(mortgageAmount)} at ${interestRate}% over ${mortgageTerm} years`;

  document.getElementById('js-overbidAmount').textContent = formatCurrency(
    Math.max(0, overbidAmount)
  );
  document.getElementById('js-overbidAmountDesc').textContent =
    `${formatCurrency(bidAmount)} (bid) - ${formatCurrency(homeReportValue)} (home report)`;

  document.getElementById('js-cashUsedBeforePurchase').textContent =
    formatCurrency(cashUsedBeforePurchase);
  document.getElementById('js-cashUsedBeforePurchaseDesc').textContent =
    `${formatCurrency(Math.max(0, overbidAmount))} (overbid) + ${formatCurrency(buyingSolicitorFeesUpfront)} (upfront fees)`;

  document.getElementById('js-mortgageAmount').textContent =
    formatCurrency(mortgageAmount);
  document.getElementById('js-mortgageAmountDesc').textContent =
    `${formatCurrency(homeReportValue)} (home report) - ${formatCurrency(requiredDeposit)} (deposit)`;

  document.getElementById('js-lbtt').textContent = formatCurrency(lbtt);
  document.getElementById('js-lbttDesc').textContent =
    `Calculated on ${formatCurrency(bidAmount)} using Scottish LBTT bands`;

  document.getElementById('js-equityFromSale').textContent =
    formatCurrency(equityFromSale);
  document.getElementById('js-equityFromSaleDesc').textContent =
    `${formatCurrency(expectedSaleValue)} (sale value) - ${formatCurrency(existingMortgage)} (mortgage) - ${formatCurrency(sellingSolicitorFees)} (selling fees)`;

  document.getElementById('js-totalFundsAfterSale').textContent =
    formatCurrency(totalFundsAfterSale);
  document.getElementById('js-totalFundsAfterSaleDesc').textContent =
    `${formatCurrency(cashAvailable)} (cash) + ${formatCurrency(equityFromSale)} (equity from sale)`;

  document.getElementById('js-requiredDeposit').textContent =
    formatCurrency(requiredDeposit);
  document.getElementById('js-requiredDepositDesc').textContent =
    `${formatCurrency(totalFundsAfterSale)} (funds) - ${formatCurrency(cashUsedBeforePurchase)} (used before) - ${formatCurrency(lbtt)} (LBTT) - ${formatCurrency(buyingSolicitorFeesAtSale)} (fees)`;

  document.getElementById('js-ltvPercentage').textContent =
    `${ltvPercentage.toFixed(2)}%`;
  document.getElementById('js-ltvPercentageDesc').textContent =
    `${formatCurrency(mortgageAmount)} (mortgage) ÷ ${formatCurrency(homeReportValue)} (home report) × 100`;

  // Save values after calculation
  saveValues();
}

// Initialize the calculator
function init() {
  // Load saved values or defaults
  const values = loadValues();
  populateForm(values);

  // Add event listeners to all inputs
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('input', calculateAll);
  });

  // Add reset button listener
  document
    .getElementById('js-resetButton')
    .addEventListener('click', resetToDefaults);

  // Initial calculation
  calculateAll();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
