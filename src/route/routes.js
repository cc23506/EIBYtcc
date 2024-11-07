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

router.get('/', controller.showLogin);
router.post('/login', controller.login);
router.get('/home', controller.showHome);

router.get('/produtos', controller.showProdutos);
router.post('/pedir-produto', controller.pedirProduto);
router.get('/status-robot', controller.statusRobot);

router.get('/zones', controller.showZones);

router.get('/editAll', controller.showEditable);
router.get('/produtosEdit', controller.showProdutosEdit);
router.post('/novo-produto', controller.newProduto);
router.post('/editar-produto/:produtoId', controller.editProduto);
router.post('/save-produto', controller.saveProduto);
router.post('/save-produto/:produtoId', controller.saveProduto);
router.post('/delete-produto', controller.delProduto);

router.get('/zonesEdit', controller.showZonesEdit);
router.post('/new-zone', controller.newZone);
router.post('/new-map', controller.newMap);
router.post('/upload-map', upload.single('image'), controller.uploadMap);

router.post('/editar-zone/:zoneId', controller.editZone);
router.post('/save-zone', controller.saveZone);
router.post('/save-zone/:zoneId', controller.saveZone);
router.post('/delete-zone', controller.delZone);

router.get('/sobre', controller.showSobre);

router.get('/logout', controller.logout);

module.exports = router;