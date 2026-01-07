import {
  state,
  loadData,
  saveData,
  calculateForecast,
  parseCSVLine,
  findColumnIndex,
  parseAmount,
  parseDate,
  parseFrequency,
  parseBoolean,
} from "./core.js";

// Navigation Logic
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.getAttribute('data-page');
        navigateToPage(pageName);

        // Close mobile menu
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});



export function navigateToPage(pageName) {
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            // Show selected page
            document.getElementById(pageName).classList.add('active');

            // Update nav links
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageName) {
                    link.classList.add('active');
                }
            });

            // Update specific page content
            if (pageName === 'forecast') {
                renderForecastPage();
            } else if (pageName === 'dashboard') {
                updateDashboard();
            } else if (pageName === 'config') {
                updateConfigPage();
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

export function init() {
            loadData();
            updateAllViews();

            // Initialize slider gradient
            const slider = document.getElementById('state.savingsPercent');
            const percentage = (state.savingsPercent / 100) * 100;
            slider.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #334155 ${percentage}%, #334155 100%)`;
        }

export function saveAllData() {
            saveData();

            // Reset all unsaved flags
            state.hasUnsavedIncomes = false;
            state.hasUnsavedExpenses = false;

            // Update button states
            const incomeBtn = document.getElementById('saveIncomeBtn');
            if (incomeBtn) {
                incomeBtn.classList.remove('btn-unsaved');
                incomeBtn.textContent = '💾 Save Income';
            }

            const expenseBtn = document.getElementById('saveExpenseBtn');
            if (expenseBtn) {
                expenseBtn.classList.remove('btn-unsaved');
                expenseBtn.textContent = '💾 Save Expenses';
            }

            const allBtn = document.getElementById('saveAllBtn');
            if (allBtn) {
                allBtn.classList.remove('btn-unsaved');
                allBtn.textContent = '💾 Save All Changes';
            }

            updateAllViews();

            // Show brief confirmation
            if (allBtn) {
                const originalText = allBtn.textContent;
                allBtn.textContent = '✓ All Saved!';
                setTimeout(() => {
                    allBtn.textContent = originalText;
                }, 1500);
            }
        }

export function addIncome() {
            state.incomes.push({
                id: Date.now(),
                name: '',
                amount: 0,
                frequency: 'monthly',
                nextDate: new Date().toISOString().split('T')[0]
            });
            renderIncomesTable();
        }

export function removeIncome(id) {
            if (confirm('Remove this income source?')) {
                state.incomes = state.incomes.filter(inc => inc.id !== id);
                renderIncomesTable();
                saveData();
                updateAllViews();

                // Clear unsaved flag since we just saved
                state.hasUnsavedIncomes = false;
                const btn = document.getElementById('saveIncomeBtn');
                if (btn) {
                    btn.classList.remove('btn-unsaved');
                    btn.textContent = '💾 Save Income';
                }
            }
        }

export function addExpense() {
            state.expenses.push({
                id: Date.now(),
                name: '',
                amount: 0,
                frequency: 'monthly',
                nextDate: new Date().toISOString().split('T')[0],
                isEssential: false
            });
            renderExpensesTable();
        }

export function removeExpense(id) {
            if (confirm('Remove this expense?')) {
                state.expenses = state.expenses.filter(exp => exp.id !== id);
                renderExpensesTable();
                saveData();
                updateAllViews();

                // Clear unsaved flag since we just saved
                state.hasUnsavedExpenses = false;
                const btn = document.getElementById('saveExpenseBtn');
                if (btn) {
                    btn.classList.remove('btn-unsaved');
                    btn.textContent = '💾 Save Expenses';
                }
            }
        }

export function renderIncomesTable() {
            const tbody = document.querySelector('#incomeTable tbody');
            tbody.innerHTML = state.incomes.map(inc => `
                <tr>
                    <td><input type="text" value="${inc.name || ''}" onchange="updateIncome(${inc.id}, 'name', this.value)"></td>
                    <td><input type="number" step="0.01" value="${inc.amount || 0}" onchange="updateIncome(${inc.id}, 'amount', parseFloat(this.value))"></td>
                    <td>
                        <select onchange="updateIncome(${inc.id}, 'frequency', this.value)">
                            <option value="weekly" ${inc.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="biweekly" ${inc.frequency === 'biweekly' ? 'selected' : ''}>Bi-weekly</option>
                            <option value="monthly" ${inc.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </td>
                    <td><input type="date" value="${inc.nextDate || ''}" onchange="updateIncome(${inc.id}, 'nextDate', this.value)"></td>
                    <td><button class="btn btn-danger" onclick="removeIncome(${inc.id})">Remove</button></td>
                </tr>
            `).join('');
        }

export function renderExpensesTable() {
            const tbody = document.querySelector('#expenseTable tbody');
            tbody.innerHTML = state.expenses.map(exp => `
                <tr>
                    <td><input type="text" value="${exp.name || ''}" onchange="updateExpense(${exp.id}, 'name', this.value)"></td>
                    <td><input type="number" step="0.01" value="${exp.amount || 0}" onchange="updateExpense(${exp.id}, 'amount', parseFloat(this.value))"></td>
                    <td>
                        <select onchange="updateExpense(${exp.id}, 'frequency', this.value)">
                            <option value="weekly" ${exp.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="biweekly" ${exp.frequency === 'biweekly' ? 'selected' : ''}>Bi-weekly</option>
                            <option value="monthly" ${exp.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </td>
                    <td><input type="date" value="${exp.nextDate || ''}" onchange="updateExpense(${exp.id}, 'nextDate', this.value)"></td>
                    <td>
                        <div class="checkbox-wrapper">
                            <input type="checkbox" ${exp.isEssential ? 'checked' : ''} onchange="updateExpense(${exp.id}, 'isEssential', this.checked)">
                        </div>
                    </td>
                    <td><button class="btn btn-danger" onclick="removeExpense(${exp.id})">Remove</button></td>
                </tr>
            `).join('');
        }

export function updateIncome(id, field, value) {
            const income = state.incomes.find(inc => inc.id === id);
            if (income) {
                income[field] = value;

                // Check if row is complete (has name, amount, and date)
                const isComplete = income.name && income.name.trim() !== '' && 
                                 income.amount > 0 && 
                                 income.nextDate && income.nextDate !== '';

                if (isComplete) {
                    // Auto-save complete rows
                    saveData();
                    updateAllViews();
                } else {
                    // Mark as unsaved for incomplete rows
                    markIncomesUnsaved();
                }
            }
        }

export function updateExpense(id, field, value) {
            const expense = state.expenses.find(exp => exp.id === id);
            if (expense) {
                expense[field] = value;

                // Check if row is complete (has name, amount, and date)
                const isComplete = expense.name && expense.name.trim() !== '' && 
                                 expense.amount > 0 && 
                                 expense.nextDate && expense.nextDate !== '';

                if (isComplete) {
                    // Auto-save complete rows
                    saveData();
                    updateAllViews();
                } else {
                    // Mark as unsaved for incomplete rows
                    markExpensesUnsaved();
                }
            }
        }

export function markIncomesUnsaved() {
            state.hasUnsavedIncomes = true;
            const btn = document.getElementById('saveIncomeBtn');
            if (btn) {
                btn.classList.add('btn-unsaved');
                btn.textContent = '💾 Save Income *';
            }
        }

export function markExpensesUnsaved() {
            state.hasUnsavedExpenses = true;
            const btn = document.getElementById('saveExpenseBtn');
            if (btn) {
                btn.classList.add('btn-unsaved');
                btn.textContent = '💾 Save Expenses *';
            }
        }

export function saveIncomeData() {
            saveData();
            state.hasUnsavedIncomes = false;
            const btn = document.getElementById('saveIncomeBtn');
            if (btn) {
                btn.classList.remove('btn-unsaved');
                btn.textContent = '💾 Save Income';
            }
            updateAllViews();

            // Show brief confirmation
            const originalText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 1500);
        }

