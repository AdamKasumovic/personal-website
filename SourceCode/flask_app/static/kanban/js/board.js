// Get the board ID
const boardID = document.querySelector('.board-name').getAttribute('data-id');

// Join the board's room on startup
let socket;
$(document).ready(function(){

    socket = io.connect('https://' + document.domain + ':' + location.port + '/board');
    socket.on('connect', function() {
        socket.emit('joined_board', boardID);
    });

    // Updates details live, database update happens before this triggers
    socket.on('update_details', function(data) {
        const fixedCardId = '"' + data.card_id + '"';
        let targetCard = document.querySelector(".task-details[data-id=" + fixedCardId + "]");
        targetCard.setAttribute('contenteditable', 'false');
        setEditButtonOn(data.card_id);
        targetCard.textContent = data.text_content;
    });

    socket.on('board_status', function(data) {
        let tag  = document.createElement("p");
        let text = document.createTextNode(data.msg);
        let element = document.getElementById("board-chat");
        tag.appendChild(text);
        tag.style.cssText = data.style;
        element.appendChild(tag);
        $('#board-chat').scrollTop($('#board-chat')[0].scrollHeight);
    });

});

// Consider combining these two functions
function setEditButtonOff(card_id) {
    let targetEditButton = document.getElementById('edit-button-' + card_id);
    if (targetEditButton !== null)
        targetEditButton.style.display = "none";
}

// Use this when the content no longer becomes editable
function setEditButtonOn(card_id) {
    let targetEditButton = document.getElementById('edit-button-' + card_id);
    if (targetEditButton !== null)
        targetEditButton.style.display = "inline";
}

// This just enables a certain card's editable status,
// SAVE via Enter key will be separate and will make card not editable via event listeners on all cards
// prevent default required on enter event since contenteditables are multi-line.
// SAVE will make live change and database change via modifyRows, might be useful to have standalone SAVE function
function editCard(card_id) {
    const fixedCardId = '"' + card_id + '"';
    let targetCard = document.querySelector(".task-details[data-id=" + fixedCardId + "]");
    targetCard.setAttribute('contenteditable', 'true');
    setEditButtonOff(card_id);
}

// This makes both a live change and a database change to certain cards and makes the original card not editable
// This will also SAVE, skipping the Enter key step
function submitCard(card_id, card_count) {
    const fixedCardId = '"' + card_id + '"';
    let targetCard = document.querySelector(".task-details[data-id=" + fixedCardId + "]");

    if (targetCard.textContent.trim() === "Task1 details here!"
            || targetCard.textContent.trim() === "Task2 details here!")
        return;  // do nothing if no text entered

    // Check if doing list target card has content already
    let doingContentExists = false;
    // If we are in the To Do list...
    if ((parseInt(card_id) - 1) % (3*parseInt(card_count)) < (parseInt(card_count))) {
        const doingCardId = (parseInt(card_id) + parseInt(card_count)).toString();
        const doingFixedCardId = '"' + doingCardId + '"';
        let doingTargetCard = document.querySelector(".task-details[data-id=" + doingFixedCardId + "]");
        // If content isn't empty...
        if (!(doingTargetCard.textContent.trim() === "Task1 details here!"
            || doingTargetCard.textContent.trim() === "Task2 details here!"))
            doingContentExists = true;
    }

    // Check if we are moving to the completed list, assuming three lists per board
    if (((parseInt(card_id) - 1) % (3*parseInt(card_count)) >= (parseInt(card_count))) || doingContentExists) {
        const completedCardId = (parseInt(card_id) + parseInt(card_count)).toString();
        const completedFixedCardId = '"' + completedCardId + '"';
        let completedTargetCard = document.querySelector(".task-details[data-id=" + completedFixedCardId + "]");
        if (completedTargetCard.textContent.trim() === "Task1 details here!"
            || completedTargetCard.textContent.trim() === "Task2 details here!")
            completedTargetCard.textContent = "";
        if (!doingContentExists) {
            socket.emit('move_details', {'text_content': completedTargetCard.textContent + targetCard.textContent + " | ",
                'card_id': targetCard.getAttribute('data-id'), 'board_id': boardID,
                'card_count': card_count});
        } else {
            socket.emit('move_details', {'text_content': completedTargetCard.textContent + " | " + targetCard.textContent,
                'card_id': targetCard.getAttribute('data-id'), 'board_id': boardID,
                'card_count': card_count});
        }
    }
    else {
        socket.emit('move_details', {'text_content': targetCard.textContent,
                'card_id': targetCard.getAttribute('data-id'), 'board_id': boardID,
                'card_count': card_count});
    }
}

// Set placeholder text
const allDetails = document.querySelectorAll('.task-details');
for (let detail of allDetails) {
    // Borrowed from https://htmldom.dev/placeholder-for-a-contenteditable-element/
    // Get the placeholder attribute
    const placeholder = detail.getAttribute('data-placeholder');
    //console.log(detail);
    // Set the placeholder as initial content if it's empty
    if (detail.innerHTML.trim() === '') {
        detail.innerHTML = placeholder;
    }
    
    detail.addEventListener('focus', function (e) {
        const value = e.target.innerHTML;
        if (value === placeholder) {
            e.target.innerHTML = ''
        }
    });
    
    detail.addEventListener('blur', function (e) {
        const value = e.target.innerHTML;
        if (value.trim() === '') {
            e.target.innerHTML = placeholder;
        }
    });

    // SAVE functionality here!
    detail.addEventListener('keydown', function(e) {
        // On enter press...
        if (e.keyCode === 13) {
            e.preventDefault();  // Don't create a newline
            socket.emit('send_details', {'text_content': detail.textContent,
                'card_id': detail.getAttribute('data-id'), 'board_id': boardID});
        }
    });
}

// Send chat message
function submitChat() {
    const messageBox = document.getElementById("board-message-content");
    socket.emit('board_send', {'text_value': messageBox.value, 'board_id': boardID})
    messageBox.value = "";
}

// Called when user leaves page
window.onbeforeunload = function() {
    socket.emit('board_leave', boardID);
}
