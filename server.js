const express = require("express");
const mysql = require("mysql");
const util = require("util");
const os = require("os");

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { log } = require("console");

const app = express();

let pool;

async function initialize() {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_NAME,
    })
  );

  const secret = JSON.parse(response.SecretString);
  console.log(secret);
  
  console.log("Loaded DB secret.");

  pool = mysql.createPool({
    host: secret.db_host,
    port: secret.db_port,
    user: secret.db_username,
    password: secret.db_password,
    database: secret.db_name,
  });

  pool.query = util.promisify(pool.query);
  // Implement the movies API endpoint
  app.get('/movies', async function (req, res) {
    try {
      const rows = await pool.query(
        'select m.title, m.release_year, m.score, r.name as reviewer, p.name as publication from movies m,' +
        'reviewers r, publications p where r.publication=p.name and m.reviewer=r.name'
      )
      res.json(rows)
    } catch (err) {
      console.error('API Error:', err)
      res.status(500).send({'msg': 'Internal server error'})
    }
  })

  app.get('/reviewers', async function (req, res) {
    try {
      const rows = await pool.query('select r.name, r.publication, r.avatar from reviewers r')
      res.json(rows)
    } catch (err) {
      console.error('API Error:', err)
      res.status(500).send({'msg': 'Internal server error'})
    }
  })

  app.get('/publications', async function (req, res) {
    try {
      const rows = await pool.query('select r.name, r.avatar from publications r')
      res.json(rows)
    } catch (err) {
      console.error('API Error:', err)
      res.status(500).send({'msg': 'Internal server error'})
    }
  })

  app.get('/pending', async function (req, res) {
    try {
      const rows = await pool.query(
        'select m.title, m.release_year, m.score, r.name as reviewer, p.name as publication ' +
        'from movie_db.movies m, movie_db.reviewers r, movie_db.publications p ' +
        'where r.publication = p.name ' +
        'and m.reviewer = r.name ' +
        'and m.release_year >= 2017'
      );
      res.json(rows)
    } catch (err) {
      console.error('API Error:', err)
      res.status(500).send({'msg': 'Internal server error'})
    }
  })

  app.get('/', function (req, res) {
    res.status(200).json({
      service_status: "Up",
      hostname: os.hostname(),
    });
  })

  console.log('server listening through port: ' + process.env.PORT)

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
  });
}

initialize().catch((err) => {
  console.error("Failed to initialize application");
  console.error(err);
  process.exit(1);
});

module.exports = app

// // Get our dependencies
// const express = require('express')
// const app = express()
// const mysql = require('mysql')
// const util = require('util')
// const os = require("os");

// console.log(process.env.AWS_REGION);
// console.log(process.env.DB_SECRET_NAME);

// let pool;

// const {
//   SecretsManagerClient,
//   GetSecretValueCommand,
// } = require("@aws-sdk/client-secrets-manager");

// const aws_client = new SecretsManagerClient({
//   region: process.env.AWS_REGION || "us-east-1",
// });

// const response = async ()=>{ 
//   return await client.send(
//     new GetSecretValueCommand({
//       SecretId: process.env.DB_SECRET_NAME,
//     })
//   );
// }
// console.log(response);

// // const secret = JSON.parse(response.SecretString);


// // pool = mysql.createPool({
// //   database: secret.db_name,
// //   host: secret.db_host,
// //   port: secret.db_port,
// //   user: secret.db_username,
// //   password: secret.db_password,
// // });

// // // const pool = mysql.createPool({
// // //   host: process.env.DB_HOST || 'localhost',
// // //   user: process.env.DB_USER || 'applicationuser',
// // //   password: process.env.DB_PASS || 'applicationuser',
// // //   database: process.env.DB_NAME || 'movie_db'
// // // })


// // pool.query = util.promisify(pool.query)

// // // Implement the movies API endpoint
// // app.get('/movies', async function (req, res) {
// //   try {
// //     const rows = await pool.query(
// //       'select m.title, m.release_year, m.score, r.name as reviewer, p.name as publication from movies m,' +
// //       'reviewers r, publications p where r.publication=p.name and m.reviewer=r.name'
// //     )
// //     res.json(rows)
// //   } catch (err) {
// //     console.error('API Error:', err)
// //     res.status(500).send({'msg': 'Internal server error'})
// //   }
// // })

// // app.get('/reviewers', async function (req, res) {
// //   try {
// //     const rows = await pool.query('select r.name, r.publication, r.avatar from reviewers r')
// //     res.json(rows)
// //   } catch (err) {
// //     console.error('API Error:', err)
// //     res.status(500).send({'msg': 'Internal server error'})
// //   }
// // })

// // app.get('/publications', async function (req, res) {
// //   try {
// //     const rows = await pool.query('select r.name, r.avatar from publications r')
// //     res.json(rows)
// //   } catch (err) {
// //     console.error('API Error:', err)
// //     res.status(500).send({'msg': 'Internal server error'})
// //   }
// // })

// // app.get('/pending', async function (req, res) {
// //   try {
// //     const rows = await pool.query(
// //       'select m.title, m.release_year, m.score, r.name as reviewer, p.name as publication ' +
// //       'from movie_db.movies m, movie_db.reviewers r, movie_db.publications p ' +
// //       'where r.publication = p.name ' +
// //       'and m.reviewer = r.name ' +
// //       'and m.release_year >= 2017'
// //     );
// //     res.json(rows)
// //   } catch (err) {
// //     console.error('API Error:', err)
// //     res.status(500).send({'msg': 'Internal server error'})
// //   }
// // })

// // app.get('/', function (req, res) {
// //   res.status(200).json({
// //     service_status: "Up",
// //     hostname: os.hostname(),
// //   });
// // })

// // console.log('server listening through port: ' + process.env.PORT)
// // app.listen(process.env.PORT || 3000)
// // module.exports = app

