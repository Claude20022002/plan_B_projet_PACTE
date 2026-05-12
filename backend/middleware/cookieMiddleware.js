export const parseCookies = (req, _res, next) => {
    const header = req.headers.cookie;
    req.cookies = {};

    if (!header) {
        return next();
    }

    for (const item of header.split(";")) {
        const [rawName, ...rawValue] = item.trim().split("=");
        if (!rawName) continue;
        req.cookies[rawName] = decodeURIComponent(rawValue.join("="));
    }

    next();
};
