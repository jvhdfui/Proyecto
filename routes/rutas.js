import { Router } from "express";
import { 
    nuevaReceta, 
    obtenerRecetaPorId, 
    actualizarReceta, 
    obtenerRecetas, 
    eliminarReceta, 
    obtenerRecetasPorCategoria, 
    subirArchivos, 
    calificarReceta,
    agregarFavorito,
    eliminarFavorito,
    esFavorito,
    obtenerRecetasFavoritas,
    migrarRecetasExistentes
} from "../db/recetabd.js";
import { nuevoUsuario, buscarUsuarioPorEmail, obtenerUsuarios } from "../db/usuariosbd.js"; 
import verificarSesion from "../middlewares/verificarSesion.js";
import User from "../models/modelUser.js";
import Receta from "../models/modelReceta.js";
import subirFoto from "../middlewares/subirFoto.js";
import fs from "fs";
import path from "path";

const getPhotoPath = (filename) => {
    return path.join(process.cwd(), 'web', 'images', filename);
}

const router = Router();

// FUNCIÓN PARA OBTENER RECETAS DESTACADAS (reutilizable)
async function obtenerRecetasDestacadas() {
    try {
        const recetas = await obtenerRecetas();
        return recetas
            .sort((a, b) => (b.promedioCalificacion || 0) - (a.promedioCalificacion || 0))
            .slice(0, 4);
    } catch (error) {
        console.error('Error al obtener recetas destacadas:', error);
        return [];
    }
}

