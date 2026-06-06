/** True when a selected column does not exist on the table (schema not fully migrated). */
export function isMissingColumnError(error: {
  code?: string;
  message?: string;
} | null | undefined): boolean {
  if (!error) return false;
  return error.code === "42703" || (error.message ?? "").toLowerCase().includes("does not exist");
}

/** True when a filter value is not a valid UUID for a uuid column. */
export function isInvalidUuidError(error: {
  code?: string;
  message?: string;
} | null | undefined): boolean {
  if (!error) return false;
  return error.code === "22P02" || (error.message ?? "").toLowerCase().includes("invalid input syntax for type uuid");
}

/** True when PostgREST/Postgres reports the table or relation is missing. */
export function isMissingTableError(error: {
  code?: string;
  message?: string;
  status?: number;
  statusCode?: number;
} | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  const status = error.status ?? error.statusCode;
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    status === 404 ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("relation") && msg.includes("not exist")
  );
}
