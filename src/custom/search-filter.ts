export class TabulatorSearchFilter {
  /**
   * Create filter input element and insert it before the table
   */
  createFilterInput(tableName: string, filterName: string): void {
    // Find the table element
    const tableElement = document.getElementById(tableName);
    if (!tableElement) return;

    // Get the parent element that contains the heading and (will contain) the table
    const parentContainer =
      tableElement.closest(".d-flex") || tableElement.parentElement;

    // Find the heading element (h1) to place the filter next to
    const headingElement = parentContainer?.querySelector("h1");

    // Create filter container
    const filterContainer = document.createElement("div");
    filterContainer.className = "w-25";

    // Create filter input
    const filterInput = document.createElement("input");
    filterInput.className = "form-control";
    filterInput.type = "text";
    filterInput.placeholder = "Search...";
    filterInput.id = filterName;

    // Add the input to the container
    filterContainer.appendChild(filterInput);

    // Create or find the flex container for the heading and filter
    let flexContainer: HTMLElement;

    if (headingElement) {
      // If heading exists, check if it's already in a flex container
      const existingFlexContainer = headingElement.closest(
        ".d-flex.justify-content-between.align-items-center.mb-1"
      );

      if (existingFlexContainer) {
        // Use the existing flex container
        flexContainer = existingFlexContainer as HTMLElement;
        flexContainer.appendChild(filterContainer);
      } else {
        // Create a new flex container
        flexContainer = document.createElement("div");
        flexContainer.className =
          "d-flex justify-content-between align-items-center mb-1";

        // If there's a heading, move it inside the flex container
        if (headingElement.parentElement) {
          headingElement.parentElement.insertBefore(
            flexContainer,
            headingElement
          );
          flexContainer.appendChild(headingElement);
        } else {
          // Insert the flex container before the table
          tableElement.parentElement?.insertBefore(flexContainer, tableElement);
        }

        flexContainer.appendChild(filterContainer);
      }
    } else {
      // No heading, create a simple flex container and add it before the table
      flexContainer = document.createElement("div");
      flexContainer.className =
        "d-flex justify-content-end align-items-center mb-1";
      flexContainer.appendChild(filterContainer);

      // Insert the flex container before the table
      tableElement.parentElement?.insertBefore(flexContainer, tableElement);
    }
  }
}
