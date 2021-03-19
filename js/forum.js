// Remark:
// This js file contains js codes related to forum page
// We have completed one function for searching, which shows briefing how will we code the js file


// Partial: A function to perform searching for titles or content.
// TODO: we will also allow search on ID later
function search() {
    // variables declaration
    let input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("searchInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("forumList");
    tr = table.getElementsByTagName("tr");

    // Hide all post which does not contain the search query in its title
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
    // Hide all post which does not contain the search query in its content
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[1];
        if (tr[i].style.display !== "none"){
            continue;
        }
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// TODO: function to filter out the Q&A post
function filterQA(){
}

// TODO: function to filter out the Task post
function filterTask(){
}

// TODO: function to filter out by course input
function filterCourse(){
}

// TODO: function to filter out by department input
function filterDept(){
}

// TODO: function to sort by post ID
function sortID(){
}

// TODO: function to sort by course code
function sortCourse(){
}

// TODO: function to sort by post type
function sortType(){
}

// TODO: function to sort by post time
function sortTime(){
}

// TODO: function to reset filter setting
function reset(){
}

// TODO: function to get post info from db and display in page
function display(){
}

// TODO: function to get access to the correponding post on clicking
function access(){
}



