import multer from "multer";

export default function subirFoto() {
    const storage = multer.diskStorage({
        destination: "./public/uploads",
        filename: function (req, file, cb) {
            cb(null, Date.now() + "-" + file.originalname);
        }
    });

    return multer({ storage }).single("foto"); // <-- foto única
}