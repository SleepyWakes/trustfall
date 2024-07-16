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
let inConsole = false;


function continueOn(nextFunction) {
    console.log("in continueOn")
    document.getElementById("continueButtonDiv").style.display="block";
    document.getElementById('continueButtonID').addEventListener('click', function(e) {
        this.removeEventListener('click', arguments.callee); // Remove the listener 
        document.getElementById("continueButtonDiv").style.display="none";
        document.getElementById("textID").textContent = "";
        nextFunction();
    });
}

//////////////// CONSOLE ////////////////////
function consoleStart() {
    console.log("in consoleStart")
    inConsole = true;
    document.getElementById("formID").style.display="none";
    document.getElementById("topID").style.display="none";
    document.getElementById("consoleID").style.display="block";
    document.getElementById("consoleNameListID").style.display="block";

    socket.on('playersToConsole', (players, player1) => {
        console.log("received players in playersToConsole", players, player1)

        // Clear existing options before appending new ones
        document.getElementById('consolePlayerSelect').innerHTML = ""; 

        const nameOption = document.createElement('option');
        nameOption.value = ''; // Empty value
        player1.selected = true; // Make it the default
        nameOption.disabled = true;  // Make it unselectable
        document.getElementById('consolePlayerSelect').appendChild(nameOption);

        // Create and append player names dynamically
        players.forEach((player) => {
            const option = document.createElement("option");
            option.value = player;
            option.text = player;
            document.getElementById('consolePlayerSelect').appendChild(option);
        });

        document.getElementById('consolePlayerSelect').addEventListener('change', function(e) {
            let newCaptain = e.target.value;
            socket.emit('captainChange', newCaptain);
            console.log("There's a new captain in town:", newCaptain)
        });

    });

    document.getElementById('consoleFormID').addEventListener('submit', consoleSubmit);

    function consoleSubmit(e) {
        e.preventDefault();
        consoleAnswer = document.getElementById('consoleAnswerID').value.toLowerCase();
        document.getElementById('consoleAnswerID').value = '';
        if (consoleAnswer === 'reset buttons') {
            socket.emit('resetStage1FromConsole');
            console.log("Resetting Buttons")
        } else if (consoleAnswer === 'xxx')  {
        
        }
    };

}


stage0();

///////////////////////////////////// STAGE 0 -- Entry ////////////////////////////////////////
function stage0() {
    
    typeText("Excellent, you made contact. What is the secret codeword?",0,50,);
    document.getElementById('formID').style.display='inline';
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
        document.getElementById('answerID').value = '';
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
        // get the default captain so we can use it later
        captain = player1;
        document.getElementById('playerSelect').addEventListener('change', nameSubmit);
    });
    function nameSubmit(e) {
        playerName = e.target.value;
        document.getElementById('nameListID').style.display='none';
        document.getElementById("textID").textContent = "";
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
                endStage0(); // continue because they just got initialized
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
    function endStage0() {
        document.getElementById("textID").textContent = "";
        typeText("By the way, if you ever need to reset, you can refresh or go back to trustfall.games and put your code in again. It will take you to where you were.",0,50, () => continueOn(prepStage1));
    
        function prepStage1 () {
            typeText("My name is Frank. Orion hired my security firm, and we've got a problem. We have reason to believe that one of your colleagues is about to sell valuable company information to a competitor. And we have to keep this among just us so they don't know we're onto them.",0,50, () => continueOn(trustSpeech)); // custom -- company name
    
            function trustSpeech () {
                typeText("Before I solicit your help, I need to know I can trust you to do your jobs.",0,50, () => continueOn(stage1));
            }
        }
    }
}


///////////////////////////////////// STAGE 1 -- Trust Test ////////////////////////////////////////

const logContainer = document.getElementById("logID");

