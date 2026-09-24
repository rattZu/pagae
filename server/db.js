import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'senha123',
    database: 'pagae'
});
