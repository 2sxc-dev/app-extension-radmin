import type { ITableCustomizer } from "../../../src/ts/custom/ITableCustomizer";
import { CustomizeAccessCodesTable } from "../../../src/ts/custom/customizers/customize-access-codes";

// Export only constructors (not instances)
export const customizers: Array<new () => ITableCustomizer> = [
  CustomizeAccessCodesTable,
  // add more customizer constructors here as needed
];

console.log("radmin customizers version 0.3.2");