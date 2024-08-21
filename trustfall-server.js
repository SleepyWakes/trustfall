import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();

// this is for socket.io
import http from 'http';
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json()); // enables JSON parsing
// app.set('view engine', 'ejs');

 //this gets the paths correct for finding things like css/styles.css. __dirname doesn't work with import now, so I had to add all of this other stuff
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname + '/'));

// this is the path for local testing
// mongoose.connect("mongodb://localhost:27017/ThunderDB/", { useNewUrlParser: true});
// this is the path for live
mongoose.connect("mongodb+srv://overlord:mt5E%23c4b@serverlessinstance0.geujl.mongodb.net/Trustfall", { useNewUrlParser: true});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

//build the game collection schema
const gameSchema = new mongoose.Schema ({
  passcode: String,
  players: [String],
  stage1: Date,
  stage2: Date,
  stage3: Date,
  stage4: Date,
  stage5: Date,
  stage6: Date,
  stage7: Date,
  endingTime: Date,
  survey1: Number,
  survey2: Number,
  survey3: Number,
  moleVotes: [{ playerName: String, vote: String }]
});

const Game = mongoose.model('Game', gameSchema);

let captain;

// stage1 button assigment variables
let assignedActions = [];
let playerActions = {};
let nextActionIndex = 0;
let buttonPressOrder = [];



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/index.html');
  });

