const fs = require("fs");
const express = require("express");
const bodyParser = require('body-parser')
const mysql = require("mysql");
const session = require("express-session");
const nodemailer = require('nodemailer');
const path = require("path");
const { type } = require("jquery");
const upload = require("express-fileupload");
const querystring = require('querystring');

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
server.use(upload());
server.set('view engine', 'ejs');
// Initialize the needed data in seesion
server.use(session({
    secret: 'secret-key',
    loggedin: false,
    uid: 0,
    is_auth: "",
    username: "",
    last_url: "",
    is_teacher: false,
    resave: true,
    saveUninitialized: true
}));

// For the login page
server.get(['/', '/login'], (request, response) => {
    request.session.last_url = '/login' ;
    var viewData = {
        passvc: true
    }
    response.render(path.join(__dirname , "../html/LandP_login"), viewData);
});

// For the login success, If login success, then arrive this page
server.get('/login_success', (request, response) => {
    request.session.last_url = '/login_success' ;
    if (!request.session.is_auth)
        // If the account is verified, redirect the url to forum homepage
        response.redirect("/forum");
    else {
        // If the account is not verified, request user to enter the verifying code
        var viewData = {
            passvc: false
        }
        response.render(path.join(__dirname , "../html/LandP_login"), viewData);
    }
});

// create application/json parser
var jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });


// Post method for the login name and password passing back to backend
// For processing the login data
server.post('/process-login', urlencodedParser, (request, response) => {
    var name = request.body.username;
    var pw = request.body.password;

    if (name && pw) {
        db.query(`SELECT UID, NAME, IS_AUTH, TYPE FROM USERS WHERE LOGIN_NAME = '${name}' AND PASSWORD = '${pw}'`, function(error, results, fields) {
            if (error) throw error;
			if (results.length === 0) {   // There are no matches in the database
                var viewData = {
                    wrong: true,
                    passvc: true
                };
                response.render(path.join(__dirname ,"../html/LandP_login"), viewData);
			} else {    
                // If successfully login into the account
                // Record all the needed data into session
                request.session.loggedin = true;
				request.session.username = results[0].NAME;
                request.session.uid = results[0].UID;
                request.session.is_auth = results[0].IS_AUTH;
                request.session.is_teacher = !results[0].TYPE;
				response.redirect('/login_success');
			}			
			response.end();
        });
    } else {
        // If users do not fill in the username and password, return the same page
        var viewData = {
            wrong: true,
            passvc: true
        };
        request.session.last_url = '/process-login' ;
        response.render(path.join(__dirname ,"../html/LandP_login"), viewData);
		response.end();
    }
});

// Render the page of asking to input the verify code
server.get('/verification', urlencodedParser, (request, response) => {
    var viewData = {
        wrong: false,
        verify: true,
        passvc: false
    };
    request.session.last_url = '/verification' ;
    response.render(path.join(__dirname , "../html/LandP_login"), viewData);
});

// To process registration
server.post('/process-registration', urlencodedParser, (request, response) => {
    // Getting data by post method 
    var username = request.body.name;
    var pw = request.body.password;
    var name = username;
    var email = request.body.email;
    var uid = request.body.uid;
 
    // Ref: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    function makeid(length) {
        var result           = [];
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,./;[]!@#$%^&*()+=';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
       }
       return result.join('');
    }
    // Using the function to generate a 5 characters verifying code, and store it in to the database
    // After users have verified, replace the code by null
    // Thus, if the row of verifying code is null, the user is verified.
    var vc = makeid(5);
       // Save to the database
       db.query(`INSERT INTO USERS VALUES( '${uid}', TRUE, '${username}', '${pw}', '${name}', '${email}', DEFAULT, DEFAULT, DEFAULT, '${vc}', null, null)`, function(error, results, fields) {
        if (error) throw error;
    });
    // Need verify
    // Send email
    var mailOptions = {
        from: 'csci3100f6project@gmail.com',
        to: `${email}`,
        subject: 'Sending Verificatoin Email by using Node.js',
        // The email should contain a verifying code to verify the account
        text: `Herre is your verification code: ${vc}. Please don\'t reply this email`
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    });
    request.session.uid = uid;
    request.session.username = username;
    request.session.last_url = '/process-registration' ;
    response.redirect('/verification');

});

