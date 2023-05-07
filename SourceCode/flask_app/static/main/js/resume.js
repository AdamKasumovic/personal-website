// Super convenience thing for how this all works--remembers scroll position on refresh
// https://stackoverflow.com/questions/17642872/refresh-page-and-keep-scroll-position
document.addEventListener("DOMContentLoaded", function(event) {
    let scrollpos = localStorage.getItem('scrollpos');
    if (scrollpos) window.scrollTo(0, scrollpos);
});

window.onbeforeunload = function(e) {
    localStorage.setItem('scrollpos', window.scrollY);
};

let editableElements; // all contentedtiable elements
let originalValues = {}; // all original versions of contenteditable elements
let newValues = {}; // all new versions of contenteditable elements
$(document).ready(function(){
    editableElements = document.querySelectorAll('.inst--name, .inst--department, .inst--zip, .inst--state, ' +
        '.inst--city, .inst--address, .pos--title, .pos--end-date, .pos--start-date, .pos--responsibilities, ' +
        '.exp--name, .exp--description, .skl--name');
    // save original values
    for (const originalElement of editableElements)
    {
        // should trim original value to compare
        originalValues[[originalElement.getAttribute("class"),
            originalElement.getAttribute("data-id")]] = originalElement.textContent.trim();
    }
});

function addInstitution () {
    const addInformation = {'institutions': 'dummy'};
    let departmentPrompt = prompt("Enter the department name. Leave empty or cancel if there is none.");
    if (departmentPrompt !== null && departmentPrompt !== "" && departmentPrompt.length < 100) {
        addInformation['department'] = departmentPrompt;
    }
    let addressPrompt = prompt("Enter the address. Leave empty or cancel if there is none.");
    if (addressPrompt !== null && addressPrompt !== "" && addressPrompt.length < 100) {
        addInformation['address'] = addressPrompt;
    }
    let cityPrompt = prompt("Enter the city. Leave empty or cancel if there is none.");
    if (cityPrompt !== null && cityPrompt !== "" && cityPrompt.length < 100) {
        addInformation['city'] = cityPrompt;
    }
    let statePrompt = prompt("Enter the state. Leave empty or cancel if there is none.");
    if (statePrompt !== null && statePrompt !== "" && statePrompt.length < 100) {
        addInformation['state'] = statePrompt;
    }
    let zipPrompt = prompt("Enter the ZIP code. Leave empty or cancel if there is none.");
    if (zipPrompt !== null && zipPrompt !== "" && zipPrompt.length < 10) {
        addInformation['zip'] = zipPrompt;
    }
    jQuery.ajax({
        url: "/processresumeadd",
        data: addInformation,
        type: "POST",
        success:function(returned_data){
              returned_data = JSON.parse(returned_data);

              // Go to resume (refresh) if successful update, otherwise display error message
              if (returned_data['success'])
              {
                  window.location.href = "/resume";
              }
              else
              {
                  window.alert("Something went wrong when adding the resume entry. " +
                      "Please contact me at 2098kas@gmail.com");
              }
        }
    });
}

