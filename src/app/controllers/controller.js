const Model = require('../models/model.js');
const sizeOf = require('image-size');
const axios = require('axios');
const path = require('path');

exports.showLogin = (req, res) => {
  if (req.session.username){
    return res.redirect('/home');
  }
  res.render('login/login');
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.render('login/login', { error: 'Usuário e senha são obrigatórios!' });
    }

    const foundUser = await Model.findUserByUsername(username);

    if (foundUser && password === foundUser.password) {
      req.session.username = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role
      };
      
      return res.redirect('/home');
    } else {
      return res.render('login/login', { error: 'Usuário ou senha incorretos!' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).render('login/login', { error: 'Ocorreu um erro no servidor, tente novamente mais tarde.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.pedirProduto = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  const produtoId = req.body.produtoId;
  const produto = await Model.findProductById(produtoId);
  const zone = await Model.findZoneByProduct(produtoId);
  const zoneImage = await Model.findImageById(zone.image_id);
  const imageWidth = zoneImage.imageWidth;
  const imageHeight = zoneImage.imageHeight;

  try {
    if (!produto) {
      return res.status(404).send('Produto não encontrado no banco de dados.');
    }

    const scaleX = imageWidth / 100;
    const scaleY = imageHeight / 100;

    const scaledZone = {
      x1: zone.x1 * scaleX,
      x2: zone.x2 * scaleX,
      y1: zone.y1 * scaleY,
      y2: zone.y2 * scaleY
    };

    const response = await axios.post(`http://100.112.13.108:5000/api/control-robot`, {
      requester: req.session.username,
      product: produto.name,
      zone: scaledZone,
      imageHeight: imageHeight,
      imageWidth: imageWidth
    });

    if (response.data.success) {
      res.render('logged/buscaProduto', {
        username: req.session.username,
        produto,
        zone
      });
    } else {
      res.status(404).send('Produto não encontrado pelo robô.');
    }

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      res.status(500).send('O servidor demorou muito para responder.');
    } else if (error.response) {
      res.status(error.response.status).send(`Erro na comunicação com o servidor: ${error.response.data.message}`);
    } else {
      console.error(error);
      res.status(500).send('Erro ao comunicar com o servidor.');
    }
  }
};

exports.statusRobot = async (req, res) => {
  try {
    const statusResponse = await axios.get('http://100.112.13.108:5000/api/status-robot');

    if (statusResponse.data.success) {
      res.json({
        success: true,
        message: statusResponse.data.message
      });
    } else {
      res.json({
        success: false,
        message: 'Erro com o robô.'
      });
    }
  } catch (error) {
    console.error('Erro ao obter status do robô:', error);
    res.json({
      success: false,
      message: 'Erro ao comunicar com o robô.'
    });
  }
};

exports.delProduto = async (req, res) => {
  const produtoId = req.body.produtoId;

  try {
    await Model.deleteZoneProduct(produtoId);
    await Model.deleteProduct(produtoId);
    res.redirect('/produtos');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar o produto');
  }
};

exports.saveProduto = async (req, res) => {
  const { produtoId, name, description, zonaId } = req.body;
  try {
    let productId;
    if (produtoId) {
      await Model.alterProduct(produtoId, name, description, zonaId);
      await Model.alterProductZone(produtoId, zonaId);
      productId = produtoId;
    } else {
      const result = await Model.insertProduct(name, description, zonaId);
      productId = result.insertId;
    }

    await Model.deleteProductZones(productId);
    if (zonaId) {
      await Model.insertProductZone(productId, zonaId);
    }

    res.redirect('/produtos');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao salvar o produto');
  }
};

exports.newProduto = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  try {
    const produtoId = req.params.id;
    const produto = produtoId ? await Model.findProductById(produtoId) : null;

    const zonas = await Model.findZone();

    res.render('logged/produtosForm', {
      produto,
      zonas
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar dados do produto');
  }
};


exports.editProduto = async (req, res) => {
  const { produtoId } = req.params;

  if (!produtoId) {
    return res.status(400).send('ID do produto não foi fornecido.');
  }

  try {
    const produto = await Model.findProductById(produtoId);
    const zonas = await Model.findZone();

    if (!produto) {
      return res.status(404).send('Produto não encontrado');
    }

    if (!produto.zone_id) {
      const zone = await Model.findZoneByProduct(produto.id);
      produto.zone_id = zone ? zone.id : null;
    }

    res.render('logged/produtosForm', {
      username: req.session.username,
      role: req.session.role,
      produto,
      zonas
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar o produto');
  }
};

exports.showProdutosEdit = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  try {
    const produtos = await Model.findProduct();

    const produtosComZonas = await Promise.all(produtos.map(async (produto) => {
      const zona = await Model.findZoneByProduct(produto.id) || {}; // Garante que não seja undefined
      return { ...produto, zona };  // Associa a zona ao produto, mesmo que seja um objeto vazio
    }));

    if (req.session.username.role === 'admin') {
      res.render('logged/produtosEdit', {
        username: req.session.username,
        role: req.session.username.role,
        produtos: produtosComZonas  // Envie os produtos com as zonas
      });
    } else {
      res.redirect('/produtos');
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar produtos');
  }
};

exports.showProdutos = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  try {
    const produtos = await Model.findProduct();

    const produtosComZonas = await Promise.all(produtos.map(async (produto) => {
      const zona = await Model.findZoneByProduct(produto.id) || {}; // Garantindo que 'zona' será sempre um objeto
      return { ...produto, zona }; // Passando 'zona' junto com o 'produto'
    }));

    res.render('logged/produtos', {
      username: req.session.username,
      role: req.session.role,
      produtos: produtosComZonas
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar produtos');
  }
};


exports.showHome = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  res.render('logged/home', {
    username: req.session.username,
    role: req.session.username.role,
  })
};

exports.showEditable = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  res.render('logged/editAll', {
    username: req.session.username,
    role: req.session.username.role,
  })
};

exports.showSobre = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  res.render('logged/sobre', {
    username: req.session.username,
    role: req.session.username.role,
  })
};

exports.delZone = async (req, res) => {
  const zoneId = req.body.zoneId;
  const userId = req.session.username.id;

  try {
    await Model.deleteZone(zoneId);

    const zones = await Model.findZone();

    const latestImage = await Model.findLatestImageByUser(userId);
    res.render('logged/zonesView', {
      username: req.session.username.username,
      role: req.session.username.role,
      imagePath: latestImage.imagePath,
      zones: zones
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao deletar zona');
  }
};


exports.editZone = async (req, res) => {
  const { zoneId } = req.body;
  const userId = req.session.username.id;
  const latestImage = await Model.findLatestImageByUser(userId);
  const zones = await Model.findZoneByPathId(latestImage.id);
  const zone = await Model.findZoneById(zoneId);
  const imagePath = latestImage.imagePath.replace(/.*public\\uploads\\/, '');

  try {

    if (!zone) {
      return res.status(404).send('Zona não encontrada');
    }

    if (!latestImage) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.render('logged/zonesForm', {
      username: req.session.username,
      role: req.session.role,
      zone,
      imagePath: imagePath,
      zones: zones || [],
      editingZoneId: zoneId,
      imageId: latestImage.id
    });
  } catch (error) {
    console.error('Erro ao buscar zona ou imagem:', error);
    res.status(500).send('Erro no servidor');
  }
};

exports.showZonesEdit = async (req, res) => {
  try {
    const zones = await Model.findZone();
    if (req.session.username && req.session.username.role === 'admin') {
      res.render('logged/zonesEdit', {
        username: req.session.username,
        zones: zones
      });
    } else {
      res.status(403).send('Acesso negado');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar zonas');
  }
}

exports.showZones = async (req, res) => {
  try {
    if (!req.session.username || !req.session.username.id) {
      return res.redirect('/');
    }

    const username = req.session.username.username;
    const userId = req.session.username.id;

    const latestImage = await Model.findLatestImageByUser(userId);

    if (!latestImage) {
      return renderErrorWithRedirect(req, res, 'É necessário enviar um arquivo para acessar a zona.');
    }

    const imagePath = latestImage.imagePath.replace(/.*public\\uploads\\/, '');

    const zones = await Model.findZoneByPathId(latestImage.id);

    res.render('logged/zones', {
      username: username,
      imagePath: imagePath,
      zones: zones || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar as zonas');
  }
};

exports.newZone = async (req, res) => {
  const userId = req.session.username.id;
  const latestImage = await Model.findLatestImageByUser(userId);
  const zones = await Model.findZoneByPathId(latestImage.id);
  const imagePath = latestImage.imagePath.replace(/.*public\\uploads\\/, '');

  if (!req.session.username) {
    return res.redirect('/');
  }
  
  try {
    if (!latestImage) {
      return renderErrorWithRedirect(req, res, 'Nenhuma imagem encontrada para o usuário.');
    }

    res.render('logged/zonesForm', {
      imageId: latestImage.id,
      imagePath: imagePath,
      zones: zones || [],
      zone: null,
      editingZoneId: null  // Definido como null para criação de nova zona
    });
  } catch (error) {
    console.error('Erro ao buscar dados da imagem:', error);
    res.status(500).send('Erro ao buscar dados da imagem');
  }
};

exports.saveZone = async (req, res) => {
  const { zoneId, name, x1, x2, y1, y2, imageId } = req.body;
  console.log(req.body)
  try {
      if (zoneId) {
          await Model.alterZone({ id: zoneId, name, x1, x2, y1, y2, image_id: imageId });
          res.redirect('/zonesEdit');
      } else {
          await Model.insertZone({ name, x1, x2, y1, y2, image_id: imageId });
          res.redirect('/zonesEdit');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao salvar a zona');
  }
};

exports.deleteZone = (req, res) => {
    const { zoneId } = req.body;
    Model.deleteZone({ where: { id: zoneId } })
        .then(() => res.redirect('/zonesadm'))
        .catch(err => res.status(500).send(err.message));
};

function renderErrorWithRedirect(req, res, errorMessage) {
  res.render('errorPage', {
    message: errorMessage,
    redirectUrl: '/new-plan',
    errorRedirect: true
  });
}

exports.newPlan = async (req, res) => {
  try {
    if (!req.session.username || !req.session.username.id) {
      return res.redirect('/');
    }
    const user = req.session.username.id
    res.render('logged/planForm', {
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar o formulário da zona');
  }
};

exports.uploadMap = async (req, res) => {
  console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).send('Nenhuma imagem foi enviada');
    }

    // Caminho público para o acesso via URL
    const imagePath = `/uploads/${req.file.filename}`;
    console.log(imagePath);

    // Caminho absoluto no sistema de arquivos
    const absoluteImagePath = path.join(__dirname, '../../../public/', imagePath);

    // Obter dimensões da imagem
    const dimensions = sizeOf(absoluteImagePath);
    const imageWidth = dimensions.width;
    const imageHeight = dimensions.height;

    // Obter o ID do usuário
    const userId = req.session.username.id;

    // Remover zonas e imagens antigas relacionadas ao usuário
    await Model.deleteUserZonesAndImage(userId);

    // Inserir a nova imagem e suas dimensões no banco
    await Model.insertZoneImage(imagePath, imageWidth, imageHeight, userId);

    // Redirecionar para a página de zonas
    res.redirect('/zones');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao fazer upload da imagem');
  }
};