export function saveExpenseData() {
            saveData();
            state.hasUnsavedExpenses = false;
            const btn = document.getElementById('saveExpenseBtn');
            if (btn) {
                btn.classList.remove('btn-unsaved');
                btn.textContent = '💾 Save Expenses';
            }
            updateAllViews();

            // Show brief confirmation
            const originalText = btn.textContent;
            btn.textContent = '✓ Saved!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 1500);
        }

export function renderForecastPage() {
            const forecast = calculateForecast();

            // Render chart
            renderForecastChart(forecast);

            // Render forecast grid
            const grid = document.getElementById('forecastGrid');
            grid.innerHTML = forecast.map(week => {
                const isDeficit = week.netChange < 0;
                const statusClass = isDeficit ? 'deficit' : 'surplus';

                // Sort items by date
                const sortedItems = week.itemsDue.sort((a, b) => a.date - b.date);

                // Format date range
                const dateRange = `${week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                // Create items due summary
                const itemsSummary = sortedItems.length > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #334155;">
                        <div style="font-size: 0.9em; color: #94a3b8; margin-bottom: 8px; font-weight: 600;">Due This Week:</div>
                        ${sortedItems.map(item => {
                            const itemDate = item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const itemClass = item.type === 'income' ? 'positive' : 'negative';
                            const itemIcon = item.type === 'income' ? '💰' : '💸';
                            const essentialBadge = item.type === 'expense' && item.isEssential ? '<span style="font-size: 0.75em; background: #ef4444; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">Essential</span>' : '';
                            return `
                                <div style="font-size: 0.85em; margin: 6px 0; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #cbd5e1;">
                                        ${itemIcon} ${item.name}
                                        ${essentialBadge}
                                    </span>
                                    <span class="${itemClass}" style="font-weight: 600;">
                                        ${item.type === 'income' ? '+' : '-'}$${item.amount.toFixed(2)}
                                    </span>
                                </div>
                                <div style="font-size: 0.75em; color: #64748b; margin-left: 20px; margin-top: -4px;">${itemDate}</div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #334155; font-size: 0.85em; color: #64748b; text-align: center;">No items due this week</div>';

                return `
                    <div class="week-card ${statusClass}">
                        <div class="week-header">Week ${week.weekNumber}</div>
                        <div style="font-size: 0.85em; color: #64748b; margin-bottom: 15px;">${dateRange}</div>
                        <div class="week-stat">
                            <span class="week-stat-label">Income:</span>
                            <span class="week-stat-value positive">$${week.inflow.toFixed(2)}</span>
                        </div>
                        <div class="week-stat">
                            <span class="week-stat-label">Expenses:</span>
                            <span class="week-stat-value negative">$${week.outflow.toFixed(2)}</span>
                        </div>
                        <div class="week-stat">
                            <span class="week-stat-label">Net Change:</span>
                            <span class="week-stat-value ${week.netChange >= 0 ? 'positive' : 'negative'}">
                                ${week.netChange >= 0 ? '+' : ''}$${week.netChange.toFixed(2)}
                            </span>
                        </div>
                        <div class="week-stat" style="border-top: 1px solid #334155; padding-top: 8px; margin-top: 8px;">
                            <span class="week-stat-label">Ending Balance:</span>
                            <span class="week-stat-value ${week.endingBalance >= 0 ? 'positive' : 'negative'}">
                                $${week.endingBalance.toFixed(2)}
                            </span>
                        </div>
                        ${itemsSummary}
                    </div>
                `;
            }).join('');
        }

