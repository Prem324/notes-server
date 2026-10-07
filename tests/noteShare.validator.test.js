const {
    shareNoteSchema,
    updatePermissionSchema,
} = require("../validators/noteShareValidator");

describe("Note Share Validators", () => {
    describe("shareNoteSchema", () => {
        it("should accept valid share data", () => {
            const { error } = shareNoteSchema.validate({
                email: "john@example.com",
                permission: "editor",
            });

            expect(error).toBeUndefined();
        });

        it("should reject invalid email", () => {
            const { error } = shareNoteSchema.validate({
                email: "invalid-email",
                permission: "viewer",
            });

            expect(error).toBeDefined();
        });

        it("should reject invalid permission", () => {
            const { error } = shareNoteSchema.validate({
                email: "john@example.com",
                permission: "admin",
            });

            expect(error).toBeDefined();
        });

        it("should require email", () => {
            const { error } = shareNoteSchema.validate({
                permission: "viewer",
            });

            expect(error).toBeDefined();
        });

        it("should require permission", () => {
            const { error } = shareNoteSchema.validate({
                email: "john@example.com",
            });

            expect(error).toBeDefined();
        });
    });

    describe("updatePermissionSchema", () => {
        it("should accept viewer", () => {
            const { error } =
                updatePermissionSchema.validate({
                    permission: "viewer",
                });

            expect(error).toBeUndefined();
        });

        it("should accept editor", () => {
            const { error } =
                updatePermissionSchema.validate({
                    permission: "editor",
                });

            expect(error).toBeUndefined();
        });

        it("should reject invalid permission", () => {
            const { error } =
                updatePermissionSchema.validate({
                    permission: "admin",
                });

            expect(error).toBeDefined();
        });
    });
});