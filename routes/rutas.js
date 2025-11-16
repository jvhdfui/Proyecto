import { Router } from "express";
import { nuevaReceta, obtenerRecetaPorId, actualizarReceta, obtenerRecetas, eliminarReceta, obtenerRecetasPorCategoria } from "../db/recetabd.js";
import { nuevoUsuario, buscarUsuarioPorEmail, obtenerUsuarios} from "../db/usuariosbd.js"; 

const router = Router();

router.get("/", (req, res) => {
    res.render("home", { usuario: req.session.usuario });
});

router.get("/agregarReceta", autenticarUsuario, (req, res) => {
    res.render("agregarReceta", { usuario: req.session.usuario });
});

router.post("/agregarReceta", autenticarUsuario, async (req, res) => {
    try {
        const { nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video } = req.body;
        const nueva = await nuevaReceta({
            nombre,
            ingredientes,
            preparacion,
            tiempo,
            dificultad,
            categoria,
            url_video
        });
        console.log("Receta guardada:", nueva);
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
        console.error(error);
        res.send("Error al abrir edición");
    }
});

router.post("/editar/:id", autenticarUsuario, async (req, res) => {
    try {
        const resultado = await actualizarReceta(req.params.id, req.body);
        if (resultado) return res.redirect("/mostrarRecetas");
        res.send("No se pudo actualizar la receta");
    } catch (error) {
        console.error(error);
        res.send("Error en actualización");
    }
});

router.post("/eliminarReceta/:id", autenticarUsuario, autorizarAdmin, async (req, res) => {
    try {
        await eliminarReceta(req.params.id);
        res.redirect("/mostrarRecetas");
    } catch (error) {
        console.error(error);
        res.send("Error al eliminar");
    }
});

router.get("/login", (req, res) => {
    res.render("login", { usuario: req.session.usuario });
});

router.post("/login", async (req, res) => {
    const { email, pswd } = req.body;
    
    try {
        //administrador
        if (email === "cookland@gmail.com" && pswd === "$CookLand4") {
            req.session.usuario = { email, username: "Administrador", rol: 'admin' };
            console.log("Login exitoso: Administrador");
            return res.redirect("/mostrarRecetas");
        }
        //usuario normal
        const dbUsuario = await buscarUsuarioPorEmail(email);

        if (dbUsuario && dbUsuario.password === pswd) {
            req.session.usuario = {
                email: dbUsuario.email,
                username: dbUsuario.username,
                rol: 'normal'
            };
            console.log("Login exitoso");
            return res.redirect("/mostrarRecetas");
        }
        console.log("Login fallido: Credenciales incorrectas");
        return res.render("home", { 
            mensajeError: "Usuario o contraseña incorrectos", 
            usuario: req.session.usuario 
        });

    } catch (error) {
        console.error("Error en login:", error);
        return res.render("home", { 
            mensajeError: "Error en el proceso de login", 
            usuario: req.session.usuario 
        });
    }
});

router.post("/signup", async (req, res) => {
    const { txt, email, broj, pswd } = req.body;
    try {
        const guardado = await nuevoUsuario({
            username: txt,
            email,
            telefono: broj,
            password: pswd,
            rol: 'normal'
        });
        console.log("Usuario registrado:", guardado);
        res.render("home")
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        if (error.code === 11000) {
            return res.render("home");
        }
        res.render("home");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.send("Error al cerrar sesión");
        }
        res.clearCookie('connect.sid');
        res.redirect("/");
    });
});

// Verificar acceso a rutas
function autenticarUsuario(req, res, next) {
    if (req.session?.usuario) {
        next();
    } else {
        console.log("Acceso denegado: Usuario no autenticado");
        res.redirect("/");
    }
}

// Verifica si el usuario es administrador
function autorizarAdmin(req, res, next) {
    if (req.session?.usuario?.rol === 'admin') {
        next();
    } else {
        console.log("Acceso denegado, No es administrador");
        res.redirect("/mostrarRecetas");
    }
}

//Mostrar los usuarios existentes
router.get("/usuarios", autenticarUsuario, autorizarAdmin, async (req, res) => {
    try {
        const listaUsuarios = await obtenerUsuarios();
        res.render("usuarios", {
            usuarios: listaUsuarios,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error("Error al cargar la lista de usuarios", error);
        res.send("Error interno al cargar la lista de usuarios");
    }
});

export default router;
