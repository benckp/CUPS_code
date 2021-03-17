
const express = require("express");
const bodyParser = require('body-parser')
const mysql = require("mysql");
const session = require("express-session");
const nodemailer = require('nodemailer');

const server = express();

// mySQL create connection
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'csci3100',
    database  : 'project'
});

// Connect to mysql
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("Mysql connected");
});

// Sending email, for email verification
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'csci3100f6project@gmail.com',
      pass: 'csci3100churaf!'
    }
  });

// Set Static folder
server.use(express.static(__dirname + "/css_file"));
server.use(express.static(__dirname + "/js_file"));
server.set('view engine', 'ejs');
server.use(session({
    secret: 'secret-key',
    loggedin: false,
    username: "",
    resave: true,
    saveUninitialized: true
}));

server.get(['/', '/index'], (request, response) => {
    var greet;
    if (request.session.loggedin) {
        greet = "Hi " + request.session.username + ", Welcome back"; 
    } else {
        greet = "You havn't logged in";
    }
    // Get Leaderboard information
    var record;
    db.query('SELECT LOGIN_NAME AS name, CREDIT_BAL AS credit FROM USERS ORDER BY CREDIT_BAL DESC LIMIT 10', function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {   
            record = results;
        } 	
        // Have to wait for the result in mySql, so it must be inside the query
        var viewData = {
            greeting: greet,
            loggedin: request.session.loggedin,
            leaderboard_record: record
        };
        response.render(__dirname + "/html_file/test_index", viewData);
    });
    
});

server.get('/tech', (request, response) => {
    response.render(__dirname + "/html_file/test_tech");
});

server.get('/login', (request, response) => {
    response.render(__dirname + "/html_file/test_login");
});

server.get('/reg', (request, response) => {
    response.render(__dirname + "/html_file/test_registration");
});

server.get('/login_success', (request, response) => {
    response.render(__dirname + "/html_file/test_login_success");
});

// create application/json parser
var jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });

server.post('/process-login', urlencodedParser, (request, response) => {
    var name = request.body.username;
    var pw = request.body.password;

    if (name && pw) {
        db.query(`SELECT COUNT(UID) AS res FROM USERS WHERE LOGIN_NAME = '${name}' AND PASSWORD = '${pw}'`, function(error, results, fields) {
            if (error) throw error;
			if (results[0].res > 0) {   // There are matches in the database
				request.session.loggedin = true;
				request.session.username = name;
				response.redirect('/login_success');
			} else {
                var viewData = {
                    wrong: true
                };
                response.render(__dirname + "/html_file/test_login", viewData);
			}			
			response.end();
        });
    } else {
        var viewData = {
            wrong: true
        };
        response.render(__dirname + "/html_file/test_login", viewData);
		response.end();
    }
});

server.post('/process-registration', urlencodedParser, (request, response) => {
    var username = request.body.username;
    var pw = request.body.password;
    var name = request.body.name;
    var email = request.body.email;
    var uid = request.body.uid;

    // Save to the database
    db.query(`INSERT INTO USERS VALUES( '${uid}', TRUE, '${username}', '${pw}', '${name}', '${email}', DEFAULT, DEFAULT, DEFAULT, DEFAULT)`, function(error, results, fields) {
        if (error) throw error;
    });

    // Need verify
    // Send email
    var mailOptions = {
        from: 'csci3100f6project@gmail.com',
        to: `${email}`,
        subject: 'Sending Email using Node.js',
        // The email should contain a hash-coded link to verify the account
        // TODO
        text: 'You have successfully verified!'
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    });
    response.redirect('/verification');
});

server.get('/verification', urlencodedParser, (request, response) => {
    response.render(__dirname + "/html_file/test_verify");
});

server.get('/logout', urlencodedParser, (request, response) => {
    request.session.destroy();
    response.redirect('/');
});


