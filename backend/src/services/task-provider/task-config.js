/**
 * @typedef {Record<string, string[]>} TaskCapabilityMap
 * Maps task identifiers to the list of capability method names they are
 * authorized to invoke. This acts as an allowlist enforced at runtime
 * by `TaskCapability` ensuring tasks can only access explicitly
 * permitted operations.
 */

/** @type {TaskCapabilityMap} */
export const taskConfig = {
  "tasks.wines.bulk_import": ["bulkImportWines"]
};
