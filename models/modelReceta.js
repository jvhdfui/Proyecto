import mongoose from "mongoose"

const recetaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  ingredientes: {
    type: [String],
    required: true,
    trim: true,
    unique: false
  },
  preparacion: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  tiempo: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  dificultad: {
    type: String,
    required: true,
    trim: true,
    unique: false
  },
  categoria: {
    type: String,
    required: true
  },
  url_video: {
    type: String
  }
})

export default mongoose.model("Receta", recetaSchema)
