// Mouse over event listener to display piano key labels
const pianoKeys = document.getElementsByClassName("piano-key");
//console.log(pianoKeys);
const keyLabels = document.getElementsByClassName("key-label");
//console.log(keyLabels);
const labelTimeout = 3000;  // Time in ms before key labels disappear

// Used to prevent weird flickering bug
let timeoutIDs = [];

// Display the piano key labels when any key is mouseovered
for (const pianoKey of pianoKeys) {
    pianoKey.addEventListener("mouseover", (event) => {
        // Make piano key labels visible
        for (const keyLabel of keyLabels) {
            keyLabel.style.display = "block";
        }
        //console.log("Key labels visible!");

        // Make piano key labels invisible again after a timeout
        const timeoutID = setTimeout(() => {
            for (const keyLabel of keyLabels) {
                keyLabel.style.display = "none";
            }
            //console.log("Key labels expired!");
        }, labelTimeout);
        timeoutIDs.push(timeoutID);  // add timeoutID to list
    }, false);

    pianoKey.addEventListener("mouseleave", (event) => {
        // Clear any timeoutIDs and empty the list of them, preventing any unintentional flickering
        for (const timeoutIDElement of timeoutIDs)
        {
            clearTimeout(timeoutIDElement); // https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout
        }
        while (timeoutIDs.length > 0) {
            timeoutIDs.pop();
        }

        // Make piano key labels hidden immediately after leaving
        for (const keyLabel of keyLabels) {
            keyLabel.style.display = "none";
        }
        //console.log("Key labels hidden!");
    }, false);
}

// Get all piano keys by id
const c4Key = document.getElementById("c4");
//console.log(c4Key);
const d4Key = document.getElementById("d4");
const e4Key = document.getElementById("e4");
const f4Key = document.getElementById("f4");
const g4Key = document.getElementById("g4");
const a5Key = document.getElementById("a5");
const b5Key = document.getElementById("b5");
const c5Key = document.getElementById("c5");
const d5Key = document.getElementById("d5");
const e5Key = document.getElementById("e5");
const cSharp4Key = document.getElementById("c-sharp4");
const dSharp4Key = document.getElementById("d-sharp4");
const fSharp4Key = document.getElementById("f-sharp4");
const gSharp4Key = document.getElementById("g-sharp4");
const aSharp5Key = document.getElementById("a-sharp5");
const cSharp5Key = document.getElementById("c-sharp5");
const dSharp5Key = document.getElementById("d-sharp5");

// If the piano key is currently pressed
let c4Pressed = false;
let d4Pressed = false;
let e4Pressed = false;
let f4Pressed = false;
let g4Pressed = false;
let a5Pressed = false;
let b5Pressed = false;
let c5Pressed = false;
let d5Pressed = false;
let e5Pressed = false;
let cSharp4Pressed = false;
let dSharp4Pressed = false;
let fSharp4Pressed = false;
let gSharp4Pressed = false;
let aSharp5Pressed = false;
let cSharp5Pressed = false;
let dSharp5Pressed = false;

// Soundbank
const sound = {65:"http://carolinegabriel.com/demo/js-keyboard/sounds/040.wav",
                87:"http://carolinegabriel.com/demo/js-keyboard/sounds/041.wav",
                83:"http://carolinegabriel.com/demo/js-keyboard/sounds/042.wav",
                69:"http://carolinegabriel.com/demo/js-keyboard/sounds/043.wav",
                68:"http://carolinegabriel.com/demo/js-keyboard/sounds/044.wav",
                70:"http://carolinegabriel.com/demo/js-keyboard/sounds/045.wav",
                84:"http://carolinegabriel.com/demo/js-keyboard/sounds/046.wav",
                71:"http://carolinegabriel.com/demo/js-keyboard/sounds/047.wav",
                89:"http://carolinegabriel.com/demo/js-keyboard/sounds/048.wav",
                72:"http://carolinegabriel.com/demo/js-keyboard/sounds/049.wav",
                85:"http://carolinegabriel.com/demo/js-keyboard/sounds/050.wav",
                74:"http://carolinegabriel.com/demo/js-keyboard/sounds/051.wav",
                75:"http://carolinegabriel.com/demo/js-keyboard/sounds/052.wav",
                79:"http://carolinegabriel.com/demo/js-keyboard/sounds/053.wav",
                76:"http://carolinegabriel.com/demo/js-keyboard/sounds/054.wav",
                80:"http://carolinegabriel.com/demo/js-keyboard/sounds/055.wav",
                186:"http://carolinegabriel.com/demo/js-keyboard/sounds/056.wav"};

