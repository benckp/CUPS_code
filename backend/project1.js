
const express = require("express");
const bodyParser = require('body-parser')
const mysql = require("mysql");
const session = require("express-session");
const nodemailer = require('nodemailer');
const path = require("path");

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
server.use(express.static(path.join(__dirname , "../css")));
server.use(express.static(path.join(__dirname , "../js")));
server.use(express.static(path.join(__dirname , "../img")));
server.set('view engine', 'ejs');
server.use(session({
    secret: 'secret-key',
    loggedin: false,
    uid: 0,
    username: "",
    resave: true,
    saveUninitialized: true
}));

// server.get( '/index', (request, response) => {
//     var greet;
//     if (request.session.loggedin) {
//         greet = "Hi " + request.session.username + ", Welcome back"; 
//     } else {
//         greet = "You havn't logged in";
//     }
//     // Get Leaderboard information
//     var record;
//     db.query('SELECT LOGIN_NAME AS name, CREDIT_BAL AS credit FROM USERS ORDER BY CREDIT_BAL DESC LIMIT 10', function(error, results, fields) {
//         if (error) throw error;
//         if (results.length > 0) {   
//             record = results;
//         } 	
//         // Have to wait for the result in mySql, so it must be inside the query
//         var viewData = {
//             greeting: greet,
//             loggedin: request.session.loggedin,
//             leaderboard_record: record
//         };
//         response.render(path.join(__dirname ,"../html/test_index"), viewData);
//         response.end();
//     });
    
// });

server.get(['/', '/login'], (request, response) => {
    response.render(path.join(__dirname , "../html/LandP_login"));
});

server.get('/login_success', (request, response) => {
    response.redirect("/forum");
});

// create application/json parser
var jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });

server.post('/process-login', urlencodedParser, (request, response) => {
    var name = request.body.username;
    var pw = request.body.password;

    if (name && pw) {
        db.query(`SELECT UID FROM USERS WHERE LOGIN_NAME = '${name}' AND PASSWORD = '${pw}'`, function(error, results, fields) {
            if (error) throw error;
			if (results.length === 0) {   // There are no matches in the database
                var viewData = {
                    wrong: true
                };
                response.render(path.join(__dirname ,"../html/LandP_login"), viewData);
			} else {    
                request.session.loggedin = true;
				request.session.username = name;
                request.session.uid = results[0].UID;
				response.redirect('/login_success');
			}			
			response.end();
        });
    } else {
        var viewData = {
            wrong: true
        };
        response.render(path.join(__dirname ,"../html/LandP_login"), viewData);
		response.end();
    }
});

server.get('/verification', urlencodedParser, (request, response) => {
    var viewData = {
        wrong: false,
        verify: true
    };
    response.render(path.join(__dirname , "../html/LandP_login"), viewData);
});

