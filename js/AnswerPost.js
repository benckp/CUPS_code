// Connect to MySQL server and load data using ExpressJs
// Query: SELECT * FROM questions WHERE users.UID = pid
// Result set: result

// Type is true iff it is a Q&A post
var result = [
    {
        'UID': 1,
        'PID': 10,
        'Name': 'Apple',
        'Type': true,
        'Class': 'CSCI',
        'isSolved': false,
        'Heading': 'Heading1',
        'TextContent': 'Robustness is a difficult to define quality. What exactly it is?',
        'Credit': 10,
        'Time': '19:10 14/04/21'
    }
]

// to be load from db for commenter name
var commenter_name = 'banana';
var commenter_uid = 5;
var user_uid = 10;
var author_uid = 10;

function loadQuestion() {
    document.getElementById("heading").innerHTML = result[0].Heading;
    document.getElementById("time").innerHTML = result[0].Time;
    document.getElementById("info").innerHTML = result[0].Name + "       " + result[0].Class + "        " + (result[0].Type ? 'Q&A' : 'Task');
    document.getElementById("content").innerHTML = result[0].TextContent;
}

function selectAnswer(commenter_uid){
    // Mark the selected answer (maybe put on top)
    // give credit from author to the selected commenter
    // change the post status to Solved
    
    // const button = document.getElementById('selectBtn');
    // button.addEventListener('click', function(e) {
    //     console.log('button was clicked');
    // });

    fetch('/selected?pid=', {method: 'POST'})
    .then(function(response) {
      if(response.ok) {
        // console.log('Click was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });

}

// Show hidden give answer
function showGiving() {
    if (user_uid == author_uid){
        var i = 0;
        while (1){
            if (document.getElementsByClassName('btnGive')[i] == "undefined"){
                break;
            }
            document.getElementsByClassName('btnGive')[i].style.display = 'block';
            i++;
        }

    }
}


function checkComment() {
    /*check if user input sth in the comment box, otherwise show alert*/
    var c = document.querySelector("#new-comment").value;
    var c1 = document.querySelector("#graphics").value;
    if (c == "" && c1 == "") {
        alert("Please don't leave the Comment Box / Graphic blank");
        return false;
    }
    return true;
    // let lastComment = document.querySelector("#comments").lastElementChild;
    // let newComment = document.createElement("div");
    // let element = '<div><h5></h5><p></p><small></small><button style="display:none" type="button" class="btnGive" onclick="selectAnswer(commenter_uid)">Select as answer</button></div><hr>';
    // newComment.innerHTML = element;
    // newComment.className = "d-flex";
    // newComment.id = 'c' + (Number(lastComment.id.substr(1)) + 1);
    // newComment.querySelector("p").innerHTML = document.querySelector("#new-comment").value;
    // document.querySelector("#comments").appendChild(newComment);
    // var today = new Date();
    // var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    // var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    // var dateTime = date + ' ' + time;
    // newComment.querySelector("small").innerHTML = commenter_name + '    ' + dateTime;
    // document.getElementById('new-comment').value = "";
}

function checkPost() {
    /*check if user input sth in each box, otherwise show alert*/
    var d1 = document.querySelector("#qname").value;
    if (d1 == "") {
        alert("Please don't leave the Question Box blank");
        return false;
    }
    
    var d2 = document.querySelector("#class").value;
    if (d2 == "") {
        alert("Please don't leave the Class Box blank");
        return false;
    }
    var d3 = document.querySelector("#content").value;
    if (d3 == "") {
        alert("Please don't leave the Content Box blank");
        return false;
    }
          
    var d4 = document.querySelector("#credit").value;
    if (d4 == "") {
        alert("Please don't leave the Credit Box blank");
        return false;
    }

    return true;	//success to create a post
        
    
}

function checkTask() {
    /*check if user input sth in each box, otherwise show alert*/
    var d1 = document.querySelector("#qname").value;
    if (d1 == "") {
        alert("Please don't leave the Question Box blank");
        return false;
    }

    var d2 = document.querySelector("#class").value;
    if (d2 == "") {
        alert("Please don't leave the Class Box blank");
        return false;
    }

    var d3 = document.querySelector("#content").value;
    if (d3 == "") {
        alert("Please don't leave the Content Box blank");
        return false;
    }

    var d4 = document.querySelector("#credit").value;
    if (d4 == "") {
        alert("Please don't leave the Credit Box blank");
        return false;
    }

    var d5 = document.querySelector("#suggestedanswer").value;
    if (d5 == "") {
        alert("Please don't leave the Answer Box blank");
        return false;
    }
    return true; //success to create a task
}