// To process forget password
server.post('/process-forgetpw', urlencodedParser, (request, response) => {
    var email = request.body.email;
    var mail_title = "";
    var mail_content = "";
    // After finding the email in the database, get the password and send the password to that email
    db.query(`SELECT PASSWORD FROM USERS WHERE EMAIL = '${email}'`, function(error, results, fields) {
        if (error) throw error;
        if(results.length>0) {
            var pw = results[0].PASSWORD;
            mail_title = "CUPD: Here is your password";
            mail_content = `Your password is "${pw}". If you do not press forget password, just ignore this email.`;
        }
        else {
            // If there is no avaliable result, the user is not registered yet
            mail_title = "CUPD: You have not registered yet";
            mail_content = `Come and join us by registering an account!`;
        }
        var mailOptions = {
            from: 'csci3100f6project@gmail.com',
            to: `${email}`,
            subject: mail_title,
            text: mail_content
        }

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
            console.log(error);
            } else {
            console.log('Email sent: ' + info.response);
            }
        });
        request.session.last_url = '/process-forgetpw' ;
        response.redirect('/');
    });
    
});

server.get('/question', urlencodedParser, (request, response) => {
    if (!request.session.is_auth) {
        if (request.session.loggedin) {
            request.session.last_url = '/question' ;
            response.render(path.join(__dirname , "../html/CreatePost_homepage1"));
        }
        else {
            response.redirect('/');
        }
    } else {
        response.redirect('/');
                    response.end();
    }
});

