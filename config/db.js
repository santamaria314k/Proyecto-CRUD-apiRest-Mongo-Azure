const colors = require('colors');
const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL || 'mongodb://mongodbtrabajo:', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Conexión exitosa a Azure Cosmos DB: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`❌ Error al conectar a la base de datos: ${error.message}`.red);
    process.exit(1);
  }
}

module.exports = connectDB;