const editSaveButton = document.getElementById('edit-save-button');
const cancelButton = document.getElementById('cancel-button');
const addInstButton = document.getElementById('add-inst-button');
const editHeaderText = document.getElementById('edit-header-text');
if (editSaveButton !== null)
{
    editSaveButton.addEventListener('click', () => {
        for (let originalElement of editableElements)
        {
            // Handle first time
            if (originalElement.contentEditable === 'inherit') {
                originalElement.contentEditable = 'false';
                // Prevent pasted text from having html stuff
                originalElement.addEventListener('paste', (event) => {
                    event.preventDefault();
                    const pastedText = event.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, pastedText);
                });
            }

            // Negate contenteditable status
            originalElement.contentEditable = originalElement.contentEditable === 'false' ? 'true' : 'false';
        }

        if (editableElements.length > 0) {
            // Handle button label
            if(editableElements[0].contentEditable === 'false') {
                editSaveButton.textContent = "Edit";
                cancelButton.style.display = 'none';
                addInstButton.style.display = 'none';
                editHeaderText.textContent = "";
                // save new values
                for (const originalElement of editableElements)
                {
                    // should trim new value to compare
                    newValues[[originalElement.getAttribute("class"),
                        originalElement.getAttribute("data-id")]] = originalElement.textContent.trim();
                }
                if (!checkValidity())
                {
                    window.alert("Entries invalid. Please ensure that text fields are not too large and that dates are valid.");
                    for (let originalElement of editableElements) {
                        originalElement.contentEditable = 'true';
                    }
                    editSaveButton.textContent = "Save";
                    cancelButton.style.display = 'inline';
                    addInstButton.style.display = 'inline';
                    editHeaderText.innerHTML = "Click on a dynamic resume element to edit it! Save when you're done!" +
                        " Note that only valid replacements are accepted and there are limits to how long entries can be. " +
                        "Exceeding the limits is only possible by pasting something too large, so check for things you " +
                        "pasted if formatting looks broken/you exceed the SQL DB limits. Entries can never be empty." +
                        "<br><b>To delete an entry</b>, select it with your mouse and then hit the " +
                        "Delete key on your keyboard.<br><b>To add an entry,</b> select the entry it will " +
                        "belong to and hit Enter. For adding institutions, hit the button labeled accordingly.";
                }
                else {
                    // SEND DATA TO SERVER VIA jQuery.ajax({})
                    jQuery.ajax({
                        url: "/processresumeedit",
                        data: newValues,
                        type: "POST",
                        success:function(returned_data){
                              returned_data = JSON.parse(returned_data);

                              // Go to resume (refresh) if successful update, otherwise display error message
                              if (returned_data['success'])
                              {
                                  window.location.href = "/resume";
                              }
                              else
                              {
                                  window.alert("Something went wrong when saving the resume. " +
                                      "Please don't use any silly characters that would make a SQL server cry." +
                                      "Regardless, this shouldn't be happening, please contact me at 2098kas@gmail.com");
                              }
                            }
                    });
                }
            }
            else {
                editSaveButton.textContent = "Save";
                cancelButton.style.display = 'inline';
                addInstButton.style.display = 'inline';
                editHeaderText.innerHTML = "Click on a dynamic resume element to edit it! Save when you're done!" +
                        " Note that only valid replacements are accepted and there are limits to how long entries can be. " +
                        "Exceeding the limits is only possible by pasting something too large, so check for things you " +
                        "pasted if formatting looks broken/you exceed the SQL DB limits. Entries can never be empty." +
                        "<br><b>To delete an entry</b>, select it with your mouse and then hit the " +
                        "Delete key on your keyboard.<br><b>To add an entry,</b> select the entry it will " +
                        "belong to and hit Enter. For adding institutions, hit the button labeled accordingly.";
            }
        }
        else {
            const confirmAddInstText = "The resume is empty! Would you like to get started by adding an institution?";
            if (confirm(confirmAddInstText)) {
                addInstitution();
            }
        }
    });
}

if (cancelButton !== null) {
    cancelButton.addEventListener('click', () => {
        window.location.href = "/resume";  // just refresh page if cancel (no save will occur)
    });
}

if (addInstButton !== null) {
    addInstButton.addEventListener('click', () => {
        addInstitution();  // add institution if button is pressed
    });
}

// Below two functions borrowed from
// https://gomakethings.com/how-to-check-if-a-date-is-valid-with-vanilla-javascript/
// They are used to prevent SQL errors from invalid dates
function daysInMonth(m, y) {
    switch (m) {
        case 1 :
            return (y % 4 === 0 && y % 100) || y % 400 === 0 ? 29 : 28;
        case 8 : case 3 : case 5 : case 10 :
            return 30;
        default :
            return 31;
    }
}

function isValidDate(d, m, y) {
    m = m - 1;
    return m >= 0 && m < 12 && d > 0 && d <= daysInMonth(m, y);
}

