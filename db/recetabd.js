import Receta from "../models/modelReceta.js"
import multer from "multer"

export async function nuevaReceta({nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video, foto}){
  const receta = new Receta({
    nombre,
    ingredientes,
    preparacion,
    tiempo,
    dificultad,
    categoria,
    url_video,
    foto
  })
  const respuestaMongo = await receta.save()
  return respuestaMongo
}

export const obtenerRecetas = async () => {
  try {
    return await Receta.find({});
  } catch (error) {
    console.error("Error al obtener recetas:", error);
    throw error;
  }
}

export const obtenerRecetaPorId = async (id) => {
  try {
    return await Receta.findById(id);
  } catch (error) {
    console.error("Error al obtener receta por ID:", error);
    throw error;
  }
}

export const actualizarReceta = async (id, datosReceta) => {
  try {
    const resultado = await Receta.findByIdAndUpdate(id, datosReceta, { new: true });
    return resultado !== null;
  } catch (error) {
    console.error("Error al actualizar receta:", error);
    throw error;
  }
}

export const eliminarReceta = async (id) => {
  try {
    const resultado = await Receta.findByIdAndDelete(id);
    return resultado !== null;
  } catch (error) {
    console.error("Error al eliminar receta:", error);
    throw error;
  }
}

export const obtenerRecetasPorCategoria = async (categoria) => {
  try {
    if (!categoria || categoria.trim() === "") {
      return await Receta.find({});
    }
    return await Receta.find({
      categoria: { $regex: new RegExp(categoria, "i") }
    });
  } catch (error) {
    console.error("Error al obtener recetas por categoría:", error);
    throw error;
  }
}

// FUNCIÓN CORREGIDA - Recetas destacadas por calificación
export const obtenerRecetasDestacadas = async () => {
  try {
    const recetas = await Receta.find()
      .sort({ promedioCalificacion: -1 })
      .limit(4)
      .exec();
    return recetas;
  } catch (error) {
    console.error('Error al obtener recetas destacadas:', error);
    return [];
  }
}

// FUNCIÓN DE CALIFICACIÓN 
export const calificarReceta = async (recetaId, usuarioId, calificacion) => {
  try {
    console.log(' calificarReceta - Parámetros:', { recetaId, usuarioId, calificacion });

    const receta = await Receta.findById(recetaId);
    
    if (!receta) {
      throw new Error("Receta no encontrada");
    }

    console.log(' RECETA ANTES:', {
      nombre: receta.nombre,
      calificaciones: receta.calificaciones,
      usuariosQueCalificaron: receta.usuariosQueCalificaron,
      promedioCalificacion: receta.promedioCalificacion,
      totalCalificaciones: receta.totalCalificaciones
    });

    // Inicializar arrays si no existen (seguridad)
    if (!receta.calificaciones) receta.calificaciones = [];
    if (!receta.usuariosQueCalificaron) receta.usuariosQueCalificaron = [];

    // Verificar si el usuario ya calificó
    const usuarioIndex = receta.usuariosQueCalificaron.findIndex(
      id => id.toString() === usuarioId.toString()
    );

    console.log(' Índice de usuario encontrado:', usuarioIndex);

    if (usuarioIndex !== -1) {
      // Actualizar calificación existente
      receta.calificaciones[usuarioIndex] = calificacion;
      console.log(' Actualizando calificación existente');
    } else {
      // Agregar nueva calificación
      receta.calificaciones.push(calificacion);
      receta.usuariosQueCalificaron.push(usuarioId);
      console.log('Agregando nueva calificación');
    }

    // Calcular promedio
    const total = receta.calificaciones.reduce((sum, calif) => sum + calif, 0);
    receta.promedioCalificacion = total / receta.calificaciones.length;
    receta.totalCalificaciones = receta.calificaciones.length;

    console.log(' Cálculos:', {
      total,
      promedio: receta.promedioCalificacion,
      totalCalificaciones: receta.totalCalificaciones
    });

    await receta.save();

    console.log(' RECETA DESPUÉS:', {
      nombre: receta.nombre,
      calificaciones: receta.calificaciones,
      usuariosQueCalificaron: receta.usuariosQueCalificaron,
      promedioCalificacion: receta.promedioCalificacion,
      totalCalificaciones: receta.totalCalificaciones
    });

    return receta;
  } catch (error) {
    console.error(" Error al calificar receta:", error);
    throw error;
  }
}

