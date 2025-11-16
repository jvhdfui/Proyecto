import User from "../models/modelUser.js";

async function nuevoUsuario(datos) {
    try {
        const user = new User(datos);
        return await user.save();
    } catch (error) {
        console.error("Error en nuevoUsuario:", error);
        throw error;
    }
}

async function buscarUsuarioPorEmail(email) {
    try {
        return await User.findOne({ email });
    } catch (error) {
        console.error("Error en buscarUsuarioPorEmail:", error);
        throw error;
    }
}

async function obtenerUsuarios() {
    try {
        const usuarios = await User.find().select('-password');
        return usuarios;
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
}

export { nuevoUsuario, buscarUsuarioPorEmail, obtenerUsuarios};
