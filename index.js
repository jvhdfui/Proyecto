import express from "express"
import session from 'express-session';
import rutas from "./routes/rutas.js"
import conectarBD from "./db/db.js" 

const app = express()
app.use(express.static('public')); //imagen

async function conexion(){
  await conectarBD()
}

conexion()

//cerrar sesión
app.use(session({
    secret: 'cookland_compartiendo_cocina', 
    resave: false, 
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
    }
}));

app.use(express.urlencoded({extended:true}))
app.set("view engine", "ejs")
app.use("/", rutas)

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Aplicación en http://localhost:" + PORT);
})
