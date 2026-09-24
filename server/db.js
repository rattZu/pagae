import mysql from 'mysql2/promise';

process.loadEnvFile();

export const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'pagae',
    dateStrings: true
});
