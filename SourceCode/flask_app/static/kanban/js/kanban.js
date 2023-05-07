// Very simple function that just pops up the create board stuff
function displayCreateBoard() {
    const createBoard = document.querySelector('.create-board-container');
    createBoard.style.display = "block";
    const createBoardButton = document.querySelector('.create-board-button-container');
    createBoardButton.style.display = "none";
}

// Function that adds email both visually and to a list, user's own email will be added in post
let emails = []
function addEmail () {
    let newSpan = document.createElement("span");
    newSpan.classList.add("added-email");
    const emailText = document.getElementById("board-email");
    const spanTextNode = document.createTextNode(emailText.value);
    // do a weak, easily bypassable check for valid email to help reduce garbage emails
    if (emailText.value.length >= 3 && emailText.value.includes('@') && emailText.value[0] !== '@') {
        newSpan.appendChild(spanTextNode);
        emails.push(emailText.value);
    } else {
        window.alert("Invalid email! Please try again.");
    }
    emailText.value = "";
    document.getElementById("email-list").appendChild(newSpan);
}

// This function creates a board and sends the user there
function makeDefaultBoard() {
    const boardName = document.getElementById('board-name');
    // Soft name check to save the users from empty board names
    if (boardName.value.trim().length === 0) {
        window.alert("Please type in a name for the new board.");
    } else {
        // package data in a JSON object, apparently you can't have arrays
        const data_d = {'name': boardName.value.trim(), 'emails': JSON.stringify(emails)};

        // SEND DATA TO SERVER VIA jQuery.ajax({})
        jQuery.ajax({
            url: "/processboardcreation",
            data: data_d,
            type: "POST",
            success:function(returned_data){
                returned_data = JSON.parse(returned_data);

                // Refresh either way, display message depending on success
                if (returned_data['success'])
                {
                    window.alert("Board creation successful!");
                }
                else
                {
                    window.alert("Something went wrong when creating the board.");
                }
                window.location.href = "/simpletrello";
            }
        });
    }
}

// Sends the user to the correct board
function gotoBoard(board_id) {
    window.location.href = "/board/"+board_id;
}
