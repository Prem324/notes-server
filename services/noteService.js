const Note=require("../models/Note");
const mediaService=require("./mediaService");
const AppError=require("../utils/AppError");

const getAllNotes=async(userId,role,page,limit,search)=>{
    const query={};

    if(role !== "admin"){
        query.user=userId
    }

    if(search){
        query.$text={
            $search:search,
        };
    }

    const totalNotes = await Note.countDocuments(query);
    const totalPages = Math.ceil(totalNotes/limit);
    
    const notes=await Note.find(query)
    .populate("user","name email role")
    .skip((page-1)*limit)
    .limit(limit)
    .sort({createdAt:-1,})
    .lean();
    return {
      notes,
      pagination:{
        totalNotes,
        currentPage:page,
        totalPages,
        limit,
        hasNextPage:page<totalPages,
        hasPrevPage:page>1,
      },
    };
};

const getNoteById=async(noteId, userId, role) =>{
  const note = await Note.findById(noteId);

  if (!note) {
    throw new AppError("Note not found",404);
  }

  if (role !== "admin" && note.user.toString() !== userId) {
    throw new AppError("Not authorized to access this note",403);
  }

  return note;
}

const createNote = async (data,userId) => {
    return await Note.create({
        ...data,
        user: userId,
    });
};

const updateNote = async (id,data,userId,role) => {
    const note = await Note.findById(id);
    if (!note) {
        throw new AppError("Note not found",404);
    }

    if (role !== "admin" && note.user.toString() !== userId) {
      throw new AppError("Not authorized to update this note", 403);
    }


    note.title = data.title ?? note.title;

    note.content = data.content ?? note.content;

    note.completed = data.completed ?? note.completed;

    await note.save();

    return note;
};

const deleteNote = async (
  noteId,
  userId,
  role
) => {

  const note =
  await Note.findById(noteId);

  if (!note) {
    throw new AppError(
      "Note not found",404
    );
  }

  if (role !== "admin" && note.user.toString() !== userId) {
    throw new AppError("Not authorized to update this note", 403);
  }


  if (
    note.attachments &&
    note.attachments.length > 0
  ) {

    await Promise.all(

  note.attachments.map(
    async (attachment) => {

      try{

        if(
          attachment.publicId
        ){

          await mediaService.deleteFile(
            attachment.publicId
          );
        }

      }catch(error){

        console.error(
          "Cloudinary delete failed:",
          attachment.publicId
        );
      }
    }
  )
);
  }

  await Note.findByIdAndDelete(
    noteId
  );

  return {
    message:
    "Note deleted successfully"
  };
};

const getNoteWithComments=async(noteId)=>{
    const note=await Note.findById(noteId)
    .populate(
        "user",
        "name email"
    )

    .populate({
        path:"comments",
        populate:{
            path:"user",
            select:"name email",
        },
    });

    if(!note){
        throw new AppError("Note not found",404);
    }
    return note;
}

const uploadAttachment = async (
  noteId,
  userId,
  attachments,
  role
) => {

  const note =
    await Note.findById(noteId);

  if (!note) {
    throw new AppError(
      "Note not found",404
    );
  }

  if (role !== "admin" && note.user.toString() !== userId) {
    throw new AppError("Not authorized to update this note", 403);
  }


  const updatedNote =
    await Note.findByIdAndUpdate(
      noteId,
      {
        $push: {
          attachments: {
            $each: attachments,
          },
        },
      },
      {
        new: true,
      }
    );

  return updatedNote;
};

const deleteAttachment =
async (
  noteId,
  attachmentId,
  userId,
  role
) => {

  const note =
    await Note.findById(noteId);

  if (!note) {
    throw new AppError(
      "Note not found",404
    );
  }

  if (role !== "admin" && note.user.toString() !== userId) {
    throw new AppError("Not authorized to update this note", 403);
  }


  const attachment =
  note.attachments.find(
    item =>
      item._id.toString() === attachmentId
  );

  if (!attachment) {
    throw new AppError(
      "Attachment not found",404
    );
  }

  await mediaService.deleteFile(
    attachment.publicId
  );

  note.attachments.pull(
    attachmentId
  );

  await note.save();

  return note;
};


module.exports={
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getNoteWithComments,
    uploadAttachment,
    deleteAttachment
}