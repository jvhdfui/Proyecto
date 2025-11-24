import { Router } from "express";
import { nuevaReceta, obtenerRecetaPorId, actualizarReceta, obtenerRecetas, eliminarReceta, obtenerRecetasPorCategoria } from "../db/recetabd.js";
import { nuevoUsuario, buscarUsuarioPorEmail, obtenerUsuarios } from "../db/usuariosbd.js"; 
import verificarSesion from "../middlewares/verificarSesion.js";
import User from "../models/modelUser.js";
import subirFoto from "../middlewares/subirFoto.js";
import fs from "fs";
import path from "path";


const router = Router();

router.get("/", (req, res) => {
    res.render("home", { usuario: req.session.usuario });
});

//RECETAS
router.get("/agregarReceta", autenticarUsuario, (req, res) => {
    res.render("agregarReceta", { usuario: req.session.usuario });
});

router.post("/agregarReceta", autenticarUsuario, async (req, res) => {
    try {
        const { nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video } = req.body;
        const nueva = await nuevaReceta({
            nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video
        });
        res.redirect("/mostrarRecetas"); 
    } catch (error) {
        console.error("Error al guardar receta:", error);
        res.send("Error al guardar la receta");
    }
});

router.get("/mostrarRecetas", autenticarUsuario, async (req, res) => {
    try {
        const categoria = req.query.categoria || "";
        const recetas = await obtenerRecetasPorCategoria(categoria);
        res.render("mostrarRecetas", { contactosBD: recetas, categoria, usuario: req.session.usuario });
    } catch (error) {
        console.error(error);
        res.send("Error al cargar recetas");
    }
});

router.get("/editar/:id", autenticarUsuario, async (req, res) => {
    try {
        const receta = await obtenerRecetaPorId(req.params.id);
        if (!receta) return res.send("Receta no encontrada");
        res.render("editarReceta", { receta, usuario: req.session.usuario }); 
    } catch (error) {
        res.send("Error al abrir edición");
    }
});

router.post("/editar/:id", autenticarUsuario, async (req, res) => {
    try {
        const resultado = await actualizarReceta(req.params.id, req.body);
        if (resultado) return res.redirect("/mostrarRecetas");
        res.send("No se pudo actualizar la receta");
    } catch (error) {
        res.send("Error en actualización");
    }
});

router.post("/eliminarReceta/:id", autenticarUsuario, autorizarAdmin, async (req, res) => {
    try {
        await eliminarReceta(req.params.id);
        res.redirect("/mostrarRecetas");
    } catch (error) {
        res.send("Error al eliminar");
    }
});

//login


router.get("/login", (req, res) => {
    res.render("login", { usuario: req.session.usuario });
});

router.post("/login", async (req, res) => {
    const { email, pswd } = req.body;
    try {
        let dbUsuario = null; 
        if (email === "cookland@gmail.com" && pswd === "$CookLand4") {
            dbUsuario = await buscarUsuarioPorEmail(email); 

            if (dbUsuario) {
                req.session.usuario = { 
                    email, 
                    username: "Administrador", 
                    rol: 'admin', 
                    userId: dbUsuario._id 
                };
                return res.redirect("/");
            }
        }
        if (!dbUsuario) {
             dbUsuario = await buscarUsuarioPorEmail(email);
        }

        if (dbUsuario && dbUsuario.password === pswd) {
            req.session.usuario = {
                email: dbUsuario.email,
                username: dbUsuario.username,
                rol: dbUsuario.rol,
                userId: dbUsuario._id
            };
            return res.redirect("/");
        }

        return res.render("home", { 
            mensajeError: "Usuario o contraseña incorrectos", 
            usuario: req.session.usuario 
        });

    } catch (error) {
        console.error("Error en el proceso de login:", error);
        return res.render("home", { 
            mensajeError: "Error en el proceso de login", 
            usuario: req.session.usuario 
        });
    }
})



//singup

router.post("/signup", async (req, res) => {
    const { txt, email, broj, pswd, nombre, edad } = req.body;

    try {
        const guardado = await nuevoUsuario({
            username: txt,
            email,
            telefono: broj,
            password: pswd,
            edad,        
            rol: 'normal'
        });

        res.render("home");
    } catch (error) {
        if (error.code === 11000) {
            return res.render("home");
        }
        res.render("home");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect("/");
    });
});



//permisoss

function autenticarUsuario(req, res, next) {
    if (req.session?.usuario) next();
    else res.redirect("/");
}

function autorizarAdmin(req, res, next) {
    if (req.session?.usuario?.rol === 'admin') next();
    else res.redirect("/mostrarRecetas");
}

//Administrador-->lista de usuarios

router.get("/usuarios", autenticarUsuario, autorizarAdmin, async (req, res) => {
    try {
        const listaUsuarios = await obtenerUsuarios();
        res.render("usuarios", {
            usuarios: listaUsuarios,
            usuario: req.session.usuario
        });
    } catch (error) {
        res.send("Error interno al cargar la lista de usuarios");
    }
});
//PERFIL
// ver perfil
router.get("/perfil", verificarSesion, async (req, res) => {
    const user = await User.findById(req.session.usuario.userId).lean();
    if (user && !user.foto) {
        user.foto = "default.png"; 
    }
    res.render("vistaPerfil", { 
        user, 
        usuario: req.session.usuario
    });
});

// formulario para poder editar perfil
router.get("/perfil/editar/:id", verificarSesion, async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    res.render("editarPerfil", { 
        user, 
        usuario: req.session.usuario
    });
});

// guardar cambios
router.post("/perfil/editar", verificarSesion, subirFoto(), async (req, res) => {

    const { username, edad, email, telefono, password } = req.body;
    
    // Obtener usuario actual
    const user = await User.findById(req.session.usuario.userId);

    user.username = username;
    user.edad = edad;
    user.email = email;
    user.telefono = telefono;

    if (password && password.trim() !== "") {
        user.password = password;
    }

    if (req.file) {
        
        if (user.foto && user.foto !== "default.png") {
            const rutaFoto = path.join("public", "uploads", user.foto);
            if (fs.existsSync(rutaFoto)) {
                fs.unlinkSync(rutaFoto);
            }
        }

        // Guardar nueva foto
        user.foto = req.file.filename;
    }

    // Guardar cambios
    await user.save();

    res.redirect("/perfil");
});



// eliminar cuenta
router.post("/perfil/eliminar", verificarSesion, async (req, res) => {
    const user = await User.findById(req.session.usuario.userId);

if (user.foto && user.foto !== "default.png") {
    const rutaFoto = path.join("public", "uploads", user.foto);
    if (fs.existsSync(rutaFoto)) fs.unlinkSync(rutaFoto);
}
    await User.findByIdAndDelete(req.session.usuario.userId);

    req.session.destroy(() => {
        res.redirect("/login");
    });


});


export default router;
