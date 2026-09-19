/** Compatibility shim — Home Screen nudge lives in `features/a2hs`. */
export {
  isStandalone as isStandaloneDisplay,
  isMobile as isMobileBrowser,
  isIOS as detectIos,
  isAndroid as detectAndroid,
} from "@/components/features/a2hs/env";
export { markAddToHomePending } from "@/components/features/a2hs/actions";
