export const state = {
  incomes: [],
  expenses: [],
  currentBalance: 0,
  savingsPercent: 0,
  forecastChart: null,
  hasUnsavedIncomes: false,
  hasUnsavedExpenses: false,
};

export function getMonthlyAmount(amount, frequency) {
            if (!amount) return 0;

            switch(frequency) {
                case 'weekly':
                    return amount * 4.33; // Average weeks per month
                case 'biweekly':
                    return amount * 2.17; // 26 pay periods / 12 months
                case 'monthly':
                default:
                    return amount;
            }
        }

export function loadData() {
            const saved = localStorage.getItem('cashFlowData');
            if (saved) {
                const data = JSON.parse(saved);
                state.incomes = data.state.incomes || [];
                state.expenses = data.state.expenses || [];
                state.currentBalance = data.state.currentBalance || 0;
                state.savingsPercent = data.state.savingsPercent || 0;

                document.getElementById('state.currentBalance').value = state.currentBalance;
                document.getElementById('state.savingsPercent').value = state.savingsPercent;
                document.getElementById('savingsPercentDisplay').textContent = state.savingsPercent + '%';
            }
            renderIncomesTable();
            renderExpensesTable();
        }

export function saveData() {
            // Parse current balance - strip $ and commas
            const balanceInput = document.getElementById('state.currentBalance').value;
            state.currentBalance = parseAmount(balanceInput);

            // Get savings percent
            state.savingsPercent = parseInt(document.getElementById('state.savingsPercent').value) || 0;

            const data = {
                state.incomes,
                state.expenses,
                state.currentBalance,
                state.savingsPercent,
                lastSaved: new Date().toISOString()
            };

            localStorage.setItem('cashFlowData', JSON.stringify(data));
        }

export function calculateForecast() {
            const forecast = [];
            let balance = state.currentBalance;
            const startDate = new Date();

            for (let week = 1; week <= 6; week++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (week - 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                let weekInflow = 0;
                let weekOutflow = 0;
                const itemsDue = [];

                // Calculate income for this week
                state.incomes.forEach(inc => {
                    const nextDate = new Date(inc.nextDate);
                    let isDue = false;

                    // Check if this income is due during this week
                    if (inc.frequency === 'weekly') {
                        isDue = true; // Weekly income occurs every week
                    } else if (inc.frequency === 'biweekly') {
                        // Check if the nextDate falls within this week or every 2 weeks from nextDate
                        const daysDiff = Math.floor((weekStart - nextDate) / (1000 * 60 * 60 * 24));
                        isDue = daysDiff >= 0 && daysDiff % 14 < 7;
                    } else if (inc.frequency === 'monthly') {
                        // Check if nextDate falls within this week
                        isDue = nextDate >= weekStart && nextDate <= weekEnd;
                    }

                    if (isDue) {
                        weekInflow += (inc.amount || 0);
                        itemsDue.push({
                            name: inc.name || 'Unnamed Income',
                            amount: inc.amount || 0,
                            type: 'income',
                            date: nextDate
                        });
                    }
                });

                // Calculate state.expenses for this week
                state.expenses.forEach(exp => {
                    const nextDate = new Date(exp.nextDate);
                    let isDue = false;

                    // Check if this expense is due during this week
                    if (exp.frequency === 'weekly') {
                        isDue = true; // Weekly expense occurs every week
                    } else if (exp.frequency === 'biweekly') {
                        // Check if the nextDate falls within this week or every 2 weeks from nextDate
                        const daysDiff = Math.floor((weekStart - nextDate) / (1000 * 60 * 60 * 24));
                        isDue = daysDiff >= 0 && daysDiff % 14 < 7;
                    } else if (exp.frequency === 'monthly') {
                        // Check if nextDate falls within this week
                        isDue = nextDate >= weekStart && nextDate <= weekEnd;
                    }

                    if (isDue) {
                        weekOutflow += (exp.amount || 0);
                        itemsDue.push({
                            name: exp.name || 'Unnamed Expense',
                            amount: exp.amount || 0,
                            type: 'expense',
                            date: nextDate,
                            isEssential: exp.isEssential
                        });
                    }
                });

                const netChange = weekInflow - weekOutflow;
                balance += netChange;

                forecast.push({
                    weekNumber: week,
                    startDate: weekStart,
                    endDate: weekEnd,
                    inflow: weekInflow,
                    outflow: weekOutflow,
                    netChange: netChange,
                    endingBalance: balance,
                    itemsDue: itemsDue
                });
            }

            return forecast;
        }

export function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);

            return result.map(val => val.replace(/^"|"$/g, '').trim());
        }

export function findColumnIndex(headers, possibleNames) {
            for (let name of possibleNames) {
                const index = headers.findIndex(h => h === name || h.includes(name));
                if (index !== -1) return index;
            }
            return -1;
        }

export function parseAmount(amountStr) {
            if (!amountStr) return 0;
            // Remove $, commas, and any other non-numeric characters except decimal point
            const cleaned = amountStr.replace(/[$,\s]/g, '');
            const amount = parseFloat(cleaned);
            return isNaN(amount) ? 0 : amount;
        }

export function parseDate(dateStr) {
            if (!dateStr) return new Date().toISOString().split('T')[0];

            const currentYear = new Date().getFullYear();

            // Try to parse various date formats
            // Format: "Jan 8", "January 8", "1/8", "01-08", etc.

            // Check if it's already in ISO format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
            }

            // Handle "Mon DD" or "Month DD" format (e.g., "Jan 8", "January 8")
            const monthDayMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
            if (monthDayMatch) {
                const monthName = monthDayMatch[1];
                const day = parseInt(monthDayMatch[2]);

                const monthMap = {
                    'jan': 0, 'january': 0,
                    'feb': 1, 'february': 1,
                    'mar': 2, 'march': 2,
                    'apr': 3, 'april': 3,
                    'may': 4,
                    'jun': 5, 'june': 5,
                    'jul': 6, 'july': 6,
                    'aug': 7, 'august': 7,
                    'sep': 8, 'september': 8,
                    'oct': 9, 'october': 9,
                    'nov': 10, 'november': 10,
                    'dec': 11, 'december': 11
                };

                const month = monthMap[monthName.toLowerCase()];
                if (month !== undefined) {
                    const date = new Date(currentYear, month, day);
                    return date.toISOString().split('T')[0];
                }
            }

            // Try standard Date parsing as fallback
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }

            // If all else fails, return today's date
            return new Date().toISOString().split('T')[0];
        }

export function parseFrequency(freqStr) {
            if (!freqStr) return 'monthly';

            const normalized = freqStr.toLowerCase().trim();

            if (normalized.includes('week') && !normalized.includes('bi')) return 'weekly';
            if (normalized.includes('biweek') || normalized.includes('bi-week') || normalized.includes('every 2 week')) return 'biweekly';
            if (normalized.includes('month')) return 'monthly';

            return 'monthly'; // Default
        }

export function parseBoolean(value) {
            if (!value) return false;

            const normalized = value.toString().toLowerCase().trim();
            return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
        }
