# Scottish Property Purchase Calculator

A web-based calculator to help you understand mortgage affordability and cash requirements when purchasing property in Scotland. This tool is especially useful when navigating the Scottish property market's unique aspects like overbidding and LBTT calculations.

## Features

- **LBTT Calculation**: Automatically calculates Land and Buildings Transaction Tax (Scotland's property transaction tax) based on current Scottish tax bands
- **Overbid Support**: Handles scenarios where you bid above the home report value (common in the Scottish market)
- **Comprehensive Cost Breakdown**: Tracks all costs including solicitor fees, LBTT, and cash requirements
- **Chain Purchase Support**: Calculates equity from selling an existing property and how it affects your new purchase
- **Mortgage Affordability**: Shows monthly payments based on interest rate and term
- **LTV Calculation**: Displays your loan-to-value percentage
- **Auto-save**: Your inputs are automatically saved to localStorage for convenience
- **Real-time Updates**: All calculations update instantly as you change values

## Installation

This project uses [Bun](https://bun.sh/) as its runtime. Make sure you have Bun installed.

```bash
# Clone the repository
git clone https://github.com/josephshambrook/scottish-property-purchase-calculator.git
cd scottish-property-purchase-calculator

# Install dependencies
bun install
```

## Usage

### Development Mode

Run the calculator locally in development mode:

```bash
bun run dev
```

Then open the displayed URL in your browser (typically `http://localhost:3000`).

### Production Build

Build an optimized version for production:

```bash
bun run prod
```

The built files will be in the `dist/` directory.

### Formatting

Format the code using Prettier:

```bash
bun run format
```

## How It Works

The calculator walks through the complete property purchase journey:

### Inputs

**Property Being Purchased:**
- Home Report Value: The official valuation
- Bid Amount: What you're offering to pay
- Buying Solicitor Fees: Split into upfront and completion costs

**Existing Property Being Sold:**
- Expected Sale Value
- Existing Mortgage Balance
- Selling Solicitor Fees

**Available Funds:**
- Cash Available: Your savings

**New Mortgage Parameters:**
- Interest Rate (%)
- Mortgage Term (years)

### Calculations

1. **Overbid Amount**: Calculates how much you're bidding over the home report value (must be paid in cash)
2. **LBTT**: Calculates Land and Buildings Transaction Tax using Scottish tax bands:
   - £0 - £145,000: 0%
   - £145,001 - £250,000: 2%
   - £250,001 - £325,000: 5%
   - £325,001 - £750,000: 10%
   - Over £750,000: 12%
3. **Cash Used Before Purchase**: Overbid + upfront solicitor fees
4. **Equity from Sale**: Sale value minus existing mortgage and selling costs
5. **Total Funds Available**: Your cash plus equity from sale
6. **Required Deposit**: Available funds minus all pre-purchase costs
7. **Mortgage Amount**: Home report value minus deposit
8. **Monthly Payment**: Standard amortization calculation
9. **LTV Percentage**: Mortgage amount divided by home report value

## Development

The project is built with vanilla JavaScript, HTML, and CSS:

- `index.html`: Main application structure
- `script.js`: All calculation logic and interactivity
- `styles.css`: Styling and layout
- `bun.lock`: Dependency lock file

### Project Structure

```
scottish-property-purchase-calculator/
├── index.html          # Main HTML file
├── script.js           # JavaScript logic
├── styles.css          # Styling
├── package.json        # Project configuration
├── bun.lock           # Dependency lock file
├── .prettierrc        # Prettier configuration
└── dist/              # Production build output
```

## Technology Stack

- **Runtime**: Bun
- **Languages**: HTML, CSS, JavaScript (ES6+)
- **Storage**: localStorage for persisting user inputs
- **Build**: Bun's built-in bundler

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Joseph Shambrook

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

**Note**: This calculator is for informational purposes only and should not be considered financial advice. Always consult with a qualified mortgage advisor or financial professional before making property purchase decisions.
