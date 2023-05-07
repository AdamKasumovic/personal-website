// Get the feedback button container
const feedbackButton = document.getElementsByClassName("feedback-button-container");

// Get the feedback form container
const feedbackForm = document.getElementsByClassName("feedback-form-container");

feedbackButton[0].addEventListener("click", (event) => {
    // Make feedback form visible
    if (feedbackForm[0].style.display === "block") {
        feedbackForm[0].style.display = "none";
    }
    else {
        feedbackForm[0].style.display = "block";
    }

}, false);