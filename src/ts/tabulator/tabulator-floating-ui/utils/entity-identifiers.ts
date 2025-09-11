import type { RowComponent } from "tabulator-tables";

/**
 * Extract EntityId / EntityGuid from Tabulator row data.
 * Returns an object shaped as { ids, data } where ids = { entityId, entityGuid }.
 */
export function getEntityIdentifiers(row: RowComponent) {
  const data = row.getData() as any;
  const ids = {
    entityId: data.EntityId ?? data.id,
    entityGuid: data.EntityGuid ?? data.guid,
  };
  return { ids, data };
}
