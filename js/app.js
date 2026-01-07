import { init, navigateToPage, addIncome, addExpense, saveAllData, exportData, importData, clearAllData, generateActionPlan, importCSV } from "./ui.js";

window.navigateToPage = navigateToPage;
window.addIncome = addIncome;
window.addExpense = addExpense;
window.saveAllData = saveAllData;
window.exportData = exportData;
window.importData = importData;
window.importCSV = importCSV;
window.clearAllData = clearAllData;
window.generateActionPlan = generateActionPlan;

window.addEventListener("load", init);