// ( port, ip)  127.0.0.1 == localhost
server.listen(3000, "127.0.0.1", () =>{
    console.log(`Server is running at http://127.0.0.1:3000`);
});


/**
MySQL part
// Create table ( Should be done before the program run)
CREATE TABLE USERS(
    UID INT PRIMARY KEY, 
    TYPE BOOLEAN NOT NULL, 
    LOGIN_NAME VARCHAR(20) NOT NULL, 
    PASSWORD VARCHAR(20) NOT NULL, 
    NAME VARCHAR(40) NOT NULL, 
    EMAIL VARCHAR(100) NOT NULL, 
    CREDIT_BAL INT DEFAULT 10, 
    CREDIT_GAIN INT DEFAULT 0, 
    LEVEL INT DEFAULT 0,
    IS_AUTH BOOLEAN DEFAULT FALSE
);
CREATE TABLE QUESTION(
    PID INT AUTO_INCREMENT PRIMARY KEY, 
    UID INT NOT NULL, 
    TYPE BOOLEAN NOT NULL, 
    KEYWORDS VARCHAR(20) NOT NULL, 
    CLASS VARCHAR(20) NOT NULL, 
    HEADING VARCHAR(60) NOT NULL, 
    TEXT_CONTENT TEXT NOT NULL, 
    CREDIT INT, 
    VOTE INT DEFAULT 0,
    SUGGEST_ANS TEXT NOT NULL,      // ? Why should it be not null ?
    CONSTRAINT F_USER_QUESTION FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);
CREATE TABLE RESPONDS(
    RID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    PID INT NOT NULL,
    TEXT_CONTENT TEXT NOT NULL, 
    CONSTRAINT F_USER_RESPOND FOREIGN KEY (UID) 
    REFERENCES USERS(UID),
    CONSTRAINT F_QUESTION_RESPOND FOREIGN KEY (PID) 
    REFERENCES QUESTION(PID)
); 
CREATE TABLE COMMENTS(
    CID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    COMMENTING_ID INT NOT NULL,
    TEXT_CONTENT TEXT NOT NULL,
    CONSTRAINT F_USER_COMMENT FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);

// Registration
INSERT INTO USERS VALUES( 1155000000, TRUE, 'admin', 'admin', 'admin', 'admin@gmail.com', DEFAULT, DEFAULT, DEFAULT, TRUE);

INSERT INTO USERS VALUES( 1155000001, TRUE, 'mons', 'admin', 'mons', 'mons@gmail.com', 15, DEFAULT, DEFAULT, TRUE);
INSERT INTO USERS VALUES( 1155000002, TRUE, 'paul', 'admin', 'paul', 'paul@gmail.com', 14, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO USERS VALUES( 1155000003, TRUE, 'kim', 'admin', 'kim', 'kim@gmail.com', 13, DEFAULT, DEFAULT, TRUE);
INSERT INTO USERS VALUES( 1155000004, TRUE, 'lee', 'admin', 'lee', 'lee@gmail.com', 12, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO USERS VALUES( 1155000005, TRUE, 'royal', 'admin', 'royal', 'royal@gmail.com', 19, DEFAULT, DEFAULT, TRUE);

// Email verification
`'SELECT EMAIL FROM USERS WHERE UID = ${uid}'`

// Login verification
`'SELECT * FROM USERS WHERE LOGIN_NAME = '${name}' AND PASSWORD = '$pw''`

// Ask Question / Set up task  (Changing the type)
INSERT INTO QUESTION VALUES( 0, uid, type, keywords, class, heading, text_content, credit, DEFAULT, NULL);

// Comment
INSERT COMMENTS VALUES(0, uid, comment_id, text);

// Display profile
'SELECT * FROM USERS WHERE LOGIN_NAME = ?', name

// Leaderboard  (Only top ten would be shown)
SELECT LOGIN_NAME, CREDIT_BAL FROM USERS ORDER BY CREDIT_BAL DESC LIMIT 10;
*/