function stage1() {
    socket.emit("saveStage", 'stage1', passcode);
    console.log("entered stage1")
    // Remove all event listeners from the buttons by cloning so I don't double-up
    document.getElementById("continueButtonID").replaceWith(document.getElementById("continueButtonID").cloneNode(true));

    socket.emit('getAction', playerName);

    socket.on("newLog", (newLog) => {
        
        // Create a new line element
        const newLine = document.createElement("p");
        newLine.textContent = newLog;
      
        // Append the new line to the container
        logContainer.appendChild(newLine);
    });

    socket.on('buttonAction', (data) => {
        console.log("in buttonAction")

        // remove the event listener in case things were reset
        document.getElementById("buttonID").replaceWith(document.getElementById("buttonID").cloneNode(true)); 

        // Update UI based on the assigned action
        document.getElementById("buttonDivID").style.display="block";
        document.getElementById("buttonID").disabled = true;
        document.getElementById("buttonID").textContent = data.action;
        document.getElementById("buttonID").style.backgroundColor = data.color;
        document.getElementById("logSectionID").style.display="block";
        logContainer.style.display="block";
        
        document.getElementById("textID").textContent = "";
        typeText("Each of you has been assigned a specific button. Can your team click all of the buttons correctly during the countdown?",0,50, () => continueOn(countdown));

    });

    function countdown () {
        // clear the event listener
        document.getElementById("buttonID").replaceWith(document.getElementById("buttonID").cloneNode(true));
        document.getElementById("textID").textContent = "";
        if (captain === playerName) {
            typeText("You're the current captain. When everyone is ready, click 'continue.'",0,50,startCounting);
            function startCounting () {
                console.log("in startCounting")
                document.getElementById("continueButtonDiv").style.display="block";
                document.getElementById('continueButtonID').addEventListener('click', function(e) {
                    this.removeEventListener('click', arguments.callee); // Remove the listener 
                    document.getElementById("continueButtonDiv").style.display="none";
                    document.getElementById("textID").textContent = "";
                    socket.emit('goTime', );
                });
            }
        } else {
            document.getElementById("textID").textContent = `waiting for ${captain}...`;
        }
    }

     socket.on("startTimer", () => {
        document.getElementById("textID").textContent = "";
        console.log("removed event listener")
        startTimer();
        document.getElementById("buttonID").disabled = false; // Enable the button
        console.log("added event listener")
        document.getElementById("buttonID").addEventListener("click", clickButton);
        function clickButton(){
            console.log("button clicked")
            socket.emit('buttonPress', playerName);
        }
    });

    // Timer function
    async function startTimer() {
        socket.emit('getPlayerCount', passcode); // Request player count from server
      
        socket.on('playerCount', (numPlayers) => { 
            console.log("numPlayers:", numPlayers);
            
            const duration = numPlayers * 2;
            let timer = duration;
            
            logContainer.textContent = "";
            document.getElementById("timerDivID").style.display = "block";
            document.getElementById("timerID").textContent = timer;
      
            const countdown = setInterval(() => {
                timer--;
                document.getElementById("timerID").textContent = timer;
            
                if (timer <= 0) {
                    clearInterval(countdown);

                    // Disable all buttons after time's up
                    document.getElementById("buttonID").disabled = true;

                    if (playerName === captain) {
                        console.log("triggered timesUp")
                        socket.emit("timesUp"); // Let the server know time's up, but just send it once (from captain)
                    }
                }
            }, 1000); // Update every second
        });
    }


    socket.on("roundResult", (success) => {
        if(success) {
            typeText("Well done, it seems I can trust you.",0,50, () => continueOn(pouch));
            document.getElementById("logSectionID").style.display="none";
            document.getElementById("timerDivID").style.display = "none";
            logContainer.style.display="none";
            logContainer.textContent="";
            document.getElementById("buttonDivID").style.display="none";
            
            function pouch(){
                typeText("You should have received a locked pouch. The combination to the lock is 164. Review the contents and then click 'continue' below.",0,50, () => continueOn(stage2));
            }
            
        } else {
            typeText("Not quite. Try again.",0,50, () => continueOn(countdown));
        }
    });

    socket.on("restartStage1", () => { // I put this inside stage1 so console doesn't get it
        if (inConsole) {
            console.log("in console so not going to stage1")
        } else {
            console.log("going back to stage1 function per restartStage1")
            socket.emit('getAction', playerName);
        }
        
    });

}


///////////////////////////////////// STAGE 2 -- Meeting Notes ////////////////////////////////////////

