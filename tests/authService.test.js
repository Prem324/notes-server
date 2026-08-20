const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

const User = require("../models/User");

jest.mock("../services/emailService", () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

const {
    loginUser,
    registerUser,
} = require("../services/authService");

jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("authService - loginUser", () => {

    test("should return access token and refresh token for valid verified credentials", async () => {

        // ARRANGE

        const user = {
            _id: "123",
            email: "test@gmail.com",
            password: "hashedPassword",
            role: "user",
            emailVerified: true,
            save: jest.fn().mockResolvedValue(true),
        };

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user),
        });

        bcrypt.compare.mockResolvedValue(true);

        jwt.sign.mockReturnValue("fake-access-token");


        // ACT

        const result = await loginUser(
            "test@gmail.com",
            "123456"
        );


        // ASSERT

        expect(result.accessToken).toBe(
            "fake-access-token"
        );

        expect(result.refreshToken).toBeDefined();

        expect(User.findOne).toHaveBeenCalledWith({
            email: "test@gmail.com",
        });

        expect(bcrypt.compare).toHaveBeenCalledWith(
            "123456",
            "hashedPassword"
        );

        expect(jwt.sign).toHaveBeenCalledWith(
            {
                id: "123",
                role: "user",
            },
            config.jwtSecret,
            {
                expiresIn: config.jwtExpiresIn,
            }
        );

        expect(user.save).toHaveBeenCalledTimes(1);
    });


    test("should throw error when user does not exist", async () => {

        User.findOne.mockReturnValue({
            select: jest.fn()
                .mockResolvedValue(null),
        });

        await expect(
            loginUser(
                "wrong@gmail.com",
                "123456"
            )
        ).rejects.toThrow(
            "Invalid credentials"
        );

        expect(User.findOne)
            .toHaveBeenCalledWith({
                email: "wrong@gmail.com",
            });
    });


    test("should reject login when email is not verified", async () => {

        const user = {
            _id: "123",
            email: "test@gmail.com",
            password: "hashedPassword",
            role: "user",
            emailVerified: false,
            save: jest.fn(),
        };

        User.findOne.mockReturnValue({
            select: jest.fn()
                .mockResolvedValue(user),
        });

        await expect(
            loginUser(
                "test@gmail.com",
                "123456"
            )
        ).rejects.toThrow(
            "Please verify your email before logging in"
        );

        expect(bcrypt.compare)
            .not.toHaveBeenCalled();

        expect(jwt.sign)
            .not.toHaveBeenCalled();
    });


    test("should throw error when password is incorrect", async () => {

        const user = {
            _id: "123",
            email: "test@gmail.com",
            password: "hashedPassword",
            role: "user",
            emailVerified: true,
            save: jest.fn(),
        };

        User.findOne.mockReturnValue({
            select: jest.fn()
                .mockResolvedValue(user),
        });

        bcrypt.compare.mockResolvedValue(false);

        await expect(
            loginUser(
                "test@gmail.com",
                "wrong-password"
            )
        ).rejects.toThrow(
            "Invalid credentials"
        );

        expect(bcrypt.compare)
            .toHaveBeenCalledWith(
                "wrong-password",
                "hashedPassword"
            );

        expect(user.save)
            .not.toHaveBeenCalled();
    });

});


describe("authService - registerUser", () => {

    test("should register user successfully", async () => {

        // ARRANGE

        User.findOne.mockResolvedValue(null);

        bcrypt.hash.mockResolvedValue(
            "hashedPassword"
        );

        const savedUser = {
            _id: "123",
            name: "Prem",
            email: "prem@gmail.com",
            password: "hashedPassword",

            // IMPORTANT
            save: jest.fn()
                .mockResolvedValue(true),
        };

        User.create.mockResolvedValue(
            savedUser
        );


        // ACT

        const result = await registerUser({
            name: "Prem",
            email: "prem@gmail.com",
            password: "123456",
        });


        // ASSERT

        expect(result).toBe(savedUser);

        expect(User.findOne)
            .toHaveBeenCalledWith({
                email: "prem@gmail.com",
            });

        expect(bcrypt.hash)
            .toHaveBeenCalledWith(
                "123456",
                10
            );

        expect(User.create)
            .toHaveBeenCalledWith({
                name: "Prem",
                email: "prem@gmail.com",
                password: "hashedPassword",
            });

        expect(savedUser.save)
            .toHaveBeenCalledTimes(1);
    });


    test("should throw error when email already exists", async () => {

        User.findOne.mockResolvedValue({
            _id: "123",
            email: "prem@gmail.com",
        });

        await expect(
            registerUser({
                name: "Prem",
                email: "prem@gmail.com",
                password: "123456",
            })
        ).rejects.toThrow(
            "Email already exists"
        );

        expect(bcrypt.hash)
            .not.toHaveBeenCalled();

        expect(User.create)
            .not.toHaveBeenCalled();
    });


    test("should hash password before saving user", async () => {

        User.findOne.mockResolvedValue(null);

        bcrypt.hash.mockResolvedValue(
            "hashedPassword"
        );

        const savedUser = {
            _id: "123",
            name: "Prem",
            email: "prem@gmail.com",
            password: "hashedPassword",
            save: jest.fn()
                .mockResolvedValue(true),
        };

        User.create.mockResolvedValue(
            savedUser
        );


        await registerUser({
            name: "Prem",
            email: "prem@gmail.com",
            password: "123456",
        });


        expect(bcrypt.hash)
            .toHaveBeenCalledWith(
                "123456",
                10
            );

        expect(User.create)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    password: "hashedPassword",
                })
            );

        expect(savedUser.save)
            .toHaveBeenCalled();
    });

});
