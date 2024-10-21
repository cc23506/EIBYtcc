const controller = require('../app/controllers/controller');
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Cria a pasta se não existir
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Define o diretório de upload
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Gera um nome de arquivo único
  }
});

const upload = multer({ storage: storage });

// Rotas
router.get('/', controller.showLogin);
router.post('/login', controller.login);
router.get('/home', controller.showHome);
router.get('/produtos', controller.showProdutos);
router.get('/produtosadm', controller.showProdutosADM);
router.get('/zones', controller.showZones);
router.get('/zonesadm', controller.showZonesADM);
router.get('/logout', controller.logout);
router.get('/sobre', controller.showSobre);
router.post('/pedir-produto', controller.pedirProduto);
router.get('/status-robot', controller.statusRobot);
router.post('/editar-produto/:produtoId', controller.editProduto);
router.post('/editar-zone/:zoneId', controller.editZone);
router.post('/save-produto', controller.saveProduto);
router.post('/save-zone', controller.saveZone);
router.post('/delete-produto', controller.delProduto);
router.post('/delete-zone', controller.delZone);
router.post('/novo-produto', controller.newProduto);
router.post('/new-zone', controller.newZone);
router.post('/new-map', controller.newMap);

router.post('/upload-map', upload.single('image'), controller.uploadMap);

module.exports = router;