server.post('/process-registration', urlencodedParser, (request, response) => {
    var username = request.body.username;
    var pw = request.body.password;
    var name = username;
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
        text: 'You have successfully verified! Please don\'t reply this email'
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


server.get('/question', urlencodedParser, (request, response) => {
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/CreatePost_homepage1"));
    }
    else {
        response.redirect('/');
    }
});

server.get('/profile', urlencodedParser, (request, response) => {
    var liked_post = [];
    var own_post = [];
    var commented_post = [];
    var credit = 0;
    var caption = "";
    if (request.session.loggedin) {
        db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
        FROM QUESTION, LIKED, USERS WHERE LIKED.PID = QUESTION.PID AND LIKED.UID = ${request.session.uid} AND QUESTION.UID = USERS.UID;`, function(error, results, fields) {
            if (error) throw error;
            results.forEach(function(item){
                liked_post.push(item);
                // console.log(item.HEADING);
            });	
            db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
            FROM QUESTION, USERS WHERE QUESTION.UID = ${request.session.uid} AND QUESTION.UID = USERS.UID;`, function(error, results, fields) {
                if (error) throw error;
                results.forEach(function(item){
                    own_post.push(item);
                    // console.log(item.HEADING);
                });	
                db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
                FROM QUESTION, RESPONDS, USERS WHERE RESPONDS.PID = QUESTION.PID AND RESPONDS.UID = ${request.session.uid} AND QUESTION.UID = USERS.UID;`, function(error, results, fields) {
                    if (error) throw error;
                    results.forEach(function(item){
                        commented_post.push(item);
                        // console.log(item.HEADING);
                    });	
                    db.query(`SELECT CREDIT_BAL, CAPTION FROM USERS WHERE USERS.UID = ${request.session.uid};`, function(error, results, fields) {
                        if (error) throw error;
                        credit = results[0].CREDIT_BAL;
                        caption = results[0].CAPTION;
                        var viewData = {
                            username: request.session.username,
                            liked_post: liked_post,
                            own_post: own_post,
                            commented_post: commented_post,
                            credit: credit,
                            caption: caption
                        };
                        response.render(path.join(__dirname , "../html/profile"), viewData);
                        response.end();
                    });
                });
            });
        });
    }
    else {
        response.redirect('/');
    }
});

server.get('/task', urlencodedParser, (request, response) => {
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/CreatePost_homepage2"));
    }
    else {
        response.redirect('/');
    }
    
});

server.get('/newtask', urlencodedParser, (request, response) => {
    
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/CreatePost_newtask"));
    }
    else {
        response.redirect('/');
    }
});

server.get('/newthread', urlencodedParser, (request, response) => {
   
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/CreatePost_newthread"));
    }
    else {
        response.redirect('/');
    }
});

server.get('/forum', urlencodedParser, (request, response) => {
    var post = [];
    if (request.session.loggedin) {
        db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
        FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID;`, function(error, results, fields) {
            if (error) throw error;
            results.forEach(function(item){
                post.push(item);
                // console.log(item.HEADING);
            });	
            var viewData = {
                post: post,
            };
            response.render(path.join(__dirname , "../html/forum"), viewData);
            response.end();
        });
    }
    else {
        response.redirect('/');
    }
});

server.get('/answer', urlencodedParser, (request, response) => {
    
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/AnswerPost"));
    }
    else {
        response.redirect('/');
    }
});

server.get('/edit', urlencodedParser, (request, response) => {
    
    if (request.session.loggedin) {
        response.render(path.join(__dirname , "../html/Edit"));
    }
    else {
        response.redirect('/');
    }
});

server.post('/process-login', urlencodedParser, (request, response) => {
    var name = request.body.username;
    var info = request.body.info;

    if (name && pw) {
        db.query(`UPDATE USERS SET NAME = '${name}' AND CAPTION = '${info}'`, function(error, results, fields) {
            if (error) throw error;
			
            response.redirect('/profile');

			response.end();
        });
    } else {
        
        response.redirect('/profile');
		response.end();
    }
});

// After Login into the forum
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
CREATE DATABASE project;
USE project;

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
    IS_AUTH BOOLEAN DEFAULT FALSE,
    CAPTION TEXT
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
    SUGGEST_ANS TEXT,
    POST_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT F_USER_QUESTION FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);
