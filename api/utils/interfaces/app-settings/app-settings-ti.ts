/**
 * This module was automatically generated by `ts-interface-builder`
 */
import * as t from "ts-interface-checker";
// tslint:disable:object-literal-key-quotes

export const IAppSettings = t.iface([], {
  "selectedMenuId": t.union("string", "null"),
  "pinnedNewsIds": t.array("string"),
});

export const IAppSettingsPut = t.iface([], {
  "selectedMenuId": t.opt(t.union("string", "null")),
  "pinnedNewsIds": t.opt(t.array("string")),
});

const exportedTypeSuite: t.ITypeSuite = {
  IAppSettings,
  IAppSettingsPut,
};
export default exportedTypeSuite;
