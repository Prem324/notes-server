const User = require("../models/User");
const Note = require("../models/Note");

const adminService = require("../services/adminService");

jest.mock("../models/User");
jest.mock("../models/Note");

beforeEach(() => {
    jest.clearAllMocks();
});


describe("adminService - getAdminDashboard", () => {

    test("should return admin dashboard statistics", async () => {

        User.countDocuments
            .mockResolvedValueOnce(10) // total users
            .mockResolvedValueOnce(7)  // verified users
            .mockResolvedValueOnce(2); // admin users

        Note.countDocuments
            .mockResolvedValueOnce(25);

        const result =
            await adminService.getAdminDashboard();

        expect(result).toEqual({
            totalUsers: 10,
            totalNotes: 25,
            verifiedUsers: 7,
            adminUsers: 2,
        });

        expect(User.countDocuments)
            .toHaveBeenCalledTimes(3);

        expect(Note.countDocuments)
            .toHaveBeenCalledTimes(1);

        expect(User.countDocuments)
            .toHaveBeenNthCalledWith(1);

        expect(User.countDocuments)
            .toHaveBeenNthCalledWith(2, {
                emailVerified: true,
            });

        expect(User.countDocuments)
            .toHaveBeenNthCalledWith(3, {
                role: "admin",
            });
    });
});


describe("adminService - getAdminUserById", () => {

    test("should return user when user exists", async () => {

        const user = {
            _id: "user123",
            name: "Prem",
            email: "prem@gmail.com",
            emailVerified: true,
            role: "user",
        };

        const select = jest
            .fn()
            .mockResolvedValue(user);

        User.findById.mockReturnValue({
            select,
        });

        const result =
            await adminService.getAdminUserById(
                "user123"
            );

        expect(result).toEqual(user);

        expect(User.findById)
            .toHaveBeenCalledWith("user123");

        expect(select)
            .toHaveBeenCalledWith(
                "_id name email emailVerified role profilePicture createdAt updatedAt"
            );
    });


    test("should throw error when user does not exist", async () => {

        User.findById.mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue(null),
        });

        await expect(
            adminService.getAdminUserById(
                "unknown"
            )
        ).rejects.toThrow(
            "User not found"
        );
    });
});


describe("adminService - deleteAdminUser", () => {

    test("should delete another user", async () => {

        const user = {
            _id: "user123",
            name: "Rahul",
            email: "rahul@gmail.com",
            role: "user",
        };

        User.findById.mockResolvedValue(user);

        User.findByIdAndDelete
            .mockResolvedValue(user);

        const result =
            await adminService.deleteAdminUser(
                "user123",
                "admin123"
            );

        expect(result).toEqual(user);

        expect(User.findById)
            .toHaveBeenCalledWith(
                "user123"
            );

        expect(User.findByIdAndDelete)
            .toHaveBeenCalledWith(
                "user123"
            );
    });


    test("should reject deleting own admin account", async () => {

        await expect(
            adminService.deleteAdminUser(
                "admin123",
                "admin123"
            )
        ).rejects.toThrow(
            "You cannot delete your own admin account"
        );

        expect(User.findById)
            .not.toHaveBeenCalled();

        expect(User.findByIdAndDelete)
            .not.toHaveBeenCalled();
    });


    test("should throw error when deleting nonexistent user", async () => {

        User.findById.mockResolvedValue(null);

        await expect(
            adminService.deleteAdminUser(
                "unknown",
                "admin123"
            )
        ).rejects.toThrow(
            "User not found"
        );

        expect(User.findByIdAndDelete)
            .not.toHaveBeenCalled();
    });
});

describe("adminService - getAdminUsers", () => {

    test("should return paginated users", async () => {

        const users = [
            {
                _id: "user1",
                name: "Prem",
                email: "prem@gmail.com",
                role: "user",
            },
        ];

        const limit = jest.fn()
            .mockReturnThis();

        const skip = jest.fn()
            .mockReturnThis();

        const sort = jest.fn()
            .mockReturnThis();

        const select = jest.fn()
            .mockReturnThis();

        // Final query execution
        limit.mockResolvedValue(users);

        User.find.mockReturnValue({
            select,
            sort,
            skip,
            limit,
        });

        User.countDocuments
            .mockResolvedValue(11);

        const result =
            await adminService.getAdminUsers({
                page: 2,
                limit: 10,
            });

        expect(result.users)
            .toEqual(users);

        expect(result.pagination)
            .toEqual({
                totalUsers: 11,
                currentPage: 2,
                totalPages: 2,
                limit: 10,
                hasNextPage: false,
                hasPrevPage: true,
            });

        expect(User.countDocuments)
            .toHaveBeenCalledTimes(1);
    });
});