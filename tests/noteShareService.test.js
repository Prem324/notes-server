
const mongoose = require("mongoose");

const Note = require("../models/Note");
const User = require("../models/User");
const NoteShare = require("../models/NoteShare");
const notificationService = require("../services/notificationService");

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

        jest.spyOn(notificationService, "createNotification")
            .mockResolvedValue(null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("shareNote", () => {
        it("should share a note with a user and create a notification", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
                name: "John",
                email: "john@example.com",
            });

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(null);

            const createdShare = {
                note: noteId,
                user: collaboratorId,
                permission: "editor",
            };

            jest.spyOn(NoteShare, "create").mockResolvedValue(createdShare);

            const result = await shareNote({
                noteId,
                ownerId,
                userId: collaboratorId,
                permission: "editor",
            });

            expect(result.permission).toBe("editor");
            expect(result.user).toEqual(collaboratorId);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "NOTE_SHARED",
                    title: "A note was shared with you",
                    actor: ownerId,
                    note: noteId,
                    metadata: {
                        permission: "editor",
                    },
                })
            );
        });

        it("should reject sharing a note that is not owned by the user", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue(null);

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

            expect(
                notificationService.createNotification
            ).not.toHaveBeenCalled();
        });

        it("should reject adding the owner as collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
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

            expect(
                notificationService.createNotification
            ).not.toHaveBeenCalled();
        });

        it("should reject a nonexistent user", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            jest.spyOn(User, "findById").mockResolvedValue(null);

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

            expect(
                notificationService.createNotification
            ).not.toHaveBeenCalled();
        });

        it("should reject a duplicate collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
            });

            jest.spyOn(NoteShare, "findOne").mockResolvedValue({
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

            expect(
                notificationService.createNotification
            ).not.toHaveBeenCalled();
        });

        it("should allow an admin to share a collaborator on any note", async () => {
            const adminId = new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
                name: "Collaborator",
                email: "collaborator@example.com",
            });

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(null);

            const createdShare = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(NoteShare, "create").mockResolvedValue(createdShare);

            const result = await shareNote({
                noteId,
                ownerId: adminId,
                userId: collaboratorId,
                permission: "viewer",
                role: "admin",
            });

            expect(result).toEqual(createdShare);

            expect(Note.findById).toHaveBeenCalledWith(noteId);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "NOTE_SHARED",
                    actor: adminId,
                    note: noteId,
                })
            );
        });

        it("should not fail sharing when notification creation fails", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            jest.spyOn(User, "findById").mockResolvedValue({
                _id: collaboratorId,
            });

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(null);

            const createdShare = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(NoteShare, "create").mockResolvedValue(createdShare);

            notificationService.createNotification.mockRejectedValueOnce(
                new Error("Notification database failure")
            );

            await expect(
                shareNote({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).resolves.toEqual(createdShare);
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

            const sort = jest.fn().mockResolvedValue(collaborators);
            const populate = jest.fn().mockReturnValue({ sort });

            jest.spyOn(NoteShare, "find").mockReturnValue({ populate });

            const result = await getNoteCollaborators({
                noteId,
                ownerId,
            });

            expect(populate).toHaveBeenCalledWith("user", "name email");
            expect(result).toEqual(collaborators);
            expect(notificationService.createNotification).not.toHaveBeenCalled();
        });

        it("should allow an admin to list collaborators on any note", async () => {
            const adminId = new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById").mockResolvedValue({
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

            const sort = jest.fn().mockResolvedValue(collaborators);
            const populate = jest.fn().mockReturnValue({ sort });

            jest.spyOn(NoteShare, "find").mockReturnValue({ populate });

            const result = await getNoteCollaborators({
                noteId,
                ownerId: adminId,
                role: "admin",
            });

            expect(result).toEqual(collaborators);
            expect(Note.findById).toHaveBeenCalledWith(noteId);
            expect(NoteShare.find).toHaveBeenCalledWith({ note: noteId });
            expect(notificationService.createNotification).not.toHaveBeenCalled();
        });
    });

    describe("updateCollaboratorPermission", () => {
        it("should update collaborator permission and create a notification", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(share);

            const result = await updateCollaboratorPermission({
                noteId,
                ownerId,
                userId: collaboratorId,
                permission: "editor",
            });

            expect(result.permission).toBe("editor");
            expect(share.save).toHaveBeenCalled();

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "COLLABORATOR_PERMISSION_UPDATED",
                    actor: ownerId,
                    note: noteId,
                    metadata: {
                        previousPermission: "viewer",
                        permission: "editor",
                    },
                })
            );
        });

        it("should reject a nonexistent collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(null);

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

            expect(notificationService.createNotification).not.toHaveBeenCalled();
        });

        it("should allow an admin to update collaborator permission on any note", async () => {
            const adminId = new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(share);

            const result = await updateCollaboratorPermission({
                noteId,
                ownerId: adminId,
                userId: collaboratorId,
                permission: "editor",
                role: "admin",
            });

            expect(share.permission).toBe("editor");
            expect(share.save).toHaveBeenCalled();
            expect(result).toBe(share);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "COLLABORATOR_PERMISSION_UPDATED",
                    actor: adminId,
                    note: noteId,
                })
            );
        });

        it("should not notify when the permission has not changed", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(share);

            await updateCollaboratorPermission({
                noteId,
                ownerId,
                userId: collaboratorId,
                permission: "viewer",
            });

            expect(share.save).toHaveBeenCalled();
            expect(notificationService.createNotification).not.toHaveBeenCalled();
        });

        it("should not fail permission updates when notification creation fails", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
                save: jest.fn().mockResolvedValue(true),
            };

            jest.spyOn(NoteShare, "findOne").mockResolvedValue(share);

            notificationService.createNotification.mockRejectedValueOnce(
                new Error("Notification database failure")
            );

            await expect(
                updateCollaboratorPermission({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                    permission: "editor",
                })
            ).resolves.toBe(share);

            expect(share.permission).toBe("editor");
            expect(share.save).toHaveBeenCalled();
        });
    });

    describe("removeCollaborator", () => {
        it("should remove collaborator and create a notification", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(NoteShare, "findOneAndDelete").mockResolvedValue(share);

            const result = await removeCollaborator({
                noteId,
                ownerId,
                userId: collaboratorId,
            });

            expect(result).toEqual(share);

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "COLLABORATOR_REMOVED",
                    actor: ownerId,
                    note: noteId,
                    metadata: {
                        previousPermission: "viewer",
                    },
                })
            );
        });

        it("should reject a nonexistent collaborator", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
            });

            jest.spyOn(NoteShare, "findOneAndDelete").mockResolvedValue(null);

            await expect(
                removeCollaborator({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).rejects.toMatchObject({
                statusCode: 404,
            });

            expect(notificationService.createNotification).not.toHaveBeenCalled();
        });

        it("should allow an admin to remove a collaborator from any note", async () => {
            const adminId = new mongoose.Types.ObjectId();

            jest.spyOn(Note, "findById").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(NoteShare, "findOneAndDelete").mockResolvedValue(share);

            const result = await removeCollaborator({
                noteId,
                ownerId: adminId,
                userId: collaboratorId,
                role: "admin",
            });

            expect(result).toEqual(share);
            expect(Note.findById).toHaveBeenCalledWith(noteId);

            expect(NoteShare.findOneAndDelete).toHaveBeenCalledWith({
                note: noteId,
                user: collaboratorId,
            });

            expect(notificationService.createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipient: collaboratorId,
                    type: "COLLABORATOR_REMOVED",
                    actor: adminId,
                    note: noteId,
                })
            );
        });

        it("should not fail collaborator removal when notification creation fails", async () => {
            jest.spyOn(Note, "findOne").mockResolvedValue({
                _id: noteId,
                user: ownerId,
                title: "Test note",
            });

            const share = {
                note: noteId,
                user: collaboratorId,
                permission: "viewer",
            };

            jest.spyOn(NoteShare, "findOneAndDelete").mockResolvedValue(share);

            notificationService.createNotification.mockRejectedValueOnce(
                new Error("Notification database failure")
            );

            await expect(
                removeCollaborator({
                    noteId,
                    ownerId,
                    userId: collaboratorId,
                })
            ).resolves.toEqual(share);
        });
    });
});
