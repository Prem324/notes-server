const User =
require("../models/User");

const uploadService =
require("../services/uploadService");

const mediaService =
require("../services/mediaService");

const {
    uploadProfilePicture,
    deleteProfilePicture,
} = require("../services/userService");


// Convert dependencies into mocks
jest.mock("../models/User");

jest.mock("../services/uploadService");

jest.mock("../services/mediaService");


// Reset mocks before every test
beforeEach(() => {
    jest.clearAllMocks();
});


describe(
    "userService - uploadProfilePicture",
    () => {

        test(
            "should throw error when user not found",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                User.findById
                .mockResolvedValue(null);

                // =====================
                // ACT + ASSERT
                // =====================

                await expect(

                    uploadProfilePicture(
                        "user123",
                        {
                            buffer:
                            Buffer.from("image")
                        }
                    )

                ).rejects.toThrow(
                    "User not found"
                );

                // Verify execution stopped

                expect(
                    uploadService.compressImage
                ).not.toHaveBeenCalled();

                expect(
                    mediaService.uploadFile
                ).not.toHaveBeenCalled();

                expect(
                    mediaService.deleteFile
                ).not.toHaveBeenCalled();
            }
        );



        test(
            "should upload first profile picture successfully",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                const mockUser = {

                    // First profile picture
                    profilePicture:null,

                    save:jest.fn()
                    .mockResolvedValue(),
                };

                const mockFile = {

                    buffer:
                    Buffer.from("image"),
                };

                const compressedBuffer =
                Buffer.from("compressed");


                // Mock database user

                User.findById
                .mockResolvedValue(
                    mockUser
                );


                // Mock Sharp compression

                uploadService.compressImage
                .mockResolvedValue(
                    compressedBuffer
                );


                // Mock Cloudinary upload

                mediaService.uploadFile
                .mockResolvedValue({

                    secure_url:
                    "https://cloudinary.com/profile.webp",

                    public_id:
                    "profile-pictures/abc123",
                });



                // =====================
                // ACT
                // =====================

                const result =
                await uploadProfilePicture(
                    "user123",
                    mockFile
                );



                // =====================
                // ASSERT
                // =====================

                // Verify image compression

                expect(
                    uploadService.compressImage
                ).toHaveBeenCalledWith(
                    mockFile.buffer
                );


                // Verify upload to Cloudinary

                expect(
                    mediaService.uploadFile
                ).toHaveBeenCalledWith(
                    compressedBuffer,
                    "profile-pictures"
                );


                // No old image exists

                expect(
                    mediaService.deleteFile
                ).not.toHaveBeenCalled();


                // Verify profile picture updated

                expect(
                    mockUser.profilePicture
                ).toEqual({

                    url:
                    "https://cloudinary.com/profile.webp",

                    publicId:
                    "profile-pictures/abc123",
                });


                // Verify database saved

                expect(
                    mockUser.save
                ).toHaveBeenCalled();


                // Verify returned user

                expect(result)
                .toBe(mockUser);
            }
        );



        test(
            "should replace old profile picture and delete old cloudinary image",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                const mockUser = {

                    profilePicture:{

                        url:
                        "https://cloudinary.com/old.webp",

                        publicId:
                        "old-profile-id",
                    },

                    save:jest.fn()
                    .mockResolvedValue(),
                };


                const mockFile = {

                    buffer:
                    Buffer.from("new-image"),
                };


                const compressedBuffer =
                Buffer.from(
                    "compressed-new-image"
                );


                User.findById
                .mockResolvedValue(
                    mockUser
                );


                uploadService.compressImage
                .mockResolvedValue(
                    compressedBuffer
                );


                mediaService.uploadFile
                .mockResolvedValue({

                    secure_url:
                    "https://cloudinary.com/new.webp",

                    public_id:
                    "profile-pictures/new123",
                });


                mediaService.deleteFile
                .mockResolvedValue();



                // =====================
                // ACT
                // =====================

                const result =
                await uploadProfilePicture(
                    "user123",
                    mockFile
                );



                // =====================
                // ASSERT
                // =====================

                // Verify compression

                expect(
                    uploadService.compressImage
                ).toHaveBeenCalledWith(
                    mockFile.buffer
                );


                // Verify upload

                expect(
                    mediaService.uploadFile
                ).toHaveBeenCalledWith(
                    compressedBuffer,
                    "profile-pictures"
                );


                // Verify OLD image deleted

                expect(
                    mediaService.deleteFile
                ).toHaveBeenCalledWith(
                    "old-profile-id"
                );


                // Verify NEW image saved

                expect(
                    mockUser.profilePicture
                ).toEqual({

                    url:
                    "https://cloudinary.com/new.webp",

                    publicId:
                    "profile-pictures/new123",
                });


                expect(
                    mockUser.save
                ).toHaveBeenCalled();


                expect(result)
                .toBe(mockUser);
            }
        );
    }
);



describe(
    "userService - deleteProfilePicture",
    () => {

        test(
            "should throw error when user not found",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                User.findById
                .mockResolvedValue(null);


                // =====================
                // ACT + ASSERT
                // =====================

                await expect(

                    deleteProfilePicture(
                        "user123"
                    )

                ).rejects.toThrow(
                    "User not found"
                );


                expect(
                    mediaService.deleteFile
                ).not.toHaveBeenCalled();
            }
        );



        test(
            "should delete profile picture successfully",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                const mockUser = {

                    profilePicture:{

                        url:
                        "https://cloudinary.com/profile.webp",

                        publicId:
                        "profile-pictures/abc123",
                    },

                    save:jest.fn()
                    .mockResolvedValue(),
                };


                User.findById
                .mockResolvedValue(
                    mockUser
                );


                mediaService.deleteFile
                .mockResolvedValue();



                // =====================
                // ACT
                // =====================

                const result =
                await deleteProfilePicture(
                    "user123"
                );



                // =====================
                // ASSERT
                // =====================

                expect(
                    mediaService.deleteFile
                ).toHaveBeenCalledWith(
                    "profile-pictures/abc123"
                );


                expect(
                    mockUser.profilePicture
                ).toBeNull();


                expect(
                    mockUser.save
                ).toHaveBeenCalled();


                expect(result)
                .toBe(mockUser);
            }
        );



        test(
            "should handle user with no profile picture",
            async () => {

                // =====================
                // ARRANGE
                // =====================

                const mockUser = {

                    profilePicture:null,

                    save:jest.fn()
                    .mockResolvedValue(),
                };


                User.findById
                .mockResolvedValue(
                    mockUser
                );



                // =====================
                // ACT
                // =====================

                const result =
                await deleteProfilePicture(
                    "user123"
                );



                // =====================
                // ASSERT
                // =====================

                expect(
                    mediaService.deleteFile
                ).not.toHaveBeenCalled();


                expect(
                    mockUser.profilePicture
                ).toBeNull();


                expect(
                    mockUser.save
                ).toHaveBeenCalled();


                expect(result)
                .toBe(mockUser);
            }
        );
    }
);