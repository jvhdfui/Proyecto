import Receta from "../models/modelReceta.js"

export async function nuevaReceta({nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video}){
  const receta = new Receta({
    nombre,
    ingredientes,
    preparacion,
    tiempo,
    dificultad,
    categoria,
    url_video
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
      // Si no se escribió nada, devolver todas
      return await Receta.find({});
    }
    return await Receta.find({
      categoria: { $regex: new RegExp(categoria, "i") }
    });
  } catch (error) {
    console.error("Error al obtener recetas por categoría:", error);
    throw error;
  }
};