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
    depositPercentage: 20,
    adsApplicable: false
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
        { threshold: 750000, rate: 0.10 },
        { threshold: Infinity, rate: 0.12 }
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

    const monthlyPayment = principal *
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
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
        homeReportValue: parseFloat(document.getElementById('js-homeReportValue').value) || 0,
        bidAmount: parseFloat(document.getElementById('js-bidAmount').value) || 0,
        buyingSolicitorFeesUpfront: parseFloat(document.getElementById('js-buyingSolicitorFeesUpfront').value) || 0,
        buyingSolicitorFeesAtSale: parseFloat(document.getElementById('js-buyingSolicitorFeesAtSale').value) || 0,
        expectedSaleValue: parseFloat(document.getElementById('js-expectedSaleValue').value) || 0,
        existingMortgage: parseFloat(document.getElementById('js-existingMortgage').value) || 0,
        sellingSolicitorFees: parseFloat(document.getElementById('js-sellingSolicitorFees').value) || 0,
        cashAvailable: parseFloat(document.getElementById('js-cashAvailable').value) || 0,
        interestRate: parseFloat(document.getElementById('js-interestRate').value) || 0,
        mortgageTerm: parseFloat(document.getElementById('js-mortgageTerm').value) || 0,
        depositPercentage: parseFloat(document.getElementById('js-depositPercentage').value) || 0,
        adsApplicable: document.getElementById('js-adsApplicable').checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

