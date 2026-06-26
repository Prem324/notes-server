const Joi = require("joi");

const validate = require("../middleware/validate");

describe("validate middleware", () => {
    test("should call next when request body is valid", () => {
        // =====================
        // ARRANGE
        // =====================

        const schema = Joi.object({
            name: Joi.string().required(),
        });

        const req = {
            body: {
                name: "Prem",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = validate(schema);


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(next).toHaveBeenCalled();

        expect(res.status).not.toHaveBeenCalled();

        expect(res.json).not.toHaveBeenCalled();
    });


    test("should return 400 when request body is invalid", () => {
        // =====================
        // ARRANGE
        // =====================

        const schema = Joi.object({
            name: Joi.string().required(),
        });

        const req = {
            body: {},
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const next = jest.fn();

        const middleware = validate(schema);


        // =====================
        // ACT
        // =====================

        middleware(req, res, next);


        // =====================
        // ASSERT
        // =====================

        expect(res.status).toHaveBeenCalledWith(400);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: expect.stringContaining("name"),
        });

        expect(next).not.toHaveBeenCalled();
    });
});