// The profile page
server.get('/profile', urlencodedParser, (request, response) => {
    var liked_post = [];
    var own_post = [];
    var commented_post = [];
    var credit = 0;
    var caption = "";
    var utype = true;
    var propic;
    if (!request.session.is_auth) {
        if (request.session.loggedin) {
            // Using the session uid to find all the data in the database, including what post did he/she post, answer
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
                        db.query(`SELECT CREDIT_BAL, CAPTION, TYPE, PROFILE_PIC FROM USERS WHERE USERS.UID = ${request.session.uid};`, function(error, results, fields) {
                            if (error) throw error;
                            credit = results[0].CREDIT_BAL;
                            caption = results[0].CAPTION;
                            utype = results[0].TYPE;
                            propic = results[0].PROFILE_PIC;
                            var viewData = {
                                username: request.session.username,
                                liked_post: liked_post,
                                own_post: own_post,
                                commented_post: commented_post,
                                credit: credit,
                                caption: caption,
                                utype: utype,
                                propic: propic,
                                IS_TEACHER: request.session.is_teacher
                            };
                            request.session.last_url = '/profile' ;
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
    } else {
        response.redirect('/');
                    response.end();
    }
});

// To add a new task into the forum
server.get('/newtask', urlencodedParser, (request, response) => {
    if (!request.session.is_auth) {
    if (request.session.loggedin) {
        var viewData = {
            // Posting a new task is only allowed for teachers' account
            IS_TEACHER: request.session.is_teacher
        };
        response.render(path.join(__dirname , "../html/CreatePost_newtask"), viewData);
    }
    else {
        response.redirect('/');
    }
}
else {
    response.redirect('/');
                    response.end();
}
});

// To add a new thread into the forum
server.get('/newthread', urlencodedParser, (request, response) => {
    if (!request.session.is_auth) {
    if (request.session.loggedin) {
        var viewData = {
            IS_TEACHER: request.session.is_teacher
        };
        response.render(path.join(__dirname , "../html/CreatePost_newthread"), viewData);
    }
    else {
        response.redirect('/');
    }
}
else {
    response.redirect('/');
    response.end();
}
});

// To process the data of the new thread
server.post('/process-newthread', urlencodedParser, (request, response) => {
    var question = request.body.question;
    var cl = request.body.cl;
    var content = request.body.content;
    var credit = request.body.credit;
    var pic; 
    var buf;
    var com = [];
    // If there is photo included
    if (request.files) {
        pic =  request.files.graphics;
        buf = pic.data.toString('base64');
    }
    if (!request.session.is_auth) {
    if (request.session.loggedin) {
        if (!request.files) {
            // If there is no photo included
            db.query(`SELECT CREDIT_BAL FROM USERS WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                var credit_bal = results[0].CREDIT_BAL;
                db.query(`UPDATE USERS SET CREDIT_BAL = ${credit_bal - credit} WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                    db.query(`INSERT INTO QUESTION VALUES( 0, ${request.session.uid}, TRUE, "${question}", "${cl}", 
                        "${question}", "${content}", ${credit}, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);`, function(error, results, fields) {
                        if (error) throw error;
                        db.query(`SELECT QUESTION.PID FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID AND QUESTION.UID = ${request.session.uid} AND QUESTION.HEADING = '${question}';`, function(error, results, fields) {
                            if (error) throw error;
                            request.session.last_url = `/forum?pid=${results[0].PID}` ;
                            response.redirect(request.session.last_url);
                            response.end();
                        });
                    });
                });
            });
        }
        else {
            // If there is photo included
            db.query(`SELECT CREDIT_BAL FROM USERS WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                var credit_bal = results[0].CREDIT_BAL;
                db.query(`UPDATE USERS SET CREDIT_BAL = ${credit_bal - credit} WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                    db.query(`INSERT INTO QUESTION VALUES( 0, ${request.session.uid}, TRUE, "${question}", "${cl}", 
                        "${question}", "${content}", ${credit}, DEFAULT, NULL, DEFAULT, DEFAULT, '${buf}');`, function(error, results, fields) {
                        if (error) throw error;
                        db.query(`SELECT QUESTION.PID FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID AND QUESTION.UID = ${request.session.uid} AND QUESTION.HEADING = '${question}';`, function(error, results, fields) {
                            if (error) throw error;
                            request.session.last_url = `/forum?pid=${results[0].PID}` ;
                            response.redirect(request.session.last_url);
                            response.end();
                        });
                    });
                });
            });
        }
    }
    else {
        response.redirect('/');
    }
} else {
    response.redirect('/');
    response.end();
}
});