CREATE TABLE RESPONDS(
    RID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    PID INT NOT NULL,
    TEXT_CONTENT TEXT NOT NULL, 
    GRAPHIC BLOB,
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
CREATE TABLE LIKED(
    UID INT NOT NULL,
    PID INT NOT NULL,
    CONSTRAINT F_USER_LIKED FOREIGN KEY (UID) 
    REFERENCES USERS(UID),
    CONSTRAINT F_POST_LIKED FOREIGN KEY (PID) 
    REFERENCES QUESTION(PID)
);

// Registration
INSERT INTO USERS VALUES( 1155000000, TRUE, 'admin', 'admin', 'admin', 'admin@gmail.com', DEFAULT, DEFAULT, DEFAULT, TRUE);

// Email verification
`'SELECT EMAIL FROM USERS WHERE UID = ${uid}'`

// Login verification
`'SELECT * FROM USERS WHERE LOGIN_NAME = '${name}' AND PASSWORD = '${pw}''`

// Ask Question / Set up task  (Changing the type)
INSERT INTO QUESTION VALUES( 0, uid, type, keywords, class, heading, text_content, credit, DEFAULT, NULL, DEFAULT);

// Respond
INSERT RESPONDS VALUES(0, uid, pid, text, graphic);

// Comment
INSERT COMMENTS VALUES(0, uid, comment_id, text);

// Like post
INSERT LIKED VALUES(uid, pid);

// Unlike post
DELETE FROM LIKED WHERE UID = ${uid} AND PID = ${pid};

// Get all post
SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID;

// Check Liked
SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
FROM QUESTION, LIKED, USERS WHERE LIKED.PID = QUESTION.PID AND LIKED.UID = ${uid} AND QUESTION.UID = USERS.UID;

// Check Own post
SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
FROM QUESTION, USERS WHERE QUESTION.UID = ${uid} AND QUESTION.UID = USERS.UID;

// Check comment post
SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
FROM QUESTION, RESPONDS, USERS WHERE RESPONDS.PID = QUESTION.PID AND RESPONDS.UID = ${uid} AND QUESTION.UID = USERS.UID;

// Display profile
'SELECT * FROM USERS WHERE LOGIN_NAME = ?', name

// Leaderboard  (Only top ten would be shown)
SELECT LOGIN_NAME, CREDIT_BAL FROM USERS ORDER BY CREDIT_BAL DESC LIMIT 10;









All test case:

CREATE DATABASE project;
USE project;

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
    IS_AUTH BOOLEAN DEFAULT FALSE,
    CAPTION TEXT
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
    SUGGEST_ANS TEXT,
    POST_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT F_USER_QUESTION FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);
