import mongoose from "mongoose"
async function conectarBD(){
	try{
		/*//atlas
		const conexion = await mongoose.connect("mongodb+srv://anakarenlori_db_user:Toto1183@cluster0.e2hlaur.mongodb.net/?retryWrites=true&w=majority&appName=Recetas")
		compas*/
		const conexion = await mongoose.connect("mongodb://localhost:27017/Recetas")
		console.log("Conexión Exitosa con Mongo Compass")
	}catch(err){
		console.log("Error" + err)
	}
}

export default conectarBD;