const auditService =
    require("../services/auditService");

const {
    sendSuccess,
} = require("../utils/apiResponse");


const getAuditLogs = async (req, res) => {

    const page =
        Math.max(
            parseInt(req.query.page) || 1,
            1
        );


    const limit =
        Math.min(
            Math.max(
                parseInt(req.query.limit) || 10,
                1
            ),
            50
        );


    const action =
        req.query.action || "";


    const resource =
        req.query.resource || "";


    const result =
        await auditService.getAuditLogs(
            page,
            limit,
            action,
            resource
        );


    return sendSuccess(
        res,
        200,
        "Audit logs fetched successfully",
        result
    );
};


module.exports = {
    getAuditLogs,
};