// Importa o módulo 'mysql2', que é utilizado para interagir com o banco de dados MySQL
const mysql = require('mysql2/promise');

// Configuração da conexão com o MySQL
const dbConfig = {
  host: 'autorack.proxy.rlwy.net',  // Endereço do servidor MySQL fornecido pela Railway
  user: 'root',                     // Nome de usuário
  password: 'mYtiExCPxbxyFRQGuZJxDnKmBThZuDPR', // Senha fornecida
  database: 'railway',         // Substitua por seu banco de dados correto
  port: 14296,                      // Porta do MySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Variável para armazenar a conexão com o pool de conexões
let poolPromise;

// Função assíncrona que conecta ao banco de dados
async function connect() {
  // Verifica se o pool de conexões já foi criado
  if (!poolPromise) {
    try {
      // Cria uma nova conexão se ainda não houver uma existente
      poolPromise = mysql.createPool(dbConfig);

      // Testa a conexão estabelecendo-a uma vez
      const connection = await poolPromise.getConnection();
      connection.release();

      // Exibe uma mensagem no console informando que a conexão foi bem-sucedida
      console.log('\n\n\tConectado ao Banco de dados');
    } catch (err) {
      // Se ocorrer algum erro durante a conexão, exibe o erro no console e lança o erro
      console.error('Erro ao conectar ao Banco de dados:', err);
      throw err;
    }
  }

  // Retorna o pool de conexões, para que possa ser reutilizado nas próximas consultas
  return poolPromise;
}

// Exporta a função 'connect' para permitir sua utilização em outros módulos
module.exports = {
  connect,  // Função de conexão com o banco de dados
  mysql     // Objeto 'mysql' que contém os métodos e funcionalidades do 'mysql2/promise'
};
