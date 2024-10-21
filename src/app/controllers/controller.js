const Model = require('../models/model.js');
const axios = require('axios');
const fs = require('fs');

exports.showLogin = (req, res) => {
  if (req.session.username){
    return res.redirect('/home');
  }
  res.render('login/login', { error: undefined });
};

// Função para processar o login
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

  try {

    if (!produto) {
      return res.status(404).send('Produto não encontrado no banco de dados.');
    }

    const response = await axios.post('http://10.0.2.15:5000/api/control-robot', {
      requester: req.session.username,
      product: produto.name,
      zone: zone
    });

    res.render('logged/buscaProduto', {
      username: req.session.username,
      produto,
      zone
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
      res.status(500).send('O robô demorou muito para responder.');
    } else if (error.response) {
      res.status(error.response.status).send(`Erro na comunicação com o robô: ${error.response.data.message}`);
    } else {
      console.error(error);
      res.status(500).send('Erro ao comunicar com o robô.');
    }
  }
};

exports.statusRobot = async (req, res) => {
  try {
    const statusResponse = await axios.get('http://192.168.0.110:5000/api/status-robot');

    if (statusResponse.data.success) {
      res.json({
        success: true,
        message: statusResponse.data.message
      });
    } else {
      res.json({
        success: false,
        message: 'Erro ao obter o status do robô.'
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
  const { produtoId, name, description, zone } = req.body;
  try {
    let productId;
    if (produtoId) {
      await Model.alterProduct(produtoId, name, description);
      productId = produtoId;
    } else {
      const result = await Model.insertProduct(name, description);
      productId = result.insertId;
    }

    await Model.deleteProductZones(productId);
    if (zone) {
      await Model.insertProductZone(productId, zone);
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
    // Busca o produto e a zona associada, se houver
    const produtoId = req.params.id; // Pode ser undefined se estiver criando um novo produto
    const produto = produtoId ? await Model.findProductById(produtoId) : null;

    // Busque todas as zonas disponíveis
    const zonas = await Model.findZone();

    res.render('logged/produtosForm', {
      produto,
      zonas  // Certifique-se de passar a variável 'zonas'
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
    // Busca o produto pelo ID e a zona associada
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

exports.showProdutosADM = async (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }

  try {
    const produtos = await Model.findProduct();

    const produtosComZonas = await Promise.all(produtos.map(async (produto) => {
      const zona = await Model.findZoneByProduct(produto.id);
      return { ...produto, zona };  // Associe a zona ao produto
    }));

    if (req.session.username.role === 'admin') {
      res.render('logged/produtos', {
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
      const zona = await Model.findZoneByProduct(produto.id);
      return { ...produto, zona };
    }));

    res.render('logged/produtosView', {
      username: req.session.username,
      role: req.session.role,
      produtos: produtosComZonas  // Envie os produtos com as zonas
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

    // Busca a imagem mais recente do usuário e suas zonas
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
  const imagePath = latestImage.imagePath.replace(/.*public\\uploads\\/, '');
  const zone = await Model.findZoneById(zoneId);

  try {

    if (!zone) {
      return res.status(404).send('Zona não encontrada');
    }

    if (!latestImage) {
      return res.status(404).send('Imagem não encontrada');
    }

    res.render('logged/zonesEdit', {
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

exports.showZonesADM = async (req, res) => {
  try {
    const zones = await Model.findZone();
    if (req.session.username && req.session.username.role === 'admin') {
      res.render('logged/zones', {
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
    // Verifica se o usuário está autenticado
    if (!req.session.username || !req.session.username.id) {
      return res.redirect('/'); // Redireciona se não estiver autenticado
    }

    // Obtém o nome do usuário e o ID
    const username = req.session.username.username;
    const userId = req.session.username.id;

    // Busca a imagem mais recente do usuário e suas zonas
    const latestImage = await Model.findLatestImageByUser(userId);

    // Verifica se a imagem existe
    if (!latestImage) {
      return renderErrorWithRedirect(req, res, 'É necessário enviar um arquivo para acessar a zona.');
    }

    // Ajusta o caminho da imagem para ser relativo ao diretório público
    const imagePath = latestImage.imagePath.replace(/.*public\\uploads\\/, '');

    const zones = await Model.findZoneByPathId(latestImage.id);

    res.render('logged/zonesView', {
      username: username,   // Nome do usuário
      imagePath: imagePath, // Caminho relativo da imagem
      zones: zones || []    // Passa uma lista vazia se não houver zonas
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

    res.render('logged/zonesAdd', {
      imageId: latestImage.id,
      imagePath: imagePath,
      zones: zones || []
    });
  } catch (error) {
    console.error('Erro ao buscar dados da imagem:', error);
    res.status(500).send('Erro ao buscar dados da imagem');
  }
};

exports.saveZone = async (req, res) => {
  const { zoneId, name, x1, x2, y1, y2, imageId } = req.body;
  try {
      if (zoneId) {
          // Atualizar zona existente
          await Model.alterZone({ id: zoneId, name, x1, x2, y1, y2, image_id: imageId });
          res.redirect('/zonesadm');
      } else {
          // Criar nova zona
          await Model.insertZone({ name, x1, x2, y1, y2, image_id: imageId });
          res.redirect('/zonesadm');
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
    redirectUrl: '/new-map',
    errorRedirect: true
  });
}

exports.newMap = async (req, res) => {
  try {
    // Verifica se o usuário está autenticado
    if (!req.session.username || !req.session.username.id) {
      return res.redirect('/'); // Ou para a página de login, se necessário
    }
    const user = req.session.username.id // Obtendo o ID do usuário da sessão
    // Passa o ID do usuário para a view
    res.render('logged/mapZones', {
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar o formulário da zona');
  }
};

exports.uploadMap = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nenhuma imagem foi enviada');
    }

    const imagePath = `/uploads/${req.file.filename}`;  // Caminho relativo público
    const userId = req.session.username.id;

    // Apaga todas as zonas e a imagem anterior do usuário
    await Model.deleteUserZonesAndImage(userId);

    // Insere o caminho da nova imagem e o ID do usuário no banco de dados
    await Model.insertZoneImage(imagePath, userId);

    // Constrói a URL completa para acessar a imagem a partir de qualquer lugar
    const fullImageUrl = `${req.protocol}://${req.get('host')}${imagePath}`;

    // Retorna a URL completa da imagem pública
    res.redirect('/zones'); // Ou responda com JSON, se preferir
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao fazer upload da imagem');
  }
};