io.on('connection', (socket) => {

  socket.on('passcodeSubmitted', async ( passcode ) => {
    console.log('Received passcode:', passcode);

    const existingTeam = await Game.findOne({ passcode });

    if (existingTeam) {
      console.log('Team found, players:' + existingTeam.players);
      let player1 = existingTeam.players[0]; // set the first player as the captain for default purposes
      captain = player1;
      socket.emit('rightCode', existingTeam.players, player1);
      io.emit('playersToConsole', existingTeam.players, player1); // send the players to the console
    } else {
      console.log('Team not found:');
      socket.emit('wrongCode', );
    }
  });

  socket.on('captainChange', async ( newCaptain ) => {
    console.log('Captain Changed:', newCaptain)
    captain = newCaptain;
    io.emit('newCaptain', newCaptain); 
  });


  // Listen for the 'getStarted' event from the client
  socket.on('getStarted', async ( passcode, playerName ) => {
    console.log('Received passcode in getStarted:', passcode, playerName);

    try {
      const existingTeam = await Game.findOne({ passcode });
      console.log('existingTeam:', existingTeam);
  
      if (existingTeam && existingTeam.stage1 !== undefined) {
        console.log('Existing team found and they have already started');
  
        let startingStage = 'stage';

        // Determine the correct starting stage based on the first non-zero (stages get saved when they start)
        if (!existingTeam.stage1) {
          startingStage = 'stage0';
        } else if (!existingTeam.stage2) {
          startingStage = 'stage1';
        } else if (!existingTeam.stage3) {
          startingStage = 'stage2';
        } else if (!existingTeam.stage4) {
          startingStage = 'stage3';
        } else if (!existingTeam.stage5) {
          startingStage = 'stage4';
        } else if (!existingTeam.stage6) {
          startingStage = 'stage5';
        } else if (!existingTeam.stage7) {
          startingStage = 'stage6';
        } else {
          startingStage = 'stage7';
        }

        console.log("startingStage: " + startingStage)
        
        socket.emit('startingStage', startingStage);
               
      } else {
        console.log('Stage1 not found, initializing the game');

        let actions = [
          { Action: "Push your button 3 times", Color: "yellow" },
          { Action: "Push your button", Color: "blue" },
          { Action: "Push your button first", Color: "red" },
          { Action: "Push your button last", Color: "red" },
          { Action: "Push your button after blue", Color: "red" },
          { Action: "Push your button before yellow", Color: "red" },
          { Action: "Don't push your button", Color: "red" },
          { Action: "Push your button twice", Color: "red" },
          { Action: "Push your button", Color: "red" },
          { Action: "Don't push your button", Color: "red" },
          { Action: "Push your button", Color: "red" },
          { Action: "Don't push your button", Color: "red" }
        ];

        // Shuffle the actions array to randomize assignments
        for (let i = actions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [actions[i], actions[j]] = [actions[j], actions[i]];
        }

        // Assign actions to players
        const playerActions = {};
        for (let i = 0; i < existingTeam.players.length; i++) {
            playerActions[existingTeam.players[i]] = actions[i];
        }

        console.log("playerActions " + playerActions)

        const updatedGame = await Game.findOneAndUpdate(
          { passcode }, // Filter to find the record with the matching passcode
          { 
            stage1: Date.now(),
            playerActions: playerActions // Add the playerActions object to the document
          },
          { upsert: true, new: true }
        );

        console.log('Record saved successfully:', updatedGame);

        socket.emit('startingStage', 'stage0' );
      
      }
    } catch (error) {
      console.error('Error saving record:', error);
    }
  });

  socket.on('getPlayerCount', async (passcode) => {
  try {
    const gameData = await Game.findOne({ passcode });
    const numPlayers = gameData ? gameData.players.length : 0; // Handle case where gameData might be null
    socket.emit('playerCount', numPlayers); // Send the player count back to the client
  } catch (error) {
    console.error("Error fetching player count:", error);
    socket.emit('playerCountError'); // Or send an error message if needed
  }
});

  socket.on("saveStage", async (stageName, passcode) => {
    try {
      const existingTeam = await Game.findOne({ passcode });
      const existingStageTime = existingTeam[stageName];
  
      if (existingStageTime && existingStageTime.getTime() !== 0) {
        // Stage is already completed, do not update
        console.log(`Stage ${stageName} already saved, skipping update`);
        return;
      }

      const update = {};
      update[stageName] = Date.now(); // Dynamically create the update object

      const updatedGame = await Game.findOneAndUpdate(
        { passcode },  // Find the game by passcode
        { $set: update }, // Update the specific stage field
        { new: true }     // Return the updated document
      );

      if (!updatedGame) {
        throw new Error("Game not found for the given passcode");
      }

      console.log(`Stage ${stageName} saved`);
    } catch (error) {
      console.error("Error saving stage:", error);
      socket.emit("stageSaveError", stageName, error.message);
    }
  });

  /////////////////////////////// STAGE 1 ///////////////////////////////

  socket.on("getAction", async (playerName, passcode) => {
    console.log("in getAction, passcode:" + passcode);
    try {
        // Fetch the game data from the database based on some identifier (e.g., passcode)
        const game = await Game.findOne({ passcode });

        if (!game || !game.playerActions) {
            throw new Error("Game or player actions not found");
        }

        // Retrieve the action assigned to the player
        const action = game.playerActions.get(playerName);

        if (!action) {
            throw new Error("Action not found for player");
        }

        // Send the action and its color to the client
        socket.emit("buttonAction", {
            action: action.Action,
            color: action.Color
        });

        console.log("playerActions", game.playerActions); // Log the entire playerActions map

    } catch (error) {
        console.error("Error getting or assigning action:", error);
        // Handle the error (e.g., send an error message to the client)
    }
});
  
  socket.on('goTime', async () => {
    console.log("in goTime")
    buttonPressOrder = []; // Clear the button press order array for a new round
    io.emit('startTimer', ); // start everyone's timer
  });

  socket.on('buttonPress', async ( playerName ) => {
    console.log("inside buttonPress")
    let phrase = `${playerName} pushed their button`; 
    io.emit('newLog', phrase); // send the button press info to everyone

    // Store the button press in the order array
    buttonPressOrder.push({ playerName, timestamp: Date.now() }); // Include timestamp for precise ordering
    console.log("buttonPressOrder: ", buttonPressOrder)
  });

  socket.on("timesUp", async () => {
    console.log("in timesUp")
    // Evaluate the button press order
    const isCorrectOrder = evaluateButtonPressOrder(buttonPressOrder, playerActions, actions);

    // Emit the result to all clients
    io.emit("roundResult", isCorrectOrder);

    function evaluateButtonPressOrder(buttonPressOrder, playerActions, actions) {
      // Filter button presses to include only those from players with assigned actions
      const relevantButtonPresses = buttonPressOrder.filter(press => playerActions.hasOwnProperty(press.playerName));

      for (const playerName in playerActions) {
        const actionIndex = playerActions[playerName];
        const action = actions[actionIndex];
    
        // Search within relevantButtonPresses
        const findPlayerIndex = (playerNameToFind) => relevantButtonPresses.findIndex(press => press.playerName === playerNameToFind);

        // 1. Push your button first
        if (action.Action === "Push your button first" && findPlayerIndex(playerName) !== 0) {
          return false;
        }

        // 2. Push your button last
        if (action.Action === "Push your button last" && findPlayerIndex(playerName) !== relevantButtonPresses.length - 1) {
          return false;
        }

        // 3. Push your button (simplified)
        if (action.Action === "Push your button") {
          const playerPresses = relevantButtonPresses.filter(press => press.playerName === playerName);
          if (playerPresses.length === 0) {
            return false;
          }
        }

        // 4. Push your button after blue
        if (action.Action === "Push your button after blue") {
          const blueIndex = relevantButtonPresses.findIndex(press => actions[playerActions[press.playerName]].Color === "blue");
          const playerIndex = findPlayerIndex(playerName);
          if (blueIndex === -1 || playerIndex <= blueIndex) {
            return false;
          }
        }

        // 5. Push your button before yellow
        if (action.Action === "Push your button before yellow") {
          const yellowIndex = relevantButtonPresses.findIndex(press => actions[playerActions[press.playerName]].Color === "yellow");
          const playerIndex = findPlayerIndex(playerName);
          if (yellowIndex === -1 || playerIndex >= yellowIndex) {
            return false;
          }
        }

        // 6. Push your button 3 times
        if (action.Action === "Push your button 3 times") {
          const playerPresses = relevantButtonPresses.filter(press => press.playerName === playerName);
          if (playerPresses.length !== 3) { 
            return false;
          }
        }

        // 7. Push your button twice (but not first or last)
        if (action.Action === "Push your button twice") {
          const playerPresses = relevantButtonPresses.filter(press => press.playerName === playerName);
          if (playerPresses.length !== 2 ||
              playerPresses[0] === relevantButtonPresses[0] ||
              playerPresses[playerPresses.length - 1] === relevantButtonPresses[relevantButtonPresses.length - 1]) {
            return false;
          }
        }

        // 8. Don't push your button
        if (action.Action === "Don't push your button" && relevantButtonPresses.some(press => press.playerName === playerName)) {
          return false;
        }
      }

      return true; // All actions were performed correctly
    }
    
  });

  ////////////////////////////////////// STAGE 2 /////////////////////////////////////

  socket.on('interestingInfo', async (playerName) => {
    io.emit('memoryPalace', playerName);
  });

  socket.on('memoryPalaceCorrect', async (playerName) => {
    io.emit('emitPalaceSolved', playerName);
  });


////////////////////////////////////// STAGE 4 /////////////////////////////////////

  socket.on('lizzieCorrect', async (playerName) => {
    console.log("in lizzieCorrect")
    io.emit('emitLizzieSolved', playerName);
  });



  // this is so the console can restart the button assignments if something goes weird
  socket.on("resetStage1FromConsole", async () => {
    console.log("resetStage1:", assignedActions, playerActions, buttonPressOrder)
    assignedActions = [];
    playerActions = {};
    nextActionIndex = 0;
    buttonPressOrder = [];
    console.log("after reset:", assignedActions, playerActions, buttonPressOrder)
    io.emit("restartStage1");
  });




  ////////////////////////////////////// STAGE 5 /////////////////////////////////////

  socket.on('cynthiaCorrect', async (playerName) => {
    console.log("in cynthiaCorrect")
    io.emit('emitCynthiaSolved', playerName);
  });


  ////////////////////////////////////// STAGE 6 /////////////////////////////////////

  socket.on('bananagramsCorrect', async (playerName) => {
    console.log("in bananagramsCorrect")
    io.emit('emitBananagramsSolved', playerName);
  });

  ////////////////////////////////////// STAGE 7 /////////////////////////////////////

  socket.on('finalCorrect', async (playerName) => {
    console.log("in finalCorrect")
    io.emit('emitFinalSolved', playerName);
  });

  socket.on("moleVote", async (passcode, playerName, moleVote) => {
    console.log("mole: " + moleVote)
    try {
      const existingTeam = await Game.findOne({ passcode });
      if (!existingTeam) {
        throw new Error("Game not found for the given passcode");
      }

      // Update the game document to store the mole vote
      existingTeam.moleVotes = existingTeam.moleVotes || {}; // Initialize if not present
      existingTeam.moleVotes[playerName] = moleVote;

      await Game.findOneAndUpdate(
        { passcode },
        { $push: { moleVotes: { playerName, vote: moleVote } } }
      );

      console.log(`Mole vote received from ${playerName}: ${moleVote}`);

    } catch (error) {
      console.error("Error saving mole vote:", error);
      // Handle the error (e.g., send an error message to the client)
    }
  });
});

// -------------------------------------------

// note this used to be app.listen but with socket added server to remove an error
server.listen(8083, function(){
    console.log("server started on port 8083");
});