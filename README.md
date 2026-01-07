💰 Coin Forecast
Coin Forecast is a lightweight, privacy-focused financial planning web application. It helps users visualize their cash flow over a rolling 6-week period, identify potential budget shortfalls, and generate actionable financial plans—all without your data ever leaving your browser.

✨ Key Features
📈 6-Week Cash Flow Projection: Visualize your ending balance, weekly income, and expenses through an interactive chart powered by Chart.js.

🎯 Smart Action Plan: Automatically generates personalized recommendations based on your financial health, identifying deficit weeks and suggesting emergency fund goals.

⚙️ Flexible Configuration:

Support for Weekly, Bi-weekly, and Monthly frequencies.

Toggle "Essential" vs "Non-essential" expenses to see where you can cut back.

Dynamic Savings Goal slider to calculate net income after savings.

📥 Data Portability: Export your data to JSON for backups or import existing data via CSV/JSON.

🔒 Privacy First: No accounts, no servers, and no trackers. All data is stored locally in your browser's localStorage.

📱 Responsive Design: Fully optimized for desktop, tablet, and mobile devices with a modern "Dark Mode" aesthetic.

🚀 Getting Started
Since this is a client-side application, there is no installation required.

Download the coinforecast.html file.

Open the file in any modern web browser (Chrome, Firefox, Safari, Edge).

Start Planning: Enter your current balance in the Configuration tab to begin.

🛠️ Tech Stack
HTML5/CSS3: Custom layouts using CSS Grid and Flexbox.

Vanilla JavaScript: Core logic, data processing, and forecast calculations.

Chart.js: For rendering the visual cash flow projections.

LocalStorage API: For persistent data storage without a backend.

📂 Importing Data via CSV
You can bulk-upload your expenses or income. The app intelligently maps columns like:

Name / Description

Amount / Cost

Date / Due Date

Frequency

If a "Type" column isn't found, the app will ask you to categorize the upload as either Income or Expenses.