export function renderForecastChart(forecast) {
            const ctx = document.getElementById('state.forecastChart');
            if (!ctx) return;

            const chartCtx = ctx.getContext('2d');

            if (state.forecastChart) {
                state.forecastChart.destroy();
            }

            const labels = forecast.map(week => `Week ${week.weekNumber}`);
            const balanceData = forecast.map(week => week.endingBalance);
            const inflowData = forecast.map(week => week.inflow);
            const outflowData = forecast.map(week => -week.outflow);

            // Responsive font sizes
            const isMobile = window.innerWidth < 768;
            const legendFontSize = isMobile ? 10 : 14;
            const titleFontSize = isMobile ? 14 : 18;
            const tickFontSize = isMobile ? 9 : 12;

            state.forecastChart = new Chart(chartCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Balance',
                            data: balanceData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: isMobile ? 4 : 6,
                            pointHoverRadius: isMobile ? 6 : 8,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Income',
                            data: inflowData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointRadius: isMobile ? 3 : 4,
                            pointHoverRadius: isMobile ? 5 : 6
                        },
                        {
                            label: 'Expenses',
                            data: outflowData,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointRadius: isMobile ? 3 : 4,
                            pointHoverRadius: isMobile ? 5 : 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#e2e8f0',
                                font: {
                                    size: legendFontSize,
                                    weight: 'bold'
                                },
                                padding: isMobile ? 8 : 15,
                                usePointStyle: true,
                                boxWidth: isMobile ? 8 : 12,
                                boxHeight: isMobile ? 8 : 12
                            }
                        },
                        title: {
                            display: true,
                            text: '6-Week Cash Flow Projection',
                            color: '#10b981',
                            font: {
                                size: titleFontSize,
                                weight: 'bold'
                            },
                            padding: isMobile ? 10 : 20
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#10b981',
                            bodyColor: '#e2e8f0',
                            borderColor: '#334155',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: true,
                            titleFont: {
                                size: isMobile ? 11 : 13
                            },
                            bodyFont: {
                                size: isMobile ? 10 : 12
                            },
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += '$' + context.parsed.y.toFixed(2);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: '#334155',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: {
                                    size: tickFontSize,
                                    weight: 'bold'
                                },
                                maxRotation: isMobile ? 45 : 0,
                                minRotation: isMobile ? 45 : 0
                            }
                        },
                        y: {
                            grid: {
                                color: '#334155',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: {
                                    size: tickFontSize
                                },
                                callback: function(value) {
                                    return '$' + value.toFixed(0);
                                }
                            },
                            beginAtZero: false
                        }
                    }
                }
            });
        }