// RUTA DE MIGRACIÓN (TEMPORAL - ELIMINAR DESPUÉS DE USAR)
router.get("/migrar-recetas", async (req, res) => {
  try {
    const resultado = await migrarRecetasExistentes();
    res.json({ success: true, message: `Migradas ${resultado} recetas` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PÁGINA DE INICIO CON RECETAS DESDE BD - RUTA PRINCIPAL
router.get("/", async (req, res) => {
    try {
        const recetasDestacadas = await obtenerRecetasDestacadas();
        
        res.render("home", { 
            recetas: recetasDestacadas,
            usuario: req.session.usuario || null
        });
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.render("home", { 
            recetas: [], 
            usuario: req.session.usuario || null 
        });
    }
});

// RUTA PARA VER RECETA ESPECÍFICA 
router.get("/receta/:id", async (req, res) => {
    try {
        const receta = await obtenerRecetaPorId(req.params.id);
        if (!receta) {
            return res.status(404).send('Receta no encontrada');
        }
        
        // Asegurar que los campos existan para la vista
        if (!receta.promedioCalificacion) receta.promedioCalificacion = 0;
        if (!receta.totalCalificaciones) receta.totalCalificaciones = 0;
        
        res.render("detalleReceta", {
            receta: receta,
            usuario: req.session.usuario || null
        });
    } catch (error) {
        console.error('Error al obtener receta:', error);
        res.status(500).send('Error del servidor');
    }
});

// SISTEMA DE CALIFICACIONES 
router.post("/receta/:id/calificar", verificarSesion, async (req, res) => {
    try {
        console.log(' DATOS RECIBIDOS:', {
            body: req.body,
            params: req.params,
            usuario: req.session.usuario
        });

        const { calificacion } = req.body;
        const recetaId = req.params.id;
        const usuarioId = req.session.usuario.userId;

        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ error: "Calificación debe ser entre 1 y 5" });
        }

        console.log('🔧 EJECUTANDO calificarReceta...');
        const recetaActualizada = await calificarReceta(recetaId, usuarioId, parseInt(calificacion));
        
        console.log('RECETA ACTUALIZADA:', {
            id: recetaActualizada._id,
            nombre: recetaActualizada.nombre,
            promedioCalificacion: recetaActualizada.promedioCalificacion,
            totalCalificaciones: recetaActualizada.totalCalificaciones
        });

        res.json({ 
            success: true, 
            promedio: recetaActualizada.promedioCalificacion,
            totalCalificaciones: recetaActualizada.totalCalificaciones 
        });
    } catch (error) {
        console.error(' ERROR al calificar:', error);
        res.status(500).json({ error: "Error al calificar la receta" });
    }
});

// RUTAS DE FAVORITOS
router.post("/receta/:id/favorito", verificarSesion, async (req, res) => {
    try {
        console.log(' AGREGANDO FAVORITO:', {
            recetaId: req.params.id,
            usuarioId: req.session.usuario.userId
        });

        const receta = await agregarFavorito(req.params.id, req.session.usuario.userId);
        
        console.log('FAVORITO AGREGADO:', {
            receta: receta.nombre,
            usuariosFavoritos: receta.usuariosFavoritos
        });

        res.json({ 
            success: true, 
            message: "Receta agregada a favoritos",
            esFavorito: true 
        });
    } catch (error) {
        console.error(" Error al agregar favorito:", error);
        res.status(500).json({ error: "Error al agregar a favoritos" });
    }
});

router.delete("/receta/:id/favorito", verificarSesion, async (req, res) => {
    try {
        console.log(' ELIMINANDO FAVORITO:', {
            recetaId: req.params.id,
            usuarioId: req.session.usuario.userId
        });

        const receta = await eliminarFavorito(req.params.id, req.session.usuario.userId);
        
        console.log('FAVORITO ELIMINADO:', {
            receta: receta.nombre,
            usuariosFavoritos: receta.usuariosFavoritos
        });

        res.json({ 
            success: true, 
            message: "Receta eliminada de favoritos",
            esFavorito: false 
        });
    } catch (error) {
        console.error(" Error al eliminar favorito:", error);
        res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
});

router.get("/receta/:id/es-favorito", verificarSesion, async (req, res) => {
    try {
        const esFav = await esFavorito(req.params.id, req.session.usuario.userId);
        
        console.log('🔍 VERIFICANDO FAVORITO:', {
            recetaId: req.params.id,
            usuarioId: req.session.usuario.userId,
            esFavorito: esFav
        });

        res.json({ esFavorito: esFav });
    } catch (error) {
        console.error(" Error al verificar favorito:", error);
        res.json({ esFavorito: false });
    }
});

router.get("/favoritos", verificarSesion, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.userId;
        console.log('CARGANDO FAVORITOS para usuario:', usuarioId);
        
        const recetasFavoritas = await obtenerRecetasFavoritas(usuarioId);
        
        console.log('RECETAS FAVORITAS ENCONTRADAS:', recetasFavoritas.length);
        
        res.render("favoritos", { 
            recetas: recetasFavoritas,
            usuario: req.session.usuario 
        });
    } catch (error) {
        console.error(" Error al cargar favoritos:", error);
        res.render("favoritos", { 
            recetas: [],
            usuario: req.session.usuario 
        });
    }
});

// RECETAS
function autenticarUsuario(req, res, next) {
    if (req.session?.usuario) next();
    else res.redirect("/");
}

function autorizarAdmin(req, res, next) {
    if (req.session?.usuario?.rol === 'admin') next();
    else res.redirect("/mostrarRecetas");
}

router.get("/agregarReceta", autenticarUsuario, (req, res) => {
    res.render("agregarReceta", { usuario: req.session.usuario });
});

router.post("/agregarReceta", autenticarUsuario, subirArchivos(), async (req, res) => {
    try {
        const nombreArchivo = req.file ? req.file.filename : null
        const { nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video} = req.body;
        const nueva = await nuevaReceta({
            nombre,
            ingredientes,
            preparacion,
            tiempo,
            dificultad,
            categoria,
            url_video,
            foto: nombreArchivo
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
        res.send("Error al abrir edición");
    }
});

router.post("/editar/:id", autenticarUsuario, subirArchivos(), async (req, res) => {
    try {
        const actualizarFoto = { ...req.body }
        if (req.file) {
            actualizarFoto.foto = req.file.filename
            const fotoAnterior = req.body.foto_actual
             if (fotoAnterior) {
                const rutaAntigua = getPhotoPath(fotoAnterior)
                fs.unlink(rutaAntigua, (err) => {
                    if (err) console.error(`Error al borrar foto antigua`, err)
                        else console.log(`Foto antigua borrada:`)
                })
            }
        }

        delete actualizarFoto.foto_actual
        const resultado = await actualizarReceta(req.params.id, actualizarFoto)
        if (resultado) return res.redirect("/mostrarRecetas")
            res.send("No se pudo actualizar la receta")
    } catch (error) {
        console.error("Error en actualización:", error)
    }
})

router.post("/eliminarReceta/:id", autenticarUsuario, autorizarAdmin, async (req, res) => {
    try {
        const idReceta = req.params.id;
        const recetaAEliminar = await obtenerRecetaPorId(idReceta);

        if (recetaAEliminar && recetaAEliminar.foto) {
            const rutaFoto = getPhotoPath(recetaAEliminar.foto)
            fs.unlink(rutaFoto, (err) => {
                if (err) console.error("Error al borrar foto física", err);
            });
        }
        
        await eliminarReceta(idReceta)
        res.redirect("/mostrarRecetas")
    } catch (error) {
        console.error("Error al eliminar:", error)
        res.send("Error al eliminar")
    }
})

// SIGNUP - CORREGIDA: debe renderizar home con recetas
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
        
        // Después del signup, redirigir a la página principal con recetas
        const recetasDestacadas = await obtenerRecetasDestacadas();
        res.render("home", { 
            recetas: recetasDestacadas,
            usuario: req.session.usuario || null
        });
    } catch (error) {
        if (error.code === 11000) {
            const recetasDestacadas = await obtenerRecetasDestacadas();
            return res.render("home", { 
                recetas: recetasDestacadas,
                usuario: req.session.usuario || null
            });
        }
        const recetasDestacadas = await obtenerRecetasDestacadas();
        res.render("home", { 
            recetas: recetasDestacadas,
            usuario: req.session.usuario || null
        });
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect("/");
    });
});