function stage2 () {
    socket.emit("saveStage", 'stage2', passcode);
    typeText("These three employees are part of a diverse team that is involved in a secret company project called Project Trustfall. We believe one is a mole.",0,50, () => continueOn(meetings));
    
    function meetings(){
        typeText("We know that they often meet at this Chicken N Pickle to discuss the project. Your next task is to search the immediate area for any evidence that they may have left behind from their last meeting.",0,50, () => continueOn(search)); // custom -- text about where to search and also 'this location'
    }
    function search(){
        typeText("Type in any information you find that's interesting. Any clues that might help us with Joe's password?",0,50,);
        document.getElementById("formID").style.display="inline";
        document.getElementById('formID').addEventListener('submit', meetingNotes);

        function meetingNotes(e) {
            e.preventDefault();
            document.getElementById("textID").textContent = "";
            answer = document.getElementById('answerID').value.toLowerCase();
            document.getElementById('answerID').value = '';

            if (answer === 'memory palace') { 
                document.getElementById("formID").style.display="none";
                document.getElementById('formID').removeEventListener('submit', meetingNotes);
                socket.emit('interestingInfo', playerName);
            } else {
                typeText("Hmm, I can't help with that. Anything else?",0,50,);
            }
        }
            
        socket.on('memoryPalace', (playerName) => {
            document.getElementById('formID').removeEventListener('submit', meetingNotes); // remove this again to make sure people who got dragged up have it removed
            document.getElementById("textID").textContent = "";
            console.log("playerName: ", playerName)
            typeText(playerName + " typed in memory palace. Oh! I know that Joe uses memory tricks. A memory palace is where people translate numbers into stories to remember the numbers.",0,50, () => continueOn(stage3)); 
        });
    } 
}


///////////////////////////////////// STAGE 3 -- Joe's Memory Palace ////////////////////////////////////////

function stage3 () {
    socket.emit("saveStage", 'stage3', passcode);

    typeText("I have Joe's account login pulled up. And it says, 'Bartender's coasters' below it. Maybe that's a clue about the images he uses for his memory palace.",0,50, () => continueOn(memoryPalace3)); // custom - where the coasters are located
    
    function memoryPalace3() {
        typeText("Here's how a memory palace works. Each image can be abbreviated into two letters, and those letters have number equivalents. Here's what I know of a common translation system.",0,50, () => continueOn(translator)); 
    }
    function translator() {
        const logContainer = document.getElementById("logID");
        const textLines = [
            "0=J",
            "1=A",
            "2=B",
            "3=C",
            "4=D",
            "5=F",
            "6=S",
            "7=L",
            "8=R",
            "9=N"
        ];

        document.getElementById("logSectionID").style.display="block";
        logContainer.style.display="block";
        logContainer.classList.add("text-center");
        document.getElementById("logID").textContent = "Each image represents 2 letters.";
        textLines.forEach(line => {
            const pElement = document.createElement("h1"); // Create an <h1> element for each line
            pElement.textContent = line;
            logContainer.appendChild(pElement);  // Append each line to the container
        });

        typeText("Let me know if you figure out the 6-letter code and I'll try to log in and see if we can get more intel on Joe. Just one person needs to type it in.",0,50,); 
        document.getElementById("formID").style.display="inline";
        document.getElementById('formID').addEventListener('submit', numberCode);
        function numberCode(e) {
            e.preventDefault();
            document.getElementById("textID").textContent = "";
            answer = document.getElementById('answerID').value;
            document.getElementById('answerID').value = '';
            if (answer === 'betray') {
                document.getElementById('formID').removeEventListener('submit', numberCode);
                document.getElementById("logSectionID").style.display="none";
                socket.emit('memoryPalaceCorrect', playerName);
                console.log("solved Palace")
            } else {
                typeText("That didn't work, let's try again.",0,50,);
            }
        }
    }

    socket.on("emitPalaceSolved", (solver) => {
        document.getElementById("textID").textContent = "";
        document.getElementById("logSectionID").style.display="none";
        document.getElementById("formID").style.display="none";
        document.getElementById("logID").textContent = "";
        typeText("Excellent work, I'm in! " + solver + " sent the right code. Okay, I see the security schema Joe created to protect the project files. Here's a picture of it.",0,50, () => continueOn(schema)); 
        function schema () {
            typeText("Interesting. If someone knew all of the passwords, they could get the codewords and then would only need the triangulator code to access ALL of the data. We should write down Joe's password in case we need it later. And check out the Notes.",0,50, () => continueOn(ontoStage4)); 
            document.getElementById("imageDivID").style.display="block";
            document.getElementById("imageID").src="/assets/img/schema.png";
        }
        function ontoStage4 () {
            typeText("Anyway, let's move on and investigate Lizzie....",0,50, () => continueOn(stage4)); 
            document.getElementById("imageDivID").style.display="none";
            document.getElementById("imageID").src="";
        }
    });

}

///////////////////////////////////// STAGE 4 -- Lizzie's Instagram ////////////////////////////////////////