export function updateDashboard() {
            updateStatsRow();
            updateQuickStats();
        }

export function updateConfigPage() {
            updateQuickStatsConfig();
        }

export function updateStatsRow() {
            const totalExpenses = state.expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
            const totalIncome = state.incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
            const netMonthly = totalIncome - totalExpenses;
            const savingsAmount = netMonthly > 0 ? (netMonthly * state.savingsPercent / 100) : 0;
            const netAfterSavings = netMonthly - savingsAmount;

            let statsHTML = `
                <div class="stat-card">
                    <div class="stat-label">Current Balance</div>
                    <div class="stat-value ${state.currentBalance >= 0 ? 'positive' : 'negative'}">$${state.currentBalance.toFixed(0)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Income</div>
                    <div class="stat-value positive">$${totalIncome.toFixed(0)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Expenses</div>
                    <div class="stat-value negative">$${totalExpenses.toFixed(0)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Net Monthly</div>
                    <div class="stat-value ${netMonthly >= 0 ? 'positive' : 'negative'}">$${netMonthly.toFixed(0)}</div>
                </div>
            `;

            if (state.savingsPercent > 0) {
                statsHTML += `
                    <div class="stat-card" style="border-color: #10b981;">
                        <div class="stat-label">Savings (${state.savingsPercent}%)</div>
                        <div class="stat-value" style="color: #10b981;">$${savingsAmount.toFixed(0)}</div>
                    </div>
                    <div class="stat-card" style="border-color: #10b981;">
                        <div class="stat-label">After Savings</div>
                        <div class="stat-value ${netAfterSavings >= 0 ? 'positive' : 'negative'}">$${netAfterSavings.toFixed(0)}</div>
                    </div>
                `;
            }

            document.getElementById('statsRow').innerHTML = statsHTML;
        }

