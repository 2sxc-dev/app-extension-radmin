import { CommandNames } from "@2sic.com/2sxc-typings";
import { ColumnComponent, RowComponent, Tabulator } from "tabulator-tables";
import { DataViewTableConfig } from "../models/data-view-table-config";
import { offset } from "@floating-ui/dom";

declare global {
  interface Window {
    FloatingUIDOM: any;
  }
}

/**
 * TabulatorFloatingUi
 * Handles floating UI for Tabulator tables (row actions, add button, column header button).
 *
 * All action buttons share the same visual styling (circular 40x40 with border, shadow, centered icon).
 * The adapter decides which floating UI variant to call (so we don't read dataset flags or pass the full config).
 */
export class TabulatorFloatingUi {
  /**
   * Clean up any lingering floating menus.
   */
  private cleanupFloatingMenus(): void {
    document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
  }

  /**
   * Helper to create a button element with a given icon/text and handler.
   * All buttons use the same circular styling. If fullSize is true, the button
   * will be sized to 100%/100% to fill its parent container (useful for the
   * column-header single-button floating element).
   */
  private createIconButton(
    icon: string,
    title: string,
    onClick: (ev: Event) => any,
    fullSize = false
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = icon;
    btn.title = title;
    btn.type = "button";

    // Apply base styles
    Object.assign(
      btn.style,
      // For fullSize, width/height will be set to 100% so it fills the floatingEl container.
      {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "white",
        border: "1px solid #ccc",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0",
        cursor: "pointer",
        zIndex: "1000",
      } as Partial<CSSStyleDeclaration>
    );

    btn.onclick = (ev) => {
      ev.stopPropagation();
      try {
        onClick(ev);
      } catch (err) {
        console.error("Button click handler error:", err);
      }
    };

    return btn;
  }

  /**
   * Open the toolbar for a click event.
   * @param e - The click event.
   * @param row - The Tabulator row instance.
   */
  openEditRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    // Cleanup any lingering floating menus before opening the dialog
    this.cleanupFloatingMenus();

    const action = "edit";

    const rowData = row.getData();
    const params = { entityId: rowData.id };

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
   * Open the dialog to delete a row.
   * @param e - The click event.
   * @param row - The Tabulator row instance.
   */
  openDeleteRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    this.cleanupFloatingMenus();

    const action = "delete" as CommandNames;

    const rowData = row.getData();

    const params = {
      entityId: rowData.id,
      entityGuid: rowData.guid,
    };