function stage4() {
    console.log("in stage4")
    socket.emit("saveStage", 'stage4', passcode);
    typeText("Not sure what to do next, except maybe check out Lizzie on social media? I think she has an Instagram account.",0,50, () => continueOn(insta));

    function insta() {
        typeText("Let me know if you figure out her password and I'll type it into her account login. Maybe there's some evidence in there.",0,50,);
        document.getElementById("formID").style.display="inline";
        document.getElementById('formID').addEventListener('submit', lizzieCode);
    }
    function lizzieCode(e) {
        e.preventDefault();
        document.getElementById("textID").textContent = "";
        answer = document.getElementById('answerID').value.toLowerCase();
        document.getElementById('answerID').value = '';
        if (answer === 'backstab') {
            document.getElementById('formID').removeEventListener('submit', lizzieCode);
            socket.emit('lizzieCorrect', playerName);
            console.log("solved Lizzie")
        } else {
            typeText("That didn't work, let's try again.",0,50,);
        }
    }

}

socket.on("emitLizzieSolved", (solver) => {
    console.log("in emitLizzieSolved")
    document.getElementById("textID").textContent = "";
    document.getElementById("logSectionID").style.display="none";
    document.getElementById("formID").style.display="none";
    document.getElementById("logID").textContent = "";
    typeText("Excellent work, I'm into her account. " + solver + " sent the right password. Some project files here, but nothing that shows Lizzie is the mole.",0,50, () => continueOn(lizzie1)); 
    function lizzie1 () {
        typeText("There is a note in here written on a napkin....",0,50, () => continueOn(ontoStage5)); 
        document.getElementById("imageDivID").style.display="block";
        document.getElementById("imageID").src="/assets/img/napkin.png";
    }
    function ontoStage5 () {
        document.getElementById("imageDivID").style.display="none";
        typeText("Okay, let's move on and check out Cynthia....",0,50, () => continueOn(stage5)); 

    }
});


///////////////////////////////////// STAGE 5 -- Cynthia's Phone ////////////////////////////////////////

function stage5() {
    console.log("in stage5")
    socket.emit("saveStage", 'stage5', passcode);
    typeText("I have no ideas, but Lizzie's napkin said there's a phone number, so if you figure that out put it into this phone:",0,50, () => continueOn(phone));

    function phone() {
        document.getElementById("phoneID").style.display="block";
        const phoneDisplay = document.getElementById("phoneDisplayID");
        const correctCode = "7138675309"; // customize -- change to local area code
        
        let enteredCode = "";
        
        // Array of audio file paths
        const audioFiles = [
            "/assets/sounds/audio1.m4a",
            "/assets/sounds/audio2.m4a",
            "/assets/sounds/audio3.m4a",
            "/assets/sounds/audio4.m4a",
            "/assets/sounds/audio5.m4a",
        ];

        function playRandomAudio() {
            // Get a random index within the array's length
            const randomIndex = Math.floor(Math.random() * audioFiles.length);
            
            // Select the random audio file
            const audioFile = audioFiles[randomIndex];
            
            // Create the audio element and play it
            const audio = new Audio(audioFile);
            audio.play();
        }

        const buttons = document.querySelectorAll("#phoneID button"); // Define buttons here
  
        buttons.forEach(button => {
          button.addEventListener("click", handleButtonClick);
        });

        let codeAlreadyEntered = false;

        function handleButtonClick() {
            const value = this.dataset.value; // 'this' refers to the clicked button
            
            if (this.id === "backButtonID") {
              enteredCode = enteredCode.slice(0, -1);
            } else if (this.id === "callButtonID") {
              
                if (enteredCode === correctCode) {
                    playRandomAudio();
                    if (!codeAlreadyEntered) {
                        codeAlreadyEntered = true;
                        document.getElementById("textID").textContent = "";
                        setTimeout(() => {
                            typeText("Sounds like some pre-recorded messages, turn up your volume if you couldn't hear it. Now if your team can figure out the answer after listening to the riddles, let me know.",0,50,);
                            document.getElementById("formID").style.display="inline";
                            document.getElementById('formID').addEventListener('submit', phoneNumber);
                        }, 5000);
                    }
                                        
                    function phoneNumber(e) {
                        e.preventDefault();
                        answer = document.getElementById('answerID').value.toLowerCase();
                        document.getElementById('answerID').value = '';
                        if (answer === 'counter') {
                            document.getElementById("phoneID").style.display="none";
                            document.getElementById('formID').removeEventListener('submit', phoneNumber);
                            socket.emit('cynthiaCorrect', playerName);
                            console.log("solved Cynthia")
                        } else {
                            typeText("That didn't work, let's try again.",0,50,);
                        }
                    }
                } else {
                    document.getElementById('phoneMessageID').textContent = "INVALID NUMBER";
                    setTimeout(() => {
                        enteredCode = "";
                        phoneDisplay.textContent = " "; // put a space in there so it doesn't disappear when no content is in it
                        document.getElementById('phoneMessageID').textContent = " ";
                    }, 1500); // Clear after 1.5 seconds
                }
            } else {
                if (enteredCode.length < 10) { 
                    enteredCode += value;
                }
            }
            // Format the display
            phoneDisplay.textContent = formatPhoneNumber(enteredCode); 
        
            // Disable Call button if less than 10 digits
            document.getElementById("callButtonID").disabled = enteredCode.length < 10;
        }
        
        function formatPhoneNumber(number) {
          if (number.length <= 3) return number;
          if (number.length <= 6) return number.slice(0, 3) + "-" + number.slice(3);
          return number.slice(0, 3) + "-" + number.slice(3, 6) + "-" + number.slice(6);
        }
    }


    socket.on("emitCynthiaSolved", (solver) => {
        console.log("in emitCynthiaSolved")
        document.getElementById("textID").textContent = "";
        document.getElementById("phoneID").style.display="none";
        document.getElementById("logSectionID").style.display="none";
        document.getElementById("formID").style.display="none";

        typeText("Excellent, I'm into her account. " + solver + " sent the right password. Mostly administrative project files here, no clear evidence of Cynthia being the mole. Other than Joe's earlier note about her reading others' emails.",0,50, () => continueOn(cynthia1)); 
        function cynthia1 () {
            document.getElementById("imageDivID").style.display="none";
            typeText("Okay, let's move on....",0,50, () => continueOn(stage6));     
        }
    });
    

}

