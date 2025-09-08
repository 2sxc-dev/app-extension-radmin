import { CommandNames } from "@2sic.com/2sxc-typings";
import { ColumnComponent, RowComponent, Tabulator } from "tabulator-tables";
import { SxcCockpitTableConfig } from "../models/table-config";
import { offset } from "@floating-ui/dom";

declare global {
  interface Window {
    FloatingUIDOM: any;
  }
}

/**
 * Floating UI for Tabulator — row actions, add button, column header button.
 * Focus on small reusable helpers and minimal duplicated logic.
 */
export class TabulatorFloatingUi {
  private baseButtonSize = 40;
  private zIndex = 1000;

  debug = false;

  editSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;
  deleteSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
  addSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z"/></svg>`;
  newColumnSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;

  private log(...args: any[]) {
    if (this.debug) console.log("[TabulatorFloatingUi]", ...args);
  }

  private cleanupFloatingMenus() {
    this.log("Cleaning up floating menus");
    document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
  }

  /**
   * Wrap $2sxc cms.run with a small adapter so we always pass an acceptable
   * argument type (HTMLElement | number | ContextIdentifier | Sxc).
   */
  private safeCmsRun(
    target: Element | HTMLElement,
    action: CommandNames,
    params: any
  ) {
    this.log("safeCmsRun called", { target, action, params });
    try {
      const result = ($2sxc as any)(target).cms.run({ action, params });
      this.log("safeCmsRun result", result);
      return result;
    } catch (err) {
      this.log("safeCmsRun error", err);
      return Promise.reject(err);
    }
  }

  private iconButtonStyle(fullSize = false): Partial<CSSStyleDeclaration> {
    const sizeStyles: Partial<CSSStyleDeclaration> = fullSize
      ? { width: "100%", height: "100%" }
      : {
          width: `${this.baseButtonSize}px`,
          height: `${this.baseButtonSize}px`,
        };

    return {
      ...sizeStyles,
      borderRadius: "50%",
      background: "white",
      border: "1px solid #ccc",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      cursor: "pointer",
      zIndex: String(this.zIndex),
    };
  }