// These are hard limits since technically a user can get past my soft limits below
// Try to avoid SQL errors at all costs in case they bring down the website
function checkValidity() {
    for (const [key, value] of Object.entries(newValues)) {
        // All of these can technically go under one giant if with ORs in between but this is a bit more readable

        // These should have a limit of 100 characters, but I will limit them to 99 to be safe
        if (((key.includes("inst--") && !key.includes("zip")) || key.includes("pos--title")
            || key.includes("exp--name")) && value.length > 99) {
            return false;
        }
        // I will limit the zip code to 9 characters
        else if (key.includes("inst--") && key.includes("zip") && value.length > 9) {
            return false;
        }
        // Limit to (max in SQL table - 1) for the rest.
        else if ((key.includes("pos--responsibilities") || key.includes("exp--description")) && value.length > 499) {
            return false;
        }
        else if (key.includes("skl--") && value.length > 49) {
            return false;
        }
        // Ensure dates are valid
        else if (key.includes("pos--") && key.includes("date")) {
            // Make sure no letters are present
            if (!(/^\d+-\d+-\d+$/.test(value)) && !(key.includes("end") && value === "Present")) {
                return false;
            }
            const year = parseInt(value.substring(0, 4));
            const month = parseInt(value.substring(5, 7));
            const day = parseInt(value.substring(8, 10));
            if (!(year && month && day && value[4] === '-' && value[7] === '-' && isValidDate(day, month, year)) &&
                !(key.includes("end") && value === "Present")) {
                return false;
            }
        }

    }
    return true;
}

// Borrowed from https://codepen.io/ramonsenadev/pen/jywRQg for limiting contenteditable size
settings = {
    // Maximum width that elements of group 1 can take on screen
    maximumGroup1WidthRight: 10,
    maximumGroup1WidthLeft: 29,
    maximumGroup234Width: 0.85,  // uses width ratio instead of char count
    maximum99: 99,
    maximum9: 9,
    maximum499: 499,
    maximum49: 49,
}

keys = {
    'backspace': 8,
    'shift': 16,
    'ctrl': 17,
    'alt': 18,
    'delete': 46,
    // 'cmd':
    'leftArrow': 37,
    'upArrow': 38,
    'rightArrow': 39,
    'downArrow': 40,
}

utils = {
    special: {},
    navigational: {},
    isSpecial(e) {
        return typeof this.special[e.keyCode] !== 'undefined';
    },
    isNavigational(e) {
        return typeof this.navigational[e.keyCode] !== 'undefined';
    }
}

utils.special[keys['backspace']] = true;
utils.special[keys['shift']] = true;
utils.special[keys['ctrl']] = true;
utils.special[keys['alt']] = true;
utils.special[keys['delete']] = true;

utils.navigational[keys['upArrow']] = true;
utils.navigational[keys['downArrow']] = true;
utils.navigational[keys['leftArrow']] = true;
utils.navigational[keys['rightArrow']] = true;

function determineElementType(htmlElement, mapper) {
    const classToType = mapper;
    const fullClass = htmlElement.getAttribute("class");
    for (const [key, value] of Object.entries(classToType)) {
        if (fullClass.includes(key)) {
          return value;
        }
    }
}

// Prevent empty contenteditables
editableElements = document.querySelectorAll('.inst--name, .inst--department, .inst--zip, .inst--state, ' +
        '.inst--city, .inst--address, .pos--title, .pos--end-date, .pos--start-date, .pos--responsibilities, ' +
        '.exp--name, .exp--description, .skl--name');
