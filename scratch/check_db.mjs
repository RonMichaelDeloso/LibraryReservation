import mysql from 'mysql2/promise';

async function checkDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'lS'
    });
    
    const [rows] = await connection.query("DESCRIBE notifications");
    console.log(rows);
    
    await connection.end();
  } catch (e) {
    console.error(e);
  }
}

checkDb();
