/*
 * ====================================================================
 * COIN FORECAST - MAIN JAVASCRIPT
 * ====================================================================
 * 
 * PURPOSE: All application logic and functionality
 * 
 * ORGANIZATION:
 * 1. Global Variables - Data that persists across functions
 * 2. Navigation Logic - Page switching
 * 3. Profile Management - Multi-profile system  
 * 4. Data Management - Save/load/import/export
 * 5. Income & Expense Management - CRUD operations
 * 6. Forecast Calculations - Core forecasting logic
 * 7. Week Tracking - Rolling balance system
 * 8. UI Updates - Rendering data to screen
 * 9. Action Plan Generation - Financial recommendations
 * 10. Utility Functions - Helper functions
 * 
 * KEY CONCEPTS:
 * - Functions are blocks of reusable code
 * - Variables store data (let creates a variable)
 * - localStorage saves data in the browser
 * - getElementById() finds HTML elements to update
 * - Event listeners respond to user actions (clicks, etc)
 * 
 * TIPS FOR EDITING:
 * - Each function should do ONE thing
 * - Comments explain WHY, not WHAT
 * - Keep functions small (under 50 lines)
 * - Test changes in browser console (F12)
 * 
 * ====================================================================
 */

// ===== 1. GLOBAL VARIABLES =====
// These variables are accessible everywhere in the code
// Think of them as the app's "memory"

// Global Variables
let incomes = [];
let expenses = [];
let currentBalance = 0;
let savingsPercent = 0;
let forecastStartDate = null;
let forecastChart = null;
let hasUnsavedIncomes = false;
let hasUnsavedExpenses = false;

// Profile management
let currentProfile = 'Personal';
let profiles = {};

// ===== 2. NAVIGATION LOGIC =====
// Handles page switching and mobile menu

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

