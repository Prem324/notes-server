const {
    registerSchema,
    loginSchema,
} = require("../validators/authValidator");

describe("auth validators", () => {
    describe("registerSchema", () => {
        test("should pass with valid register data", () => {
            // =====================
            // ARRANGE
            // =====================

            const validData = {
                name: "Prem",
                email: "prem@gmail.com",
                password: "Password123",
            };


            // =====================
            // ACT
            // =====================

            const result = registerSchema.validate(
                validData
            );


            // =====================
            // ASSERT
            // =====================

            expect(result.error).toBeUndefined();

            expect(result.value).toEqual(
                validData
            );
        });


        test("should fail when name is missing", () => {
            const invalidData = {
                email: "prem@gmail.com",
                password: "123456",
            };

            const result = registerSchema.validate(
                invalidData
            );

            expect(result.error).toBeDefined();

            expect(result.error.message).toContain(
                "name"
            );
        });


        test("should fail when email is invalid", () => {
            const invalidData = {
                name: "Prem",
                email: "invalid-email",
                password: "Password123",
            };

            const result = registerSchema.validate(
                invalidData
            );

            expect(result.error).toBeDefined();

            expect(result.error.message).toContain(
                "email"
            );
        });


        test("should fail when password is less than 6 characters", () => {
            const invalidData = {
                name: "Prem",
                email: "prem@gmail.com",
                password: "123",
            };

            const result = registerSchema.validate(
                invalidData
            );

            expect(result.error).toBeDefined();

            expect(result.error.message).toContain(
                "password"
            );
        });
    });


    describe("loginSchema", () => {
        test("should pass with valid login data", () => {
            const validData = {
                email: "prem@gmail.com",
                password: "Password123",
            };

            const result = loginSchema.validate(
                validData
            );

            expect(result.error).toBeUndefined();

            expect(result.value).toEqual(
                validData
            );
        });


        test("should fail when email is missing", () => {
            const invalidData = {
                password: "Password123",
            };

            const result = loginSchema.validate(
                invalidData
            );

            expect(result.error).toBeDefined();

            expect(result.error.message).toContain(
                "email"
            );
        });


        test("should fail when password is missing", () => {
            const invalidData = {
                email: "prem@gmail.com",
            };

            const result = loginSchema.validate(
                invalidData
            );

            expect(result.error).toBeDefined();

            expect(result.error.message).toContain(
                "password"
            );
        });
    });
});