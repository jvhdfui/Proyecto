import express from "express";
import session from "express-session";
import rutas from "./routes/rutas.js";
import conectarBD from "./db/db.js";

const app = express();

//imagen
app.use(express.static('public'));

async function conexion() {
  await conectarBD();
}
conexion();

// Configuración de sesiones
app.use(session({
  secret: 'cookland_compartiendo_cocina',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production'
  }
}));
// Middleware para que usuario esté disponible en todas las vistas EJS
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});


app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/", rutas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Aplicación en http://localhost:" + PORT);
});