CREATE TABLE RESPONDS(
    RID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    PID INT NOT NULL,
    TEXT_CONTENT TEXT NOT NULL, 
    GRAPHIC BLOB,
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
CREATE TABLE LIKED(
    UID INT NOT NULL,
    PID INT NOT NULL,
    CONSTRAINT F_USER_LIKED FOREIGN KEY (UID) 
    REFERENCES USERS(UID),
    CONSTRAINT F_POST_LIKED FOREIGN KEY (PID) 
    REFERENCES QUESTION(PID)
);


INSERT INTO USERS VALUES( 1155000000, TRUE, 'admin', 'admin', 'admin', 'admin@gmail.com', DEFAULT, DEFAULT, DEFAULT, TRUE, "Hi there, I am admin");
INSERT INTO USERS VALUES( 1155000001, TRUE, 'mons', 'admin', 'mons', 'mons@gmail.com', 15, DEFAULT, DEFAULT, TRUE, NULL);
INSERT INTO USERS VALUES( 1155000002, TRUE, 'paul', 'admin', 'paul', 'paul@gmail.com', 14, DEFAULT, DEFAULT, DEFAULT, NULL);
INSERT INTO USERS VALUES( 1155000003, TRUE, 'kim', 'admin', 'kim', 'kim@gmail.com', 13, DEFAULT, DEFAULT, TRUE, NULL);
INSERT INTO USERS VALUES( 1155000004, TRUE, 'lee', 'admin', 'lee', 'lee@gmail.com', 12, DEFAULT, DEFAULT, DEFAULT, NULL);
INSERT INTO USERS VALUES( 1155000005, TRUE, 'royal', 'admin', 'royal', 'royal@gmail.com', 19, DEFAULT, DEFAULT, TRUE, NULL);
INSERT INTO USERS VALUES( 1255000001, False, 'Prof. X', 'admin', 'Prof. X', 'profX@gmail.com', 19, DEFAULT, DEFAULT, TRUE, NULL);


INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Programming", "CSCI0000", "Hello World!", "Quick question: do you...", 1, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Help", "ENGG0000", "Hey guys!", "Can someone help...", 1, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000004, TRUE, "Science fiction", "PSYC0000", "X-Men", "Mutation, it is the key to our evolution...", 3, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000005, TRUE, "Programming", "CSCI3100", "About initial code", "completeness...", 5, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000005, TRUE, "Programming", "CSCI3100", "Regarding initial code", "robustness...", 4, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000002, TRUE, "Programming", "CSCI3100", "Talking on initial code", "user-friendliness...", 3, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000003, TRUE, "Programming", "CSCI3100", "Discussing initial code", "documentation...", 2, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000003, TRUE, "Programming", "CSCI3100", "For initial code", "other aspects...", 2, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000000, TRUE, "Testing", "TEST0000", "Testing", "Working...", 1, DEFAULT, NULL, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1255000001, FALSE, "Story", "UGFH1000", "Oedipus the King", "Oedipus the King unfolds as a murder mystery, a political thriller, and a psychological whodunit. Throughout this mythic story of patricide and incest, Sophocles emphasizes the irony of a man determined to track down, expose, and punish an assassin, who turns out to be himself.
As the play opens, the citizens of Thebes beg their king, Oedipus, to lift the plague that threatens to destroy the city. Oedipus has already sent his brother-in-law, Creon, to the oracle to learn what to do.
On his return, Creon announces that the oracle instructs them to find the murderer of Laius, the king who ruled Thebes before Oedipus. The discovery and punishment of the murderer will end the plague. At once, Oedipus sets about to solve the murder.
Summoned by the king, the blind prophet Tiresias at first refuses to speak, but finally accuses Oedipus himself of killing Laius. Oedipus mocks and rejects the prophet angrily, ordering him to leave, but not before Tiresias hints darkly of an incestuous marriage and a future of blindness, infamy, and wandering.
Oedipus attempts to gain advice from Jocasta, the queen; she encourages him to ignore prophecies, explaining that a prophet once told her that Laius, her husband, would die at the hands of their son. According to Jocasta, the prophecy did not come true because the baby died, abandoned, and Laius himself was killed by a band of robbers at a crossroads.
Oedipus becomes distressed by Jocasta's remarks because just before he came to Thebes he killed a man who resembled Laius at a crossroads. To learn the truth, Oedipus sends for the only living witness to the murder, a shepherd.
Another worry haunts Oedipus. As a young man, he learned from an oracle that he was fated to kill his father and marry his mother. Fear of the prophecy drove him from his home in Corinth and brought him ultimately to Thebes. Again, Jocasta advises him not to worry about prophecies.
Oedipus finds out from a messenger that Polybus, king of Corinth, Oedipus' father, has died of old age. Jocasta rejoices — surely this is proof that the prophecy Oedipus heard is worthless. Still, Oedipus worries about fulfilling the prophecy with his mother, Merope, a concern Jocasta dismisses.
Overhearing, the messenger offers what he believes will be cheering news. Polybus and Merope are not Oedipus' real parents. In fact, the messenger himself gave Oedipus to the royal couple when a shepherd offered him an abandoned baby from the house of Laius.
Oedipus becomes determined to track down the shepherd and learn the truth of his birth. Suddenly terrified, Jocasta begs him to stop, and then runs off to the palace, wild with grief.
Confident that the worst he can hear is a tale of his lowly birth, Oedipus eagerly awaits the shepherd. At first the shepherd refuses to speak, but under threat of death he tells what he knows — Oedipus is actually the son of Laius and Jocasta.
And so, despite his precautions, the prophecy that Oedipus dreaded has actually come true. Realizing that he has killed his father and married his mother, Oedipus is agonized by his fate.
Rushing into the palace, Oedipus finds that the queen has killed herself. Tortured, frenzied, Oedipus takes the pins from her gown and rakes out his eyes, so that he can no longer look upon the misery he has caused. Now blinded and disgraced, Oedipus begs Creon to kill him, but as the play concludes, he quietly submits to Creon's leadership, and humbly awaits the oracle that will determine whether he will stay in Thebes or be cast out forever.", 5, DEFAULT, NULL, DEFAULT);

INSERT LIKED VALUES(1155000000, 3);
INSERT LIKED VALUES(1155000000, 7);
INSERT LIKED VALUES(1155000000, 2);
INSERT LIKED VALUES(1155000000, 5);
INSERT LIKED VALUES(1155000000, 10);

INSERT RESPONDS VALUES(0, 1155000000, 7, "Nice post!", NULL);

*/




