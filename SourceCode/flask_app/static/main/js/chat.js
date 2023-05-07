// Code from template--handles join message
let socket;
$(document).ready(function(){

    socket = io.connect('https://' + document.domain + ':' + location.port + '/chat');
    socket.on('connect', function() {
        socket.emit('joined', {});
    });

    socket.on('status', function(data) {
        let tag  = document.createElement("p");
        let text = document.createTextNode(data.msg);
        let element = document.getElementById("chat");
        tag.appendChild(text);
        tag.style.cssText = data.style;
        element.appendChild(tag);
        $('#chat').scrollTop($('#chat')[0].scrollHeight);

    });
});

// Called on hitting the Leave Room button
function leaveRoom() {
    window.location.href = "/home";
}

// Called when user leaves page
window.onbeforeunload = function() {
    socket.emit('leave', {});
}

// Handle entering messages
const messageBox = document.getElementById("message-content");
messageBox.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        socket.emit('send', messageBox.value)
        messageBox.value = "";
    }
});
