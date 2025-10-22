import type {
  ColumnComponent,
  RowComponent,
  Tabulator,
} from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import { openAddRowDialog } from "./dialogs/add-row-dialog";
import { openDeleteRowDialog } from "./dialogs/delete-row-dialog";
import { openEditColumnDialog } from "./dialogs/edit-column-dialog";
import { openEditRowDialog } from "./dialogs/edit-row-dialog";
import { openNewColumnDialog } from "./dialogs/new-column-dialog";
import { addSvg, editSvg, deleteSvg, newColumnSvg } from "./lib/icons";
import { createIconButton } from "./utils/button-factory";
import {
  cleanupFloatingMenus,
  createVirtualElFromRects,
  positionFloatingElement,
} from "./utils/floating-menu";
/**
 * Floating UI for Tabulator — row actions, add button, column header button.
 * Focus on small reusable helpers and minimal duplicated logic.
 */
export class TabulatorFloatingUi {
  private baseButtonSize = 40;
  private zIndex = 1000;

  debug = false;

  private log(...args: any[]) {
    if (this.debug) console.log("[TabulatorFloatingUi]", ...args);
  }

  // Wrappers that pass this.log to the splitted dialog modules
  openEditRowDialog(e: Event, row: RowComponent) {
    return openEditRowDialog(e, row, this.log.bind(this));
  }

  openDeleteRowDialog(e: Event, row: RowComponent) {
    return openDeleteRowDialog(e, row, this.log.bind(this));
  }

  openAddRowDialog(e: Event, table: Tabulator, tableConfigData: RadminTableConfig) {
    return openAddRowDialog(e, table, tableConfigData, this.log.bind(this));
  }

  openNewColumnDialog(
    e: Event,
    column: ColumnComponent,
    tableConfigData: RadminTableConfig
  ) {
    return openNewColumnDialog(e, column, tableConfigData, this.log.bind(this));
  }

  openEditColumnDialog(e: Event, column: ColumnComponent, entityId: number) {
    return openEditColumnDialog(e, column, entityId, this.log.bind(this));
  }

