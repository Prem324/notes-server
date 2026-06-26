const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User=require("../models/User");

const {loginUser,registerUser}=require("../services/authService");

//Convert to Mock Functions
jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

//Cleaning Before
beforeEach(()=>{
    jest.clearAllMocks();
});

describe("authService - loginUser",()=>{ //Group related tests together
    test(
        "should return token for valid credentials", //Create and call this test
        async()=>{

            //ARRANGE 

            //Mock User
            User.findOne.mockReturnValue({
                select:jest.fn().mockResolvedValue({
                    _id:"123",
                    email:"test@gmail.com",
                    password:"hashedPassword",
                    role:"user"
                }),
            });

            //Mock bcrypt
            bcrypt.compare.mockResolvedValue(true);

            //Mock jwt
            jwt.sign.mockReturnValue("fake-token");



            //ACT
            const token=await loginUser("test@gmail.com","123456");


            //ASSERT
            expect(token).toBe("fake-token");

            expect(User.findOne)
            .toHaveBeenCalledWith({
                email:"test@gmail.com",
            });

            expect(bcrypt.compare).toHaveBeenCalledWith(
                "123456",
                "hashedPassword"
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id:"123",
                    role:"user",
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:"1d"
                }
            );
        }
    );

    test(
        "should throw error when user does not exist",
        async () => {

            // Arrange

            User.findOne.mockReturnValue({
                select: jest.fn()
                    .mockResolvedValue(null),
            });

            // Act + Assert

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
        }
    );

    test(
        "should throw error when password is incorrect",
        async () => {

            // Arrange

            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue({
                    _id: "123",
                    email: "test@gmail.com",
                    password: "hashedPassword",
                    role: "user",
                }),
            });

            bcrypt.compare.mockResolvedValue(
                false
            );

            // Act + Assert

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
        }
    );

});

describe("authService - registerUser", () => {

    test(
        "should register user successfully",
        async () => {

            // ARRANGE

            User.findOne.mockResolvedValue(
                null
            );

            bcrypt.hash.mockResolvedValue(
                "hashedPassword"
            );

            User.create.mockResolvedValue({
                _id: "123",
                name: "Prem",
                email: "prem@gmail.com",
                password: "hashedPassword",
            });

            // ACT

            const result =
            await registerUser({
                name: "Prem",
                email: "prem@gmail.com",
                password: "123456",
            });

            // ASSERT

            expect(result)
            .toEqual({
                _id: "123",
                name: "Prem",
                email: "prem@gmail.com",
                password: "hashedPassword",
            });

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
        }
    );

    test(
        "should throw error when email already exists",
        async () => {

            // ARRANGE

            User.findOne.mockResolvedValue({
                _id: "123",
                email: "prem@gmail.com",
            });

            // ACT + ASSERT

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
        }
    );

    test(
        "should hash password before saving user",
        async () => {

            // ARRANGE

            User.findOne.mockResolvedValue(
                null
            );

            bcrypt.hash.mockResolvedValue(
                "hashedPassword"
            );

            User.create.mockResolvedValue({
                _id: "123",
                name: "Prem",
                email: "prem@gmail.com",
                password: "hashedPassword",
            });

            // ACT

            await registerUser({
                name: "Prem",
                email: "prem@gmail.com",
                password: "123456",
            });

            // ASSERT

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
        }
    );
}); 