//  SISTEMA DE FAVORITOS 
export const agregarFavorito = async (recetaId, usuarioId) => {
  try {
    console.log('agregarFavorito - Parámetros:', { recetaId, usuarioId });

    const receta = await Receta.findById(recetaId);
    if (!receta) throw new Error("Receta no encontrada");

    console.log('RECETA ANTES FAVORITO:', {
      nombre: receta.nombre,
      usuariosFavoritos: receta.usuariosFavoritos
    });

    // Inicializar array si no existe
    if (!receta.usuariosFavoritos) {
      receta.usuariosFavoritos = [];
    }

    // Agregar usuario si no está en favoritos
    const usuarioExiste = receta.usuariosFavoritos.some(
      id => id.toString() === usuarioId.toString()
    );

    if (!usuarioExiste) {
      receta.usuariosFavoritos.push(usuarioId);
      await receta.save();
      console.log(' USUARIO AGREGADO A FAVORITOS');
    } else {
      console.log(' Usuario ya está en favoritos');
    }
    
    console.log('RECETA DESPUÉS FAVORITO:', {
      nombre: receta.nombre,
      usuariosFavoritos: receta.usuariosFavoritos
    });

    return receta;
  } catch (error) {
    console.error(" Error al agregar favorito:", error);
    throw error;
  }
}

export const eliminarFavorito = async (recetaId, usuarioId) => {
  try {
    console.log('eliminarFavorito - Parámetros:', { recetaId, usuarioId });

    const receta = await Receta.findById(recetaId);
    if (!receta) throw new Error("Receta no encontrada");

    console.log(' RECETA ANTES ELIMINAR FAVORITO:', {
      nombre: receta.nombre,
      usuariosFavoritos: receta.usuariosFavoritos
    });

    // Eliminar usuario de favoritos
    if (receta.usuariosFavoritos) {
      receta.usuariosFavoritos = receta.usuariosFavoritos.filter(
        id => id.toString() !== usuarioId.toString()
      );
      await receta.save();
      console.log('USUARIO ELIMINADO DE FAVORITOS');
    }
    
    console.log(' RECETA DESPUÉS ELIMINAR FAVORITO:', {
      nombre: receta.nombre,
      usuariosFavoritos: receta.usuariosFavoritos
    });

    return receta;
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    throw error;
  }
}

export const esFavorito = async (recetaId, usuarioId) => {
  try {
    console.log(' esFavorito - Parámetros:', { recetaId, usuarioId });

    const receta = await Receta.findById(recetaId);
    if (!receta || !receta.usuariosFavoritos) {
      console.log(' No es favorito (receta no encontrada o sin favoritos)');
      return false;
    }
    
    const esFav = receta.usuariosFavoritos.some(
      id => id.toString() === usuarioId.toString()
    );

    console.log(' RESULTADO esFavorito:', esFav);
    return esFav;
  } catch (error) {
    console.error(" Error al verificar favorito:", error);
    return false;
  }
}

export const obtenerRecetasFavoritas = async (usuarioId) => {
  try {
    console.log(' obtenerRecetasFavoritas - Usuario:', usuarioId);
    
    const recetas = await Receta.find({
      usuariosFavoritos: usuarioId
    });

    console.log(' RECETAS FAVORITAS ENCONTRADAS:', recetas.length);
    recetas.forEach(receta => {
      console.log('   -', receta.nombre, '(ID:', receta._id + ')');
    });

    return recetas;
  } catch (error) {
    console.error("Error al obtener recetas favoritas:", error);
    return [];
  }
}

// SCRIPT DE MIGRACIÓN PARA RECETAS EXISTENTES
export const migrarRecetasExistentes = async () => {
  try {
    const recetas = await Receta.find({});
    let actualizadas = 0;
    
    for (let receta of recetas) {
      let necesitaGuardar = false;
      
      // Inicializar campos que puedan faltar
      if (!receta.calificaciones) {
        receta.calificaciones = [];
        necesitaGuardar = true;
      }
      if (!receta.usuariosQueCalificaron) {
        receta.usuariosQueCalificaron = [];
        necesitaGuardar = true;
      }
      if (!receta.promedioCalificacion) {
        receta.promedioCalificacion = 0;
        necesitaGuardar = true;
      }
      if (!receta.totalCalificaciones) {
        receta.totalCalificaciones = 0;
        necesitaGuardar = true;
      }
      if (!receta.usuariosFavoritos) {
        receta.usuariosFavoritos = [];
        necesitaGuardar = true;
      }
      
      if (necesitaGuardar) {
        await receta.save();
        actualizadas++;
        console.log(`Migrada receta: ${receta.nombre}`);
      }
    }
    
    console.log(` Migración completada: ${actualizadas} recetas actualizadas`);
    return actualizadas;
  } catch (error) {
    console.error(' Error en migración:', error);
    throw error;
  }
}

export function subirArchivos(){
  const storage = multer.diskStorage({
    destination:"./web/images",
    filename: function(req, file, cb){
      cb(null, Date.now() + file.originalname)
    }
  })

  const upload = multer({storage}).single('fotos')
  return upload
}
