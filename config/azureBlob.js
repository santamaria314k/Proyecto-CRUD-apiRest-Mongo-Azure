const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "almacenablobimg";

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Crear contenedor si no existe
async function asegurarContenedor() {
    await containerClient.createIfNotExists({
        access: 'blob'
    });
    console.log(`Contenedor ${CONTAINER_NAME} listo`);
}
asegurarContenedor().catch(console.error);

// Subir imagen a Azure Blob Storage
async function subirImagenAzure(file) {
    if (!file) throw new Error("Archivo no proporcionado");
    
    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });
    
    return blockBlobClient.url;
}

// Eliminar imagen de Azure Blob Storage
async function eliminarImagenAzure(imageUrl) {
    if (!imageUrl) return false;
    
    try {
        // Extraer el nombre del blob de la URL
        const blobName = imageUrl.split('/').pop().split('?')[0];
        if (!blobName) return false;
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        return true;
    } catch (error) {
        console.error("Error al eliminar imagen:", error);
        return false;
    }
}

module.exports = { 
    subirImagenAzure, 
    eliminarImagenAzure 
};