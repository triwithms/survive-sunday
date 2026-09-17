/**
 * Preflight for `npm run db:push` / `setup`. Not a Vercel build step.
 * Blocks production Neon unless ALLOW_PROD_DB_MUTATION=1.
 */
import { assertNotProdNeon } from "./assert-not-production";

assertNotProdNeon(process.argv[2] ?? "db-mutation");
