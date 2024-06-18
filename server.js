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


const urlDB = `mysql://${process.env.MYSQLUSER}:${process.env.MYSQL_ROOT_PASSWORD}@${process.env.RAILWAY_TCP_PROXY_DOMAIN}:${process.env.RAILWAY_TCP_PROXY_PORT}}/${process.env.MYSQL_DATABASE}`
const db = mysql.createConnection({urlDB});


app.listen(3001, () => {
    console.log('Server running on port 3001');
})

