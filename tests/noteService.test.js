//Imports
const Note=require("../models/Note");
const mediaService=require("../services/mediaService");

const {deleteAttachment,}=require("../services/noteService");

jest.mock("../models/Note");
jest.mock("../services/mediaService");

beforeEach(()=>{
    jest.clearAllMocks();
});

//Test 1: Note Not Found
test(
    "should throw error when note does not exist",
    async()=>{

        //ARRANGE
        Note.findById.mockResolvedValue(null);

        //ACT+ASSERT 
        await expect(
            deleteAttachment(
                "note123",
                "att123",
                "user123"
            )
        ).rejects.toThrow("Note not found");

        expect(
            Note.findById
        ).toHaveBeenCalledWith("note123");

        expect(
            mediaService.deleteFile 
        ).not.toHaveBeenCalled();
    }
);

//Test 2: User Not Authorized
test(
    "should throw error when user is not authorized",
    async()=>{

        //ARRANGE
        const mockNote={
            user:{
                toString:()=>"owner123",
            },

            attachments:[],

            save:jest.fn(),
        };

        Note.findById.mockResolvedValue(mockNote);

        //ACT+ASSERT 
        await expect(
            deleteAttachment(
                "note123",
                "att123",
                "user123"
            )
        ).rejects.toThrow(
            "Not authorized"
        );

        expect(
            mediaService.deleteFile
        ).not.toHaveBeenCalled();

        expect(
            mockNote.save
        ).not.toHaveBeenCalled();
    }
);

//Test 3: Attachment Not Found
test(
    "should throw error when attachment does not exist",
    async()=>{

        //ARRANGE
        const mockNote={
            user:{
                toString:()=>
                    "user123",
            },

            attachments:[],

            save:jest.fn(),
        };

        Note.findById.mockResolvedValue(
            mockNote
        );

        //ACT+ASSERT
        await expect(
            deleteAttachment(
                "note123",
                "att123",
                "user123"
            )
        ).rejects.toThrow(
            "Attachment not found"
        );

        expect(
            mediaService.deleteFile
        ).not.toHaveBeenCalled();

        expect(
            mockNote.save
        ).not.toHaveBeenCalled();
    }
);

//Test 4: Successful Deletion
test(
    "should delete attachment successfully",
    async()=>{

        //ARRANGE
        const mockAttachment={
            _id:{
                toString:()=>"att123",
            },
            publicId:"note-images/cloud123",
        };

        const attachments=[mockAttachment,];

        attachments.pull=jest.fn();

        const mockNote={
            user:{
                toString:()=>"user123",
            },
            attachments,

            save:jest.fn().mockResolvedValue(),
        };

        Note.findById.mockResolvedValue(mockNote);

        mediaService.deleteFile.mockResolvedValue();

        //ACT
        const result=
        await deleteAttachment(
            "note123","att123","user123"
        );

        //ASSERT
        expect(
            mediaService.deleteFile
        ).toHaveBeenCalledWith(
            "note-images/cloud123"
        );

        expect(
            attachments.pull
        ).toHaveBeenCalledWith("att123");

        expect(
            mockNote.save
        ).toHaveBeenCalled();

        expect(result)
        .toBe(mockNote);
    }
);