function navigateToPage(pageName) {
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

// ===== 3. INITIALIZATION & PROFILE MANAGEMENT =====
// Sets up the app and handles multiple profiles (Personal, Business, etc.)

// Initialize
function init() {
    loadProfiles();
    loadData();
    updateAllViews();
    
    // Initialize slider gradient
    const slider = document.getElementById('savingsPercent');
    const percentage = (savingsPercent / 100) * 100;
    slider.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #334155 ${percentage}%, #334155 100%)`;
}

// Profile Management
function loadProfiles() {
    const saved = localStorage.getItem('cashFlowProfiles');
    if (saved) {
        profiles = JSON.parse(saved);
        
        // Load last used profile
        const lastProfile = localStorage.getItem('lastProfile');
        if (lastProfile && profiles[lastProfile]) {
            currentProfile = lastProfile;
        }
    } else {
        // Initialize with Personal profile
        profiles = {
            'Personal': {
                incomes: [],
                expenses: [],
                currentBalance: 0,
                savingsPercent: 0,
                forecastStartDate: new Date().toISOString()
            }
        };
        saveProfiles();
    }
    
    updateProfileSelector();
}

function saveProfiles() {
    localStorage.setItem('cashFlowProfiles', JSON.stringify(profiles));
    localStorage.setItem('lastProfile', currentProfile);
}

function saveCurrentProfileState() {
    profiles[currentProfile] = {
        incomes: incomes,
        expenses: expenses,
        currentBalance: currentBalance,
        savingsPercent: savingsPercent,
        forecastStartDate: forecastStartDate
    };
    saveProfiles();
}

function loadProfileState(profileName) {
    const profile = profiles[profileName];
    if (profile) {
        incomes = profile.incomes || [];
        expenses = profile.expenses || [];
        currentBalance = profile.currentBalance || 0;
        savingsPercent = profile.savingsPercent || 0;
        forecastStartDate = profile.forecastStartDate || new Date().toISOString();
        
        // Update UI
        document.getElementById('currentBalance').value = currentBalance;
        document.getElementById('savingsPercent').value = savingsPercent;
        document.getElementById('savingsPercentDisplay').textContent = savingsPercent + '%';
        
        // Update slider gradient
        const slider = document.getElementById('savingsPercent');
        const percentage = (savingsPercent / 100) * 100;
        slider.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #334155 ${percentage}%, #334155 100%)`;
        
        renderIncomesTable();
        renderExpensesTable();
    }
}

function switchProfile(profileName) {
    // Save current profile before switching
    saveCurrentProfileState();
    
    // Switch to new profile
    currentProfile = profileName;
    localStorage.setItem('lastProfile', currentProfile);
    
    // Load new profile
    loadProfileState(profileName);
    
    // Update all views
    updateAllViews();
}

function updateProfileSelector() {
    const select = document.getElementById('profileSelect');
    select.innerHTML = '';
    
    Object.keys(profiles).forEach(profileName => {
        const option = document.createElement('option');
        option.value = profileName;
        option.textContent = profileName;
        if (profileName === currentProfile) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function manageProfiles() {
    const profileNames = Object.keys(profiles).join('\n• ');
    const action = prompt(
        `Current Profiles:\n• ${profileNames}\n\n` +
        `What would you like to do?\n\n` +
        `1. Type "new [name]" to create a new profile\n` +
        `   Example: new Business\n\n` +
        `2. Type "copy [name]" to copy current profile\n` +
        `   Example: copy Business\n\n` +
        `3. Type "rename [old] to [new]" to rename\n` +
        `   Example: rename Personal to Home\n\n` +
        `4. Type "delete [name]" to delete a profile\n` +
        `   Example: delete Business\n\n` +
        `Or click Cancel to go back.`
    );
    
    if (!action) return;
    
    const trimmed = action.trim();
    
    // Create new profile
    if (trimmed.toLowerCase().startsWith('new ')) {
        const newName = trimmed.substring(4).trim();
        if (!newName) {
            alert('Please provide a profile name.');
            return;
        }
        if (profiles[newName]) {
            alert(`Profile "${newName}" already exists.`);
            return;
        }
        
        // Create new profile with default data
        profiles[newName] = {
            incomes: [],
            expenses: [],
            currentBalance: 0,
            savingsPercent: 0,
            forecastStartDate: new Date().toISOString()
        };
        
        saveProfiles();
        updateProfileSelector();
        
        if (confirm(`Profile "${newName}" created! Switch to it now?`)) {
            document.getElementById('profileSelect').value = newName;
            switchProfile(newName);
        }
    }
    // Copy current profile
    else if (trimmed.toLowerCase().startsWith('copy ')) {
        const newName = trimmed.substring(5).trim();
        if (!newName) {
            alert('Please provide a profile name.');
            return;
        }
        if (profiles[newName]) {
            alert(`Profile "${newName}" already exists.`);
            return;
        }
        
        // Copy current profile data
        profiles[newName] = {
            incomes: JSON.parse(JSON.stringify(incomes)),
            expenses: JSON.parse(JSON.stringify(expenses)),
            currentBalance: currentBalance,
            savingsPercent: savingsPercent,
            forecastStartDate: new Date().toISOString() // Fresh forecast start
        };
        
        saveProfiles();
        updateProfileSelector();
        
        if (confirm(`Profile "${newName}" created as a copy of "${currentProfile}"! Switch to it now?`)) {
            document.getElementById('profileSelect').value = newName;
            switchProfile(newName);
        }
    }
    // Rename profile
    else if (trimmed.toLowerCase().includes(' to ')) {
        const parts = trimmed.split(' to ');
        const oldNamePart = parts[0].trim();
        const newName = parts[1].trim();
        
        const oldName = oldNamePart.toLowerCase().startsWith('rename ') 
            ? oldNamePart.substring(7).trim() 
            : oldNamePart;
        
        if (!oldName || !newName) {
            alert('Please provide both old and new profile names.');
            return;
        }
        if (!profiles[oldName]) {
            alert(`Profile "${oldName}" not found.`);
            return;
        }
        if (profiles[newName]) {
            alert(`Profile "${newName}" already exists.`);
            return;
        }
        
        // Rename profile
        profiles[newName] = profiles[oldName];
        delete profiles[oldName];
        
        if (currentProfile === oldName) {
            currentProfile = newName;
        }
        
        saveProfiles();
        updateProfileSelector();
        alert(`Profile renamed from "${oldName}" to "${newName}"`);
    }
    // Delete profile
    else if (trimmed.toLowerCase().startsWith('delete ')) {
        const deleteName = trimmed.substring(7).trim();
        
        if (!deleteName) {
            alert('Please provide a profile name to delete.');
            return;
        }
        if (!profiles[deleteName]) {
            alert(`Profile "${deleteName}" not found.`);
            return;
        }
        if (Object.keys(profiles).length === 1) {
            alert('Cannot delete the last profile. Create a new one first.');
            return;
        }
        
        if (confirm(`Are you sure you want to delete "${deleteName}"? This cannot be undone.`)) {
            delete profiles[deleteName];
            
            // If deleting current profile, switch to first available
            if (currentProfile === deleteName) {
                currentProfile = Object.keys(profiles)[0];
                loadProfileState(currentProfile);
            }
            
            saveProfiles();
            updateProfileSelector();
            updateAllViews();
            alert(`Profile "${deleteName}" deleted.`);
        }
    }
    else {
        alert('Invalid command. Please try again.');
    }
}

function getMonthlyAmount(amount, frequency) {
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

function getCurrentWeekNumber() {
    const now = new Date();
    const startDate = new Date(forecastStartDate);
    const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    return Math.max(1, Math.min(6, weekNumber)); // Clamp between 1 and 6
}

function advanceToNextWeek() {
    const forecast = calculateForecast();
    const currentWeek = getCurrentWeekNumber();
    
    if (currentWeek >= 6) {
        if (confirm('You\'re at the end of the 6-week forecast. Start a new forecast cycle?')) {
            // Reset to week 1 and keep the final balance
            const finalWeek = forecast[5];
            currentBalance = finalWeek.endingBalance;
            forecastStartDate = new Date().toISOString();
            
            document.getElementById('currentBalance').value = currentBalance.toFixed(2);
            saveData();
            updateAllViews();
            
            alert(`New forecast started with balance: $${currentBalance.toFixed(2)}`);
        }
    } else {
        const currentWeekData = forecast[currentWeek - 1];
        const nextWeekData = forecast[currentWeek];
        
        const message = `Complete Week ${currentWeek}?\n\n` +
            `Week ${currentWeek} Ending Balance: $${currentWeekData.endingBalance.toFixed(2)}\n` +
            `This will become your new starting balance for Week ${currentWeek + 1}.\n\n` +
            `Continue?`;
        
        if (confirm(message)) {
            currentBalance = currentWeekData.endingBalance;
            forecastStartDate = new Date(currentWeekData.endDate.getTime() + 86400000).toISOString(); // Next day after week end
            
            document.getElementById('currentBalance').value = currentBalance.toFixed(2);
            saveData();
            updateAllViews();
            
            alert(`✓ Advanced to Week ${getCurrentWeekNumber()}\nNew balance: $${currentBalance.toFixed(2)}`);
        }
    }
}

function resetForecastCycle() {
    if (confirm('Start a fresh 6-week forecast cycle? This will keep your current balance but reset the week counter.')) {
        forecastStartDate = new Date().toISOString();
        saveData();
        updateAllViews();
        alert('Forecast cycle reset to Week 1');
    }
}

// ===== 4. DATA MANAGEMENT =====
// Save, load, import, and export data

function loadData() {
    // Load from current profile
    if (profiles[currentProfile]) {
        loadProfileState(currentProfile);
    } else {
        // Fallback to old data format for migration
        const saved = localStorage.getItem('cashFlowData');
        if (saved) {
            const data = JSON.parse(saved);
            incomes = data.incomes || [];
            expenses = data.expenses || [];
            currentBalance = data.currentBalance || 0;
            savingsPercent = data.savingsPercent || 0;
            forecastStartDate = data.forecastStartDate || new Date().toISOString();
            
            document.getElementById('currentBalance').value = currentBalance;
            document.getElementById('savingsPercent').value = savingsPercent;
            document.getElementById('savingsPercentDisplay').textContent = savingsPercent + '%';
        } else {
            // Initialize forecast start date if no saved data
            forecastStartDate = new Date().toISOString();
        }
        renderIncomesTable();
        renderExpensesTable();
    }
}

function saveData() {
    // Parse current balance - strip $ and commas
    const balanceInput = document.getElementById('currentBalance').value;
    currentBalance = parseAmount(balanceInput);
    
    // Get savings percent
    savingsPercent = parseInt(document.getElementById('savingsPercent').value) || 0;
    
    // Save to current profile
    saveCurrentProfileState();
}

function saveAllData() {
    saveData();
    
    // Reset all unsaved flags
    hasUnsavedIncomes = false;
    hasUnsavedExpenses = false;
    
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

function addIncome() {
    incomes.push({
        id: Date.now(),
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextDate: new Date().toISOString().split('T')[0]
    });
    renderIncomesTable();
}

function removeIncome(id) {
    if (confirm('Remove this income source?')) {
        incomes = incomes.filter(inc => inc.id !== id);
        renderIncomesTable();
        saveData();
        updateAllViews();
        
        // Clear unsaved flag since we just saved
        hasUnsavedIncomes = false;
        const btn = document.getElementById('saveIncomeBtn');
        if (btn) {
            btn.classList.remove('btn-unsaved');
            btn.textContent = '💾 Save Income';
        }
    }
}

function addExpense() {
    expenses.push({
        id: Date.now(),
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextDate: new Date().toISOString().split('T')[0],
        isEssential: false
    });
    renderExpensesTable();
}

function removeExpense(id) {
    if (confirm('Remove this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        renderExpensesTable();
        saveData();
        updateAllViews();
        
        // Clear unsaved flag since we just saved
        hasUnsavedExpenses = false;
        const btn = document.getElementById('saveExpenseBtn');
        if (btn) {
            btn.classList.remove('btn-unsaved');
            btn.textContent = '💾 Save Expenses';
        }
    }
}

function renderIncomesTable() {
    const tbody = document.querySelector('#incomeTable tbody');
    tbody.innerHTML = incomes.map(inc => `
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

function renderExpensesTable() {
    const tbody = document.querySelector('#expenseTable tbody');
    tbody.innerHTML = expenses.map(exp => `
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

function updateIncome(id, field, value) {
    const income = incomes.find(inc => inc.id === id);
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

function updateExpense(id, field, value) {
    const expense = expenses.find(exp => exp.id === id);
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

function markIncomesUnsaved() {
    hasUnsavedIncomes = true;
    const btn = document.getElementById('saveIncomeBtn');
    if (btn) {
        btn.classList.add('btn-unsaved');
        btn.textContent = '💾 Save Income *';
    }
}

function markExpensesUnsaved() {
    hasUnsavedExpenses = true;
    const btn = document.getElementById('saveExpenseBtn');
    if (btn) {
        btn.classList.add('btn-unsaved');
        btn.textContent = '💾 Save Expenses *';
    }
}

function saveIncomeData() {
    saveData();
    hasUnsavedIncomes = false;
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

function saveExpenseData() {
    saveData();
    hasUnsavedExpenses = false;
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

function calculateForecast() {
    const forecast = [];
    let balance = currentBalance;
    const startDate = new Date();

    for (let week = 1; week <= 6; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (week - 1) * 7);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let weekInflow = 0;
        let weekOutflow = 0;
        const itemsDue = [];

        // Calculate income for this week
        incomes.forEach(inc => {
            const result = getOccurrenceInWeek(inc.nextDate, inc.frequency, weekStart, weekEnd);
            
            if (result.isDue) {
                weekInflow += (inc.amount || 0);
                itemsDue.push({
                    name: inc.name || 'Unnamed Income',
                    amount: inc.amount || 0,
                    type: 'income',
                    date: result.actualDate
                });
            }
        });

        // Calculate expenses for this week
        expenses.forEach(exp => {
            const result = getOccurrenceInWeek(exp.nextDate, exp.frequency, weekStart, weekEnd);
            
            if (result.isDue) {
                weekOutflow += (exp.amount || 0);
                itemsDue.push({
                    name: exp.name || 'Unnamed Expense',
                    amount: exp.amount || 0,
                    type: 'expense',
                    date: result.actualDate,
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

function getOccurrenceInWeek(nextDateStr, frequency, weekStart, weekEnd) {
    const nextDate = new Date(nextDateStr);
    nextDate.setHours(0, 0, 0, 0);
    
    let isDue = false;
    let actualDate = null;

    if (frequency === 'weekly') {
        // Weekly occurs every week on the same day of week as nextDate
        const targetDayOfWeek = nextDate.getDay();
        
        // Find that day of week in this week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + dayOffset);
            checkDate.setHours(0, 0, 0, 0);
            
            if (checkDate.getDay() === targetDayOfWeek && checkDate >= weekStart && checkDate <= weekEnd) {
                isDue = true;
                actualDate = checkDate;
                break;
            }
        }
        
    } else if (frequency === 'biweekly') {
        // Check each day in the week to see if it's a biweekly occurrence from nextDate
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + dayOffset);
            checkDate.setHours(0, 0, 0, 0);
            
            // Only check if checkDate is within the week bounds
            if (checkDate >= weekStart && checkDate <= weekEnd) {
                const daysDiff = Math.floor((checkDate - nextDate) / (1000 * 60 * 60 * 24));
                
                // Check if this day is exactly on a biweekly cycle from nextDate
                if (daysDiff >= 0 && daysDiff % 14 === 0) {
                    isDue = true;
                    actualDate = checkDate;
                    break;
                }
            }
        }
        
    } else if (frequency === 'monthly') {
        // Check if the same day-of-month as nextDate occurs in this week
        const targetDay = nextDate.getDate();
        
        // Check each day in the week
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + dayOffset);
            checkDate.setHours(0, 0, 0, 0);
            
            if (checkDate >= weekStart && checkDate <= weekEnd) {
                // Check if this is the target day of the month AND it's at or after the original nextDate
                if (checkDate.getDate() === targetDay && checkDate >= nextDate) {
                    isDue = true;
                    actualDate = checkDate;
                    break;
                }
            }
        }
    }

    return { isDue, actualDate: actualDate || nextDate };
}

function renderForecastPage() {
    const forecast = calculateForecast();
    const currentWeek = getCurrentWeekNumber();
    
    // Update week tracking display
    const currentWeekData = forecast[currentWeek - 1];
    const weekDateRange = `${currentWeekData.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentWeekData.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    document.getElementById('currentWeekDisplay').textContent = `Week ${currentWeek}`;
    document.getElementById('weekDateRange').textContent = weekDateRange;
    
    // Render chart
    renderForecastChart(forecast);
    
    // Render forecast grid
    const grid = document.getElementById('forecastGrid');
    grid.innerHTML = forecast.map(week => {
        const isDeficit = week.netChange < 0;
        const isCurrentWeek = week.weekNumber === currentWeek;
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
            <div class="week-card ${statusClass} ${isCurrentWeek ? 'current-week' : ''}" ${isCurrentWeek ? 'id="currentWeekCard"' : ''}>
                <div class="week-header">
                    Week ${week.weekNumber}
                    ${isCurrentWeek ? '<span style="margin-left: 8px; background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">CURRENT</span>' : ''}
                </div>
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

function renderForecastChart(forecast) {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    if (forecastChart) {
        forecastChart.destroy();
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
    
    forecastChart = new Chart(chartCtx, {
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

function updateDashboard() {
    updateStatsRow();
    updateQuickStats();
}

function updateConfigPage() {
    updateQuickStatsConfig();
    
    // Update week display
    const currentWeek = getCurrentWeekNumber();
    const configWeekDisplay = document.getElementById('configWeekDisplay');
    if (configWeekDisplay) {
        configWeekDisplay.textContent = `Currently in Week ${currentWeek} of your forecast`;
    }
}

function updateStatsRow() {
    const totalExpenses = expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
    const netMonthly = totalIncome - totalExpenses;
    const savingsAmount = netMonthly > 0 ? (netMonthly * savingsPercent / 100) : 0;
    const netAfterSavings = netMonthly - savingsAmount;

    let statsHTML = `
        <div class="stat-card">
            <div class="stat-label">Current Balance</div>
            <div class="stat-value ${currentBalance >= 0 ? 'positive' : 'negative'}">$${currentBalance.toFixed(0)}</div>
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
    
    if (savingsPercent > 0) {
        statsHTML += `
            <div class="stat-card" style="border-color: #10b981;">
                <div class="stat-label">Savings (${savingsPercent}%)</div>
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

function updateQuickStats() {
    const totalExpenses = expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
    const netMonthly = totalIncome - totalExpenses;
    const savingsAmount = netMonthly > 0 ? (netMonthly * savingsPercent / 100) : 0;
    const netAfterSavings = netMonthly - savingsAmount;

    const stats = `
        <div style="padding: 15px;">
            <div class="week-stat">
                <span class="week-stat-label">Current Balance:</span>
                <span class="week-stat-value ${currentBalance >= 0 ? 'positive' : 'negative'}">$${currentBalance.toFixed(2)}</span>
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
            ${savingsPercent > 0 ? `
                <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 8px;">
                    <span class="week-stat-label">Savings Goal (${savingsPercent}%):</span>
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

function updateQuickStatsConfig() {
    const totalExpenses = expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
    const netMonthly = totalIncome - totalExpenses;
    const savingsAmount = netMonthly > 0 ? (netMonthly * savingsPercent / 100) : 0;
    const netAfterSavings = netMonthly - savingsAmount;

    const stats = `
        <div style="padding: 15px;">
            <div class="week-stat">
                <span class="week-stat-label">Current Balance:</span>
                <span class="week-stat-value ${currentBalance >= 0 ? 'positive' : 'negative'}">$${currentBalance.toFixed(2)}</span>
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
            ${savingsPercent > 0 ? `
                <div class="week-stat" style="background: rgba(16, 185, 129, 0.05); padding: 8px; border-radius: 6px; margin-top: 8px;">
                    <span class="week-stat-label">Savings Goal (${savingsPercent}%):</span>
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

function generateActionPlan() {
    const forecast = calculateForecast();
    const totalExpenses = expenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + getMonthlyAmount(inc.amount, inc.frequency), 0);
    const netMonthly = totalIncome - totalExpenses;
    
    const actionPlan = [];

    // Financial Health Status
    if (netMonthly >= 0 && currentBalance >= 0) {
        actionPlan.push(`
            <div class="success-box">
                <h3>✅ Healthy Financial Position</h3>
                <p>Your finances are in good shape! You have positive cash flow and a healthy balance.</p>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Consider building an emergency fund (3-6 months of expenses)</li>
                    <li>Look into investment opportunities</li>
                    <li>Review discretionary expenses for optimization</li>
                </ul>
            </div>
        `);
    } else if (netMonthly < 0) {
        actionPlan.push(`
            <div class="warning-box">
                <h3>⚠️ Negative Cash Flow Detected</h3>
                <p>Your expenses exceed your income by $${Math.abs(netMonthly).toFixed(2)} per month.</p>
                <ul style="margin-top: 10px; padding-left: 20px;">
                    <li>Identify and reduce non-essential expenses</li>
                    <li>Look for additional income opportunities</li>
                    <li>Prioritize essential expenses</li>
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
            ${incomes.length > 0 ? 
                incomes.map(inc => {
                    const monthly = getMonthlyAmount(inc.amount || 0, inc.frequency);
                    const freqLabel = inc.frequency === 'monthly' ? '' : ` → $${monthly.toFixed(2)}/mo`;
                    return `<div style="margin-top: 4px;">• ${inc.name || 'Unnamed'}: $${(inc.amount || 0).toFixed(2)} (${inc.frequency}${freqLabel})</div>`;
                }).join('') :
                '<div style="margin-top: 4px;">No income sources configured</div>'
            }
            ${incomes.length > 0 ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #334155;"><strong>Total Monthly Income: $${totalIncome.toFixed(2)}</strong></div>` : ''}
        </div>
    `);

    // Expense breakdown
    const essentialExpenses = expenses.filter(e => e.isEssential);
    const nonEssentialExpenses = expenses.filter(e => !e.isEssential);
    const essentialTotal = essentialExpenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    const nonEssentialTotal = nonEssentialExpenses.reduce((sum, e) => sum + getMonthlyAmount(e.amount, e.frequency), 0);
    
    actionPlan.push(`
        <div class="action-item">
            <strong>💸 Expense Breakdown:</strong>
            ${expenses.length > 0 ? 
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
                '<div style="margin-top: 4px;">No expenses configured</div>'
            }
        </div>
    `);

    // Recommendations
    actionPlan.push(`
        <div class="action-item">
            <strong>💡 Recommendations:</strong>
            <div style="margin-top: 10px;">
                ${netMonthly < 0 ? 
                    '<div>1. Focus on reducing non-essential expenses first</div>' : 
                    '<div>1. Continue maintaining positive cash flow</div>'
                }
                ${currentBalance < totalExpenses * 3 ? 
                    '<div>2. Build an emergency fund of 3-6 months expenses</div>' : 
                    '<div>2. Consider investment opportunities for surplus funds</div>'
                }
                <div>3. Review and adjust your budget monthly</div>
                <div>4. Track actual spending vs. projected spending</div>
            </div>
        </div>
    `);

    document.getElementById('actionPlanContent').innerHTML = actionPlan.join('');
}

function updateAllViews() {
    updateDashboard();
    updateConfigPage();
    // Don't automatically update forecast page to avoid unnecessary chart redraws
}

function exportData() {
    const data = {
        profileName: currentProfile,
        incomes,
        expenses,
        currentBalance,
        savingsPercent,
        forecastStartDate,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coinforecast-${currentProfile.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData() {
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
                        incomes = data.incomes || [];
                        expenses = data.expenses || [];
                        currentBalance = data.currentBalance || 0;
                        savingsPercent = data.savingsPercent || 0;
                        forecastStartDate = data.forecastStartDate || new Date().toISOString();
                        
                        // Reset unsaved flags
                        hasUnsavedIncomes = false;
                        hasUnsavedExpenses = false;
                        
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

function importCSV(csvContent) {
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
        `• ${expenseCount} expenses\n\n` +
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
        
        incomes = [...incomes, ...newIncomes];
        expenses = [...expenses, ...newExpenses];
    } else {
        // Replace existing data
        incomes = parsedData.filter(d => d.isIncome).map(d => {
            const { isIncome, ...rest } = d;
            return rest;
        });
        expenses = parsedData.filter(d => !d.isIncome).map(d => {
            const { isIncome, ...rest } = d;
            return rest;
        });
    }
    
    // Reset unsaved flags
    hasUnsavedIncomes = false;
    hasUnsavedExpenses = false;
    
    saveData();
    loadData();
    updateAllViews();
    
    alert(`CSV imported successfully! ✓\nAdded ${incomeCount} income sources and ${expenseCount} expenses.`);
}

function parseCSVLine(line) {
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

function findColumnIndex(headers, possibleNames) {
    for (let name of possibleNames) {
        const index = headers.findIndex(h => h === name || h.includes(name));
        if (index !== -1) return index;
    }
    return -1;
}

function parseAmount(amountStr) {
    if (!amountStr) return 0;
    // Remove $, commas, and any other non-numeric characters except decimal point
    const cleaned = amountStr.replace(/[$,\s]/g, '');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
}

function parseDate(dateStr) {
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

function parseFrequency(freqStr) {
    if (!freqStr) return 'monthly';
    
    const normalized = freqStr.toLowerCase().trim();
    
    if (normalized.includes('week') && !normalized.includes('bi')) return 'weekly';
    if (normalized.includes('biweek') || normalized.includes('bi-week') || normalized.includes('every 2 week')) return 'biweekly';
    if (normalized.includes('month')) return 'monthly';
    
    return 'monthly'; // Default
}

function parseBoolean(value) {
    if (!value) return false;
    
    const normalized = value.toString().toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1' || normalized === 'y';
}

function clearAllData() {
    if (confirm(`⚠️ This will delete ALL data for the "${currentProfile}" profile. This cannot be undone. Continue?`)) {
        if (confirm('Are you absolutely sure? This is your last chance!')) {
            // Clear current profile data
            incomes = [];
            expenses = [];
            currentBalance = 0;
            savingsPercent = 0;
            forecastStartDate = new Date().toISOString();
            
            // Reset unsaved flags
            hasUnsavedIncomes = false;
            hasUnsavedExpenses = false;
            
            document.getElementById('currentBalance').value = 0;
            document.getElementById('savingsPercent').value = 0;
            document.getElementById('savingsPercentDisplay').textContent = '0%';
            
            // Save cleared profile
            saveCurrentProfileState();
            
            renderIncomesTable();
            renderExpensesTable();
            updateAllViews();
            
            alert(`All data for "${currentProfile}" profile has been cleared.`);
        }
    }
}

// Listen for current balance changes
document.getElementById('currentBalance').addEventListener('change', function() {
    currentBalance = parseAmount(this.value);
    saveData();
    updateAllViews();
});

// Listen for savings percent changes
document.getElementById('savingsPercent').addEventListener('input', function() {
    savingsPercent = parseInt(this.value) || 0;
    document.getElementById('savingsPercentDisplay').textContent = savingsPercent + '%';
    
    // Update slider gradient
    const percentage = (savingsPercent / 100) * 100;
    this.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${percentage}%, #334155 ${percentage}%, #334155 100%)`;
    
    saveData();
    updateAllViews();
});

// Redraw chart on window resize for mobile responsiveness
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Check if we're on the forecast page
        const forecastPage = document.getElementById('forecast');
        if (forecastPage && forecastPage.classList.contains('active')) {
            renderForecastPage();
        }
    }, 250);
});

// Initialize on page load
window.addEventListener('load', init);
