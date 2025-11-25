import type {
  ColumnComponent,
  RowComponent,
  Tabulator,
} from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import {
  cleanupToolbars,
  createVirtualElFromRects,
  positionToolbarElement,
} from "./utils/toolbar-positioning";
import { CommandNames } from "@2sic.com/2sxc-typings";

declare const $2sxc: any;
const winAny = window as any;
winAny.tabulatorToolbars = winAny.tabulatorToolbars || {};

/**
 * 2sxc Toolbar integration for Tabulator
 * Uses native 2sxc toolbars to create toolbars for rows and columns
 */
export class TabulatorToolbars {
  private baseButtonSize = 32;
  private zIndex = 1000;

  debug = false;

  private log(...args: any[]) {
    if (this.debug) console.log("[tabulatorToolbars]", ...args);
  }

  public showAddButton(table: Tabulator, tableConfigData: RadminTableConfig) {
    this.log("Adding add button to table");
    const tableElement = table.element as HTMLElement;

    // remove existing
    tableElement
      .querySelectorAll(".table-add-button")
      .forEach((n) => n.remove());

    const sxc = $2sxc(tableElement);
    if (!sxc.isEditMode()) {
      this.log("Not in edit mode, skipping add button");
      return;
    }

    const contentType = tableConfigData.dataContentType || "Default";
    const toolbarHtml = sxc.manage.getToolbar({
      contentType,
      action: "new",
      prefill: {},
    });

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

    container.innerHTML = toolbarHtml;
    tableElement.appendChild(container);

    this.observeToolbarMutations(container, toolbarHtml);
  }