// To process the data of the new task
// Almost the same as processing new thread
server.post('/process-newtask', urlencodedParser, (request, response) => {
    var question = request.body.question;
    var cl = request.body.cl;
    var content = request.body.content;
    var credit = request.body.credit;
    var suggested_ans = request.body.suggestedanswer;
    var pic; 
    var buf;
    var com = [];
    if (request.files) {
        pic =  request.files.graphics;
        buf = pic.data.toString('base64');
    }
    if (!request.session.is_auth) {
    if (request.session.loggedin) {
        if (!request.files) {
            db.query(`SELECT CREDIT_BAL FROM USERS WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                var credit_bal = results[0].CREDIT_BAL;
                db.query(`UPDATE USERS SET CREDIT_BAL = ${credit_bal - credit} WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                    db.query(`INSERT INTO QUESTION VALUES( 0, ${request.session.uid}, FALSE, "${question}", "${cl}", 
                        "${question}", "${content}", ${credit}, DEFAULT, "${suggested_ans}", DEFAULT, DEFAULT, DEFAULT);`, function(error, results, fields) {
                        if (error) throw error;
                        db.query(`SELECT QUESTION.PID FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID AND QUESTION.UID = ${request.session.uid} AND QUESTION.HEADING = '${question}';`, function(error, results, fields) {
                            if (error) throw error;
                            request.session.last_url = `/forum?pid=${results[0].PID}` ;
                            response.redirect(request.session.last_url);
                            response.end();
                        });
                    });
                });
            });
        }
        else {
            db.query(`SELECT CREDIT_BAL FROM USERS WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                var credit_bal = results[0].CREDIT_BAL;
                db.query(`UPDATE USERS SET CREDIT_BAL = ${credit_bal - credit} WHERE UID = ${request.session.uid}`, function(error, results, fields) {
                    db.query(`INSERT INTO QUESTION VALUES( 0, ${request.session.uid}, FALSE, "${question}", "${cl}", 
                        "${question}", "${content}", ${credit}, DEFAULT, "${suggested_ans}", DEFAULT, DEFAULT,'${buf}');`, function(error, results, fields) {
                        if (error) throw error;
                        db.query(`SELECT QUESTION.PID FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID AND QUESTION.UID = ${request.session.uid} AND QUESTION.HEADING = '${question}';`, function(error, results, fields) {
                            if (error) throw error;
                            request.session.last_url = `/forum?pid=${results[0].PID}` ;
                            response.redirect(request.session.last_url);
                            response.end();
                        });
                    });
                });
            });
        }
    }
    else {
        response.redirect('/');
    }
} else {
    response.redirect('/');
    response.end();
}
});

// When without the query pid
// The homepage of the forum
// Having all the topic of the post and some details of them in this page
// With the query pid
// It will show the question page with the query pid
server.get('/forum', urlencodedParser, (request, response) => {
    var post = [];
    var com = [];
    var que;
    // Check the user is verifyed or not, if not, redirect the user to login page
    if (!request.session.is_auth) {
    // In case some users does not login and typing /forum to bypass the login system
    // The session has stored whether the user is logged in or not
    // If not, it will redirect to the login page
    if (request.session.loggedin) {
        if (!request.query.pid) {
            db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, QUESTION.CREDIT, QUESTION.SOLVED, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
            FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID;`, function(error, results, fields) {
                if (error) throw error;
                results.forEach(function(item){
                    post.push(item);
                    // console.log(item.HEADING);
                });	
                var viewData = {
                    post: post,
                    IS_TEACHER: request.session.is_teacher
                };
                request.session.last_url = '/forum' ;
                response.render(path.join(__dirname , "../html/forum"), viewData);
                response.end();
            });
        }
        else {
            // With the query pid, We can get all the data about the post, including post's heading, time, class...
            // And also all details of comments
            db.query(`SELECT QUESTION.PID, QUESTION.HEADING, QUESTION.TEXT_CONTENT, QUESTION.CLASS, QUESTION.TYPE, QUESTION.CREDIT, QUESTION.SOLVED, QUESTION.SOLVED, QUESTION.GRAPHIC, QUESTION.UID, USERS.NAME, TIMESTAMPDIFF(MINUTE, QUESTION.POST_AT, CURRENT_TIMESTAMP) AS TIME
            FROM QUESTION, USERS WHERE QUESTION.UID = USERS.UID AND QUESTION.PID = ${request.query.pid};`, function(error, results, fields) {
                if (error) throw error;
                que = results[0];
                db.query(`SELECT RESPONDS.GRAPHIC,RESPONDS.TEXT_CONTENT, USERS.NAME, RESPONDS.POST_AT, RESPONDS.RID, RESPONDS.IS_SOL
                FROM USERS, RESPONDS WHERE RESPONDS.UID = USERS.UID AND RESPONDS.PID = ${request.query.pid};`, function(error, results, fields) {
                    if (error) throw error;
                        results.forEach(function(item){
                        com.push(item);
                        // console.log(item.NAME);
                    });	
                    var yrPost = (que.UID == request.session.uid)?1:0;
                    var viewData = {
                        results: que,
                        com: com,
                        IS_TEACHER: request.session.is_teacher,
                        YR_POST: yrPost,
                    };
                    request.session.last_url = `/forum?pid=${request.query.pid}` ;
                    response.render(path.join(__dirname , "../html/AnswerPost"), viewData);
                    response.end();
                });
            });
        }
    }
    else {
        response.redirect('/');
    }
}
else {
    response.redirect('/');
    response.end();
}
});