// Creepy audio
const creepyAudio = "https://orangefreesounds.com/wp-content/uploads/2020/09/Creepy-piano-sound-effect.mp3?_=1";

// A counter of consecutive successful "weseeyou" keys
let weseeyou = 0;
const weseeyouPicture = document.getElementById("great-old-one-pic");
const summonedText = document.getElementById("summoned-text");
// If successful "weseeyou", disable piano keys
let pianoDisabled = false;

// Please forgive me; I wanted to have a bit more fun with this
let megalovania = 0;
const megalovaniaAudio = document.getElementById("megalovania");
let megalovaniaPlaying = false;

// Don't play notes when the form is out
// Get the feedback form container
const feedbackFormPiano = document.getElementsByClassName("feedback-form-container");

// Today I learned that my keyboard cannot handle more than 9 keyboard inputs simultaneously.

// Alter key style when pressed. Using window, no input tags are needed.
// In addition, play the corresponding audio.
// Also, keep track if the user is spelling "weseeyou".
window.addEventListener("keydown", (event) => {
    // The event.repeat prevents key spamming
    if (event.isComposing || event.keyCode === 229 || event.repeat || pianoDisabled
        || feedbackFormPiano[0].style.display === "block") {
        return;
    }
    //console.log(event.keyCode);
    // Set corresponding keyPressed to true when it is pressed
    if (event.keyCode === 65) {
        c4Pressed = true;
    }
    else if (event.keyCode === 83) {
        d4Pressed = true;
    }
    else if (event.keyCode === 68) {
        e4Pressed = true;
    }
    else if (event.keyCode === 70) {
        f4Pressed = true;
    }
    else if (event.keyCode === 71) {
        g4Pressed = true;
    }
    else if (event.keyCode === 72) {
        a5Pressed = true;
    }
    else if (event.keyCode === 74) {
        b5Pressed = true;
    }
    else if (event.keyCode === 75) {
        c5Pressed = true;
    }
    else if (event.keyCode === 76) {
        d5Pressed = true;
    }
    else if (event.keyCode === 186) {
        e5Pressed = true;
    }
    else if (event.keyCode === 87) {
        cSharp4Pressed = true;
    }
    else if (event.keyCode === 69) {
        dSharp4Pressed = true;
    }
    else if (event.keyCode === 84) {
        fSharp4Pressed = true;
    }
    else if (event.keyCode === 89) {
        gSharp4Pressed = true;
    }
    else if (event.keyCode === 85) {
        aSharp5Pressed = true;
    }
    else if (event.keyCode === 79) {
        cSharp5Pressed = true;
    }
    else if (event.keyCode === 80) {
        dSharp5Pressed = true;
    }

    // Check what keys are pressed when any key is pressed and update styles
    if (c4Pressed) {
        makeKeyPressed(c4Key);
    }
    if (d4Pressed) {
        makeKeyPressed(d4Key);
    }
    if (e4Pressed) {
        makeKeyPressed(e4Key);
    }
    if (f4Pressed) {
        makeKeyPressed(f4Key);
    }
    if (g4Pressed) {
        makeKeyPressed(g4Key);
    }
    if (a5Pressed) {
        makeKeyPressed(a5Key);
    }
    if (b5Pressed) {
        makeKeyPressed(b5Key);
    }
    if (c5Pressed) {
        makeKeyPressed(c5Key);
    }
    if (d5Pressed) {
        makeKeyPressed(d5Key);
    }
    if (e5Pressed) {
        makeKeyPressed(e5Key);
    }
    if (cSharp4Pressed) {
        makeKeyPressed(cSharp4Key);
    }
    if (dSharp4Pressed) {
        makeKeyPressed(dSharp4Key);
    }
    if (fSharp4Pressed) {
        makeKeyPressed(fSharp4Key);
    }
    if (gSharp4Pressed) {
        makeKeyPressed(gSharp4Key);
    }
    if (aSharp5Pressed) {
        makeKeyPressed(aSharp5Key);
    }
    if (cSharp5Pressed) {
        makeKeyPressed(cSharp5Key);
    }
    if (dSharp5Pressed) {
        makeKeyPressed(dSharp5Key);
    }

    // Play the audio (for some reason there is a short delay before the first sound plays)
    let pianoSound = new Audio(sound[event.keyCode]);
    pianoSound.play();

    // Finally, check if we are making the weseeyou combo
    // Technically this could be one large conditional statement, but I think this is more readable
    if (weseeyou === 0 && cSharp4Pressed) {  // W
        ++weseeyou;
    }
    else if (weseeyou === 1 || weseeyou === 3 || weseeyou === 4) {  // E
        if (dSharp4Pressed) {
            ++weseeyou;
        }
        else {
            if (cSharp4Pressed) {  // Reset on failure appropriately
                weseeyou = 1;
            }
            else {
                weseeyou = 0;
            }
        }
    }
    else if (weseeyou === 2) {  // S
        if (d4Pressed) {
            ++weseeyou
        }
        else {
            if (cSharp4Pressed) {
                weseeyou = 1;
            }
            else {
                weseeyou = 0;
            }
        }
    }
    else if (weseeyou === 5) {  // Y
        if (gSharp4Pressed) {
            ++weseeyou;
        }
        else {
            if (cSharp4Pressed) {
                weseeyou = 1;
            }
            else {
                weseeyou = 0;
            }
        }
    }
    else if (weseeyou === 6) {  // O
        if (cSharp5Pressed) {
            ++weseeyou;
        }
        else {
            if (cSharp4Pressed) {
                weseeyou = 1;
            }
            else {
                weseeyou = 0;
            }
        }
    }
    else if (weseeyou === 7) {  // U
        if (aSharp5Pressed) {  // play audio, disable piano, and summon the great old one
            console.log("\"weseeyou\" typed!");

            // fade in
            weseeyouPicture.style.zIndex = "2";
            weseeyouPicture.style.transition = "opacity 1s ease-in";
            weseeyouPicture.style.opacity = "1";
            summonedText.textContent = "I have awoken."

            megalovaniaAudio.pause();
            megalovaniaAudio.currentTime = 0;

            pianoDisabled = true;

            let creepyAudioSound = new Audio(creepyAudio);
            creepyAudioSound.play();
        }
        if (cSharp4Pressed) {
            weseeyou = 1;
        }
        else {
            weseeyou = 0;
        }
    }

    // Also check if we are making the megalovania combo
    if (megalovania === 0 || megalovania === 1 || megalovania === 7) {  // S
        if (d4Pressed) {
            ++megalovania;
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 2) {  // L
        if (d5Pressed) {
            ++megalovania;
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 3) {  // H
        if (a5Pressed) {
            ++megalovania
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 4) {  // Y
        if (gSharp4Pressed) {
            ++megalovania;
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 5) {  // G (first)
        if (g4Pressed) {
            ++megalovania;
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 6 || megalovania === 8) {  // F
        if (f4Pressed) {
            ++megalovania;
        }
        else {
            if (d4Pressed) {
                megalovania = 1;
            }
            else {
                megalovania = 0;
            }
        }
    }
    else if (megalovania === 9) {  // G (last)
        if (g4Pressed) {  // toggle audio
            if (!megalovaniaPlaying) {
                megalovaniaAudio.play();
                megalovaniaPlaying = true;
            }
            else {
                megalovaniaAudio.pause();
                megalovaniaAudio.currentTime = 0;
                megalovaniaPlaying = false;
            }
        }
        if (d4Pressed) {
            megalovania = 1;
        }
        else {
            megalovania = 0;
        }
    }
});

// Alter key style when released. Using window, no input tags are needed.
window.addEventListener("keyup", (event) => {
    if (event.isComposing || event.keyCode === 229) {
        return;
    }
    //console.log(event.keyCode);
    // Set corresponding keyPressed to false when it is released
    if (event.keyCode === 65) {
        c4Pressed = false;
    }
    else if (event.keyCode === 83) {
        d4Pressed = false;
    }
    else if (event.keyCode === 68) {
        e4Pressed = false;
    }
    else if (event.keyCode === 70) {
        f4Pressed = false;
    }
    else if (event.keyCode === 71) {
        g4Pressed = false;
    }
    else if (event.keyCode === 72) {
        a5Pressed = false;
    }
    else if (event.keyCode === 74) {
        b5Pressed = false;
    }
    else if (event.keyCode === 75) {
        c5Pressed = false;
    }
    else if (event.keyCode === 76) {
        d5Pressed = false;
    }
    else if (event.keyCode === 186) {
        e5Pressed = false;
    }
    else if (event.keyCode === 87) {
        cSharp4Pressed = false;
    }
    else if (event.keyCode === 69) {
        dSharp4Pressed = false;
    }
    else if (event.keyCode === 84) {
        fSharp4Pressed = false;
    }
    else if (event.keyCode === 89) {
        gSharp4Pressed = false;
    }
    else if (event.keyCode === 85) {
        aSharp5Pressed = false;
    }
    else if (event.keyCode === 79) {
        cSharp5Pressed = false;
    }
    else if (event.keyCode === 80) {
        dSharp5Pressed = false;
    }

    // Check what keys are unpressed when any key is released and update styles
    if (!c4Pressed) {
        makeWhiteKeyUnpressed(c4Key);
    }
    if (!d4Pressed) {
        makeWhiteKeyUnpressed(d4Key);
    }
    if (!e4Pressed) {
        makeWhiteKeyUnpressed(e4Key);
    }
    if (!f4Pressed) {
        makeWhiteKeyUnpressed(f4Key);
    }
    if (!g4Pressed) {
        makeWhiteKeyUnpressed(g4Key);
    }
    if (!a5Pressed) {
        makeWhiteKeyUnpressed(a5Key);
    }
    if (!b5Pressed) {
        makeWhiteKeyUnpressed(b5Key);
    }
    if (!c5Pressed) {
        makeWhiteKeyUnpressed(c5Key);
    }
    if (!d5Pressed) {
        makeWhiteKeyUnpressed(d5Key);
    }
    if (!e5Pressed) {
        makeWhiteKeyUnpressed(e5Key);
    }
    if (!cSharp4Pressed) {
        makeBlackKeyUnpressed(cSharp4Key);
    }
    if (!dSharp4Pressed) {
        makeBlackKeyUnpressed(dSharp4Key);
    }
    if (!fSharp4Pressed) {
        makeBlackKeyUnpressed(fSharp4Key);
    }
    if (!gSharp4Pressed) {
        makeBlackKeyUnpressed(gSharp4Key);
    }
    if (!aSharp5Pressed) {
        makeBlackKeyUnpressed(aSharp5Key);
    }
    if (!cSharp5Pressed) {
        makeBlackKeyUnpressed(cSharp5Key);
    }
    if (!dSharp5Pressed) {
        makeBlackKeyUnpressed(dSharp5Key);
    }
});

// Hoisted function that changes the style of a provided key to be pressed
function makeKeyPressed(keyElement) {
    keyElement.style.backgroundColor = "#aaaaff";
    keyElement.style.boxShadow = "calc(-1*var(--piano-border-thickness)) 0 var(--piano-border-thickness) #030303, " +
        "var(--piano-border-thickness) 0 var(--piano-border-thickness) #030303";
}

// Hoisted function that changes the style of a provided white key to be unpressed
function makeWhiteKeyUnpressed(keyElement) {
    keyElement.style.backgroundColor = "#ffffff";
    keyElement.style.boxShadow = "none";
}

// Hoisted function that changes the style of a provided black key to be unpressed
function makeBlackKeyUnpressed(keyElement) {
    keyElement.style.backgroundColor = "#000000";
    keyElement.style.boxShadow = "none";
}
