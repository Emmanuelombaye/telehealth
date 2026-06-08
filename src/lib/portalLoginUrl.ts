/** Login URL for a protected portal path (shared by ProtectedRoute + session guard). */
export function portalLoginUrl(path: string): string {
  const care = path.match(/^\/care\/([^/]+)/);
  if (care) {
    const slug = care[1];
    const rest = path.slice(`/care/${slug}`.length);
    if (rest.startsWith("/admin")) return `/care/${slug}/admin/login`;
    if (rest.startsWith("/affiliate")) return `/care/${slug}/affiliate/login`;
    return `/care/${slug}/login`;
  }
  if (path.startsWith("/doctor")) return "/doctor/login";
  if (path.startsWith("/providers")) return "/providers/login";
  if (path.startsWith("/pharmacy")) return "/pharmacy/login";
  if (path.startsWith("/admin")) return "/admin/login";
  if (path.startsWith("/superadmin")) return "/superadmin/login";
  if (path.startsWith("/affiliate")) return "/affiliate/login";
  if (path.startsWith("/patient")) return "/login";
  return "/login";
}
