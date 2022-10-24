const https = require('https');
const fs = require('fs');


const express = require('express')
const sqlite3 = require('sqlite3').verbose();
const app = express()

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs')
const { auth } = require('express-openid-connect');
require('dotenv').config()

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;


//const PORT = process.env.PORT || 3000

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: externalUrl || `http://localhost:${port}`,
    clientID: process.env.CLIENTID,
    issuerBaseURL: process.env.ISSUER
  };

app.use(auth(config));
//const baza = require('./baza')
// open the database
let db = new sqlite3.Database('./baza_utakmice.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to database.');
  });


app.get("/", (req, res) => {
    //console.log(req.oidc.isAuthenticated())
    //console.log(req.oidc.user['email'])
    const sql = `SELECT * FROM utakmica ORDER BY ID`
    //const d = `DELETE FROM utakmica`
    const sql_l = `SELECT team_name, sum(score) as suma
                FROM ljestvica
                GROUP BY team_name
                ORDER BY suma DESC`
    db.all(sql, [], (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
        db.all(sql_l, [], (err, rows_l) => {
            if (err) {
              return console.error(err.message);
            }
            
            res.render('index', {rows: rows, rows_l: rows_l, 
                                isAuthenticated: req.oidc.isAuthenticated(),
                                user: req.oidc.user})
          }); 
        //res.render('index', {rows: rows})
      }); 
     

})

app.get("/raspored", (req, res) =>{
    res.render('raspored',{isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user})
})

app.get("/comments", (req, res) =>{

        const sql = `SELECT vrijeme, mail, komentar, id
        FROM komentari`
        db.all(sql, [], (err, rows) => {
        if (err) {
        return console.error(err.message);
        }
        //console.log(rows[1].id)
       // console.table(rows)
        res.render('comments',{isAuthenticated: req.oidc.isAuthenticated(),
            user: req.oidc.user, rows: rows})
        });

    
})
app.post("/comments",(req, res) => {
   const sql = `INSERT INTO komentari(mail, komentar) VALUES (?, ?)`;
   const nove = [req.oidc.user['email'], req.body.kom_value.trim()];
   db.run(sql, nove, err => {

        res.redirect("/comments");
    }); 
})
app.get("/delete/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `DELETE FROM komentari WHERE id = ?`;
    db.get(sql, id, (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        //console.log(row)
        res.redirect("/comments");
        
      });
  });
  app.post("/delete/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const sql = "DELETE FROM komentari WHERE id = ?";
    db.run(sql, id, err => {
      // if (err) ...
      res.redirect("/comments");
    });
  });

app.get("/addNewGame", (req, res) =>{
    res.render('newGame',{isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user})
})

/*app.get("/comment", (req, res) =>{
    const sql = `SELECT vrijeme, mail, komentar
                FROM komentari`
    db.all(sql, [], (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
        res.render('comments', {rows: rows})
      });
    
}) */
app.get("/edit", (req, res) =>{
    res.send("Uredi")
})
app.get("/edit/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `SELECT * FROM utakmica WHERE id = ?`;
    db.get(sql, id, (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        //console.log(row)
        res.render('edit', {row : row, isAuthenticated: req.oidc.isAuthenticated(),
            user: req.oidc.user});
      });
  });
app.get("/addNewGame", (req, res) =>{
    res.render('newGame')
})


app.post("/addNewGame",(req, res) => {
    //const sql = `INSERT INTO utakmica(id,team1_name,team1_score,team2_name,team2_score)
   // VALUES (`+id+`, '`+team1+ `', `+team1score+`, '`+team2+`', `+team2score + `)`
   const sql = `INSERT INTO utakmica(id,team1_name,team1_score,team2_name,team2_score) VALUES (?, ?, ?, ?, ?)`;
   const sql_ljestvica = `INSERT INTO ljestvica(team_name,score,id) VALUES(?,?,?)`
   const nove = [parseInt(req.body.id), req.body.team1_name.trim(), parseInt(req.body.team1_score), req.body.team2_name.trim(), parseInt(req.body.team2_score)];
   const nov_ljes1 = [req.body.team1_name.trim(), parseInt(req.body.team1_score),parseInt(req.body.id)]
   const nov_ljes2 = [req.body.team2_name.trim(), parseInt(req.body.team2_score),parseInt(req.body.id)]
   db.run(sql, nove, err => {

        //res.redirect("/");
    });
    db.run(sql_ljestvica, nov_ljes1, err => {

        //res.redirect("/");
    });
    db.run(sql_ljestvica, nov_ljes2, err => {

        res.redirect("/");
    });
    
})

app.post("/edit/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const nove = [req.body.team1_name.trim(), parseInt(req.body.team1_score), req.body.team2_name.trim(), parseInt(req.body.team2_score),id];
    const sql = "UPDATE utakmica SET team1_name = ?, team1_score = ?, team2_name = ?, team2_score = ? WHERE (ID = ?)";
    const sql_l = `UPDATE ljestvica SET score = ? WHERE (team_name = ? AND id = ?)`
    const nova1 = [parseInt(req.body.team1_score), req.body.team1_name.trim(),id]
    const nova2 = [parseInt(req.body.team2_score), req.body.team2_name.trim(),id]
    db.run(sql,nove, err => {
      if (err) {
        return console.error(err.message);
      }
      //res.redirect("/");
    });
    db.run(sql_l,nova1, err => {
        if (err) {
          return console.error(err.message);
        }
        //res.redirect("/");
      });
      db.run(sql_l,nova2, err => {
        if (err) {
          return console.error(err.message);
        }
        res.redirect("/");
      }); 
  });

function nova() {
    const sql_create = `CREATE TABLE IF NOT EXISTS ljestvica (
        team_name  VARCHAR(100),
        score INTEGER,
        id INTEGER
      );`;
    const kom = `CREATE TABLE IF NOT EXISTS komentari (
        mail  VARCHAR(100),
        komentar TEXT,
        vrijeme DATETIME DEFAULT CURRENT_TIMESTAMP,
        id INTEGER PRIMARY KEY AUTOINCREMENT
      );`;
    const sql_del = `DROP TABLE ljestvica`
    const ov = `DELETE FROM ljestvica`
    const q = `SELECT * FROM utakmica`
      db.run(ov, err => {
        if (err) {
          return console.error(err.message);
        }
        console.log("Successful creation of the 'koemntari' table");
    })
    /*db.all(q, [], (err, rows) => {
        if (err) {
        return console.error(err.message);
        }
        console.table(rows[0].id)
        }); */
}
//nova()

if (externalUrl) {
  const hostname = '127.0.0.1';
  app.listen(port, hostname, () => {
  console.log(`Server locally running at http://${hostname}:${port}/ and from
  outside on ${externalUrl}`);
  });
  }else {
    app.listen(3000, () => {
      console.log('Server listening on : 3000')
    })
    }
    

/*app.listen(PORT, () => {
  console.log('Server listening on :' + PORT)
}) */