///////////////////////////////////// STAGE 6 -- Triangulator ////////////////////////////////////////

function stage6() {
    console.log("in stage6")
    socket.emit("saveStage", 'stage6', passcode);
    typeText("Well, we have all of their passwords, but I think we need to use that triangulator code to see all of the files.",0,50, () => continueOn(triangulator1));
    
    function triangulator1 () {
        document.getElementById("textID").textContent = "";
        typeText("Let me pull up Joe's security schema image again. Anything you see here?",0,50, () => continueOn(triangulator2));
    }

    function triangulator2 () {
        document.getElementById("imageDivID").style.display="block";
        document.getElementById("imageID").src="/assets/img/schema.png";
        document.getElementById("svgID").style.display="block";
        document.getElementById("formID").style.display="inline";

        document.getElementById("svgID").addEventListener("click", () => {
            document.getElementById("imageID").src="/assets/img/schema2.png";
            //// have it make a sound here?
        });


        document.getElementById('formID').addEventListener('submit', newSchema);
        function newSchema(e) {
            e.preventDefault();
            document.getElementById("textID").textContent = "";
            answer = document.getElementById('answerID').value.toLowerCase();
            document.getElementById('answerID').value = '';
            if (answer === 'bananagrams') {
                document.getElementById('formID').removeEventListener('submit', newSchema);
                stage7();
                socket.emit('bananagramsCorrect', playerName);
                console.log("solved bananagrams")
            } else {
                typeText("I don't know about that, anything else?",0,50,);
            }
        }
    }

    socket.on("emitBananagramsSolved", (solver) => {
        document.getElementById("textID").textContent = "";
        document.getElementById("phoneID").style.display="none";
        document.getElementById("formID").style.display="none";
        document.getElementById("imageDivID").style.display="none";
    
        typeText("Hmm, " + solver + " typed Bananagrams? That's the word game in a banana pouch. Do you see it around? You may have to go searching. At this point, I'll let you go looking until you find the Triangulator.",0,50, () => continueOn(stage7)); 

    });

}
///////////////////////////////////// STAGE 7 -- Finish ////////////////////////////////////////

function stage7() {
    console.log("in stage7")
    socket.emit("saveStage", 'stage7', passcode);

    document.getElementById("textID").textContent = "";
    typeText("Excellent. Before I get into the system and figure out who the mole is, who do you think it is?",0,50,mole); 
    
    function mole () {
        document.getElementById("formID").style.display="block";
        document.getElementById('formID').addEventListener('submit', moleAnswer);
        function moleAnswer (e) {
            e.preventDefault();
            document.getElementById('formID').removeEventListener('submit', moleAnswer);
            document.getElementById("formID").style.display="none";
            const mole = document.getElementById('answerID').value;
            socket.emit('moleVote', passcode, playerName, mole);
            
            document.getElementById('textID').textContent = '';
            typeText("I need some time, why don't you all go play some pickleball or something....",0,50,); // customize 
        }
    }
}