// Populate form with values
function populateForm(values) {
    document.getElementById('js-homeReportValue').value = values.homeReportValue;
    document.getElementById('js-bidAmount').value = values.bidAmount;
    document.getElementById('js-buyingSolicitorFeesUpfront').value = values.buyingSolicitorFeesUpfront;
    document.getElementById('js-buyingSolicitorFeesAtSale').value = values.buyingSolicitorFeesAtSale;
    document.getElementById('js-expectedSaleValue').value = values.expectedSaleValue;
    document.getElementById('js-existingMortgage').value = values.existingMortgage;
    document.getElementById('js-sellingSolicitorFees').value = values.sellingSolicitorFees;
    document.getElementById('js-cashAvailable').value = values.cashAvailable;
    document.getElementById('js-interestRate').value = values.interestRate;
    document.getElementById('js-mortgageTerm').value = values.mortgageTerm;
    document.getElementById('js-depositPercentage').value = values.depositPercentage;
    document.getElementById('js-adsApplicable').checked = values.adsApplicable;
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
    const homeReportValue = parseFloat(document.getElementById('js-homeReportValue').value) || 0;
    const bidAmount = parseFloat(document.getElementById('js-bidAmount').value) || 0;
    const buyingSolicitorFeesUpfront = parseFloat(document.getElementById('js-buyingSolicitorFeesUpfront').value) || 0;
    const buyingSolicitorFeesAtSale = parseFloat(document.getElementById('js-buyingSolicitorFeesAtSale').value) || 0;
    const expectedSaleValue = parseFloat(document.getElementById('js-expectedSaleValue').value) || 0;
    const existingMortgage = parseFloat(document.getElementById('js-existingMortgage').value) || 0;
    const sellingSolicitorFees = parseFloat(document.getElementById('js-sellingSolicitorFees').value) || 0;
    const cashAvailable = parseFloat(document.getElementById('js-cashAvailable').value) || 0;
    const interestRate = parseFloat(document.getElementById('js-interestRate').value) || 0;
    const mortgageTerm = parseFloat(document.getElementById('js-mortgageTerm').value) || 0;
    const depositPercentage = parseFloat(document.getElementById('js-depositPercentage').value) || 0;
    const adsApplicable = document.getElementById('js-adsApplicable').checked;

    // Update ADS label
    document.getElementById('js-adsLabel').textContent = adsApplicable
        ? 'Applicable (Buying Before Selling)'
        : 'Not Applicable (Buying After Selling)';

    // 1. Calculate overbid
    const overbidAmount = bidAmount - homeReportValue;

    // 2. Calculate LBTT (paid at purchase completion)
    const standardLbtt = calculateLBTT(bidAmount);
    const adsAmount = adsApplicable ? bidAmount * 0.06 : 0;
    const totalLbtt = standardLbtt + adsAmount;

    // 3. Calculate mortgage and deposit (based on home report value)
    const requiredDeposit = homeReportValue * (depositPercentage / 100);
    const mortgageAmount = homeReportValue - requiredDeposit;

    // 4. Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(mortgageAmount, interestRate, mortgageTerm);

    // 5. Calculate total needed at purchase completion
    const cashNeededAtPurchase = requiredDeposit + overbidAmount + totalLbtt + buyingSolicitorFeesAtSale;

    // 6. Calculate total upfront costs (before completion)
    const upfrontCosts = buyingSolicitorFeesUpfront;

    // 7. Calculate equity from old house sale (after selling costs)
    const equityFromSale = expectedSaleValue - existingMortgage - sellingSolicitorFees;

    // 8. Calculate total funds available after sale
    const totalFundsAfterSale = cashAvailable + equityFromSale;

    // 9. Calculate cash shortfall if buying before selling (ADS scenario)
    const cashShortfall = cashNeededAtPurchase + upfrontCosts - cashAvailable;

    // 10. Calculate final remaining cash after purchase
    const remainingCash = totalFundsAfterSale - cashNeededAtPurchase - upfrontCosts;

    // 11. Calculate LTV
    const ltvPercentage = homeReportValue > 0 ? (mortgageAmount / homeReportValue) * 100 : 0;

    // Update all output fields
    document.getElementById('js-monthlyPayment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('js-monthlyPaymentDesc').textContent = `Based on mortgage of ${formatCurrency(mortgageAmount)} at ${interestRate}% over ${mortgageTerm} years`;

    document.getElementById('js-overbidAmount').textContent = formatCurrency(Math.max(0, overbidAmount));
    document.getElementById('js-overbidAmountDesc').textContent = `${formatCurrency(bidAmount)} (bid) - ${formatCurrency(homeReportValue)} (home report)`;

    document.getElementById('js-cashNeededAtPurchase').textContent = formatCurrency(cashNeededAtPurchase);
    document.getElementById('js-cashNeededAtPurchaseDesc').textContent = `${formatCurrency(requiredDeposit)} (deposit) + ${formatCurrency(Math.max(0, overbidAmount))} (overbid) + ${formatCurrency(totalLbtt)} (LBTT) + ${formatCurrency(buyingSolicitorFeesAtSale)} (buying fees) + ${formatCurrency(upfrontCosts)} (upfront)`;

    const cashShortfallElement = document.getElementById('js-cashShortfall');
    cashShortfallElement.textContent = formatCurrency(Math.max(0, cashShortfall));
    cashShortfallElement.classList.remove('positive', 'negative');
    if (cashShortfall > 0) {
        cashShortfallElement.classList.add('negative');
    } else {
        cashShortfallElement.classList.add('positive');
    }
    document.getElementById('js-cashShortfallDesc').textContent = cashShortfall > 0
        ? `${formatCurrency(cashNeededAtPurchase + upfrontCosts)} (total needed) - ${formatCurrency(cashAvailable)} (cash available) = bridge loan needed`
        : `Sufficient cash available - no bridge loan needed`;

    const remainingCashElement = document.getElementById('js-remainingCash');
    remainingCashElement.textContent = formatCurrency(remainingCash);
    remainingCashElement.classList.remove('positive', 'negative');
    if (remainingCash < 0) {
        remainingCashElement.classList.add('negative');
    } else if (remainingCash > 0) {
        remainingCashElement.classList.add('positive');
    }
    document.getElementById('js-remainingCashDesc').textContent = `${formatCurrency(totalFundsAfterSale)} (total after sale) - ${formatCurrency(cashNeededAtPurchase + upfrontCosts)} (total needed)`;

    document.getElementById('js-mortgageAmount').textContent = formatCurrency(mortgageAmount);
    document.getElementById('js-mortgageAmountDesc').textContent = `${formatCurrency(homeReportValue)} (home report) - ${formatCurrency(requiredDeposit)} (${depositPercentage}% deposit)`;

    document.getElementById('js-standardLbtt').textContent = formatCurrency(standardLbtt);
    document.getElementById('js-standardLbttDesc').textContent = `Calculated on ${formatCurrency(bidAmount)} using Scottish LBTT bands`;

    document.getElementById('js-adsAmount').textContent = formatCurrency(adsAmount);
    document.getElementById('js-adsAmountDesc').textContent = adsApplicable ? `${formatCurrency(bidAmount)} × 6% - payable when buying before selling` : 'Not applicable - buying after selling';

    document.getElementById('js-totalLbtt').textContent = formatCurrency(totalLbtt);
    document.getElementById('js-totalLbttDesc').textContent = `${formatCurrency(standardLbtt)} (standard) + ${formatCurrency(adsAmount)} (ADS)`;

    document.getElementById('js-equityFromSale').textContent = formatCurrency(equityFromSale);
    document.getElementById('js-equityFromSaleDesc').textContent = `${formatCurrency(expectedSaleValue)} (sale value) - ${formatCurrency(existingMortgage)} (mortgage) - ${formatCurrency(sellingSolicitorFees)} (selling fees)`;

    document.getElementById('js-totalFundsAfterSale').textContent = formatCurrency(totalFundsAfterSale);
    document.getElementById('js-totalFundsAfterSaleDesc').textContent = `${formatCurrency(cashAvailable)} (cash) + ${formatCurrency(equityFromSale)} (equity from sale)`;

    document.getElementById('js-requiredDeposit').textContent = formatCurrency(requiredDeposit);
    document.getElementById('js-requiredDepositDesc').textContent = `${formatCurrency(homeReportValue)} × ${depositPercentage}%`;

    document.getElementById('js-ltvPercentage').textContent = `${ltvPercentage.toFixed(2)}%`;
    document.getElementById('js-ltvPercentageDesc').textContent = `${formatCurrency(mortgageAmount)} (mortgage) ÷ ${formatCurrency(homeReportValue)} (home report) × 100`;

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
    inputs.forEach(input => {
        input.addEventListener('input', calculateAll);
    });

    // Add reset button listener
    document.getElementById('js-resetButton').addEventListener('click', resetToDefaults);

    // Initial calculation
    calculateAll();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
