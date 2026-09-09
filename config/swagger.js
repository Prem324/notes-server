const swaggerJsdoc = require("swagger-jsdoc");
const config=require("./env");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Notes API",
            version: "1.0.0",
            description:
                "API documentation for Notes API built with Express, MongoDB, JWT, Cloudinary, and Jest.",
        },
        servers: [
            {
                url: config.serverUrl,
                description: "Current server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                ErrorResponse: {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: false,
        },
        message: {
            type: "string",
            example: "Invalid resource ID",
        },
        requestId: {
            type: "string",
            format: "uuid",
            example: "89bec1dd-8ec1-4713-9e42-536d02559790",
        },
    },
},
                SuccessResponse: {
    type: "object",
    properties: {
        success: {
            type: "boolean",
            example: true,
        },
        message: {
            type: "string",
            example: "Operation successful",
        },
        data: {
            type: "object",
            additionalProperties: true,
        },
    },
},

Pagination: {
    type: "object",
    properties: {
        totalNotes: {
            type: "integer",
            example: 11,
        },
        currentPage: {
            type: "integer",
            example: 1,
        },
        totalPages: {
            type: "integer",
            example: 2,
        },
        limit: {
            type: "integer",
            example: 10,
        },
        hasNextPage: {
            type: "boolean",
            example: true,
        },
        hasPrevPage: {
            type: "boolean",
            example: false,
        },
    },
},


            },
        },
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;