var mssql = require('mssql');

// Параметры соединения с БД
const config = {
  user: 'new_user',
  password: 'secure_password',
  server: 'localhost',
  database: 'testdb',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Создание пула соединений
var connectionPool = new mssql.ConnectionPool(config);

// Экспорт пула соединений
module.exports = (async () => {
  try {
    await connectionPool.connect();
    console.log('Успешное подключение к базе данных');
    return connectionPool;
  } catch (err) {
    console.error('Ошибка подключения к базе данных:', err);
    process.exit(1);
  }
})();