for (let originalElement of editableElements) {
    originalElement.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isNavigational) {
            return true;
        }
        // backspace/delete/cut are fine if they won't make the content empty
        if ((len < 2 && isSpecial) || (hasSelection && selection.toString().length >= len)) {
            if (event.keyCode === 8 || event.keyCode === 46 || event.keyCode === 88
                || (hasSelection && selection.toString().length >= len)) {
                window.alert("You can't have empty entries! Add a little replacement text before deleting this.");
            }
            event.preventDefault();
            return false;
        }

        // Delete selected element on hitting delete
        if (event.keyCode === 46) {
            event.preventDefault();
            let elementType = determineElementType(originalElement,
                {"inst--": "institution", "pos--": "position", "exp--": "experience", "skl--": "skill"});
            const confirmDeleteText = "Are you sure you want to delete this " + elementType + "? " +
                "This will undo any outstanding edits and cannot be undone.";
            if (confirm(confirmDeleteText)) {
                // SEND DATA TO SERVER VIA jQuery.ajax({})
                elementType += 's';  // match table name
                const deleteTarget = {};  // apparently JS will not let me initialize the dictionary with the variable value
                deleteTarget[elementType] = originalElement.getAttribute("data-id");
                jQuery.ajax({
                    url: "/processresumedelete",
                    data: deleteTarget,
                    type: "POST",
                    success:function(returned_data){
                          returned_data = JSON.parse(returned_data);

                          // Go to resume (refresh) if successful update, otherwise display error message
                          if (returned_data['success'])
                          {
                              window.location.href = "/resume";
                          }
                          else
                          {
                              window.alert("Something went wrong when deleting the resume entry. " +
                                  "Please contact me at 2098kas@gmail.com");
                          }
                    }
                });
            }
            return true;
        }

        // Add below selected element on hitting enter, skills don't have a below so don't add to them
        if (event.keyCode === 13 && !originalElement.getAttribute("class").includes("skl--")) {
            event.preventDefault();
            let elementType = determineElementType(originalElement,
                {"inst--": "position", "pos--": "experience", "exp--": "skill"});
            const confirmAddText = "Add a new " + elementType + " below? " +
                "This will undo any outstanding edits.";
            if (confirm(confirmAddText)) {
                // SEND DATA TO SERVER VIA jQuery.ajax({})
                elementType += 's';  // match table name
                const addInformation = {};
                addInformation[elementType] = originalElement.getAttribute("data-id");
                if (elementType === "experiences") {
                    let hyperlinkPrompt = prompt("Enter a link about the experience.");
                    if (hyperlinkPrompt !== null && hyperlinkPrompt !== "" && hyperlinkPrompt.length < 100) {
                        addInformation['hyperlink'] = hyperlinkPrompt;
                    }
                }
                jQuery.ajax({
                    url: "/processresumeadd",
                    data: addInformation,
                    type: "POST",
                    success:function(returned_data){
                          returned_data = JSON.parse(returned_data);

                          // Go to resume (refresh) if successful update, otherwise display error message
                          if (returned_data['success'])
                          {
                              window.location.href = "/resume";
                          }
                          else
                          {
                              window.alert("Something went wrong when adding the resume entry. " +
                                  "Please contact me at 2098kas@gmail.com");
                          }
                    }
                });
            }
            return true;
        }
    });
}

