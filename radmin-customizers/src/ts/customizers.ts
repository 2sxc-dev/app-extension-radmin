import { CustomizeAccessCodesTable } from "./customizers/customize-resources-title-example";
import type { TableCustomizer } from "../../../extensions/radmin/src/customizers/table-customizer";

// Log on module evaluation
console.log("Loading radmin customizers module...");

// Clear named export
export const customizers: Array<new () => TableCustomizer> = [
  CustomizeAccessCodesTable,
  // add more customizer constructors here as needed
];

// No default export - stick to named exports for ES modules

// Log after export
console.log("radmin customizers version 0.5.0");
console.log("Exported customizers array with length:", customizers.length);