  private createIconButton(
    icon: string,
    title: string,
    onClick: (ev: Event) => any,
    fullSize = false
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = title;
    btn.innerHTML = icon;
    Object.assign(btn.style, this.iconButtonStyle(fullSize));

    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.log("Button clicked", title);
      try {
        onClick(ev);
      } catch (err) {
        console.error("Button click handler error:", err);
      }
    });

    return btn;
  }

  private getEntityIdentifiers(row: RowComponent) {
    const data = row.getData() as any;
    const ids = {
      entityId: data.EntityId ?? data.id,
      entityGuid: data.EntityGuid ?? data.guid,
    };
    this.log("Row data identifiers", ids, data);
    return ids;
  }

  // Generic handlers that wrap $2sxc cms.run calls.
  openEditRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const { entityId } = this.getEntityIdentifiers(row);
    if (!entityId) {
      this.log("No entityId found for edit", row.getData());
      return;
    }
    this.log("Opening edit dialog", entityId);
    return this.safeCmsRun(
      row.getElement() as Element,
      "edit" as CommandNames,
      { entityId }
    );
  }

  openDeleteRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const { entityId, entityGuid } = this.getEntityIdentifiers(row);
    if (!entityId) {
      this.log("No entityId found for delete", row.getData());
      return;
    }
    this.log("Opening delete dialog", { entityId, entityGuid });
    return this.safeCmsRun(
      row.getElement() as Element,
      "delete" as CommandNames,
      {
        entityId,
        entityGuid,
      }
    ).then((res: any) => {
      this.log("Delete result", res);
      try {
        if (res) row.delete();
      } catch (err) {
        this.log("Error deleting row:", err);
      }
      return res;
    });
  }

  openAddRowDialog(
    e: Event,
    table: Tabulator,
    tableConfigData: SxcCockpitTableConfig
  ) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const params = {
      contentType: tableConfigData.dataContentType,
      prefill: {},
    };
    this.log("Opening add row dialog", params);
    return this.safeCmsRun(
      table.element as HTMLElement,
      "new" as CommandNames,
      params
    ).then((res: any) => {
      this.log("Add row result", res);
      try {
        table.replaceData();
      } catch (err) {
        this.log("Error replacing data after add:", err);
      }
      return res;
    });
  }

  openNewColumnDialog(
    e: Event,
    column: ColumnComponent,
    tableConfigData: SxcCockpitTableConfig
  ) {
    e.preventDefault();
    const colDef = column.getDefinition() || {};
    const params = {
      contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
      prefill: {
        Title: colDef.title || "",
        linkEnable: false,
        tooltipEnabled: false,
        ValueSelector: colDef.title || "",
      },
      fields: "ColumnConfigs",
      parent: tableConfigData.guid,
    };
    this.log("Opening new column dialog", params);
    return this.safeCmsRun(
      column.getElement() as Element,
      "new" as CommandNames,
      params
    ).catch((err: string) => {
      this.log("Error creating new column config:", err);
      throw err;
    });
  }

  openEditColumnDialog(e: Event, column: ColumnComponent, entityId: number) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    this.log("Opening edit column dialog", { entityId });
    return this.safeCmsRun(
      column.getElement() as Element,
      "edit" as CommandNames,
      { entityId }
    );
  }

  public showAddButton(table: Tabulator, tableConfigData: SxcCockpitTableConfig) {
    this.log("Adding floating add button to table");
    const tableElement = table.element;
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

    const btn = this.createIconButton(
      this.addSvg,
      "Add row",
      (ev) => this.openAddRowDialog(ev, table, tableConfigData),
      false
    );
    container.appendChild(btn);
    tableElement.appendChild(container);
  }

  private createVirtualElFromRects(x: number, y: number) {
    this.log("Creating virtual element at coords", { x, y });
    return {
      getBoundingClientRect() {
        return {
          width: 0,
          height: 0,
          x,
          y,
          top: y,
          left: x,
          right: x,
          bottom: y,
        };
      },
    };
  }

  private createRowActionFloatingMenu(
    table: Tabulator,
    row: RowComponent,
    event: Event,
    showEdit: boolean,
    showDelete: boolean
  ) {
    event.preventDefault();
    this.cleanupFloatingMenus();
    this.log("Creating row action floating menu", { showEdit, showDelete });

    const tableRect = table.element.getBoundingClientRect();
    const rowRect = row.getElement().getBoundingClientRect();
    this.log("Table rect", tableRect, "Row rect", rowRect);

    const virtualEl = this.createVirtualElFromRects(
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
      const editBtn = this.createIconButton(this.editSvg, "Edit row", (ev) => {
        floatingEl.remove();
        this.openEditRowDialog(ev, row);
      });
      floatingEl.appendChild(editBtn);
    }

    if (showDelete) {
      const deleteBtn = this.createIconButton(
        this.deleteSvg,
        "Delete row",
        (ev) => {
          floatingEl.remove();
          this.openDeleteRowDialog(ev, row);
        }
      );
      floatingEl.appendChild(deleteBtn);
    }

    if (floatingEl.children.length === 0) {
      this.log("No buttons to show in row action menu");
      return;
    }

    document.body.appendChild(floatingEl);
    this.log("Row action floating menu appended");

    window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
      placement: "right",
      middleware: [
        offset(
          () =>
            -(
              (showDelete ? 40 : 0) +
              (showEdit ? 40 : 0) +
              (showDelete && showEdit ? 18 : 12)
            )
        ),
      ],
    }).then(({ x, y }: { x: number; y: number }) => {
      this.log("Computed floating menu position", { x, y });
      Object.assign(floatingEl.style, { left: `${x}px`, top: `${y}px` });
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
    tableConfigData: SxcCockpitTableConfig
  ) {
    event.preventDefault();
    this.cleanupFloatingMenus();
    this.log("Creating floating column menu");

    const colEl = column.getElement();
    const colRect = colEl.getBoundingClientRect();
    this.log("Column rect", colRect);

    const virtualEl = this.createVirtualElFromRects(
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

    const configuredColumns = Array.isArray(
      tableConfigData.columnConfigs
    )
      ? tableConfigData.columnConfigs
      : [];
    const colDef = column.getDefinition() || {};
    const colField = column.getField?.() ?? "";
    const colTitle = (colDef.title ?? colField) || "";

    this.log("Column def", colDef, "colField", colField, "colTitle", colTitle);

    const colConfig = configuredColumns.find((cfg: any) => {
      const cfgTitle = String(cfg.Title ?? cfg.title ?? "");
      return cfgTitle === colTitle || cfgTitle === colField;
    });

    const alreadyConfigured = !!colConfig;
    const entityId = colConfig ? colConfig.id : 0;

    this.log("Column already configured?", alreadyConfigured, colConfig);

    const btn = this.createIconButton(
      alreadyConfigured ? this.editSvg : this.newColumnSvg,
      alreadyConfigured ? "Edit column" : "Add column",
      (ev) => {
        floatingEl.remove();
        if (!alreadyConfigured) {
          this.openNewColumnDialog(ev, column, tableConfigData);
        } else {
          this.openEditColumnDialog(ev, column, entityId);
        }
      },
      true
    );

    floatingEl.appendChild(btn);
    document.body.appendChild(floatingEl);

    window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
      placement: "right",
      middleware: [offset(() => -this.baseButtonSize)],
    }).then(({ x, y }: { x: number; y: number }) => {
      this.log("Computed floating column menu position", { x, y });
      Object.assign(floatingEl.style, { left: `${x}px`, top: `${y}px` });
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