// Soft limits trying to restrict how much can be typed in the contenteditables
// Limit date size to 10
const group1LimitedsRight = document.querySelectorAll(".limit-g1.pos-right");
for (const group1Limited of group1LimitedsRight) {
    group1Limited.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximumGroup1WidthRight && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Limit these to 99
const limitedTo99 = document.querySelectorAll('.inst--name, .inst--department, .inst--state, .inst--city, ' +
    '.inst--address, .pos--title, .exp--name');
for (const limit99 of limitedTo99) {
    limit99.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximum99 && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Limit these to 9
const limitedTo9 = document.querySelectorAll('.inst--zip');
for (const limit9 of limitedTo9) {
    limit9.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximum9 && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Limit these to 499
const limitedTo499 = document.querySelectorAll('.pos--responsibilities, .exp--description');
for (const limit499 of limitedTo499) {
    limit499.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximum499 && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Limit these to 49
const limitedTo49 = document.querySelectorAll('.skl--name');
for (const limit49 of limitedTo49) {
    limit49.addEventListener("keydown", (event) => {
        const len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximum49 && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Prevent clipping for position names with dates
const group1LimitedsLeft = document.querySelectorAll(".limit-g1.pos-left");
for (const group1Limited of group1LimitedsLeft) {
    group1Limited.addEventListener("keydown", (event) => {
        let len = event.target.innerText.trim().length;
        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximumGroup1WidthLeft && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

// Prevent clipping for inst stuff (I should have used flex instead of float, oh well)
const group2Limiteds = document.querySelectorAll(".limit-g2");
const group3Limiteds = document.querySelectorAll(".limit-g3");
const group4Limiteds = document.querySelectorAll(".limit-g4");
for (const group2Limited of group2Limiteds) {
    group2Limited.addEventListener("keydown", (event) => {
        let multiplier = 1;
        let windowInnerWidth = window.innerWidth;  // 900 is when the float left/right start to separate
        if (windowInnerWidth > 900)
        {
            multiplier *= windowInnerWidth/900;
        }
        let len = group2Limited.clientWidth*multiplier/windowInnerWidth;
        let group3Len = 0;
        for (const group3Limited of group3Limiteds) {
            if (group3Limited.getAttribute("data-id") ===
                group2Limited.getAttribute("data-id")) {
                group3Len += group3Limited.clientWidth*multiplier/windowInnerWidth;
            }
        }
        let group4Len = 0;
        for (const group4Limited of group4Limiteds) {
            if (group4Limited.getAttribute("data-id") ===
                group2Limited.getAttribute("data-id")) {
                group4Len += group4Limited.clientWidth*multiplier/windowInnerWidth;
            }
        }
        len += Math.max(group3Len, group4Len);

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximumGroup234Width && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

for (const group3Limited of group3Limiteds) {
    group3Limited.addEventListener("keydown", (event) => {
        let multiplier = 1;
        let windowInnerWidth = window.innerWidth;  // 900 is when the float left/right start to separate
        if (windowInnerWidth > 900)
        {
            multiplier *= windowInnerWidth/900;
        }
        let len = 0;
        for (const group3LimitedInner of group3Limiteds) {
            if (group3LimitedInner.getAttribute("data-id") ===
                group3Limited.getAttribute("data-id")) {
                len += group3LimitedInner.clientWidth*multiplier/windowInnerWidth;
            }
        }
        let group2Len = 0;
        for (const group2Limited of group2Limiteds) {
            if (group2Limited.getAttribute("data-id") ===
                group3Limited.getAttribute("data-id")) {
                group2Len += group2Limited.clientWidth*multiplier/windowInnerWidth;
            }
        }
        len += group2Len;

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximumGroup234Width && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}

for (const group4Limited of group4Limiteds) {
    group4Limited.addEventListener("keydown", (event) => {
        let multiplier = 1;
        let windowInnerWidth = window.innerWidth;  // 900 is when the float left/right start to separate
        if (windowInnerWidth > 900)
        {
            multiplier *= windowInnerWidth/900;
        }
        let len = 0;
        for (const group4LimitedInner of group4Limiteds) {
            if (group4LimitedInner.getAttribute("data-id") ===
                group4Limited.getAttribute("data-id")) {
                len += group4LimitedInner.clientWidth*multiplier/windowInnerWidth;
            }
        }
        let group2Len = 0;
        for (const group2Limited of group2Limiteds) {
            if (group2Limited.getAttribute("data-id") ===
                group4Limited.getAttribute("data-id")) {
                group2Len += group2Limited.clientWidth*multiplier/windowInnerWidth;
            }
        }
        len += group2Len;

        let hasSelection = false;
        const selection = window.getSelection();
        const isSpecial = utils.isSpecial(event);
        const isNavigational = utils.isNavigational(event);

        if (selection) {
            hasSelection = !!selection.toString();
        }

        if (isSpecial || isNavigational) {
            return true;
        }

        if (len >= settings.maximumGroup234Width && !hasSelection) {
            event.preventDefault();
            return false;
        }
    });
}
