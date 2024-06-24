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
    startTime: Date,
    stage0: Date,
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
    feedback: String
    }
);

const Game = mongoose.model('Game', gameSchema);

let captain;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/index.html');
  });

io.on('connection', (socket) => {

  socket.on('passcodeSubmitted', async ( passcode ) => {
    console.log('Received passcode:', passcode);

    const existingTeam = await Game.findOne({ passcode });
    console.log('existingTeam:', existingTeam);

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


  // Listen for the 'getStarted' event from the client
  socket.on('getStarted', async ( passcode, playerName ) => {
    console.log('Received passcode in getStarted:', passcode, playerName);

    try {
      const existingTeam = await Game.findOne({ passcode });
      console.log('existingTeam:', existingTeam);
  
      if (existingTeam && existingTeam.stage0 !== undefined) {
        console.log('Existing team found and they have already started');
  
        let startingStage = 'stage0';

        // Determine the correct starting stage based on the first non-zero
        if (existingTeam.stage1 === 0) {
          startingStage = 'stage0';
        } else if (existingTeam.stage2 === 0) {
          startingStage = 'stage1';
        } else if (existingTeam.stage3 === 0) {
          startingStage = 'stage2';
        } else if (existingTeam.stage4 === 0) {
          startingStage = 'stage3';
        } else if (existingTeam.stage5 === 0) {
          startingStage = 'stage4';
        } else if (existingTeam.stage6 === 0) {
          startingStage = 'stage5';
        } else if (existingTeam.stage7 === 0) {
          startingStage = 'stage6';
        } else {
          startingStage = 'stage0';
        }

        console.log("startingStage: " + startingStage)
        
        socket.emit('startingStage', startingStage);
               
      } else {
        console.log('Stage0 not found, initializing the game');

        const updatedGame = await Game.findOneAndUpdate(
          { passcode }, // Filter to find the record with the matching passcode
          {
            startTime: Date.now(),
            stage0: 0,
            stage1: 0,
            stage2: 0,
            stage3: 0,
            stage4: 0,
            stage5: 0,
            stage6: 0,
            stage7: 0
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




  /////////////////////////////// STAGE 1 ///////////////////////////////

  // Store assigned actions
  let assignedActions = [];
  let nextActionIndex = 0;

  const actions = [
    { Action: "Push your button first", Color: "red" },
    { Action: "Push your button last", Color: "red" },
    { Action: "Push your button", Color: "blue" },
    { Action: "Push your button after blue", Color: "red" },
    { Action: "Push your button before yellow", Color: "red" },
    { Action: "Push your button 3 times", Color: "yellow" },
    { Action: "Don't push your button", Color: "red" },
    { Action: "Push your button twice", Color: "red" },
    { Action: "Push your button", Color: "red" },
    { Action: "Don't push your button", Color: "red" },
    { Action: "Push your button", Color: "red" },
    { Action: "Don't push your button", Color: "red" }
  ];

  socket.on("getAction", async (playerName) => {
    try {
      // Get the next available action or default to "Don't push your button"
      let actionIndex = nextActionIndex;
      let action = actions[actionIndex] || { Action: "Don't push your button", Color: "red" };

      // Mark the action as assigned (if it wasn't the default)
      if (actionIndex < actions.length) {
        assignedActions.push(actionIndex);
        nextActionIndex = (actionIndex + 1) % actions.length; // Cycle through actions
      }

      // Send the action and its color to the client
      socket.emit("buttonAction", {
        action: action.Action,
        color: action.Color
      });
    } catch (error) {
      console.error("Error getting or assigning action:", error);
      // Handle the error (e.g., send an error message to the client)
    }
  });



  socket.on('buttonPress', async ( playerName ) => {
  
    // if ()
    // let phrase = ; 
    socket.emit('newLog', phrase);
  });
  


});

// -------------------------------------------

// note this used to be app.listen but with socket added server to remove an error
server.listen(8083, function(){
    console.log("server started on port 8083");
});