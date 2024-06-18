const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require('jsonwebtoken');

const app = express();
   
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: 'user_id',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60 * 60 * 24
    }
}))


const urlDB = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQL_ROOT_PASSWORD}@${process.env.RAILWAY_TCP_PROXY_DOMAIN}:${process.env.RAILWAY_TCP_PROXY_PORT}/${process.env.MYSQL_DATABASE}`;
const db = mysql.createConnection(urlDB);

//

app.post('/register', (req, res) => {
    console.log(req.body);
  
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    
  
    if (!username || !password) {
      return res.status(400).send({ message: 'Username and password are required' });
    }
  
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.log(err);
      }
  
      db.query("INSERT INTO users (`username`, `password`, `role`) VALUES (?, ?, ?)", [username, hash, role], (err, result) => {
        console.log(err);
    });
    });
  });




const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    res.send("We need a token, please give it to us next time");
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: 'Failed to authenticate' });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
}

app.get("/isUserAuth", verifyJWT ,(req, res) => {
    res.send("You are Authenticated");
})



app.get('/login', (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user });
    } else {
        res.send({ loggedIn: false });
    }
});



app.post('/login', (req, res) => {
    console.log(req.body);
  
    const username = req.body.username;
    const password = req.body.password;
  
    db.query("SELECT * FROM users WHERE username = ?", 
      username,
      (err, result) => {
      if (err) {
        console.log(err);
      }
  
      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (error, response) => {
          if (response) {
            const id = result[0].id;
            const token = jwt.sign({ id }, 'supersecret', {
              expiresIn: 300
            });
            req.session.user = result;

            res.json({ auth: true, token: token, result: result });
          } else {
            res.json({ auth: false, message: 'Wrong password or username' });
          }
        });
      } else {
        res.json({ auth: false, message: 'No user found' });
      }
    });
  });

  app.post('/consultas', (req, res) => {
    console.log(req.body);
  
    const medico = req.body.medico;
    const paciente = req.body.paciente;
    const date = req.body.date;
    const farmacos = req.body.farmacos;
  
    if (!medico || !paciente || !date) {
      return res.status(400).send({ error: 'Medico, paciente, and date are required' });
    }
  
    db.query("INSERT INTO consulta (`id_medicos`, `id_paciente`, `data`, `farmacos_cons`) VALUES (?, ?, ?, ?)", [medico, paciente, date, farmacos], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Failed to register consulta' });
      }
  
      console.log('Consulta registered successfully');
      res.status(201).send({ message: 'Consulta registered successfully' });
    });
  });

  app.get('/pacientesficha', (req, res) => {
    db.query("SELECT * FROM pacientes", (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Error fetching paciente records' });
      }
  
      res.send(result);
    })
  })

  


  app.get('/pacientesficha/:pacientename', (req, res) => {
    const pacientename = req.params.pacientename; 

    if (!pacientename) {
      return res.status(400).send({ error: 'Missing pacientename parameter' });
    }
  
    db.query("SELECT * FROM pacientes WHERE pacientename = ?", [pacientename], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Error fetching paciente record' });
      }
  
      if (result.length === 0) {
        return res.status(404).send({ error: 'Paciente not found' });
      }
  
      res.send(result);
    });
  });

  app.get('/medicoagenda/:medic', (req, res) => {
    const medic = req.params.medic; 

    if (!medic) {
      return res.status(400).send({ error: 'Missing medic parameter' });
    }
  
    db.query("SELECT * FROM consulta WHERE id_medicos = ?", [medic], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Error fetching medic record' });
      }
  
      if (result.length === 0) {
        return res.status(404).send({ error: 'medic not found' });
      }
  
      res.send(result);
    });
  });

  app.get('/pacienteagenda/:paciente', (req, res) => {
    const paciente = req.params.paciente; 

    if (!paciente) {
      return res.status(400).send({ error: 'Missing paciente parameter' });
      
    }
  
    db.query("SELECT * FROM consulta WHERE id_paciente = ?", [paciente], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Error fetching paciente record' });
      }
  
      if (result.length === 0) {
        return res.status(404).send({ error: 'paciente not found' });
      }
  
      res.send(result);
    });
  });
    
  app.get('/farmacos', (req, res) => {
        db.query("SELECT * FROM farmacos", (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send({ error: 'Error fetching farmacos' });
          }
      
          res.send(result);
        });
      });

  

      app.post('/register-ficha', (req, res) => {
        console.log(req.body);
      
        const pacientename = req.body.pacientename;
        const genero = req.body.genero;
        const NomeCompleto = req.body.NomeCompleto;
        const Contacto = req.body.Contacto;
        const Email = req.body.Email;
        const Morada = req.body.Morada;
        const DataDeNascimento = req.body.DataDeNascimento;
      
        if (!pacientename || !genero || !NomeCompleto || !Contacto || !Email || !Morada || !DataDeNascimento) {
          return res.status(400).send({ error: 'All fields are required' });
        }
      
        db.query("INSERT INTO pacientes (`pacientename`, `genero`, `Nome_Completo`, `Contacto`, `email`, `Morada`, `data_de_nascimento`) VALUES (?, ?, ?, ?,?,?,?)", [pacientename, genero, NomeCompleto, Contacto, Email, Morada, DataDeNascimento], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send({ error: 'Failed to register consulta' });
          }
      
          console.log('Consulta registered successfully');
          res.status(201).send({ message: 'Consulta registered successfully' });
        });
      });



      app.post('/empregados', (req, res) => {
        console.log(req.body);

        const username = req.body.username;
        const DataDeNascimento = req.body.DataDeNascimento;
        const Contacto = req.body.Contacto;
        const Email = req.body.Email;
        db.query("INSERT INTO empregados (empregadosname, Contacto, Email, data_de_nascimento) VALUES (?, ?, ?, ?)", [username, Contacto, Email, DataDeNascimento], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send({ error: 'Failed to register consulta' });
          }
      
          console.log('Consulta registered successfully');
          res.status(201).send({ message: 'Consulta registered successfully' });
        });
      });

      app.get('/empregados/:username', (req, res) => {
        const username = req.params.username;
        if (!username) {
          return res.status(400).send({ error: 'Missing username parameter' });
        }
        db.query("SELECT * FROM empregados WHERE empregadosname = ?", [username], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send({ error: 'Error fetching empregados record' });
          }
          if (result.length === 0) {
            return res.status(404).send({ error: 'empregados not found' });
          }
          res.send(result);
        });
      });
      
app.listen(3001, () => {
    console.log('Server running on port 3001');
})

