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
 * Floating UI for Tabulator — row actions, add button, column header button.
 * Focus on small reusable helpers and minimal duplicated logic.
 */
export class TabulatorFloatingUi {
  private baseButtonSize = 40;
  private zIndex = 1000;

  editSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;
  deleteSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
  addSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z"/></svg>`;
  newColumnSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#85283B"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;

  private cleanupFloatingMenus() {
    document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
  }

  /**
   * Wrap $2sxc cms.run with a small adapter so we always pass an acceptable
   * argument type (HTMLElement | number | ContextIdentifier | Sxc).
   *
   * Many Tabulator methods are typed to return Element, which is not assignable
   * to HTMLElement in TS. We therefore prefer an explicit runtime check/cast.
   */
  private safeCmsRun(
    target: Element | HTMLElement,
    action: CommandNames,
    params: any
  ) {
    // Bypass type-check mismatch for $2sxc by casting to any here (we ensured runtime validity above).
    try {
      return ($2sxc as any)(target).cms.run({ action, params });
    } catch (err) {
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
      try {
        onClick(ev);
      } catch (err) {
        console.error("Button click handler error:", err);
      }
    });

    return btn;
  }

  // Generic handlers that wrap $2sxc cms.run calls.
  openEditRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const action = "edit" as CommandNames;
    const rowData = row.getData();
    const params = { entityId: rowData.id };
    return this.safeCmsRun(row.getElement() as Element, action, params);
  }

  openDeleteRowDialog(e: Event, row: RowComponent) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const action = "delete" as CommandNames;
    const rowData = row.getData();
    const params = { entityId: rowData.id, entityGuid: rowData.guid };
    return this.safeCmsRun(row.getElement() as Element, action, params).then(
      (res: any) => {
        try {
          if (res) row.delete();
        } catch (err) {
          console.error("Error deleting row:", err);
        }
        return res;
      }
    );
  }

  openAddRowDialog(
    e: Event,
    table: Tabulator,
    tableConfigData: DataViewTableConfig
  ) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const action = "new" as CommandNames;
    const params = {
      contentType: tableConfigData.dataContentType,
      prefill: {},
    };
    return this.safeCmsRun(table.element as HTMLElement, action, params).then(
      (res: any) => {
        try {
          table.replaceData();
        } catch {
          /* ignore */
        }
        return res;
      }
    );
  }

  openNewColumnDialog(
    e: Event,
    column: ColumnComponent,
    tableConfigData: DataViewTableConfig
  ) {
    e.preventDefault();
    const action = "new" as CommandNames;
    const colDef = column.getDefinition() || {};
    const params = {
      contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
      prefill: {
        Title: colDef.title || "",
        linkEnable: false,
        tooltipEnabled: false,
        ValueSelector: colDef.title || "",
      },
      fields: "DataViewColumnConfig",
      parent: tableConfigData.guid,
    };
    return this.safeCmsRun(
      column.getElement() as Element,
      action,
      params
    ).catch((err: string) => {
      console.error("Error creating new column config:", err);
      throw err;
    });
  }

  openEditColumnDialog(e: Event, column: ColumnComponent, entityId: number) {
    e.preventDefault();
    this.cleanupFloatingMenus();
    const action = "edit" as CommandNames;
    const params = { entityId };
    return this.safeCmsRun(column.getElement() as Element, action, params);
  }

  public showAddButton(table: Tabulator, tableConfigData: DataViewTableConfig) {
    const tableElement = table.element;
    // remove existing
    tableElement
      .querySelectorAll(".table-add-button")
      .forEach((n) => n.remove());

    const container = document.createElement("div");
    container.className = "table-add-button";
    Object.assign(container.style, {
      position: "absolute",
      top: "10px",
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

    const tableRect = table.element.getBoundingClientRect();
    const rowRect = row.getElement().getBoundingClientRect();
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

    if (floatingEl.children.length === 0) return;

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
      Object.assign(floatingEl.style, { left: `${x}px`, top: `${y}px` });
    });

    let isHovered = false;
    floatingEl.addEventListener("mouseenter", () => (isHovered = true));
    floatingEl.addEventListener("mouseleave", () => {
      isHovered = false;
      floatingEl.remove();
    });

    table.on("rowMouseLeave", () => {
      setTimeout(() => {
        if (!isHovered) floatingEl.remove();
      }, 100);
    });
  }

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

  public showFloatingColumnMenu(
    column: ColumnComponent,
    event: Event,
    tableConfigData: DataViewTableConfig
  ) {
    event.preventDefault();
    this.cleanupFloatingMenus();

    const colEl = column.getElement();
    const colRect = colEl.getBoundingClientRect();
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
      tableConfigData.dataViewColumnConfig
    )
      ? tableConfigData.dataViewColumnConfig
      : [];
    const colDef = column.getDefinition() || {};
    const colField = column.getField?.() ?? "";
    const colTitle = (colDef.title ?? colField) || "";

    const colConfig = configuredColumns.find((cfg: any) => {
      const cfgTitle = String(cfg.Title ?? cfg.title ?? "");
      return cfgTitle === colTitle || cfgTitle === colField;
    });

    const alreadyConfigured = !!colConfig;
    const entityId = colConfig ? colConfig.id : 0;

    const btn = this.createIconButton(
      alreadyConfigured ? this.editSvg : this.newColumnSvg,
      alreadyConfigured ? "Edit column" : "Add column",
      (ev) => {
        floatingEl.remove();
        if (!alreadyConfigured)
          this.openNewColumnDialog(ev, column, tableConfigData);
        else this.openEditColumnDialog(ev, column, entityId);
      },
      true
    );

    floatingEl.appendChild(btn);
    document.body.appendChild(floatingEl);

    window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
      placement: "right",
      middleware: [offset(() => -this.baseButtonSize)],
    }).then(({ x, y }: { x: number; y: number }) => {
      Object.assign(floatingEl.style, { left: `${x}px`, top: `${y}px` });
    });

    floatingEl.addEventListener("mouseenter", () => {});
    floatingEl.addEventListener("mouseleave", () => floatingEl.remove());
  }
}
