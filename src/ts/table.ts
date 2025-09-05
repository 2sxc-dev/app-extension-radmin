import { tabulatorTable } from "./tabulator/tabulator-table";

const win = window as any;
win.table ??= {};

win.table = new tabulatorTable();

console.log("sxc-tables version 0.1.0");
