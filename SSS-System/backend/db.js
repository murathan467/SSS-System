const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',         // Veritabanı sunucun (genellikle localhost)
    user: 'root',              // MySQL kullanıcı adın
    password: 'Musti105.',       // MySQL şifren
    database: 'sss_sistemi', 
        port: 3306,  // Veritabanı adın
        charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
