import { storeType, storeTypes } from "@/consts";

export function getStoreType(url: string): storeType {
  for (const [storeType, { regex }] of Object.entries(storeTypes)) {
    if (regex.test(url)) return storeType as storeType;
  }
  throw new Error("Unknown page type");
}
