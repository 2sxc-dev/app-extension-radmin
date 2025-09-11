import { CommandNames } from "@2sic.com/2sxc-typings";

/**
 * Small adapter to call $2sxc(...).cms.run safely and consistently.
 * Returns a promise or rejects with the caught error.
 */
export function safeCmsRun(
  target: Element | HTMLElement,
  action: CommandNames,
  params: any
): Promise<any> {
  try {
    // $2sxc is expected to be globally available in the environment where this runs
    // Keep this wrapper minimal so it can be unit tested/mocked easily.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = ($2sxc as any)(target).cms.run({ action, params });
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}
