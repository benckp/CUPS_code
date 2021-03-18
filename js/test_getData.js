
// var data;
// if (localStorage && localStorage.getItem('data')) {
//     data = JSON.parse(localStorage.getItem('data'));
// } else {
//     data = {"milk": "asdf"};
//     localStorage.setItem('data', JSON.stringify({"milk": "asdf"}));
// }

// const xhr = new XMLHttpRequest();
// const container = document.getElementById('contaniner');

// xhr.onload = function() {
//     if (this.status == 200) {
//         container.innerHTML = xhr.responseText;
//     } else {
//         console.warn('Did not recieve');
//     }
// };
// xhr

login();
function login(){
  // var obj = '{"username":"'+$('#username').val()+'", "password":"'+$('#password').val()+'"}';
  var obj = '{"greeting":"'+$('#greeting').val()+'"}';
  $.ajax({
    type:'GET',
    dataType :'json',
    // data: {
    //   "username": $("#username").val(),
    //   "password": $("#password").val()
    // },
    data: {
      "greeting": $("#greeting").val(),
    },
    url:'http://localhost:3000/',
    success: function (data) {
        alert("ajax callaback response:"+JSON.stringify(data));
    }
  })
}