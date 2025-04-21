const express = require('express');
const Trabajo = require("../models/trabajoModel.js");
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const { subirImagenAzure, eliminarImagenAzure } = require("../config/azureBlob");

const router = express.Router();

// Configuración de multer para subir imágenes en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// 1. Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {



        const trabajo = await Trabajo.find();
        res.status(200).json({ 
            success: true, 
            count: trabajo.length,
            data: trabajo 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            msg: `Error al obtener registros: ${error.message}` 
        });
    }
});

// 2. Obtener un usuario por ID
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                msg: "ID inválido" 
            });
        }

        const trabajo = await Trabajo.findById(req.params.id);
        if (!trabajo) {
            return res.status(404).json({ 
                success: false, 
                msg: "Registro no encontrado" 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: trabajo 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            msg: `Error al buscar: ${error.message}` 
        });
    }
});

// 3. Crear un usuario SIN imagen
router.post('/', async (req, res) => {
    try {
        const newTrabajo = await Trabajo.create(req.body);
        res.status(201).json({ 
            success: true, 
            data: newTrabajo 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            msg: `Error al crear: ${error.message}` 
        });
    }
});

// 3.1 Crear un usuario CON imagen (Azure Blob)
router.post('/with-image', upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                msg: "Debe proporcionar una imagen" 
            });
        }

        const imageUrl = await subirImagenAzure(req.file);

        const trabajoData = {
            name: req.body.name,
            lastName: req.body.lastName,
            phone: req.body.phone,
            birthdate: req.body.birthdate,
            imgUrl: imageUrl
        };

        const newTrabajo = await Trabajo.create(trabajoData);
        res.status(201).json({ 
            success: true, 
            data: newTrabajo 
        });
    } catch (error) {
        console.error("Error al crear usuario con imagen:", error);
        res.status(500).json({ 
            success: false, 
            msg: error.message || "Error al crear usuario con imagen" 
        });
    }
});

// 4. Actualizar usuario (solo datos)
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                msg: "ID inválido" 
            });
        }

        const trabajo = await Trabajo.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!trabajo) {
            return res.status(404).json({ 
                success: false, 
                msg: "Registro no encontrado" 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: trabajo 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            msg: `Error al actualizar: ${error.message}` 
        });
    }
});

// 4.1 Actualizar usuario CON imagen (Azure Blob)
router.put('/with-image/:id', upload.single("avatar"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                msg: "ID inválido" 
            });
        }

        // Obtener usuario actual
        const usuarioActual = await Trabajo.findById(req.params.id);
        if (!usuarioActual) {
            return res.status(404).json({ 
                success: false, 
                msg: "Usuario no encontrado" 
            });
        }

        let updateData = {
            name: req.body.name,
            lastName: req.body.lastName,
            phone: req.body.phone,
            birthdate: req.body.birthdate
        };

        // Si se subió una nueva imagen
        if (req.file) {
            // Eliminar la imagen anterior si existe
            if (usuarioActual.imgUrl) {
                await eliminarImagenAzure(usuarioActual.imgUrl);
            }
            
            // Subir nueva imagen
            const imageUrl = await subirImagenAzure(req.file);
            updateData.imgUrl = imageUrl;
        }

        const trabajo = await Trabajo.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            success: true, 
            data: trabajo 
        });
    } catch (error) {
        console.error("Error al actualizar usuario con imagen:", error);
        res.status(500).json({ 
            success: false, 
            msg: error.message || "Error al actualizar usuario" 
        });
    }
});

// 5. Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                msg: "ID inválido" 
            });
        }

        // Buscar usuario para obtener la URL de la imagen
        const usuario = await Trabajo.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                msg: "Usuario no encontrado" 
            });
        }

        // Eliminar imagen de Azure si existe
        if (usuario.imgUrl) {
            await eliminarImagenAzure(usuario.imgUrl);
        }

        // Eliminar usuario de la base de datos
        await Trabajo.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            success: true, 
            msg: "Usuario eliminado correctamente" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            msg: `Error al eliminar: ${error.message}` 
        });
    }
});

module.exports = router;