    return $2sxc(row.getElement())
      .cms.run({
        action,
        params,
      })
      .then((data: any) => {
        // Remove the row from the table after successful deletion
        row.delete();
        return data;
      })
      .catch((err: string) => {
        console.error("Error running cms action: ", err);
        throw err;
      });
  }

  /**
   * Open the dialog to add a new row.
   * @param e - The click event.
   * @param table - The Tabulator table instance.
   * @param tableConfigData - The table configuration data.
   */
  openAddRowDialog(
    e: Event,
    table: Tabulator,
    tableConfigData: DataViewTableConfig
  ) {
    e.preventDefault();
    this.cleanupFloatingMenus();

    const action = "new";

    // Determine the content type from the table config
    const contentType = tableConfigData.dataContentType;

    const params = {
      contentType: contentType,
      prefill: {},
    };

    return $2sxc(table.element)
      .cms.run({
        action: action as CommandNames,
        params: params,
      })
      .then((data: any) => {
        // Reload the table data after successful addition
        table.replaceData();
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
   */
  openNewColumnDialog(
    e: Event,
    column: ColumnComponent,
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
   * Open the dialog to edit an existing DataViewColumnConfig on right-click on a column header.
   */
  async openEditColumnDialog(
    e: Event,
    column: ColumnComponent,
    entityId: number
  ) {
    e.preventDefault();
    this.cleanupFloatingMenus();

    const action = "edit";

    const params = { entityId };

    return $2sxc(column.getElement())
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
   * Shows the add button for adding new rows at the top of the table.
   * @param table - The Tabulator table instance.
   * @param tableConfigData - The table configuration data.
   *
   * The add button uses the same circular 40x40 styling as all other action buttons.
   */
  public showAddButton(table: Tabulator, tableConfigData: DataViewTableConfig) {
    const tableElement = table.element;

    // Remove any existing add buttons first
    const existingButtons = tableElement.querySelectorAll(".table-add-button");
    existingButtons.forEach((btn) => btn.remove());

    const addButtonContainer = document.createElement("div");
    addButtonContainer.className = "table-add-button";
    Object.assign(addButtonContainer.style, {
      position: "absolute",
      top: "10px",
      right: "10px",
      zIndex: "100",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    // Use helper for creating the button — same circular styling, not full-size since container is fixed.
    const addButton = this.createIconButton(
      "➕",
      "Add row",
      (ev) => this.openAddRowDialog(ev, table, tableConfigData),
      false
    );

    addButtonContainer.appendChild(addButton);
    tableElement.appendChild(addButtonContainer);
  }

  /**
   * Internal helper to create and display floating UI for row actions.
   * showEdit/showDelete control which circular buttons are rendered. The container
   * itself is transparent so no rectangle background is visible — only the circular
   * buttons are displayed.
   */
  private createRowActionFloatingMenu(
    table: Tabulator,
    row: RowComponent,
    event: Event,
    showEdit: boolean,
    showDelete: boolean
  ) {
    event.preventDefault();
    this.cleanupFloatingMenus();

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
    // Make the container transparent / borderless so only the circular buttons are visible.
    Object.assign(floatingEl.style, {
      position: "absolute",
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      zIndex: "1000",
      pointerEvents: "auto",
    });

    if (showEdit) {
      const editBtn = this.createIconButton("✏️", "Edit row", () => {
        // close the floating menu before opening dialog
        floatingEl.remove();
        this.openEditRowDialog(event, row);
      });
      floatingEl.appendChild(editBtn);
    }

    if (showDelete) {
      const deleteBtn = this.createIconButton("🗑️", "Delete row", () => {
        floatingEl.remove();
        this.openDeleteRowDialog(event, row);
      });
      floatingEl.appendChild(deleteBtn);
    }

    // Only add to DOM if we have buttons to show
    if (floatingEl.children.length > 0) {
      document.body.appendChild(floatingEl);

      window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
        placement: "right",
        middleware: [
          offset(
            // Calculate how much to offset based on which buttons are shown
            () =>
              -(
                (showDelete ? 40 : 0) +
                (showEdit ? 40 : 0) +
                (showDelete && showEdit ? 18 : 12)
              )
          ),
        ], // Two buttons + padding
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
      // rely on the table event to remove with small delay when not hovered.
      table.on("rowMouseLeave", () => {
        setTimeout(() => {
          if (!isHovered) {
            floatingEl.remove();
          }
        }, 100);
      });
    }
  }

  /**
   * Exposed variants for the adapter to call based on adapter-level flags.
   * The adapter decides which of these to call and therefore we avoid
   * passing configuration objects or datasets into the floating UI.
   */
  public showFloatingMenuEditDelete(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.createRowActionFloatingMenu(table, row, event, true, true);
  }

  public showFloatingMenuEditOnly(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.createRowActionFloatingMenu(table, row, event, true, false);
  }

  public showFloatingMenuDeleteOnly(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.createRowActionFloatingMenu(table, row, event, false, true);
  }

  /**
   * Show floating menu for column headers.
   * The floatingEl is sized to 40x40 and the inner button fills it, so the visible
   * element is a single circular button placed at the computed position.
   */
  public showFloatingColumnMenu(
    column: ColumnComponent,
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
    // sized to match the desired 40x40 circular button
    Object.assign(floatingEl.style, {
      position: "absolute",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
      pointerEvents: "auto",
    });

    // Defensive: ensure dataViewColumnConfig is an array
    const configuredColumns = Array.isArray(
      tableConfigData.dataViewColumnConfig
    )
      ? tableConfigData.dataViewColumnConfig
      : [];

    const colDef = column.getDefinition();
    const colField = column.getField?.() ?? "";
    const colTitle = (colDef && (colDef.title ?? "")) || colField;

    // Try to find a matching config. Support different casings and fallbacks for fields.
    const colConfig = (configuredColumns as any[]).find((cfg: any) => {
      const cfgTitle = (cfg.Title ?? cfg.title ?? "").toString();

      const titleMatchesTitle = cfgTitle === colTitle;
      const titleMatchesField = cfgTitle === colField;

      return titleMatchesTitle || titleMatchesField;
    });

    const alreadyConfigured = !!colConfig;

    // Use type-cast to `any` when reading possible id variants to satisfy TS.
    const entityId = colConfig ? Number(colConfig.id) : 0;

    // Create a button that fills the floatingEl (fullSize = true) so the UI appears exactly like the previous circular + button
    const btn = this.createIconButton(
      alreadyConfigured ? "✏️" : "➕",
      alreadyConfigured ? "Edit column" : "Add column",
      (ev) => {
        // remove floating before launching the cms dialog
        floatingEl.remove();
        if (!alreadyConfigured)
          this.openNewColumnDialog(event, column, tableConfigData);
        else this.openEditColumnDialog(event, column, entityId);
      },
      true
    );

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
}
