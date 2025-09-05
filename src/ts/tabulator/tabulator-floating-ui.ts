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
      "➕",
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
      const editBtn = this.createIconButton("✏️", "Edit row", (ev) => {
        floatingEl.remove();
        this.openEditRowDialog(ev, row);
      });
      floatingEl.appendChild(editBtn);
    }

    if (showDelete) {
      const deleteBtn = this.createIconButton("🗑️", "Delete row", (ev) => {
        floatingEl.remove();
        this.openDeleteRowDialog(ev, row);
      });
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
      alreadyConfigured ? "✏️" : "➕",
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
