const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    const sanitized = {};

    Object.keys(obj).forEach((key) => {
        if (key.includes("$") || key.includes(".")) {
            return;
        }

        sanitized[key] = sanitizeObject(obj[key]);
    });

    return sanitized;
};

const sanitizeRequest = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    next();
};

module.exports = sanitizeRequest;