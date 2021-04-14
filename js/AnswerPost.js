
// function processform() {
//     /*check if user input sth in the comment box, otherwise show alert*/
//     var c = document.querySelector("#new-comment").value;
//     if (c == ""){
//         alert("Please don't leave the Comment Box blank");
//         return
//     }
//     let lastComment = document.querySelector("#comments").lastElementChild;
//     let newComment = document.createElement("div");
//     let element = '<div><h5></h5><p></p><small></small></div><hr>';
//     newComment.innerHTML = element;
//     newComment.className = "d-flex";
//     newComment.id = 'c' + (Number(lastComment.id.substr(1)) + 1);
//     newComment.querySelector("p").innerHTML = document.querySelector("#new-comment").value;
//     document.querySelector("#comments").appendChild(newComment);
//     var today = new Date();
//     var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
//     var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
//     var dateTime = date+' '+time;
//     newComment.querySelector("small").innerHTML = dateTime;
//     document.getElementById('new-comment').value="";
// }

function createpost() {
    /*check if user input sth in the comment box, otherwise show alert*/
    var d1 = document.querySelector("#qname").value;
    if (d1 == "")
        alert("Please don't leave the Question Box blank");
	else{
	var d2 = document.querySelector("#hashtag").value;
    if (d2 == "")
        alert("Please don't leave the Hashtag Box blank");
	else{
	var d3 = document.querySelector("#content").value;
    if (d3 == "")
        alert("Please don't leave the Content Box blank");
	else{
	var d4 = document.querySelector("#credit").value;
    if (d4 == "")
        alert("Please don't leave the Credit Box blank");
	else{
	/*execute the connect prep, not clear for config*/	
	let mysql  = require('mysql');
let config = require('./project1.js');
let connection = mysql.createConnection(config);
	/*insert the task to sql*/
	var sql="INSERT INTO QUESTION VALUES( 0, uid, TRUE, '$d2', class, '$d1', '$d3', '$d4', DEFAULT, NULL, DEFAULT)";
/*
sample sql
INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Programming", "CSCI0000", "Hello World!", "Quick question: do you...", 1, DEFAULT, NULL, DEFAULT);
*/


/*execute the insert statment*/
connection.query(sql);

connection.end();
	}}}}
}

function createtask() {
    /*check if user input sth in the comment box, otherwise show alert*/
    var d1 = document.querySelector("#qname").value;
    if (d1 == "")
        alert("Please don't leave the Question Box blank");
	else{
	var d2 = document.querySelector("#hashtag").value;
	if (d2 == "")
        alert("Please don't leave the Hashtag Box blank");
	else{
	var d3 = document.querySelector("#content").value;
    if (d3 == "")
        alert("Please don't leave the Content Box blank");
	else{
	var d4 = document.querySelector("#credit").value;
    if (d4 == "")
        alert("Please don't leave the Credit Box blank");
	else{
		/*suggestedanswer not sure put where in sql*/
	var d5 = document.querySelector("#suggestedanswer").value;
    if (d5 == "")
        alert("Please don't leave the Answer Box blank");
	else{
/*execute the connect prep, not clear for config*/	
	let mysql  = require('mysql');
let config = require('./project1.js');
let connection = mysql.createConnection(config);

/*insert the task to sql, suggested answer not sure where to put*/
	var sql="INSERT INTO QUESTION VALUES( 0, uid, FALSE, '$d2', class, '$d1', '$d3', '$d4', DEFAULT, '$d5', DEFAULT)";
/*
sample sql
INSERT INTO QUESTION VALUES( 0, 1155000001, TRUE, "Programming", "CSCI0000", "Hello World!", "Quick question: do you...", 1, DEFAULT, NULL, DEFAULT);
*/
/*execute the insert statment*/
connection.query(sql);

connection.end();
	}}}}}
	
}



