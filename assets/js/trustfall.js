// establish the socket for communicating with the server. Hidden when testing locally.
var socket = io();

///// TYPING /////

let currentTypingInstance = null; // this will allow us to stop a current instance of typeText when a new one is called so it can overwrite the previous one

// trigger the typewriter effect
function typeText(text, index = 0, speed = 50, callback = null) { // I do the callback = null in case I don't want to do a callback when I do the typing -- just keep going with a function being triggered
  if (currentTypingInstance) {
    clearTimeout(currentTypingInstance); // stop the previous instance if a new one is called
  }
  if (index < text.length) {
    document.getElementById("textID").textContent += text.charAt(index);
    index++;
    currentTypingInstance = setTimeout(function() {
      typeText(text, index, speed, callback);
    }, speed); // typing speed (delay). 50 is default
  } else {
    // Once typeText completes, check if there's a callback function and execute it so then other functions can occur
    if (callback) {
      callback();
    }
  }
}

let playerName;
let captain;

function continueOn(nextFunction) {
    console.log("in continueOn")
    document.getElementById("continueButtonID").style.display="block";
    document.getElementById('continueButtonID').addEventListener('click', function(e) {
        this.removeEventListener('click', arguments.callee); // Remove the listener 
        document.getElementById("continueButtonID").style.display="none";
        nextFunction();
    });
}

function consoleStart() {
    console.log("in consoleStart")
    document.getElementById("formID").style.display="none";
    document.getElementById("topID").style.display="none";
    document.getElementById("consoleID").style.display="block";
    document.getElementById("consoleNameListID").style.display="block";

    socket.on('playersToConsole', (players, player1) => {
        // Add "Name:" as the first option
        const nameOption = document.createElement('option');
        nameOption.value = ''; // Empty value
        player1.selected = true; // Make it the default
        nameOption.disabled = true;  // Make it unselectable
        document.getElementById('playerSelect').appendChild(nameOption);

        // Create and append player names dynamically
        players.forEach((player) => {
            const option = document.createElement("option");
            option.value = player;
            option.text = player;
            document.getElementById('playerSelect').appendChild(option);
        });

        document.getElementById('consoleNameListID').addEventListener('change', function(e) {
            let newCaptain = e.target.value;
            socket.emit('captainChange', newCaptain);
            console.log("There's a new captain in town:", newCaptain)
        });

    });


}


stage0();

///////////////////////////////////// STAGE 0 -- Entry ////////////////////////////////////////
function stage0() {
    
    typeText("Excellent, you found me. What is the secret codeword?",0,50,);

    document.getElementById('formID').style.display='block';

    document.getElementById('formID').addEventListener('submit', teamSubmit);

    function teamSubmit(e) {
        e.preventDefault();
        passcode = document.getElementById('answerID').value.toLowerCase();
        if (passcode === 'console') { // so Steve can control some of the game
            consoleStart();
        } else {
        socket.emit('passcodeSubmitted', passcode);
        console.log("passcode emitted: " + passcode);
        }
    };

    socket.on('wrongCode', () => {
        document.getElementById("textID").textContent = "";
        typeText("That isn't the right code... Are you trying to hack?",0,50,);
        document.getElementById('answerID').value = ''; 
    });

    socket.on('rightCode', (playerNames, player1) => {
        console.log('rightCode, playerNames: ' + playerNames);

        captain = player1;

        document.getElementById("textID").textContent = "";
        document.getElementById('formID').style.display='none';
        document.getElementById('nameListID').style.display='block';
        document.getElementById('playerSelect').innerHTML = "";
        typeText("Select your name.",0,50,);

        // Add "Name:" as the first option
        const nameOption = document.createElement('option');
        nameOption.value = ''; // Empty value
        nameOption.text = 'Name:';
        nameOption.selected = true; // Make it the default
        nameOption.disabled = true;  // Make it unselectable
        document.getElementById('playerSelect').appendChild(nameOption);

        // Create and append player names dynamically
        playerNames.forEach((player) => {
            const option = document.createElement("option");
            option.value = player;
            option.text = player;
            document.getElementById('playerSelect').appendChild(option);
        });

        // get the captain so we can use it later
        player1 = playerNames[0];

        document.getElementById('playerSelect').addEventListener('change', nameSubmit);
    });

    function nameSubmit(e) {
        playerName = e.target.value;
        document.getElementById('nameListID').style.display='none';
        socket.emit('getStarted', passcode, playerName);
        console.log("entry emitted: ", passcode, playerName);
    };

    socket.on('startingStage', startingStage => {
        console.log('Received starting stage:', startingStage);
        document.getElementById('formID').removeEventListener('submit', teamSubmit);
        
        document.getElementById('playerSelect').removeEventListener('submit', nameSubmit);
        document.getElementById('nameListID').style.display='none';
        

        // Call the corresponding function based on the starting stage.
        switch (startingStage) {
            case 'stage0':
                stage1(); // move to start
                break;
            case 'stage1':
                stage1();
                break;
            case 'stage2':
                stage2();
                break;
            case 'stage3':
                stage3();
                break;
            case 'stage4':
                stage4();
                break;
            case 'stage5':
                stage5();
                break;
            case 'stage6':
                stage6();
                break;
            case 'stage7':
                stage7();
                break;
            default:
                stage8();
        }
    });
}


