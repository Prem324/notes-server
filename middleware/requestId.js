const crypto = require("crypto");

const requestId = (req, res, next) => {
    const incomingId = req.get("X-Request-ID");

    const id =
        incomingId && incomingId.length <= 128
            ? incomingId
            : crypto.randomUUID();

    req.requestId = id;

    res.setHeader("X-Request-ID", id);

    next();
};

module.exports = requestId;