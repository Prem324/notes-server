const notesListKey = (
    userId,
    role,
    page,
    limit,
    search = ""
) => {

    const normalizedSearch =
        search.trim().toLowerCase();

    return [
        "notes",
        userId,
        role,
        `page=${page}`,
        `limit=${limit}`,
        `search=${encodeURIComponent(normalizedSearch)}`
    ].join(":");
};


const notesUserPattern = (userId) => {

    return `notes:${userId}:*`;

};


// ============================================================
// Individual note cache key
// ============================================================

const noteByIdKey = (
    noteId,
    userId,
    role
) => {

    return [
        "note",
        noteId,
        userId,
        role
    ].join(":");

};


module.exports = {
    notesListKey,
    notesUserPattern,
    noteByIdKey,
};