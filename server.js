const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const path = require('path');
const connectDB = require('./config/db.js');

// Configurar variables de entorno
dotenv.config({ path: './config/.env' });

// Crear aplicación
const app = express();

// Conectar a la base de datos
connectDB();

const cors = require('cors');
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());




// Servir archivos estáticos (HTML, CSS, JS desde /public)
app.use(express.static(path.join(__dirname, "public")));




// Ruta de prueba
app.get('/prueba', (req, res) => {
    res.send("Hello!");
});

// Rutas de la API
const trabajoRoutes = require('./routes/trabajoRoutes.js');
app.use('/trabajo', trabajoRoutes);



// definir el puerto del servidor 




const puerto = process.env.puerto 

//DIFINIR EL SERVIDOR 

app.listen( puerto,console.log(`servidor ejecutando en ${ puerto } `.bgBlue.white) )



