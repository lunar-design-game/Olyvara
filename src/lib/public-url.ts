export function getPublicOrigin(request: Request) {
  const configuredBase = process.env.APP_BASE_URL?.trim();
  if (configuredBase) return new URL(configuredBase).origin;

  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  let host = forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
  if (/^0\.0\.0\.0(?::\d+)?$/.test(host)) host = `localhost:${requestUrl.port || "3000"}`;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol ?? requestUrl.protocol.slice(0, -1);
  return new URL(`${protocol}://${host}`).origin;
}