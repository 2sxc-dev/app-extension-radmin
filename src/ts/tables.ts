import { TabulatorTable } from "./tabulator/tabulator-table";

const win = window as any;
win.table ??= {};

win.table = new TabulatorTable();

console.log("radmin version 0.5.1");
