import { Router } from "express"
import { nuevaReceta, obtenerRecetaPorId, actualizarReceta, obtenerRecetas, eliminarReceta, obtenerRecetasPorCategoria} from "../db/recetabd.js"

const router = Router()

router.get("/", function(req,res){
  res.render("home")
})

router.get("/agregarReceta", function(req,res){
  res.render("agregarReceta");
})

 router.get("/mostrarRecetas", async function (req, res) {
  try {
    const categoria = req.query.categoria || "";
    const recetas = await obtenerRecetasPorCategoria(categoria);
    res.render("mostrarRecetas", { contactosBD: recetas, categoria });
  } catch (error) {
    console.error("Error al obtener recetas:", error);
    res.send("Error al cargar las recetas");
  }
})

router.post("/agregarReceta", async function(req, res) {
  var nombre = req.body.nombre
  var ingredientes = req.body.ingredientes
  var preparacion = req.body.preparacion
  var tiempo = req.body.tiempo
  var dificultad = req.body.dificultad
  var categoria = req.body.categoria
  var url_video= req.body.url_video
  console.log("Nueva receta")
  console.log("Nombre:" + nombre)
  console.log("Ingredientes:" + ingredientes)
  console.log("Preparación:" + preparacion)
  console.log("Tiempo:" + tiempo)
  console.log("Dificultad:" + dificultad)
  console.log("Categoría:" + categoria)
  console.log("URL Video:" + url_video)

  try{
    const respuestaMongo = await nuevaReceta({nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video})
    console.log("Receta guardada", respuestaMongo)
    res.render("respuesta", {
      nombre,
      ingredientes,
      preparacion,
      tiempo,
      dificultad,
      categoria,
      url_video
    }) 
    
  } catch (error) {
    console.error("Error al renderizar o guardar:" +  error) 
    res.send("Error al guardar la receta")
  }
})

router.get("/editar/:id", async function(req, res){
  try{
    const id = req.params.id;
    const receta = await obtenerRecetaPorId(id);
    if (!receta) {
      return res.send("Receta no encontrada");
    }
    res.render("editarReceta", { receta: receta });
  } catch (error) {
    console.error("Error al obtener la receta:" , error);
    res.send("Error al obtener la receta para editar");
  }
})

//actualizar
router.post("/editar/:id", async function(req, res){
  try{
    const id = req.params.id;
    const { nombre, ingredientes, preparacion, tiempo, dificultad, categoria, url_video} = req.body;
    const resultado = await actualizarReceta(id, { 
      nombre, 
      ingredientes, 
      preparacion, 
      tiempo, 
      dificultad, 
      categoria,
      url_video
    });
    if (resultado) {
      res.redirect("/mostrarRecetas");
    } else {
      res.send("No se pudo actualizar la receta");
    }
  } catch (error) {
    console.error("Error al actualizar la receta:", error);
    res.send("Error al actualizar la receta");
  }
})

router.post("/eliminarReceta/:id", async (req, res) => {
  try {
    await eliminarReceta(req.params.id);
    res.redirect("/mostrarRecetas");
  } catch (error) {
    console.error("Error al eliminar la receta:", error);
    res.status(500).send("Error al eliminar la receta");
  }
});

export default router;