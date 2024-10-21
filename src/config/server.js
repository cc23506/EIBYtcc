// Importa as bibliotecas necessárias
const express = require('express');  // Framework para construção de servidores web
const path = require('path');        // Módulo para manipulação de caminhos de diretórios
const session = require('express-session');  // Gerenciamento de sessões no Express
const db = require('./db');          // Importa a conexão com o banco de dados SQL Server
const app = express();               // Inicializa a aplicação Express

// Conectar ao SQL Server
db.connect(); // Chama a função para conectar ao banco de dados. Verifique se a função retorna uma Promise e se erros de conexão estão sendo tratados.

// Configuração de sessão
app.use(session({
  secret: 'f4asd56g.!4we!fr@x13v@1@#FSA', // Chave secreta para assinar a sessão; em produção, substitua por uma chave segura
  resave: false,               // Impede que a sessão seja salva novamente se ela não for modificada
  saveUninitialized: false,    // Evita criar sessões não inicializadas, ou seja, apenas cria sessão se algo for armazenado nela
}));

// Configuração do motor de visualização EJS e pastas públicas
app.set('view engine', 'ejs'); // Define o EJS como a engine de templates usada para renderizar as views
app.set('views', path.join(__dirname, '../app/views')); // Define o diretório onde os arquivos de view estão localizados (ajuste o caminho se necessário)
app.use(express.static(path.join(__dirname, '../../public'))); // Define o diretório para arquivos estáticos, como CSS e imagens
app.use(express.urlencoded({ extended: true })); // Middleware para lidar com dados de formulários enviados via POST (formulários URL-encoded)
app.use(express.json());


// Rotas
const route = require('../route/routes'); // Importa o arquivo de rotas (verifique o caminho para garantir que esteja correto)
app.use('/', route); // Define as rotas para serem usadas no caminho raiz ('/')

// Iniciar servidor
const PORT = 8080;  // Define a porta na qual o servidor irá rodar
app.listen(PORT, () => {
  console.log(`\n\n\tServidor rodando na porta ${PORT}`); // Exibe mensagem no console informando que o servidor está rodando
});