// Allowing the user who post the task or thread to select the best solution
// If the one's answer is selected, one's account would gain the credit, and it updates the database automatically
server.get('/selected', urlencodedParser, (request, response) => {
    var credit;
    var uid;
    if (request.session.loggedin) {
        db.query(`UPDATE QUESTION SET SOLVED = TRUE WHERE PID = '${request.query.pid}'`, function(error, results, fields) {
            db.query(`UPDATE RESPONDS SET IS_SOL = TRUE WHERE RID = '${request.query.rid}'`, function(error, results, fields) {
                db.query(`SELECT CREDIT FROM QUESTION WHERE PID =  '${request.query.pid}'`, function(error, results, fields) {
                    credit = results[0].CREDIT;
                    db.query(`SELECT UID FROM RESPONDS WHERE RID = '${request.query.rid}'`, function(error, results, fields) {
                        uid = results[0].UID;
                        db.query(`UPDATE USERS SET CREDIT_BAL = CREDIT_BAL+${credit}, CREDIT_GAIN = CREDIT_GAIN+${credit} WHERE UID = '${uid}'`, function(error, results, fields) {
                            response.redirect(`/forum?pid=${request.query.pid}`);
                            response.end();
                        });
                    });
                });
            });
        });
    }
    else {
        response.redirect('/');
    }
});

// To check the verifying code is same as database or not
// If yes, change the code to null, and redirect to the homepage
// Else, redirect to the login page
server.post('/check_verification', urlencodedParser, (request, response) => {
    var vc = request.body.vcode;
    if (vc) {
        db.query(`SELECT IS_AUTH FROM USERS WHERE UID = '${request.session.uid}'`, function(error, results, fields) {
            if (error) throw error;
            if (results.length>0) {
                if (vc === results[0].IS_AUTH) {
                    db.query(`UPDATE USERS SET IS_AUTH = NULL WHERE UID = '${request.session.uid}'`, function(error, results, fields) {
                        request.session.is_auth = null;
                        response.redirect('/forum');
                        response.end();
                    });
                }
                else {
                    response.redirect('/');
                        response.end();
                }
            }
            
        });
    } 
});

// To process the addign comment function
server.post('/process-comment', urlencodedParser, (request, response) => {
    var pid = request.session.last_url.split('=')[1];
    var comment = request.body.comment;
    // console.log(comment);
    var pic; 
    var buf;
    var que; 
    var com = [];
    var type = true;
    if (request.files) {
        pic =  request.files.graphics;
        buf = pic.data.toString('base64');
    }
    if (request.session.loggedin) {
        // To handle three different combinations with only comment, only photo and both
        if (comment && !request.files) {
            db.query(`INSERT RESPONDS VALUES(0, ${request.session.uid}, ${pid}, '${comment}', NULL, DEFAULT, DEFAULT);`, function(error, results, fields) {
                if (error) throw error;
                request.session.last_url = `/forum?pid=${pid}` ;
                response.redirect(request.session.last_url);
                response.end();
            });
        }
        else if (!comment && request.files) {
            db.query(`INSERT RESPONDS VALUES(0, ${request.session.uid}, ${pid}, NULL, '${buf}', DEFAULT, DEFAULT);`, function(error, results, fields) {
                if (error) throw error;
                request.session.last_url = `/forum?pid=${pid}` ;
                response.redirect(request.session.last_url);
                response.end();
            });
        }
        else if (comment && request.files) {
            db.query(`INSERT RESPONDS VALUES(0, ${request.session.uid}, ${pid}, '${comment}', '${buf}', DEFAULT, DEFAULT);`, function(error, results, fields) {
                if (error) throw error;
                request.session.last_url = `/forum?pid=${pid}` ;
                response.redirect(request.session.last_url);
                response.end();
            });
        }
    }
    else {
        response.redirect('/');
    }
});

