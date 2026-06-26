const sanitizeRequest = require("../middleware/sanitizeRequest");

describe("sanitizeRequest middleware", () => {
    test("should remove keys starting with $ from req.body", () => {
        const req = {
            body: {
                email: "prem@gmail.com",
                "$ne": null,
            },
        };

        const res = {};
        const next = jest.fn();

        sanitizeRequest(req, res, next);

        expect(req.body).toEqual({
            email: "prem@gmail.com",
        });

        expect(next).toHaveBeenCalled();
    });

    test("should remove keys containing dot notation from req.body", () => {
        const req = {
            body: {
                name: "Prem",
                "profile.role": "admin",
            },
        };

        const res = {};
        const next = jest.fn();

        sanitizeRequest(req, res, next);

        expect(req.body).toEqual({
            name: "Prem",
        });

        expect(next).toHaveBeenCalled();
    });

    test("should sanitize nested objects", () => {
        const req = {
            body: {
                user: {
                    email: "prem@gmail.com",
                    "$or": [],
                },
            },
        };

        const res = {};
        const next = jest.fn();

        sanitizeRequest(req, res, next);

        expect(req.body).toEqual({
            user: {
                email: "prem@gmail.com",
            },
        });

        expect(next).toHaveBeenCalled();
    });

    test("should sanitize arrays", () => {
        const req = {
            body: {
                items: [
                    {
                        title: "Note 1",
                        "$where": "malicious",
                    },
                    {
                        title: "Note 2",
                    },
                ],
            },
        };

        const res = {};
        const next = jest.fn();

        sanitizeRequest(req, res, next);

        expect(req.body).toEqual({
            items: [
                {
                    title: "Note 1",
                },
                {
                    title: "Note 2",
                },
            ],
        });

        expect(next).toHaveBeenCalled();
    });
});