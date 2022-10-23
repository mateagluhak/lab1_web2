//module.exports.sum = sum;
const sqlite3 = require('sqlite3').verbose();

// open the database
let db = new sqlite3.Database('./baza_utakmice.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to database.');
  });

  

  /*  const sql = `SELECT * FROM utakmica`
    db.all(sql, [], (err,rows) => {
      if (err) return console.error(err.message);
  
      rows.forEach((row) => {
        console.log(row['team2_name'])
      });
  
  }); */


module.exports.db = db;


