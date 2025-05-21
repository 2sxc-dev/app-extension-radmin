import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfig } from "./tabulator-models";
import { TabulatorConfigService } from "./tabulator-config-service";
import { TabulatorDataProvider } from "./tabulator-data-provider";
import { CommandNames } from "@2sic.com/2sxc-typings";
import { DataViewTableConfig } from "../models/table-model";
import { offset } from "@floating-ui/dom";

// Register required modules for Tabulator
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
]);

declare global {
  interface Window {
    FloatingUIDOM: any;
  }
}

export class TabulatorAdapter {
  // Shared helper to create common Tabulator configuration options
  private async createCommonConfig(
    tableConfigData: TabulatorConfig,
    data: object[]
  ): Promise<any> {
    const configService = new TabulatorConfigService();
    const config: TabulatorConfig = configService.createTabulatorConfig(
      tableConfigData,
      data
    );
    // Build the common options for the table
    return {
      ...config,
      data,
      dependencies: {
        DateTime: DateTime,
      },
    };
  }

  /**
   * Clean up any lingering floating menus.
   */
  private cleanupFloatingMenus(): void {
    document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
  }

  /**
   * Open the toolbar for a click event.
   * @param e - The click event.
   * @param row - The Tabulator row instance.
   */
  openEditDialog(e: Event, row: any) {
    e.preventDefault();
    // Cleanup any lingering floating menus before opening the dialog
    this.cleanupFloatingMenus();

    const rowData = row.getData();
    const action = "edit";
    const params = { entityId: rowData.Id };

    return $2sxc(row.getElement())
      .cms.run({
        action: action as CommandNames,
        params: params,
      })
      .then((data: any) => {
        return data;
      })
      .catch((err: string) => {
        console.error("Error running cms action: ", err);
        throw err;
      });
  }

  /**
   * Open the dialog to create a new DataViewColumnConfig on right-click on a column header.
   * The dialog is prefilled with as many properties as possible.
   * After creation the new column config is added to the used table config.
   * @param e - The right-click event.
   * @param column - The Tabulator column instance.
   */
  openNewColumnDialog(
    e: Event,
    column: any,
    tableConfigData: DataViewTableConfig
  ) {
    e.preventDefault();
    const action = "new";

    const params = {
      contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be", // DataViewColumnConfig Content Type Guid
      prefill: {
        Title: column.getDefinition().title || "",
        linkEnable: false,
        tooltipEnabled: false,
        ValueSelector: column.getDefinition().title || "",
      },
      fields: "DataViewColumnConfig", // The field in the parent that holds the list.
      parent: tableConfigData.guid, // Parent entity GUID.
    };

    return $2sxc(column.getElement())
      .cms.run({
        action: action as CommandNames,
        params: params,
      })
      .catch((err: string) => {
        console.error(
          "Error running cms action for adding new column to list: ",
          err
        );
        throw err;
      });
  }

