const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");
const authService = require("../../services/authService");

jest.mock("../../models/User");
jest.mock("jsonwebtoken");

describe("refreshAccessToken", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should reject when refresh token is missing", async () => {
        await expect(
            authService.refreshAccessToken()
        ).rejects.toMatchObject({
            statusCode: 401,
        });

        expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should reject an invalid refresh token", async () => {
        User.findOne.mockResolvedValue(null);

        await expect(
            authService.refreshAccessToken(
                "invalid-refresh-token"
            )
        ).rejects.toMatchObject({
            statusCode: 401,
        });
    });

    test("should rotate a valid refresh token", async () => {
        const oldRefreshToken = "old-refresh-token";

        const oldRefreshTokenHash = crypto
            .createHash("sha256")
            .update(oldRefreshToken)
            .digest("hex");

        const user = {
            _id: "user123",
            role: "user",
            refreshTokenHash: oldRefreshTokenHash,
            refreshTokenExpires: new Date(
                Date.now() + 60 * 60 * 1000
            ),
            save: jest.fn(),
        };

        User.findOne.mockResolvedValue(user);

        jwt.sign.mockReturnValue("new-access-token");

        const result =
            await authService.refreshAccessToken(
                oldRefreshToken
            );

        expect(result.accessToken).toBe(
            "new-access-token"
        );

        expect(result.refreshToken).toBeDefined();

        expect(result.refreshToken).not.toBe(
            oldRefreshToken
        );

        expect(user.refreshTokenHash).not.toBe(
            oldRefreshTokenHash
        );

        expect(user.save).toHaveBeenCalledTimes(1);

        expect(jwt.sign).toHaveBeenCalledTimes(1);
    });

    test("should reject an expired refresh token", async () => {
        User.findOne.mockResolvedValue(null);

        await expect(
            authService.refreshAccessToken(
                "expired-refresh-token"
            )
        ).rejects.toMatchObject({
            statusCode: 401,
        });
    });
});