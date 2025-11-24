import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:  { 
        type: String, 
        required: true 
    },
    edad: {
        type: Number, 
        required: true
    },
    email: {
        type: String, 
        required: true, 
        unique: true 
    },
    telefono: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    foto: { 
        type: String, 
        default: null 
    }
});
const User = mongoose.model("User", userSchema);
export default User;
