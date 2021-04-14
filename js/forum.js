// --- To Dash: Please help me implementing the following backend implementation.-----------------------
// Delete the unnessary comments afterward. Thanksss!


// Connect to MySQL server and load data using ExpressJs
// Query: SELECT * FROM users, questions WHERE users.UID = questions.UID ORDER BY questions.PID ASC
// Result set: results

// Type is true iff it is a Q&A post
// isSolved is true iff it is solved (or ended for a task)
// The variable should be loaded by mySQL query, delete the variable definition afterward
var results = [
    {
        'UID': 1,
        'PID': 1,
        'Name': 'name1',
        'Type': true,
        'Class': 'CSCI',
        'isSolved': true,
        'Heading': 'Heading1',
        'TextContent': 'manywordsssssssssssss',
        'Credit': 10,
        'Time': '02:01 03/08/20'
    },
    {
        'UID': 2,
        'PID': 2,
        'Name': 'name2',
        'Type': false,
        'Class': 'STAT',
        'isSolved': false,
        'Heading': 'Heading2',
        'TextContent': 'MWAIORHOIAWHTIORHWHOIRHAIOTHIAUWHTROIAHIEURAJIUEDOAWHDOHJDIJHJJHHOUJVWAOHUIUHAIVDHUAYDBAWUVFYIBWAFRYIABWRUFIWABBAJAWOIT',
        'Credit': 20,
        'Time': '13:41 14/04/21'
    }
]
console.log(results)
console.log(results[0].Name)
console.log(results[1].Class)

// -------------------------------------------------------------------------------------------------------
// loadPosts will be executed on load, print data in results to table displayed
function loadPosts() {
    var table = document.getElementById("forumList");
    for (i = 0; i < results.length; i++) {
        // There are three columns in each row:
        // 1. Show the question type and whether it is solved, credit if not solved
        // 2. Show the class, heading and preview (first 30 letters) of the post
        // 3. Show the Name of the author and the time of publish
        table.innerHTML +=
            '<tr>' + '<b>' + '<td style="text-align:center">'
            + results[i].PID
            + '</td>' + '<b>' + '<td style="text-align:center">'
            + (results[i].isSolved ? 'Solved &#9989' : (results[i].Type ? 'Question &#10068' : 'Task &#10069')
            + '</b><br><small> Credit ' + results[i].Credit + '</small>')
            + '</td>' + '<td>'
            + '<a href="#PID" onMouseOver ="this.style.color=\'blue\'" onMouseOut="this.style.color=\'black\'" style="color: black; text-decoration: none;">' // TODO: link the content to answer post page
            + '<big><b>'
            + '【' + results[i].Class + '】 '
            + results[i].Heading
            + '</big></b>' + '<br>' + '<small>'
            + results[i].TextContent.slice(0, 30)
            + '</small>' + '</a>'
            + '</td>' + '<td style="text-align:center">'
            + results[i].Name
            + '<br>' + '<small>'
            + results[i].Time
            + '</small>' + '</td>' + '</tr>';
    }
}


// search() perform searching for class, titles or content.
function search() {
    // variables declaration
    let input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("searchInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("forumList");
    tr = table.getElementsByTagName("tr");

    // Hide all post which does not contain the search query in its title
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[2];
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


// function to sort the table according to user's click
function sortTable(n) {
    var table,
        rows,
        switching,
        i,
        x,
        y,
        shouldSwitch,
        dir,
        switchcount = 0;
    table = document.getElementById("forumList");
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.getElementsByTagName("TR");
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < rows.length - 1; i++) { //Change i=0 if you have the header th a separate table.
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            if (dir == "asc") {
                if (n == 0) {
                    if (parseInt(x.innerHTML) > parseInt(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            } else if (dir == "desc") {
                if (n == 0) {
                    if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            //Each time a switch is done, increase this count by 1:
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
    for (i = 0; i < 3; i++) {
        element = table.getElementsByTagName("TR")[0].getElementsByTagName("th")[i];
        if (i != n) {
            element.innerHTML = element.innerHTML.slice(0, -1) + '&#x21F3';
        } else if (dir == "asc") {
            element.innerHTML = element.innerHTML.slice(0, -1) + '&#x21E7';
        } else {
            element.innerHTML = element.innerHTML.slice(0, -1) + '&#x21E9';
        }
    }
}