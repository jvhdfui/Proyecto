import mongoose from "mongoose"

const recetaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  ingredientes: {
    type: [String],
    required: true,
    trim: true
  },
  preparacion: {
    type: String,
    required: true,
    trim: true
  },
  tiempo: {
    type: String,
    required: true,
    trim: true
  },
  dificultad: {
    type: String,
    required: true,
    trim: true
  },
  categoria: {
    type: String,
    required: true
  },
  url_video: {
    type: String
  },
  foto: { 
    type: String,
    trim: true 
  },
  
  // CAMPOS PARA CALIFICACIONES
  calificaciones: {
    type: [Number],
    default: []
  },
  usuariosQueCalificaron: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  promedioCalificacion: {
    type: Number,
    default: 0
  },
  totalCalificaciones: {
    type: Number,
    default: 0
  },
  
  // CAMPOS PARA FAVORITOS
  usuariosFavoritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
  
}, { timestamps: true })

export default mongoose.model("Receta", recetaSchema)
