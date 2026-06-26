const add=(a,b)=>{
    return a+b;
};

test(
    "adds 2 + 3 correctly",()=>{
        expect(add(2,3)).toBe(5);
    }
);

// AAA Example (Arrange, Act, Assert)
/* test(
    "login returns token",
    async()=>{

        ARRANGE
        User.findOne.mockResolvedValue({
            _id:"123",
            email:"test@gmail.com",
            password:"hashed",
            role:"user",
        });

        bcrypt.compare
        .mockResolvedValue(true);

        jwt.sign
        .mockReturnValue("fake-token");

        ACT
        const token =
        await loginUser(
            "test@gmail.com",
            "123456"
        );

        ASSERT
        expect(token)
        .toBe("fake-token");

    }
);*/