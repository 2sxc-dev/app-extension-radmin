import { tabulatorTable } from "./tabulator/tabulator-table";
import { CustomizeManager } from "./custom/customize-manager";
import { initializeCustomizers } from "./custom/customizers-init";

const win = window as any;

// Ensure a single shared CustomizeManager instance is created and exposed early.
// This prevents different bundles from each creating their own CustomizeManager.
const sharedManager = CustomizeManager.getInstance();
win.__RADMIN_CUSTOMIZE_MANAGER = sharedManager; // canonical place other code can inspect
win.radminCustomizers = win.radminCustomizers || {};
win.radminCustomizers.manager = sharedManager;

win.table ??= {};

// Optionally initialize built-in customizers now (safe, they will register on sharedManager)
try {
  console.log("Initializing built-in customizers...");
  initializeCustomizers();
} catch (err) {
  console.warn("Failed to initialize built-in customizers during tables boot:", err);
}

win.table = new tabulatorTable();

console.log("radmin version 0.2.2");