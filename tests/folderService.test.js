const Folder = require("../models/Folder");
const {
    createFolder,
    getFolders,
    updateFolder,
    deleteFolder,
} = require("../services/folderService");

jest.mock("../models/Folder");

describe("Folder Service", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("creates a folder", async () => {
        Folder.findOne.mockResolvedValue(null);

        const createdFolder = {
            _id: "folder-1",
            name: "Work",
            user: "user-1",
        };

        Folder.create.mockResolvedValue(createdFolder);

        const result = await createFolder({
            name: "Work",
            userId: "user-1",
        });

        expect(Folder.findOne).toHaveBeenCalledWith({
            name: "Work",
            user: "user-1",
        });

        expect(Folder.create).toHaveBeenCalledWith({
            name: "Work",
            user: "user-1",
        });

        expect(result).toEqual(createdFolder);
    });

    test("rejects duplicate folder", async () => {
        Folder.findOne.mockResolvedValue({
            _id: "folder-1",
            name: "Work",
            user: "user-1",
        });

        await expect(
            createFolder({
                name: "Work",
                userId: "user-1",
            })
        ).rejects.toMatchObject({
            message: "Folder already exists",
            statusCode: 409,
        });

        expect(Folder.create).not.toHaveBeenCalled();
    });

    test("gets user's folders sorted by name", async () => {
        const sort = jest.fn().mockResolvedValue([
            {
                _id: "folder-2",
                name: "Personal",
            },
            {
                _id: "folder-1",
                name: "Work",
            },
        ]);

        Folder.find.mockReturnValue({
            sort,
        });

        const result = await getFolders("user-1");

        expect(Folder.find).toHaveBeenCalledWith({
            user: "user-1",
        });

        expect(sort).toHaveBeenCalledWith({
            name: 1,
        });

        expect(result).toHaveLength(2);
    });

    test("updates a user's folder", async () => {
        const save = jest.fn().mockResolvedValue({
            _id: "folder-1",
            name: "Projects",
            user: "user-1",
        });

        Folder.findOne
            .mockResolvedValueOnce({
                _id: "folder-1",
                name: "Work",
                user: "user-1",
                save,
            })
            .mockResolvedValueOnce(null);

        const result = await updateFolder({
            folderId: "folder-1",
            name: "Projects",
            userId: "user-1",
        });

        expect(Folder.findOne).toHaveBeenNthCalledWith(1, {
            _id: "folder-1",
            user: "user-1",
        });

        expect(Folder.findOne).toHaveBeenNthCalledWith(2, {
            _id: { $ne: "folder-1" },
            user: "user-1",
            name: "Projects",
        });

        expect(save).toHaveBeenCalled();
        expect(result.name).toBe("Projects");
    });

    test("rejects updating a non-existent folder", async () => {
        Folder.findOne.mockResolvedValue(null);

        await expect(
            updateFolder({
                folderId: "missing-folder",
                name: "Projects",
                userId: "user-1",
            })
        ).rejects.toMatchObject({
            message: "Folder not found",
            statusCode: 404,
        });
    });

    test("rejects duplicate name when updating", async () => {
        Folder.findOne
            .mockResolvedValueOnce({
                _id: "folder-1",
                name: "Work",
                user: "user-1",
            })
            .mockResolvedValueOnce({
                _id: "folder-2",
                name: "Projects",
                user: "user-1",
            });

        await expect(
            updateFolder({
                folderId: "folder-1",
                name: "Projects",
                userId: "user-1",
            })
        ).rejects.toMatchObject({
            message: "Folder already exists",
            statusCode: 409,
        });
    });

    test("deletes a user's folder", async () => {
        const deletedFolder = {
            _id: "folder-1",
            name: "Work",
            user: "user-1",
        };

        Folder.findOneAndDelete.mockResolvedValue(deletedFolder);

        const result = await deleteFolder({
            folderId: "folder-1",
            userId: "user-1",
        });

        expect(Folder.findOneAndDelete).toHaveBeenCalledWith({
            _id: "folder-1",
            user: "user-1",
        });

        expect(result).toEqual(deletedFolder);
    });

    test("rejects deleting a non-existent folder", async () => {
        Folder.findOneAndDelete.mockResolvedValue(null);

        await expect(
            deleteFolder({
                folderId: "missing-folder",
                userId: "user-1",
            })
        ).rejects.toMatchObject({
            message: "Folder not found",
            statusCode: 404,
        });
    });
});