  private createRowActioToolbar(
    table: Tabulator,
    row: RowComponent,
    event: Event,
    showEdit: boolean,
    showDelete: boolean
  ) {
    event.preventDefault();
    cleanupToolbars();
    this.log("Creating row action toolbar", { showEdit, showDelete });

    const sxc = $2sxc(table.element);
    if (!sxc.isEditMode()) {
      this.log("Not in edit mode, skipping toolbar");
      return;
    }

    const data = row.getData() as any;
    const entityId = data.EntityId ?? data.id;
    const entityGuid = data.EntityGuid ?? data.guid;

    // Try common title fields - delete requires entityTitle
    const entityTitle = data.title ?? "";

    this.log("Entity identifiers for toolbar", {
      entityId,
      entityGuid,
      entityTitle,
    });

    if (!entityId) {
      this.log("No entityId found for toolbar");
      return;
    }

    const tableRect = table.element.getBoundingClientRect();
    const rowRect = row.getElement().getBoundingClientRect();
    this.log("Table rect", tableRect, "Row rect", rowRect);

    const virtualEl = createVirtualElFromRects(
      tableRect.right,
      rowRect.top + rowRect.height / 2
    );

    const toolbarEl = document.createElement("div");
    toolbarEl.className = "toolbar-menu";
    Object.assign(toolbarEl.style, {
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

    // Build actions array and include entityTitle for delete if available
    const actions: CommandNames[] = [];
    if (showEdit) {
      actions.push({
        entityId,
        action: "edit",
        ...(entityGuid && { entityGuid }),
      });
    }

    const canRequestDelete = !!entityId && !!entityGuid && !!entityTitle;
    if (showDelete) {
      if (canRequestDelete) {
        actions.push({
          entityId,
          action: "delete",
          ...(entityGuid && { entityGuid }),
          entityTitle, // required for delete button to appear
        });
      } else {
        this.log(
          "Skipping server delete toolbar request because entityTitle/entityGuid missing or empty. Will not request native delete button.",
          { entityTitle, entityGuid }
        );
      }
    }

    if (actions.length === 0) {
      this.log("No actions to show in row action menu");
      return;
    }

    // Request combined toolbar HTML from 2sxc
    const toolbarHtml = sxc.manage.getToolbar(actions);
    this.log("Generated toolbar HTML:", toolbarHtml);

    // Insert toolbar HTML into floating container
    toolbarEl.innerHTML = toolbarHtml;

    // If delete was requested but server did not include a delete button,
    // the toolbarHtml will not contain a delete <li>. We log for diagnostics.
    if (showDelete) {
      const hasDelete =
        toolbarEl.querySelector &&
        !!toolbarEl.querySelector('a[onclick*="delete"]');
      this.log("Server returned delete button present:", hasDelete);
    }

    document.body.appendChild(toolbarEl);
    this.log("Row action toolbar appended");

    // compute offset based on buttons present (mirrors original logic)
    const middlewareOffsetFn = () =>
      -(
        (showDelete ? this.baseButtonSize : 0) +
        (showEdit ? this.baseButtonSize : 0) +
        (showDelete && showEdit ? 16 : 12)
      );

    positionToolbarElement(
      virtualEl,
      toolbarEl,
      middlewareOffsetFn,
    ).then(({ x, y }) => {
      this.log("Computed toolbar position", { x, y });
    });

    let isHovered = false;
    toolbarEl.addEventListener("mouseenter", () => {
      isHovered = true;
      this.log("Toolbar hover start");
    });
    toolbarEl.addEventListener("mouseleave", () => {
      isHovered = false;
      this.log("Toolbar hover end — removing");
      toolbarEl.remove();
    });

    table.on("rowMouseLeave", () => {
      setTimeout(() => {
        if (!isHovered) {
          this.log("Row mouse leave — removing toolbar");
          toolbarEl.remove();
        }
      }, 100);
    });
  }

  public showEditDeleteToolbar(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show (edit + delete) toolbar");
    this.createRowActioToolbar(table, row, event, true, true);
  }

  public showEditOnlyToolbar(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show (edit only) toolbar");
    this.createRowActioToolbar(table, row, event, true, false);
  }

  public showDeleteOnlyToolbar(
    table: Tabulator,
    row: RowComponent,
    event: Event
  ) {
    this.log("Show (delete only) toolbar");
    this.createRowActioToolbar(table, row, event, false, true);
  }

  public showColumnToolbar(
    column: ColumnComponent,
    event: Event,
    tableConfigData: RadminTableConfig
  ) {
    event.preventDefault();
    this.log("Creating column toolbar");

    const table = column.getTable();
    const sxc = $2sxc(table.element);

    if (!sxc.isEditMode()) {
      this.log("Not in edit mode, skipping column toolbar");
      return;
    }

    const colEl = column.getElement();
    const colRect = colEl.getBoundingClientRect();
    this.log("Column rect", colRect);

    const virtualEl = createVirtualElFromRects(
      colRect.right,
      colRect.top + colRect.height / 2
    );

    const toolbarEl = document.createElement("div");
    toolbarEl.className = "toolbar-menu";
    Object.assign(toolbarEl.style, {
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

    let toolbarHtml: string;
    if (alreadyConfigured) {
      toolbarHtml = sxc.manage.getToolbar({
        entityId,
        action: "edit",
      });
    } else {
      const valueSelector =
        colField && colField.trim() !== ""
          ? colField
          : colTitle.replace(/\s+/g, "");

      toolbarHtml = sxc.manage.getToolbar({
        contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
        action: "new",
        prefill: {
          Title: colTitle,
          linkEnable: false,
          tooltipEnabled: false,
          ValueSelector: valueSelector,
        },
        fields: "ColumnConfigs",
        parent: tableConfigData.guid,
      });
    }

    toolbarEl.innerHTML = toolbarHtml;
    document.body.appendChild(toolbarEl);

    positionToolbarElement(
      virtualEl,
      toolbarEl,
      () => -this.baseButtonSize,
    ).then(({ x, y }) => {
      this.log("Computed column toolbar position", { x, y });
    });

    toolbarEl.addEventListener("mouseenter", () => {
      this.log("Column toolbar hover start");
    });
    toolbarEl.addEventListener("mouseleave", () => {
      this.log("Column toolbar hover end — removing");
      toolbarEl.remove();
    });
  }

  private observeToolbarMutations(wrapper: HTMLElement, originalHtml: string) {
    const observer = new MutationObserver(() => {
      this.log("Toolbar mutated, restoring original HTML");
      wrapper.innerHTML = originalHtml;
    });

    observer.observe(wrapper, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
}