// ADMINISTRADOR-->LISTA DE USUARIOS
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

// LOGIN - CORREGIDA: debe renderizar home con recetas después del login
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
                // Obtener recetas antes de redirigir
                const recetasDestacadas = await obtenerRecetasDestacadas();
                return res.render("home", { 
                    recetas: recetasDestacadas,
                    usuario: req.session.usuario
                });
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
            // Obtener recetas antes de redirigir
            const recetasDestacadas = await obtenerRecetasDestacadas();
            return res.render("home", { 
                recetas: recetasDestacadas,
                usuario: req.session.usuario
            });
        }
        
        // Si el login falla, igualmente pasar recetas
        const recetasDestacadas = await obtenerRecetasDestacadas();
        return res.render("home", { 
            mensajeError: "Usuario o contraseña incorrectos", 
            recetas: recetasDestacadas,
            usuario: req.session.usuario || null
        });
    } catch (error) {
        console.error("Error en el proceso de login:", error);
        const recetasDestacadas = await obtenerRecetasDestacadas();
        return res.render("home", { 
            mensajeError: "Error en el proceso de login", 
            recetas: recetasDestacadas,
            usuario: req.session.usuario || null
        });
    }
})

// PERFIL
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

// FORMULARIO PARA PODER EDITAR PERFIL
router.get("/perfil/editar/:id", verificarSesion, async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    res.render("editarPerfil", { 
        user, 
        usuario: req.session.usuario
    });
});

// GUARDAR CAMBIOS
router.post("/perfil/editar", verificarSesion, subirFoto(), async (req, res) => {
    const { username, edad, email, telefono, password } = req.body;
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
        user.foto = req.file.filename;
    }
    await user.save();
    res.redirect("/perfil");
});

// ELIMINAR CUENTA
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
