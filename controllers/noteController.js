const noteService=require("../services/noteService");
const uploadService = require("../services/uploadService");
const mediaService=require("../services/mediaService");
const AppError=require("../utils/AppError");
const {sendSuccess}=require("../utils/apiResponse");
const getNotes=async(req,res)=>{
    const page=Math.max(parseInt(req.query.page)||1,1);
    const limit=Math.min(Math.max(parseInt(req.query.limit)||10,1),50);
    const search=req.query.search||"";

    const result=await noteService.getAllNotes(req.user.id,req.user.role,page,limit,search);
    return sendSuccess(
      res,200,"Notes fetched successfully",result
    )
};

const getNoteById = async (req, res) => {
  const note = await noteService.getNoteById(
    req.params.id,
    req.user.id,
    req.user.role
  );

  return sendSuccess(
    res,200,"Note fetched successfully",note
  )
};

const createNote=async(req,res)=>{
    const note=await noteService.createNote(req.body,req.user.id);
    return sendSuccess(
      res,201,"Note created successfully",note
    )
};


const updateNote=async(req,res)=>{
    const note=await noteService.updateNote(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );
    return sendSuccess(
      res,200,"Note updated successfully",note
    )
};

const deleteNote=async(req,res)=>{
    await noteService.deleteNote(req.params.id,req.user.id,req.user.role);
    return sendSuccess(
      res,200,"Note deleted successfully"
    )
};

const getNoteWithComments= async(req,res)=>{
    const note=await noteService.getNoteWithComments(req.params.id);
    return sendSuccess(
      res,200,"Note with comments fetched successfully",note
    )
};

const uploadAttachment = async (
  req,
  res
) => {

  if (!req.files || req.files.length === 0) {
    throw new AppError(
      "Please upload at least one file",
      400
    );  
}

  const compressibleImages = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const attachmentData =
    await Promise.all(

      req.files.map(
        async (file) => {

          let uploadedFile;

          if (
            compressibleImages.includes(
              file.mimetype
            )
          ) {

            const compressedBuffer =
              await uploadService.compressImage(
                file.buffer
              );

            uploadedFile =
              await mediaService.uploadFile(
                compressedBuffer,
                "note-images"
              );

          } else {

            uploadedFile =
              await mediaService.uploadFile(
                file.buffer,
                "note-documents"
              );
          }

          return {
            url:
              uploadedFile.secure_url,

            publicId:
              uploadedFile.public_id,

            fileName:
              file.originalname,

            fileType:
              file.mimetype,

            size:
              uploadedFile.bytes,
          };
        }
      )
    );

  const note =
    await noteService.uploadAttachment(
      req.params.id,
      req.user.id,
      attachmentData
    );

  return sendSuccess(
    res,200,"Attachment uploaded successfully",note
  )
};


const deleteAttachment =
async (
  req,
  res
) => {

  const note =
    await noteService
      .deleteAttachment(
        req.params.noteId,
        req.params.attachmentId,
        req.user.id
      );

  return sendSuccess(
    res,200,"Attachment deleted successfully",note
  )
};

module.exports={
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote,
    getNoteWithComments,
    uploadAttachment,
    deleteAttachment
}