export function updateQuickStats() {
            const totalExpenses = state.expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
            const totalIncome = state.incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
            const netMonthly = totalIncome - totalExpenses;
            const savingsAmount = netMonthly > 0 ? (netMonthly * state.savingsPercent / 100) : 0;
            const netAfterSavings = netMonthly - savingsAmount;

            const stats = `
                <div style="padding: 15px;">
                    <div class="week-stat">
                        <span class="week-stat-label">Current Balance:</span>
                        <span class="week-stat-value ${state.currentBalance >= 0 ? 'positive' : 'negative'}">$${state.currentBalance.toFixed(2)}</span>
                    </div>
                    <div class="week-stat">
                        <span class="week-stat-label">Total Income:</span>
                        <span class="week-stat-value positive">$${totalIncome.toFixed(2)}</span>
                    </div>
                    <div class="week-stat">
                        <span class="week-stat-label">Total Expenses:</span>
                        <span class="week-stat-value negative">$${totalExpenses.toFixed(2)}</span>
                    </div>
                    <div class="week-stat" style="border-top: 1px solid #334155; padding-top: 8px; margin-top: 8px;">
                        <span class="week-stat-label">Net Monthly:</span>
                        <span class="week-stat-value ${netMonthly >= 0 ? 'positive' : 'negative'}">$${netMonthly.toFixed(2)}</span>
                    </div>
                    ${state.savingsPercent > 0 ? `
                        <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 8px;">
                            <span class="week-stat-label">Savings Goal (${state.savingsPercent}%):</span>
                            <span class="week-stat-value" style="color: #10b981;">$${savingsAmount.toFixed(2)}</span>
                        </div>
                        <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 4px;">
                            <span class="week-stat-label">After Savings:</span>
                            <span class="week-stat-value ${netAfterSavings >= 0 ? 'positive' : 'negative'}">$${netAfterSavings.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('quickStats').innerHTML = stats;
        }

export function updateQuickStatsConfig() {
            const totalExpenses = state.expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
            const totalIncome = state.incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
            const netMonthly = totalIncome - totalExpenses;
            const savingsAmount = netMonthly > 0 ? (netMonthly * state.savingsPercent / 100) : 0;
            const netAfterSavings = netMonthly - savingsAmount;

            const stats = `
                <div style="padding: 15px;">
                    <div class="week-stat">
                        <span class="week-stat-label">Current Balance:</span>
                        <span class="week-stat-value ${state.currentBalance >= 0 ? 'positive' : 'negative'}">$${state.currentBalance.toFixed(2)}</span>
                    </div>
                    <div class="week-stat">
                        <span class="week-stat-label">Total Income:</span>
                        <span class="week-stat-value positive">$${totalIncome.toFixed(2)}</span>
                    </div>
                    <div class="week-stat">
                        <span class="week-stat-label">Total Expenses:</span>
                        <span class="week-stat-value negative">$${totalExpenses.toFixed(2)}</span>
                    </div>
                    <div class="week-stat" style="border-top: 1px solid #334155; padding-top: 8px; margin-top: 8px;">
                        <span class="week-stat-label">Net Monthly:</span>
                        <span class="week-stat-value ${netMonthly >= 0 ? 'positive' : 'negative'}">$${netMonthly.toFixed(2)}</span>
                    </div>
                    ${state.savingsPercent > 0 ? `
                        <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 8px;">
                            <span class="week-stat-label">Savings Goal (${state.savingsPercent}%):</span>
                            <span class="week-stat-value" style="color: #10b981;">$${savingsAmount.toFixed(2)}</span>
                        </div>
                        <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 4px;">
                            <span class="week-stat-label">After Savings:</span>
                            <span class="week-stat-value ${netAfterSavings >= 0 ? 'positive' : 'negative'}">$${netAfterSavings.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            const statsElement = document.getElementById('quickStatsConfig');
            if (statsElement) {
                statsElement.innerHTML = stats;
            }
        }

export function generateActionPlan() {
            const forecast = calculateForecast();
            const totalExpenses = state.expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
            const totalIncome = state.incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
            const netMonthly = totalIncome - totalExpenses;

            const actionPlan = [];

            // Financial Health Status
            if (netMonthly >= 0 && state.currentBalance >= 0) {
                actionPlan.push(`
                    <div class="success-box">
                        <h3>✅ Healthy Financial Position</h3>
                        <p>Your finances are in good shape! You have positive cash flow and a healthy balance.</p>
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            <li>Consider building an emergency fund (3-6 months of state.expenses)</li>
                            <li>Look into investment opportunities</li>
                            <li>Review discretionary state.expenses for optimization</li>
                        </ul>
                    </div>
                `);
            } else if (netMonthly < 0) {
                actionPlan.push(`
                    <div class="warning-box">
                        <h3>⚠️ Negative Cash Flow Detected</h3>
                        <p>Your state.expenses exceed your income by $${Math.abs(netMonthly).toFixed(2)} per month.</p>
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            <li>Identify and reduce non-essential state.expenses</li>
                            <li>Look for additional income opportunities</li>
                            <li>Prioritize essential state.expenses</li>
                        </ul>
                    </div>
                `);
            }

            // Deficit weeks warning
            const deficitWeeks = forecast.filter(w => w.endingBalance < 0);
            if (deficitWeeks.length > 0) {
                actionPlan.push(`
                    <div class="warning-box">
                        <h3>🚨 Projected Deficit Weeks</h3>
                        <p>Your forecast shows ${deficitWeeks.length} week(s) with negative balance:</p>
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            ${deficitWeeks.map(w => `<li>Week ${w.weekNumber}: $${w.endingBalance.toFixed(2)}</li>`).join('')}
                        </ul>
                    </div>
                `);
            }

            // Income breakdown
            actionPlan.push(`
                <div class="action-item">
                    <strong>💰 Income Breakdown:</strong>
                    ${state.incomes.length > 0 ? 
                        state.incomes.map(inc => {
                            const monthly = getMonthlyAmount(inc.amount || 0, inc.frequency);
                            const freqLabel = inc.frequency === 'monthly' ? '' : ` → $${monthly.toFixed(2)}/mo`;
                            return `<div style="margin-top: 4px;">• ${inc.name || 'Unnamed'}: $${(inc.amount || 0).toFixed(2)} (${inc.frequency}${freqLabel})</div>`;
                        }).join('') :
                        '<div style="margin-top: 4px;">No income sources configured</div>'
                    }
                    ${state.incomes.length > 0 ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;"><strong>Total Monthly Income: $${totalIncome.toFixed(2)}</strong></div>` : ''}
                </div>
            `);

            // Expense breakdown
            const essentialExpenses = state.expenses.filter(e => e.isEssential);
            const nonEssentialExpenses = state.expenses.filter(e => !e.isEssential);
            const essentialTotal = essentialExpenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
            const nonEssentialTotal = nonEssentialExpenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);

            actionPlan.push(`
                <div class="action-item">
                    <strong>💸 Expense Breakdown:</strong>
                    ${state.expenses.length > 0 ? 
                        `<div style="margin-top: 10px;">
                            <strong>Essential Expenses:</strong>
                            ${essentialExpenses.length > 0 ? 
                                essentialExpenses.map(exp => {
                                    const monthly = getMonthlyAmount(exp.amount || 0, exp.frequency);
                                    const freqLabel = exp.frequency === 'monthly' ? '' : ` → $${monthly.toFixed(2)}/mo`;
                                    return `<div style="margin-top: 4px;">• ${exp.name || 'Unnamed'}: $${(exp.amount || 0).toFixed(2)} (${exp.frequency}${freqLabel})</div>`;
                                }).join('') :
                                '<div style="margin-top: 4px;">None</div>'
                            }
                            ${essentialExpenses.length > 0 ? `<div style="margin-top: 4px; font-weight: 600;">Subtotal: $${essentialTotal.toFixed(2)}/mo</div>` : ''}
                        </div>
                        <div style="margin-top: 10px;">
                            <strong>Non-Essential Expenses:</strong>
                            ${nonEssentialExpenses.length > 0 ? 
                                nonEssentialExpenses.map(exp => {
                                    const monthly = getMonthlyAmount(exp.amount || 0, exp.frequency);
                                    const freqLabel = exp.frequency === 'monthly' ? '' : ` → $${monthly.toFixed(2)}/mo`;
                                    return `<div style="margin-top: 4px;">• ${exp.name || 'Unnamed'}: $${(exp.amount || 0).toFixed(2)} (${exp.frequency}${freqLabel})</div>`;
                                }).join('') :
                                '<div style="margin-top: 4px;">None</div>'
                            }
                            ${nonEssentialExpenses.length > 0 ? `<div style="margin-top: 4px; font-weight: 600;">Subtotal: $${nonEssentialTotal.toFixed(2)}/mo</div>` : ''}
                        </div>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;"><strong>Total Monthly Expenses: $${totalExpenses.toFixed(2)}</strong></div>` :
                        '<div style="margin-top: 4px;">No state.expenses configured</div>'
                    }
                </div>
            `);

            // Recommendations
            actionPlan.push(`
                <div class="action-item">
                    <strong>💡 Recommendations:</strong>
                    <div style="margin-top: 10px;">
                        ${netMonthly < 0 ? 
                            '<div>1. Focus on reducing non-essential state.expenses first</div>' : 
                            '<div>1. Continue maintaining positive cash flow</div>'
                        }
                        ${state.currentBalance < totalExpenses * 3 ? 
                            '<div>2. Build an emergency fund of 3-6 months state.expenses</div>' : 
                            '<div>2. Consider investment opportunities for surplus funds</div>'
                        }
                        <div>3. Review and adjust your budget monthly</div>
                        <div>4. Track actual spending vs. projected spending</div>
                    </div>
                </div>
            `);

            document.getElementById('actionPlanContent').innerHTML = actionPlan.join('');
        }

export function updateAllViews() {
            updateDashboard();
            updateConfigPage();
            // Don't automatically update forecast page to avoid unnecessary chart redraws
        }

export function exportData() {
            const data = {
                state.incomes,
                state.expenses,
                state.currentBalance,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `coinforecast-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

export function importData() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.csv';

            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = (event) => {
                    try {
                        const content = event.target.result;

                        // Check if it's CSV or JSON
                        if (file.name.endsWith('.csv')) {
                            importCSV(content);
                        } else {
                            const data = JSON.parse(content);

                            if (confirm('This will replace all current data. Continue?')) {
                                state.incomes = data.state.incomes || [];
                                state.expenses = data.state.expenses || [];
                                state.currentBalance = data.state.currentBalance || 0;
                                state.savingsPercent = data.state.savingsPercent || 0;

                                // Reset unsaved flags
                                state.hasUnsavedIncomes = false;
                                state.hasUnsavedExpenses = false;

                                saveData();
                                loadData();
                                updateAllViews();

                                alert('Data imported successfully! ✓');
                            }
                        }
                    } catch (error) {
                        alert('Error importing data: ' + error.message);
                    }
                };

                reader.readAsText(file);
            };

            input.click();
        }

export function importCSV(csvContent) {
            const lines = csvContent.trim().split('\n');
            if (lines.length < 2) {
                alert('CSV file appears to be empty or invalid.');
                return;
            }

            // Parse header
            const headers = parseCSVLine(lines[0]);

            // Normalize headers (lowercase, trim)
            const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

            // Detect column indices
            const columnMap = {
                name: findColumnIndex(normalizedHeaders, ['name', 'expense', 'description', 'item']),
                amount: findColumnIndex(normalizedHeaders, ['amount', 'cost', 'price', 'value']),
                date: findColumnIndex(normalizedHeaders, ['date', 'due date', 'due', 'next date', 'duedate']),
                frequency: findColumnIndex(normalizedHeaders, ['frequency', 'freq', 'recurring', 'period']),
                essential: findColumnIndex(normalizedHeaders, ['essential', 'necessary', 'required', 'priority']),
                type: findColumnIndex(normalizedHeaders, ['type', 'category'])
            };

            // Parse data rows
            const parsedData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length === 0 || values.every(v => !v.trim())) continue;

                const row = {
                    id: Date.now() + i,
                    name: columnMap.name !== -1 ? values[columnMap.name]?.trim() : '',
                    amount: columnMap.amount !== -1 ? parseAmount(values[columnMap.amount]) : 0,
                    frequency: columnMap.frequency !== -1 ? parseFrequency(values[columnMap.frequency]) : 'monthly',
                    nextDate: columnMap.date !== -1 ? parseDate(values[columnMap.date]) : new Date().toISOString().split('T')[0],
                    isEssential: columnMap.essential !== -1 ? parseBoolean(values[columnMap.essential]) : true
                };

                // Determine if it's income or expense based on type column or default to expense
                const typeValue = columnMap.type !== -1 ? values[columnMap.type]?.toLowerCase() : '';
                const isIncome = typeValue.includes('income') || typeValue.includes('revenue');

                parsedData.push({ ...row, isIncome });
            }

            // Ask user to specify type if no type column detected
            let userSpecifiedType = null;
            if (columnMap.type === -1) {
                const typeChoice = confirm(
                    `No "Type" column detected in CSV.\n\n` +
                    `Are these EXPENSES?\n\n` +
                    `• Click OK for EXPENSES 💸\n` +
                    `• Click Cancel for INCOME 💰`
                );
                userSpecifiedType = typeChoice ? 'expense' : 'income';

                // Override all items with user's choice
                parsedData.forEach(item => {
                    item.isIncome = userSpecifiedType === 'income';
                });
            }

            // Show preview and confirmation
            const incomeCount = parsedData.filter(d => d.isIncome).length;
            const expenseCount = parsedData.filter(d => !d.isIncome).length;

            const typeInfo = userSpecifiedType 
                ? `\n\nUser specified: ${userSpecifiedType === 'income' ? '💰 Income' : '💸 Expenses'}`
                : '';

            const message = `Found ${parsedData.length} items:\n` +
                `• ${incomeCount} income sources\n` +
                `• ${expenseCount} state.expenses\n\n` +
                `Columns detected:\n` +
                `• Name: ${columnMap.name !== -1 ? '✓' : '✗'}\n` +
                `• Amount: ${columnMap.amount !== -1 ? '✓' : '✗'}\n` +
                `• Date: ${columnMap.date !== -1 ? '✓' : '✗'}\n` +
                `• Frequency: ${columnMap.frequency !== -1 ? '✓' : '✗ (defaulting to monthly)'}\n` +
                `• Type: ${columnMap.type !== -1 ? '✓' : '✗ (user specified)'}` +
                typeInfo +
                `\n\nReplace existing data or append to it?`;

            const shouldReplace = confirm(message + '\n\nOK = Replace   |   Cancel = Append');

            if (shouldReplace === null) return; // User cancelled entirely

            if (!shouldReplace) {
                // Append to existing data
                const newIncomes = parsedData.filter(d => d.isIncome).map(d => {
                    const { isIncome, ...rest } = d;
                    return rest;
                });
                const newExpenses = parsedData.filter(d => !d.isIncome).map(d => {
                    const { isIncome, ...rest } = d;
                    return rest;
                });

                state.incomes = [...state.incomes, ...newIncomes];
                state.expenses = [...state.expenses, ...newExpenses];
            } else {
                // Replace existing data
                state.incomes = parsedData.filter(d => d.isIncome).map(d => {
                    const { isIncome, ...rest } = d;
                    return rest;
                });
                state.expenses = parsedData.filter(d => !d.isIncome).map(d => {
                    const { isIncome, ...rest } = d;
                    return rest;
                });
            }

            // Reset unsaved flags
            state.hasUnsavedIncomes = false;
            state.hasUnsavedExpenses = false;

            saveData();
            loadData();
            updateAllViews();

            alert(`CSV imported successfully! ✓\nAdded ${incomeCount} income sources and ${expenseCount} state.expenses.`);
        }

export function clearAllData() {
            if (confirm('⚠️ This will delete ALL data. This cannot be undone. Continue?')) {
                if (confirm('Are you absolutely sure? This is your last chance!')) {
                    localStorage.removeItem('cashFlowData');
                    state.incomes = [];
                    state.expenses = [];
                    state.currentBalance = 0;
                    state.savingsPercent = 0;

                    // Reset unsaved flags
                    state.hasUnsavedIncomes = false;
                    state.hasUnsavedExpenses = false;

                    document.getElementById('state.currentBalance').value = 0;
                    document.getElementById('state.savingsPercent').value = 0;
                    document.getElementById('savingsPercentDisplay').textContent = '0%';
                    renderIncomesTable();
                    renderExpensesTable();
                    updateAllViews();

                    alert('All data has been cleared.');
                }
            }
        }
