/**
 * Week wrap checks. No database.
 *
 *   npx tsx scripts/verify-week-wrap.ts
 */
import { verifyTouchdownSearch } from "./week-wrap-verify/search";

import "./week-wrap-verify/when";
import "./week-wrap-verify/dedupe";
import "./week-wrap-verify/copy";
import "./week-wrap-verify/wiring";

verifyTouchdownSearch()
  .then(() => {
    console.log("\nverify-week-wrap OK");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
