export const AUTH_PAGES = ["/login", "/signup", "/sign-in", "/sign-up"];

export function isAuthedRedirectPage(pathname: string): boolean {
  return pathname === "/" || AUTH_PAGES.includes(pathname);
}
