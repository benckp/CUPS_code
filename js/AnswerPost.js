function processform() {
    /*check if user input sth in the comment box, otherwise show alert*/
    var c = document.querySelector("#new-comment").value;
    if (c == "")
        alert("Please don't leave the Comment Box blank");
    /*get user information*/
    let lastComment = document.querySelector("#comments").lastElementChild;
    let newComment = document.createElement("div");
    let element = '<div><h5></h5><p></p><small></small></div><hr>';
    newComment.innerHTML = element;
    newComment.className = "d-flex";
    newComment.id = 'c' + (Number(lastComment.id.substr(1)) + 1);
    /*output username and id*/
    newComment.querySelector("p").innerHTML = document.querySelector("#new-comment").value;
    /*output user icon*/
    document.querySelector("#comments").appendChild(newComment);
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    newComment.querySelector("small").innerHTML = dateTime;
    document.getElementById('new-comment').value="";
}
