export class TabulatorSearchFilter {
  /**
   * Create filter input element and place it next to the table heading
   * Uses module ID to ensure targeting the correct instance
   */
  createFilterInput(
    tableName: string,
    filterName: string,
    moduleId: number
  ): void {
    const tableElement = document.getElementById(tableName);
    if (!tableElement) return;

    // Find module container (parent element that contains the table)
    const moduleContainer =
      tableElement.closest(
        `[data-block-instance="${moduleId}"], [data-block-settings="${moduleId}"], [data-cb-instance="${moduleId}"]`
      ) ||
      tableElement.closest(
        `.tabulator-container[data-module-id="${moduleId}"]`
      ) ||
      tableElement.parentElement;

    if (!moduleContainer) return;

    // Create search input
    const filterInput = document.createElement("input");
    filterInput.className = "form-control";
    filterInput.type = "text";
    filterInput.placeholder = "Search...";
    filterInput.id = filterName;

    // Create container for the filter
    const filterContainer = document.createElement("div");
    filterContainer.className = "w-25";
    filterContainer.appendChild(filterInput);

    // Add data attribute to identify this component
    filterContainer.setAttribute("data-module-id", moduleId.toString());

    // Try to find existing flex container within this specific module
    const flexContainer = moduleContainer.querySelector(
      `.d-flex.justify-content-between.align-items-center.mb-1[data-module-id="${moduleId}"], .d-flex.justify-content-between.align-items-center.mb-1`
    );

    if (flexContainer) {
      // Add filter to existing flex container
      flexContainer.appendChild(filterContainer);
      return;
    }

    // If no flex container exists, create one
    const newFlexContainer = document.createElement("div");
    newFlexContainer.className =
      "d-flex justify-content-between align-items-center mb-1";
    newFlexContainer.setAttribute("data-module-id", moduleId.toString());

    // Try to find a heading to pair with the filter, specific to this module
    const headingElement = moduleContainer.querySelector(
      `h1[data-module-id="${moduleId}"], h1`
    );

    if (headingElement && headingElement.parentElement) {
      // Insert new container and move heading into it
      headingElement.parentElement.insertBefore(
        newFlexContainer,
        headingElement
      );
      newFlexContainer.appendChild(headingElement);
      newFlexContainer.appendChild(filterContainer);
    } else {
      // No heading found, just add filter before table
      newFlexContainer.className =
        "d-flex justify-content-end align-items-center mb-1";
      newFlexContainer.appendChild(filterContainer);
      tableElement.parentElement?.insertBefore(newFlexContainer, tableElement);
    }
  }

  /**
   * Custom filter function that matches any field in a row against the search term
   */
  matchAny(data: any, filterParams: any, row?: any): boolean {
    const search = filterParams.value?.toString().toLowerCase() || "";
    if (!search) return true;

    // Check row cells if row object is available
    if (row && row.getCells) {
      for (const cell of row.getCells()) {
        const value = cell.getValue();
        if (value != null && String(value).toLowerCase().includes(search)) {
          return true;
        }
      }
      return false;
    }

    // Fallback: search in the data object
    for (const key in data) {
      const value = data[key];
      if (value != null) {
        const stringValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        if (stringValue.toLowerCase().includes(search)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the filter function for Tabulator
   */
  getFilterFunction(filterName: string) {
    const filterInput = document.querySelector<HTMLInputElement>(
      `#${filterName}`
    );

    if (!filterInput) {
      console.warn(`Filter input with ID ${filterName} not found`);
      return;
    }

    return filterInput;
  }
}