// To process the user edit their own profile
// They can change their caption or their profile pic or the username, but not the login name
server.post('/process-edit', urlencodedParser, (request, response) => {
    var name = request.body.username;
    var info = request.body.info;
    var propic;var buf;
    if (request.files) {
        propic = request.files.propic;
        buf = propic.data.toString('base64');
    }
    if (propic && !name && !info) {
        db.query(`UPDATE USERS SET PROFILE_PIC = '${buf}' WHERE USERS.UID = ${request.session.uid}`, function(error, results, fields) {
            if (error) throw error;
            response.redirect('/profile');
			response.end();
        });
    } 
    
    else if (name && info && !propic) {
        db.query(`UPDATE USERS SET NAME = '${name}', CAPTION = '${info}' WHERE USERS.UID = ${request.session.uid}`, function(error, results, fields) {
            if (error) throw error;
			request.session.username = name;
            response.redirect('/profile');

			response.end();
        });
    } 
    else if (!name && info && !propic) {
        db.query(`UPDATE USERS SET  CAPTION = '${info}' WHERE USERS.UID=${request.session.uid}`, function(error, results, fields) {
            if (error) throw error;
			
            response.redirect('/profile');

			response.end();
        });
    }
    else if (name && !info && !propic) {
        db.query(`UPDATE USERS SET NAME = '${name}' WHERE USERS.UID=${request.session.uid}`, function(error, results, fields) {
            if (error) throw error;
			request.session.username = name;
            response.redirect('/profile');

			response.end();
        });
    }

    else if (name && info && propic) {
        db.query(`UPDATE USERS SET NAME = '${name}', CAPTION = '${info}', PROFILE_PIC = '${buf}' WHERE USERS.UID = ${request.session.uid}`, function(error, results, fields) {
            if (error) throw error;
			request.session.username = name;
            response.redirect('/profile');
			response.end();
        });
    } 
    else {
        
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
    IS_AUTH VARCHAR(5),
    PROFILE_PIC LONGBLOB,
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
    SOLVED BOOLEAN DEFAULT FALSE,
    GRAPHIC LONGBLOB DEFAULT NULL,
    CONSTRAINT F_USER_QUESTION FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);
CREATE TABLE RESPONDS(
    RID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    PID INT NOT NULL,
    TEXT_CONTENT TEXT, 
    GRAPHIC LONGBLOB,
    POST_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

---------------------------------------------------------------------------------------------------------------------
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
    IS_AUTH VARCHAR(5),
    PROFILE_PIC LONGBLOB,
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
    SOLVED BOOLEAN DEFAULT FALSE,
    GRAPHIC LONGBLOB DEFAULT NULL,
    CONSTRAINT F_USER_QUESTION FOREIGN KEY (UID) 
    REFERENCES USERS(UID)
);
CREATE TABLE RESPONDS(
    RID INT AUTO_INCREMENT PRIMARY KEY,
    UID INT NOT NULL,
    PID INT NOT NULL,
    TEXT_CONTENT TEXT, 
    GRAPHIC LONGBLOB,
    POST_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IS_SOL BOOLEAN DEFAULT FALSE,
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


INSERT INTO USERS VALUES( 1155000000, FALSE, 'admin', 'admin', 'admin', 'admin@gmail.com', DEFAULT, DEFAULT, DEFAULT, NULL, NULL, "Hi there, I am admin");
INSERT INTO USERS VALUES( 1155000001, TRUE, 'mons', 'admin', 'mons', 'mons@gmail.com', 15, DEFAULT, DEFAULT, NULL, NULL, NULL);
INSERT INTO USERS VALUES( 1155000002, TRUE, 'paul', 'admin', 'paul', 'paul@gmail.com', 14, DEFAULT, DEFAULT, NULL, NULL, NULL);
INSERT INTO USERS VALUES( 1155000003, TRUE, 'kim', 'admin', 'kim', 'kim@gmail.com', 13, DEFAULT, DEFAULT, NULL, NULL, NULL);
INSERT INTO USERS VALUES( 1155000004, TRUE, 'lee', 'admin', 'lee', 'lee@gmail.com', 12, DEFAULT, DEFAULT, NULL, NULL, NULL);
INSERT INTO USERS VALUES( 1155000005, TRUE, 'royal', 'admin', 'royal', 'royal@gmail.com', 19, DEFAULT, DEFAULT, NULL, NULL, NULL);
INSERT INTO USERS VALUES( 1255000001, FALSE, 'Prof. X', 'admin', 'Prof. X', 'profX@gmail.com', 19, DEFAULT, DEFAULT, NULL, NULL, NULL);


INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Programming", "CSCI0000", "Hello World!", "Quick question: do you...", 1, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Help", "ENGG0000", "Hey guys!", "Can someone help...", 1, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000004, TRUE, "Science fiction", "PSYC0000", "X-Men", "Mutation, it is the key to our evolution...", 3, DEFAULT, NULL, DEFAULT, TRUE, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000005, TRUE, "Programming", "CSCI3100", "About initial code", "A program is written to provide functions specified in its functional requirements specifications. 
Often, there are other requirements-such as performance and scalability that do not pertain to the functions of the system. 
We call these kinds of requirements nonfunctional requirements. 
A program is functionally correct if it behaves according to its stated functional specifications.", 5, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000005, TRUE, "Programming", "CSCI3100", "Regarding initial code", "robustness
A program is robust if it behaves reasonably, even in unspecified circumstances
Hard to define completely", 4, DEFAULT, NULL, DEFAULT, TRUE, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000002, TRUE, "Programming", "CSCI3100", "Talking on initial code", "user-friendliness
A software system is user friendly if its human users find it easy to use. Its subjective depends on many things (experience and type of users), e.g, a novice user may appreciate verbose messages, while an experienced user grows to hate and ignore them. 
Similarly, a non-programmer may appreciate the use of menus, while a programmer may be more comfortable with typing a command.  ", 3, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000003, TRUE, "Programming", "CSCI3100", "Discussing initial code", "documentation...", 2, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000003, TRUE, "Programming", "CSCI3100", "For initial code", "other aspects...", 2, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);
INSERT INTO QUESTION VALUES( 0, 1155000000, TRUE, "Testing", "TEST0000", "Testing", "Working...", 1, DEFAULT, NULL, DEFAULT, TRUE, DEFAULT);
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
Rushing into the palace, Oedipus finds that the queen has killed herself. Tortured, frenzied, Oedipus takes the pins from her gown and rakes out his eyes, so that he can no longer look upon the misery he has caused. Now blinded and disgraced, Oedipus begs Creon to kill him, but as the play concludes, he quietly submits to Creon's leadership, and humbly awaits the oracle that will determine whether he will stay in Thebes or be cast out forever.", 5, DEFAULT, NULL, DEFAULT, DEFAULT, DEFAULT);



INSERT LIKED VALUES(1155000000, 3);
INSERT LIKED VALUES(1155000000, 7);
INSERT LIKED VALUES(1155000000, 2);
INSERT LIKED VALUES(1155000000, 5);
INSERT LIKED VALUES(1155000000, 10);

INSERT RESPONDS VALUES(0, 1155000000, 7, "Nice post!", NULL, DEFAULT, DEFAULT);
INSERT RESPONDS VALUES(0, 1155000000, 10, "Nice story!", NULL, DEFAULT, DEFAULT);
INSERT RESPONDS VALUES(0, 1155000000, 3, "Nice!", NULL, DEFAULT, DEFAULT);

*/




