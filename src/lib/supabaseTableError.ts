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