  public showAddButton(table: Tabulator, tableConfigData: RadminTableConfig) {
    this.log("Adding floating add button to table");
    const tableElement = table.element as HTMLElement;
    // remove existing
    tableElement
      .querySelectorAll(".table-add-button")
      .forEach((n) => n.remove());

    const container = document.createElement("div");
    container.className = "table-add-button";
    Object.assign(container.style, {
      position: "absolute",
      top: "5px",
      right: "10px",
      zIndex: String(this.zIndex - 900),
      width: `${this.baseButtonSize}px`,
      height: `${this.baseButtonSize}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    const btn = createIconButton(
      addSvg,
      "Add row",
      (ev) => this.openAddRowDialog(ev, table, tableConfigData),
      {
        baseButtonSize: this.baseButtonSize,
        zIndex: this.zIndex,
        fullSize: false,
      }
    );
    container.appendChild(btn);
    tableElement.appendChild(container);
  }

  private createRowActionFloatingMenu(
    table: Tabulator,
    row: RowComponent,
    event: Event,
    showEdit: boolean,
    showDelete: boolean
  ) {
    event.preventDefault();
    cleanupFloatingMenus();
    this.log("Creating row action floating menu", { showEdit, showDelete });

    const tableRect = table.element.getBoundingClientRect();
    const rowRect = row.getElement().getBoundingClientRect();
    this.log("Table rect", tableRect, "Row rect", rowRect);

    const virtualEl = createVirtualElFromRects(
      tableRect.right,
      rowRect.top + rowRect.height / 2
    );

    const floatingEl = document.createElement("div");
    floatingEl.className = "floating-menu";
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
      zIndex: String(this.zIndex),
      pointerEvents: "auto",
    });

    if (showEdit) {
      const editBtn = createIconButton(
        editSvg,
        "Edit row",
        (ev) => {
          floatingEl.remove();
          this.openEditRowDialog(ev, row);
        },
        { baseButtonSize: this.baseButtonSize, zIndex: this.zIndex }
      );
      floatingEl.appendChild(editBtn);
    }

    if (showDelete) {
      const deleteBtn = createIconButton(
        deleteSvg,
        "Delete row",
        (ev) => {
          floatingEl.remove();
          this.openDeleteRowDialog(ev, row);
        },
        { baseButtonSize: this.baseButtonSize, zIndex: this.zIndex }
      );
      floatingEl.appendChild(deleteBtn);
    }

    if (floatingEl.children.length === 0) {
      this.log("No buttons to show in row action menu");
      return;
    }

    document.body.appendChild(floatingEl);
    this.log("Row action floating menu appended");

    // compute offset based on buttons present (mirrors original logic)
    const middlewareOffsetFn = () =>
      -(
        (showDelete ? this.baseButtonSize : 0) +
        (showEdit ? this.baseButtonSize : 0) +
        (showDelete && showEdit ? 18 : 12)
      );

    positionFloatingElement(
      virtualEl,
      floatingEl,
      middlewareOffsetFn,
      "right"
    ).then(({ x, y }) => {
      this.log("Computed floating menu position", { x, y });
    });

    let isHovered = false;
    floatingEl.addEventListener("mouseenter", () => {
      isHovered = true;
      this.log("Floating menu hover start");
    });
    floatingEl.addEventListener("mouseleave", () => {
      isHovered = false;
      this.log("Floating menu hover end — removing");
      floatingEl.remove();
    });

    table.on("rowMouseLeave", () => {
      setTimeout(() => {
        if (!isHovered) {
          this.log("Row mouse leave — removing floating menu");
          floatingEl.remove();
        }
      }, 100);
    });
  }

  public showFloatingMenuEditDelete(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show floating menu (edit + delete)");
    this.createRowActionFloatingMenu(table, row, event, true, true);
  }

  public showFloatingMenuEditOnly(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show floating menu (edit only)");
    this.createRowActionFloatingMenu(table, row, event, true, false);
  }

  public showFloatingMenuDeleteOnly(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show floating menu (delete only)");
    this.createRowActionFloatingMenu(table, row, event, false, true);
  }

  public showFloatingColumnMenu(
    column: ColumnComponent,
    event: Event,
    tableConfigData: RadminTableConfig
  ) {
    event.preventDefault();
    this.log("Creating floating column menu");

    const colEl = column.getElement();
    const colRect = colEl.getBoundingClientRect();
    this.log("Column rect", colRect);

    const virtualEl = createVirtualElFromRects(
      colRect.right,
      colRect.top + colRect.height / 2
    );

    const floatingEl = document.createElement("div");
    floatingEl.className = "floating-menu";
    Object.assign(floatingEl.style, {
      position: "absolute",
      width: `${this.baseButtonSize}px`,
      height: `${this.baseButtonSize}px`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: String(this.zIndex),
      pointerEvents: "auto",
    });

    const configuredColumns = Array.isArray(tableConfigData.columnConfigs)
      ? tableConfigData.columnConfigs
      : [];
    const colDef = column.getDefinition() || {};
    const colField = (column.getField && column.getField()) ?? "";
    const colTitle = (colDef.title ?? colField) || "";

    this.log("Column def", colDef, "colField", colField, "colTitle", colTitle);

    const colConfig = configuredColumns.find((cfg: any) => {
      const cfgTitle = String(cfg.Title ?? cfg.title ?? "");
      return cfgTitle === colTitle || cfgTitle === colField;
    });

    const alreadyConfigured = !!colConfig;
    const entityId = colConfig ? (colConfig.id as number) : 0;

    this.log("Column already configured?", alreadyConfigured, colConfig);

    const btn = createIconButton(
      alreadyConfigured ? editSvg : newColumnSvg,
      alreadyConfigured ? "Edit column" : "Add column",
      (ev) => {
        floatingEl.remove();
        if (!alreadyConfigured) {
          this.openNewColumnDialog(ev, column, tableConfigData);
        } else {
          this.openEditColumnDialog(ev, column, entityId);
        }
      },
      {
        baseButtonSize: this.baseButtonSize,
        zIndex: this.zIndex,
        fullSize: true,
      }
    );

    floatingEl.appendChild(btn);
    document.body.appendChild(floatingEl);

    positionFloatingElement(
      virtualEl,
      floatingEl,
      () => -this.baseButtonSize,
      "right"
    ).then(({ x, y }) => {
      this.log("Computed floating column menu position", { x, y });
    });

    floatingEl.addEventListener("mouseenter", () => {
      this.log("Floating column menu hover start");
    });
    floatingEl.addEventListener("mouseleave", () => {
      this.log("Floating column menu hover end — removing");
      floatingEl.remove();
    });
  }
}
