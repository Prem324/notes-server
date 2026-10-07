const mongoose = require("mongoose");

const Note = require("../models/Note");
const User = require("../models/User");
const NoteShare = require("../models/NoteShare");

const {
    shareNote,
    getNoteCollaborators,
    updateCollaboratorPermission,
    removeCollaborator,
} = require("../services/noteShareService");

describe("Note Share Service", () => {
    let ownerId;
    let collaboratorId;
    let anotherUserId;
    let noteId;

    beforeEach(() => {
        ownerId = new mongoose.Types.ObjectId();
        collaboratorId = new mongoose.Types.ObjectId();
        anotherUserId = new mongoose.Types.ObjectId();
        noteId = new mongoose.Types.ObjectId();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("shareNote", () => {
        it("should share a note with a user", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
                name: "John",
                email: "john@example.com",
            });

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue(null);

            jest.spyOn(NoteShare, "create")
                .mockResolvedValue({
                    note: noteId,
                    user: collaboratorId,
                    permission: "editor",
                });

            const result = await shareNote({
                noteId,
                ownerId,
                userId: collaboratorId,
                permission: "editor",
            });

            expect(result.permission).toBe("editor");
            expect(result.user).toEqual(
                collaboratorId
            );
        });

        it("should reject sharing a note that is not owned by the user", async () => {
            jest.spyOn(Note, "findOne")
                .mockResolvedValue(null);

            await expect(
                shareNote({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Note not found",
            });
        });

        it("should reject adding the owner as collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            await expect(
                shareNote({
                    noteId,
                    ownerId,
                    userId: ownerId,
                })
            ).rejects.toMatchObject({
                statusCode: 400,
            });
        });

        it("should reject nonexistent user", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(User, "findById")
                .mockResolvedValue(null);

            await expect(
                shareNote({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "User not found",
            });
        });

        it("should reject duplicate collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
            });

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue({
                    note: noteId,
                    user: collaboratorId,
                });

            await expect(
                shareNote({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).rejects.toMatchObject({
                statusCode: 409,
            });
        });

        it("admin can share a collaborator on any note", async () => {
            const adminId =
                new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById")
                .mockResolvedValue({
                    _id: noteId,
                    user: ownerId,
                });

            jest.spyOn(User, "findById")
                .mockResolvedValue({
                    _id: collaboratorId,
                    name: "Collaborator",
                    email: "collaborator@example.com",
                });

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue(null);

            jest.spyOn(NoteShare, "create")
                .mockResolvedValue({
                    note: noteId,
                    user: collaboratorId,
                    permission: "viewer",
                });

            const result = await shareNote({
                noteId,
                ownerId: adminId,
                userId: collaboratorId,
                permission: "viewer",
                role: "admin",
            });

            expect(result).toEqual({
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            });

            expect(
                Note.findById
            ).toHaveBeenCalledWith(noteId);
        });
    });

    describe("getNoteCollaborators", () => {
        it("should return collaborators for the owner", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            const collaborators = [
                {
                    note: noteId,
                    user: collaboratorId,
                    permission: "viewer",
                },
            ];

            const sort = jest.fn()
                .mockResolvedValue(collaborators);

            const populate = jest.fn()
                .mockReturnValue({ sort });

            jest.spyOn(NoteShare, "find")
                .mockReturnValue({
                    populate,
                });

            const result =
                await getNoteCollaborators({
                    noteId,
                    ownerId,
                });

            expect(
                populate
            ).toHaveBeenCalledWith(
                "user",
                "name email"
            );

            expect(result).toEqual(
                collaborators
            );
        });

        it("admin can list collaborators on any note", async () => {
            const adminId =
                new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById")
                .mockResolvedValue({
                    _id: noteId,
                    user: ownerId,
                });

            const collaborators = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    note: noteId,
                    user: {
                        _id: collaboratorId,
                        name: "User One",
                        email: "user1@example.com",
                    },
                    permission: "viewer",
                },
            ];

            const sort = jest.fn()
                .mockResolvedValue(collaborators);

            const populate = jest.fn()
                .mockReturnValue({
                    sort,
                });

            jest.spyOn(NoteShare, "find")
                .mockReturnValue({
                    populate,
                });

            const result =
                await getNoteCollaborators({
                    noteId,
                    ownerId: adminId,
                    role: "admin",
                });

            expect(
                result
            ).toEqual(collaborators);

            expect(
                Note.findById
            ).toHaveBeenCalledWith(noteId);

            expect(
                NoteShare.find
            ).toHaveBeenCalledWith({
                note: noteId,
            });
        });
    });

    describe("updateCollaboratorPermission", () => {
        it("should update collaborator permission", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn()
                    .mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue(share);

            const result =
                await updateCollaboratorPermission({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                    permission: "editor",
                });

            expect(
                result.permission
            ).toBe("editor");

            expect(
                share.save
            ).toHaveBeenCalled();
        });

        it("should reject nonexistent collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue(null);

            await expect(
                updateCollaboratorPermission({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                    permission: "editor",
                })
            ).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it("admin can update collaborator permission on any note", async () => {
            const adminId =
                new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById")
                .mockResolvedValue({
                    _id: noteId,
                    user: ownerId,
                });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn()
                    .mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne")
                .mockResolvedValue(share);

            const result =
                await updateCollaboratorPermission({
                    noteId,
                    ownerId: adminId,
                    userId: collaboratorId,
                    permission: "editor",
                    role: "admin",
                });

            expect(
                share.permission
            ).toBe("editor");

            expect(
                share.save
            ).toHaveBeenCalled();

            expect(result).toBe(share);
        });
    });

    describe("removeCollaborator", () => {
        it("should remove collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            const share = {
                note: noteId,
                user: collaboratorId,
            };

            jest.spyOn(
                NoteShare,
                "findOneAndDelete"
            ).mockResolvedValue(share);

            const result =
                await removeCollaborator({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                });

            expect(result).toEqual(share);
        });

        it("should reject nonexistent collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(
                NoteShare,
                "findOneAndDelete"
            ).mockResolvedValue(null);

            await expect(
                removeCollaborator({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it("admin can remove collaborator from any note", async () => {
            const adminId =
                new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById")
                .mockResolvedValue({
                    _id: noteId,
                    user: ownerId,
                });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(
                NoteShare,
                "findOneAndDelete"
            ).mockResolvedValue(share);

            const result =
                await removeCollaborator({
                    noteId,
                    ownerId: adminId,
                    userId: collaboratorId,
                    role: "admin",
                });

            expect(result).toEqual(share);

            expect(
                Note.findById
            ).toHaveBeenCalledWith(noteId);

            expect(
                NoteShare.findOneAndDelete
            ).toHaveBeenCalledWith({
                note: noteId,
                user: collaboratorId,
            });
        });
    });
});