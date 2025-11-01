import mongoose from "mongoose"
import 'dotenv/config'

async function conectarBD(){
	//conexión a base
	try{
		//atlas
		const conexion = await mongoose.connect("mongodb+srv://anakarenlori_db_user:<Toto1183>@cluster0.t6vvfu0.mongodb.net/?retryWrites=true&w=majority&appName=Recetas")
		//compas
		/*const conexion = await mongoose.connect(process.env.KEY_MONGO)*/
		console.log("Conexión Exitosa con Mongo Compass")
	}catch(err){
		console.log("Error" + err)
	}
}
export default conectarBD
