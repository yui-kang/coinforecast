import {
  init,
  navigateToPage,
  addIncome,
  addExpense,
  saveAllData,
  exportData,
  importData,
  clearAllData,
  generateActionPlan,
  importCSV,
  // Functions used by inline handlers inside rendered tables / buttons
  saveIncomeData,
  saveExpenseData,
  updateIncome,
  updateExpense,
  removeIncome,
  removeExpense,
  updateConfigPage,
} from "./ui.js";

// Expose for existing inline onclick/onchange attributes in index.html
Object.assign(window, {
  navigateToPage,
  addIncome,
  addExpense,
  saveAllData,
  exportData,
  importData,
  clearAllData,
  generateActionPlan,
  importCSV,
  saveIncomeData,
  saveExpenseData,
  updateIncome,
  updateExpense,
  removeIncome,
  removeExpense,
  updateConfigPage,
});

window.addEventListener("load", init);
