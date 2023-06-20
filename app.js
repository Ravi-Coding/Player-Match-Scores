const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDbObjectToResponsiveObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponsiveObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Returns a list of all the players in the player table(API 1)

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT 
    * 
    FROM 
    player_details;`;

  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponsiveObject(eachPlayer)
    )
  );
});

// Returns a specific player based on the player ID (API 2)

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    
    SELECT 
    *
    FROM 
    player_details
    WHERE
    player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponsiveObject(player));
});

// Updates the details of a specific player based on the player ID (API 3)

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
    player_details 
    SET 
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// Returns the match details of a specific match (API 4)
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT 
    *
    FROM 
    match_details 
    WHERE
    match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertMatchDetailsDbObjectToResponsiveObject(matchDetails));
});

// Returns a list of all the matches of a player (API 5)

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
    * 
    FROM 
    player_match_score 
      NATURAL JOIN match_details 
    WHERE 
    player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponsiveObject(eachMatch)
    )
  );
});

// Returns a list of players of a specific match (API 6)
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT 
    * 
    FROM 
    player_match_score 
    NATURAL JOIN player_details 
    WHERE 
    match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponsiveObject(eachPlayer)
    )
  );
});

// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID (API 7)
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM 
    player_match_score
    NATURAL JOIN player_details 
    WHERE 
    player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