///////////////////////////////////// STAGE 1 -- Trust Test ////////////////////////////////////////

const button = document.getElementById("buttonID");
const logContainer = document.getElementById("logID");

function stage1() {
    console.log("entered stage1")
    document.getElementById("textID").textContent = "";
    typeText("By the way, if you ever need to reset, you can refresh or go back to the original URL and put your code in again. It will take you to where you were.",0,50, () => continueOn(startStage1));

    function startStage1 () {
        document.getElementById("textID").textContent = "";
        typeText("My name is Frank. Orion hired my security firm, and we've got a problem. We have reason to believe that one of your colleagues is about to sell valuable company secrets to a competitor.",0,50, () => continueOn(trustSpeech)); // custom -- company name

        function trustSpeech () {
            typeText("Before I solicit your help, I need to know I can trust you to do your jobs.",0,50, () => continueOn(setUpButton));

            function setUpButton () {
                socket.emit('getAction', playerName);

                socket.on('buttonAction', (data) => {
                    // Update UI based on the assigned action
                    button.style.display="block";
                    button.textContent = data.action;
                    button.style.backgroundColor = data.color;
                    logContainer.style.display="block";

                    document.getElementById("textID").textContent = "";
                    typeText("You have been assigned a specific button action. Can your team click their buttons correctly during the countdown?",0,50, () => continueOn(setUpButton));

                    
                    // Add event listener for button click/touch
                    button.addEventListener("click", function() {
                        console.log("button clicked")
                        socket.emit('buttonPress', playerName);
                    });
                
                    // Start timer and enable button only when 'startTimer' event is received from the server (see server-side code)
                    socket.on('startTimer', () => {
                      startTimer(10); // 10-second countdown function
                      button.disabled = false; // Enable the button
                    });
                
                    // ... other event handlers for 'timesUp' and button disabling ...
                  });
            }

        }

        typeText(message,0,50,);


        button.addEventListener("click", function() {
          console.log("button clicked")
          socket.emit('buttonPress', passcode, playerName);
        });
    }




}


socket.on("newLog", (newLog) => {
  // Create a new line element
  const newLine = document.createElement("p");
  newLine.textContent = newLog;

  // Append the new line to the container
  logContainer.appendChild(newLine);
});







// Change image source
const myImage = document.getElementById("imageID");

function changeImage(newSrc) {    
    const myImage = document.getElementById("imageID");

    // Remove 'active' if present 
    myImage.classList.remove('active');

    // Fade out the current image (rest of the transition logic remains the same)
    myImage.classList.add('fade-in-out');

    // Once fade-out is complete, update src and fade in
    myImage.addEventListener('transitionend', function() {
        myImage.src = newSrc; 
        myImage.classList.add('active'); // Trigger fade-in
    }, { once: true }); 
}


