import { ITableCustomizer } from "./custom/ITableCustomizer";

// Export only constructors (not instances)
export const customizers: Array<new () => ITableCustomizer> = [
  // add more customizer constructors here as needed
];

console.log("radmin customizers version 0.4.0");