  /**
   * Extracted function that creates and displays the floating UI.
   * @param table - The Tabulator table instance.
   * @param row - The Tabulator row instance.
   * @param event - The originating event.
   */
  private showFloatingMenu(table: any, row: any, event: Event) {
    event.preventDefault();
    const tableElement = table.element;
    const rowElement = row.getElement();
    const tableRect = tableElement.getBoundingClientRect();
    const rowRect = rowElement.getBoundingClientRect();

    // Virtual element positioned at the right edge of the table,
    // vertically centered relative to the row.
    const virtualEl = {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: tableRect.right,
          y: rowRect.top + rowRect.height / 2,
          top: rowRect.top + rowRect.height / 2,
          left: tableRect.right,
          right: tableRect.right,
          bottom: rowRect.top + rowRect.height / 2,
        };
      },
    };

    const floatingEl = document.createElement("div");
    floatingEl.className = "floating-menu";
    Object.assign(floatingEl.style, {
      position: "absolute",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "50%",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const btn = document.createElement("button");
    btn.textContent = "✏️";
    btn.className = "btn btn-sm";
    // Prevent outside handlers from removing the menu
    btn.onclick = (ev) => {
      floatingEl.remove();
      ev.stopPropagation();
      this.openEditDialog(event, row);
    };
    floatingEl.appendChild(btn);

    document.body.appendChild(floatingEl);

    window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
      placement: "right",
      middleware: [offset(() => -40)],
    }).then(({ x, y }: { x: number; y: number }) => {
      Object.assign(floatingEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    // Use a flag to determine if the floating element is hovered.
    let isHovered = false;
    floatingEl.addEventListener("mouseenter", () => {
      isHovered = true;
    });
    floatingEl.addEventListener("mouseleave", () => {
      isHovered = false;
      floatingEl.remove();
    });

    // Instead of immediately removing on rowMouseLeave,
    table.on("rowMouseLeave", () => {
      setTimeout(() => {
        if (!isHovered) {
          floatingEl.remove();
        }
      });
    });
  }

  /**
   * Show floating menu for column headers.
   * @param table - The Tabulator table instance.
   * @param column - The Tabulator column instance.
   * @param event - The originating event.
   */
  private showFloatingColumnMenu(
    column: any,
    event: Event,
    tableConfigData: DataViewTableConfig
  ) {
    event.preventDefault();
    this.cleanupFloatingMenus();

    const colElement = column.getElement();
    const colRect = colElement.getBoundingClientRect();

    const virtualEl = {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x: colRect.right,
          y: colRect.top + colRect.height / 2,
          top: colRect.top + colRect.height / 2,
          left: colRect.right,
          right: colRect.right,
          bottom: colRect.top + colRect.height / 2,
        };
      },
    };

    const floatingEl = document.createElement("div");
    floatingEl.className = "floating-menu";
    Object.assign(floatingEl.style, {
      position: "absolute",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "50%",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    });

    const btn = document.createElement("button");
    btn.textContent = "➕";
    btn.className = "btn btn-sm";
    btn.onclick = (ev) => {
      floatingEl.remove();
      ev.stopPropagation();
      this.openNewColumnDialog(event, column, tableConfigData);
    };
    floatingEl.appendChild(btn);
    document.body.appendChild(floatingEl);

    window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
      placement: "right",
      middleware: [offset(() => -40)],
    }).then(({ x, y }: { x: number; y: number }) => {
      Object.assign(floatingEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    let isHovered = false;
    floatingEl.addEventListener("mouseenter", () => {
      isHovered = true;
    });
    floatingEl.addEventListener("mouseleave", () => {
      isHovered = false;
      floatingEl.remove();
    });
  }

  // (V1) Create a Tabulator table with provided data
  async createTableOnPromise(
    name: string,
    tableConfigData: any,
    entries: object[]
  ) {
    try {
      const options = await this.createCommonConfig(tableConfigData, entries);
      const table = new Tabulator(`#${name}`, options);

      if (this.isViewConfigMode()) {
        table.on("dataProcessing", () => {
          // Wait for data to be processed
          table.on("rowMouseEnter", (e: any, row) => {
            // Trigger Action Buttons for rows
            this.showFloatingMenu(table, row, e);
          });

          table.on("headerMouseEnter", (e, column) => {
            // Trigger Action Buttons for column headers
            this.showFloatingColumnMenu(column, e, tableConfigData);
          });
        });
      }
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
    }
  }

  // (V2) Create a Tabulator table with AJAX data loading
  async createTable(
    name: string,
    tableConfigData: any,
    dataProvider: TabulatorDataProvider
  ) {
    try {
      const initialData: object[] = await dataProvider.getAjaxRequestFunc()();

      // Build shared configuration options.
      const options = await this.createCommonConfig(
        tableConfigData,
        initialData
      );

      // Add AJAX specific configuration.
      options.ajaxContentType = "json";

      const table = new Tabulator(`#${name}`, options);

      // Trigger update when table is built.
      table.on("tableBuilt", () => {
        table.setData(initialData);
      });

      if (this.isViewConfigMode()) {
        table.on("rowContext", (e, row) => {
          this.showFloatingMenu(table, row, e);
        });

        table.on("headerContext", (e, column) => {
          this.showFloatingColumnMenu(column, e, tableConfigData);
        });
      }
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
    }
  }

  isViewConfigMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("viewconfigmode")?.toLowerCase() === "true";
  }
}
