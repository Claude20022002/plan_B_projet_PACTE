import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE = isProduction ? "__Host-access_token" : "access_token";
export const REFRESH_COOKIE = isProduction ? "__Host-refresh_token" : "refresh_token";
export const CSRF_COOKIE = isProduction ? "__Host-csrf_token" : "csrf_token";

export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.JWT_ACCESS_TTL_SECONDS || 15 * 60);
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || 7);

const sameSite = process.env.COOKIE_SAMESITE || "lax";

export const accessCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
};

export const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/api/auth/refresh",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export const csrfCookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export const makeRefreshExpiry = () => {
    const expires = new Date();
    expires.setDate(expires.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return expires;
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
    res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
};

export const clearAuthCookies = (res) => {
    res.clearCookie(ACCESS_COOKIE, { ...accessCookieOptions, maxAge: undefined });
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: undefined });
    res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions, maxAge: undefined });
};

export const randomToken = (bytes = 64) => crypto.randomBytes(bytes).toString("base64url");

export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const hmac = (value) => {
    const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET || "dev_csrf_secret";
    return crypto.createHmac("sha256", secret).update(value).digest("base64url");
};

export const buildCsrfToken = (sessionId = "anonymous") => {
    const nonce = randomToken(32);
    const payload = `${sessionId}.${nonce}`;
    return `${payload}.${hmac(payload)}`;
};

export const verifyCsrfToken = (token, sessionId = "anonymous") => {
    if (!token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [tokenSessionId, nonce, signature] = parts;
    if (sessionId && tokenSessionId !== sessionId) return false;
    if (!tokenSessionId || !nonce || !signature) return false;

    const payload = `${tokenSessionId}.${nonce}`;
    const expected = hmac(payload);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

export const setCsrfCookie = (res, sessionId = "anonymous") => {
    const token = buildCsrfToken(sessionId);
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions);
    return token;
};
