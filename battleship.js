(function() {

//*****BEGIN AI OBJECT*****

	"use strict";


	/**
	 * BattleShip AI
	 *
	 * June 03, 2016
	 * Ryan Furness
	 *
	 *
	 *
	 */
	var LOGGING = "OFF"; //ON, OFF
	var ROWS = 10;
	var COLUMNS = 10;
	var GAME_MODE = "PLAY"; //PLAY, RANDOM, SIMPLE
	var TYPE_QUESTIONABLE = "Q";

	/**
	 * [constructor function for a CandidateAI object. A new instance of your AI is created for each game.]
	 * @param {Object} player [your player instance]
	 */
	function AI(player) {
		this.player = player;
		//Grid to hold the enemy state possibilities
		this.enemyGrid = new Grid();
		this.potentialShots = new PotentialShots();
	}


//POJO to hold an x,y coordinate
	function Shot(x, y, ship) {
		this.x = x;
		this.y = y;
		this.ship = ship;
	}

//Used to hold surrounding shots when a hit/ship is made and easily define ship attributes without tons of lookups etc...
	function PotentialShots() {
		this.probability = [];

		this.ships = {};
		this.ships.CARRIER = {
			fleet: 3,
			length: 5,
			identifier: "C",
			fleetType: Fleet.CARRIER,
			shots: [],
			probability: [],
			weight: 5
		};
		this.ships.BATTLESHIP = {
			fleet: 1,
			length: 4,
			identifier: "B",
			fleetType: Fleet.BATTLESHIP,
			shots: [],
			probability: [],
			weight: 4
		};
		this.ships.DESTROYER = {
			fleet: 2,
			length: 3,
			identifier: "D",
			fleetType: Fleet.DESTROYER,
			shots: [],
			probability: [],
			weight: 3
		};
		this.ships.SUBMARINE = {
			fleet: 3,
			length: 3,
			identifier: "S",
			fleetType: Fleet.SUBMARINE,
			shots: [],
			probability: [],
			weight: 3
		};
		this.ships.PATROLBOAT = {
			fleet: 4,
			length: 2,
			identifier: "P",
			fleetType: Fleet.PATROLBOAT,
			shots: [],
			probability: [],
			weight: 2
		};
	}


//Start the potential shots object with the clear total and clear every ship array
	PotentialShots.prototype.initialize = function () {
		this.clearTotalProbability();
		for (var shipKey in this.ships) {
			if (!this.ships.hasOwnProperty(shipKey)) continue;
			this.clearProbabilityForThisShip(shipKey);
		}
	};

//Clear the total array
	PotentialShots.prototype.clearTotalProbability = function () {
		for (var row = 0; row < ROWS; row++) {
			this.probability[row] = [];
			for (var column = 0; column < COLUMNS; column++) {
				this.probability[row].push({
					p: 0
				});
			}
		}
	};

//Clear this ships array
	PotentialShots.prototype.clearProbabilityForThisShip = function (shipKey) {
		var currentShip = this.ships[shipKey];
		for (var row = 0; row < ROWS; row++) {
			currentShip.probability[row] = [];
			for (var column = 0; column < COLUMNS; column++) {
				currentShip.probability[row].push({
					p: 0
				});
			}
		}
	};

	/**
	 * []
	 */
	AI.prototype.initializeSimulation = function () {

	};

	/**
	 * [initializes a CandidateAI instance.]
	 */
	AI.prototype.initializeGame = function () {
		var x = -1, y = 0;

		//Call Grid.initialize() and PotentialShots.initialize()
		this.enemyGrid.initialize();
		this.potentialShots.initialize();

		//Simple step to go to the next x,y coordinate +1 each time
		this.getNextCoord = function () {
			if (++x > 9) {
				x = 0;
				++y;
			}

			//IF the cell is empty then return it
			if (this.enemyGrid.cells[x][y].state === Cell.TYPE_EMPTY)
				return {
					x: x,
					y: y
				};
			else {
				//Get a new one
				return this.getNextCoord();
			}
		};

		//Get a random shot, if its been hit already get another by calling itself until a legit shot is found
		this.getRandomCoord = function () {
			var randomX = getRandomInt(0, ROWS);
			var randomy = getRandomInt(0, COLUMNS);

			//Verify that shot was not taken on our board already
			if (this.enemyGrid.cells[randomX][randomy].state === Cell.TYPE_EMPTY) {
				return {
					x: randomX,
					y: randomy
				};
			}
			else {
				return this.getRandomCoord();
			}
		};

		//Get the next most probably shot, make sure its a shot that is legit...
		this.getNextProbableCoord = function (depth) {

			//lets just make sure we dont go too deep...
			if (typeof depth == 'number') {
				depth++;
			}
			else {
				depth = 1;
			}

			//Limit this to oh, i dont know 100 tries?  that is the limit of the board...
			if (depth > 100) {
				return this.getRandomCoord();
			}

			//We want to attempt to hit the most probably location for a shot
			var biggestProbability = 0;
			var biggestShot = new Shot();

			for (var row = 0; row < ROWS; row++) { // move down
				for (var column = 0; column < COLUMNS; column++) { // move right
					var curEnemy = this.potentialShots.probability[row][column].p;
					if (!isNaN(curEnemy) && curEnemy > biggestProbability && (this.enemyGrid.cells[row][column].state === Cell.TYPE_EMPTY || this.enemyGrid.cells[row][column].state === TYPE_QUESTIONABLE)) {
						biggestProbability = curEnemy;
						biggestShot = new Shot(row, column);
					}
				}
			}
			var probableX = biggestShot.x;
			var probableY = biggestShot.y;

			try {
				//Verify that shot was not taken on our board already
				if (this.enemyGrid.cells[probableX][probableY] != undefined &&
					this.enemyGrid.cells[probableX][probableY].state != undefined &&
					this.enemyGrid.cells[probableX][probableY].state === Cell.TYPE_EMPTY) {
					return {
						x: probableX,
						y: probableY
					};
				}
				else {
					//RECURSION!!!!
					return this.getNextProbableCoord(depth);
				}
			} catch (e) {
				//failback
				return this.getRandomCoord();
			}
		};

		//Push the surrounding potentials to the 'stack'  this will get POPPED later LIFO
		this.addPotentialShotsForShip = function (potentialShip, x, y) {
			var enemyShip = undefined;
			var cell = undefined;

			//Pick all the surrounding cells of a shot to get the next shots
			//
			//    Q
			// Q  3  Q
			//    Q
			if (potentialShip.shots.length < 1) {
				//This has never been shot, so push them all
				this.pushShipShot(x + 1, y, potentialShip);
				this.pushShipShot(x - 1, y, potentialShip);
				this.pushShipShot(x, y + 1, potentialShip);
				this.pushShipShot(x, y - 1, potentialShip);

				//Update the enemy fleet with the shot that hit
				enemyShip = fleetFinderByShip(potentialShip.fleetType, this.enemyGrid.fleet);
				this.enemyGrid.cells[x][y].state = potentialShip.identifier;
				cell = new Cell();
				cell.setShip(enemyShip);
				cell.ship.location = {
					x: x,
					y: y,
					direction: null
				};
				cell.state = Cell.TYPE_SHIP;
				enemyShip.cells.push(cell);
			}
			else {
				//This was hit before so lets get direction and only push the shot in that direction
				var direction = Ship.HORIZONTAL;
				if (this.previousShipShot(x + 1, y, potentialShip.identifier)) {
					direction = Ship.VERTICAL;
					this.pushShipShot(x + 2, y, potentialShip);
					this.pushShipShot(x - 1, y, potentialShip);
				}
				else if (this.previousShipShot(x - 1, y, potentialShip.identifier)) {
					this.pushShipShot(x + 1, y, potentialShip);
					this.pushShipShot(x - 2, y, potentialShip);
					direction = Ship.VERTICAL;
				}
				else if (this.previousShipShot(x + 2, y, potentialShip.identifier) || this.previousShipShot(x - 2, y, potentialShip.identifier)) {//its skipped a cell
					direction = Ship.VERTICAL;
					this.pushShipShot(x + 1, y, potentialShip);
					this.pushShipShot(x - 1, y, potentialShip);
				}
				else if (this.previousShipShot(x, y + 1, potentialShip.identifier)) {
					this.pushShipShot(x, y + 2, potentialShip);
					this.pushShipShot(x, y - 1, potentialShip);
					direction = Ship.HORIZONTAL;
				}
				else if (this.previousShipShot(x, y - 1, potentialShip.identifier)) {
					this.pushShipShot(x, y + 1, potentialShip);
					this.pushShipShot(x, y - 2, potentialShip);
					direction = Ship.HORIZONTAL;
				}
				else if (this.previousShipShot(x, y + 2, potentialShip.identifier) || this.previousShipShot(x, y - 2, potentialShip.identifier)) {//its skipped a cell
					this.pushShipShot(x, y + 1, potentialShip);
					this.pushShipShot(x, y - 1, potentialShip);
					direction = Ship.HORIZONTAL;
				}
				else {
					if (LOGGING != "OFF") {
						console.log("THIS SHOULD NEVER HAPPEN");
					}
					direction = null;
				}

				//Update the enemy fleet with the shot that hit
				enemyShip = fleetFinderByShip(potentialShip.fleetType, this.enemyGrid.fleet);
				this.enemyGrid.cells[x][y].state = potentialShip.identifier;
				cell = new Cell();
				cell.setShip(enemyShip);
				cell.ship.location = {
					direction: direction
				};
				cell.state = Cell.TYPE_SHIP;
				enemyShip.cells.push(cell);
			}
		};

		this.addPotentialShots = function (x, y, ship) {
			// 1st time add surrounding locations as potentials
			//   p
			// p x p
			//   p
			//When you hit a second shot, then we can eliminate the unnecessary ones and only take the actuals

			switch (ship) {
				case Fleet.BATTLESHIP:
					this.addPotentialShotsForShip(this.potentialShots.ships.BATTLESHIP, x, y);
					break;
				case Fleet.CARRIER:
					this.addPotentialShotsForShip(this.potentialShots.ships.CARRIER, x, y);
					break;
				case Fleet.PATROLBOAT:
					this.addPotentialShotsForShip(this.potentialShots.ships.PATROLBOAT, x, y);
					break;
				case Fleet.DESTROYER:
					this.addPotentialShotsForShip(this.potentialShots.ships.DESTROYER, x, y);
					break;
				case Fleet.SUBMARINE:
					this.addPotentialShotsForShip(this.potentialShots.ships.SUBMARINE, x, y);
					break;
				default:
					break;
			}
		};


		//Helper to check if the last shot was for the same ship
		this.previousShipShot = function (x, y, identifier) {
			//are the coordinates in bounds?
			if (x < 0 || x > 9 || y < 0 || y > 9) {
				return false;
			}

			//If the location matches identifier
			return this.enemyGrid.cells[x][y].state === identifier;
		};

		//Helper to push a shot for a specific ship to that ships shot array (and mark as questionalble)
		this.pushShipShot = function (x, y, ship) {
			//Verify that shot was not taken on our board already  AND its a legal shot
			if (this.enemyGrid.cells[x] != undefined &&
				this.enemyGrid.cells[x][y] != undefined &&
				this.enemyGrid.cells[x][y].state === Cell.TYPE_EMPTY) {
				ship.shots.push(new Shot(x, y, ship.fleet));
				this.enemyGrid.cells[x][y].state = TYPE_QUESTIONABLE;
			}
		};

		//use to find the fleet by length
		this.getFleetFromShip = function (ship) {
			switch (ship) {
				case Fleet.CARRIER:
					return "CARRIER";
					break;
				case Fleet.BATTLESHIP:
					return "BATTLESHIP";
					break;
				case Fleet.DESTROYER:
					return "DESTROYER";
					break;
				case Fleet.SUBMARINE:
					return "SUBMARINE";
					break;
				case Fleet.PATROLBOAT:
					return "PATROLBOAT";
					break;
				default:
					return null;
			}
		};

		//We sunk the ship so
		// - Mark the enemyship as the ship type
		// - clear potential shots to 0
		this.updateSunkShip = function (sunkShipReference) {
			var type = this.getFleetFromShip(sunkShipReference);
			var ship = this.enemyGrid.fleet.ships[type];

			ship.isSunk = true;

			//This ship sunk so clear the remaining potential shots back to unknowns
			var currentShip = this.potentialShots.ships[type];
			var i = currentShip.shots.length;
			while (i--) {
				var shot = currentShip.shots.pop();
				if (this.enemyGrid.cells[shot.x][shot.y].state === TYPE_QUESTIONABLE) {
					this.enemyGrid.cells[shot.x][shot.y].state = Cell.TYPE_EMPTY;
				}
			}

			//Sink the ship in the enemyGrid
			for (var row = 0; row < ROWS; row++) {
				for (var column = 0; column < COLUMNS; column++) {
					if (this.enemyGrid.cells[row][column].state === currentShip.identifier) {
						this.enemyGrid.cells[row][column].state = Cell.TYPE_SUNK;
					}
				}
			}
		};

		//Find the next shot, either from the potentials, or from the random/next best
		this.getNextShot = function () {
			this.calculateProbabilityOfFutureShots();

			var potential = {
				x: null,
				y: null
			};

			//Look at our ships and see if anyone has a potential shot
			for (var potentialShipKey in this.potentialShots.ships) {
				if (!this.potentialShots.ships.hasOwnProperty(potentialShipKey)) continue;
				var currentShip = this.potentialShots.ships[potentialShipKey];
				//if this ship type has any shots, lets take em!
				if (currentShip.shots.length > 0) {
					potential = currentShip.shots.pop();
					break;
				}
			}

			//Check if we have a next shot already
			if (potential.x != null) {
				return {
					x: potential.x,
					y: potential.y
				};
			}
			else {

				if (GAME_MODE === "PLAY") {
					//Based on probability
					return this.getNextProbableCoord();
				}
				else if (GAME_MODE === "RANDOM") {
					//Random!  if required
					return this.getRandomCoord();
				}
				else {
					//just step x,y
					return this.getNextCoord();
				}
			}
		};

		this.calculateProbabilityOfFutureShots = function () {
			//Clear out the previous probability
			this.potentialShots.clearTotalProbability();

			//Loop through all the ships and calculate their probabilityGrid
			for (var shipKey in this.potentialShots.ships) {
				if (!this.potentialShots.ships.hasOwnProperty(shipKey)) continue;
				var potentialShip = this.potentialShots.ships[shipKey];

				//clear out this grid for recalculation
				this.potentialShots.clearProbabilityForThisShip(shipKey);

				var currentEnemyShip = this.enemyGrid.fleet.ships[shipKey];
				if (currentEnemyShip.isSunk) {
					//Its sunk, why count it
					continue;
				}

				//Get the ship position so we can see where it fits
				var shipLength = potentialShip.length;

				//Go through and find the number of times a ship could possibly be in a cell
				for (var row = 0; row < ROWS; row++) { // move down
					for (var column = 0; column < COLUMNS; column++) { // move right
						var fits = 0;

						//Now 'move' this ship along the length of the ship to get all possibilities for a ship in this cell
						for(var shipStartPositionX = row - shipLength ;shipStartPositionX < ROWS; shipStartPositionX++){
							//are the coordinates in bounds?
							if (shipStartPositionX < 0 || shipStartPositionX > row || shipStartPositionX > ROWS){
								continue;
							}
							//are the coordinates in bounds?
							var shipEndPositionX = shipStartPositionX + shipLength;
							if (shipEndPositionX >= ROWS) {
								continue;
							}

							//Along the length of ths ship are there any conflicts
							for(var i = shipStartPositionX; i < shipEndPositionX; i++) {
								//Within this ship length is there anything that will cause a conflict
								if (this.enemyGrid.cells[i][column].state != Cell.TYPE_EMPTY) {
									fits = 0;
									break;
								}
								fits++;
							}
						}

						//Now 'move' this ship along the length of the ship to get all possibilities for a ship in this cell
						for(var shipStartPositionY = column - shipLength ;shipStartPositionY < COLUMNS; shipStartPositionY++){
							//are the coordinates in bounds?
							if (shipStartPositionY < 0 || shipStartPositionY > column || shipStartPositionY > COLUMNS){
								continue;
							}
							//are the coordinates in bounds?
							var shipEndPositionY = shipStartPositionY + shipLength;
							if (shipEndPositionY >= COLUMNS) {
								continue;
							}

							//Along the length of ths ship are there any conflicts
							for(var i = shipStartPositionY; i < shipEndPositionY; i++) {
								//Within this ship length is there anything that will cause a conflict
								if (this.enemyGrid.cells[row][i].state != Cell.TYPE_EMPTY) {
									fits = 0;
									break;
								}
								fits++;
							}
						}

						potentialShip.probability[row][column].p = fits;
						//Sum up for total probability
						this.potentialShots.probability[row][column].p = this.potentialShots.probability[row][column].p + fits;
					}
				}
			}

			if (LOGGING != "OFF") {
				logProbability(this.potentialShots);
			}
		};
	};

	/**
	 * [called before each game. This is where you must place your ships.]
	 */
	AI.prototype.startGame = function () {
		//Lets get some random ships placed!
		this.startGameHelper(Fleet.CARRIER);
		this.startGameHelper(Fleet.BATTLESHIP);
		this.startGameHelper(Fleet.DESTROYER);
		this.startGameHelper(Fleet.SUBMARINE);
		this.startGameHelper(Fleet.PATROLBOAT);

		//Lets just log the ships to start (ours and a BLANK ship enemy)
		if (LOGGING != "OFF") {
			logShipLocationsForGrid(this.player.grid);
			logHuntingLocationsForGrid(this.enemyGrid);
			console.log("\n\n\n=> => THE HUNT IS ON <= <=\n\n\n");
		}
	};

//Helper to make random ship placement a breeze
	AI.prototype.startGameHelper = function (fleet) {
		while (!this.player.grid.dockShip(getRandomInt(0, ROWS), getRandomInt(0, COLUMNS), getRandomInt(0, 2), fleet)) {
			//We simply want to loop until we get a success
		}
	};

	/**
	 * [called each time it is your turn to shoot]
	 */
	AI.prototype.shoot = function () {
		//Find the next best shot (whether possible or probable
		var coords = this.getNextShot();
		var x = coords.x;
		var y = coords.y;

		//SHOOT IT
		var result = this.player.shoot(x, y);

		//Set the result to our enemyGrid of states
		this.enemyGrid.cells[x][y].state = result.state;

		/** @type {Number} [the cell has no ship on it and hasn't been 'hit' yet] */
		//Cell.TYPE_EMPTY = 0;
		/** @type {Number} [the cell has a ship on it and hasn't been 'hit' yet] */
		//Cell.TYPE_SHIP  = 1;
		/** @type {Number} [the cell has no ship on it and has been 'hit'] */
		//Cell.TYPE_MISS  = 2;
		/** @type {Number} [the cell has a ship on it and has been 'hit'] */
		//Cell.TYPE_HIT   = 3;
		/** @type {Number} [the cell has a ship on it and this 'hit' resulted in sinking the ship.
		 All cells the sunk ship uses are updated with this value] */
		//Cell.TYPE_SUNK  = 4;

		//Depending on the result
		switch (result.state) {
			case Cell.TYPE_HIT:
			case Cell.TYPE_SHIP:
				//Set the result to our enemyGrid of states
				this.enemyGrid.cells[x][y].state = result.state;
				//It was a hit so push the next potentials to the 'stack'
				this.addPotentialShots(x, y, result.ship);
				break;
			case Cell.TYPE_SUNK:
				//Set the result to our enemyGrid of states
				this.enemyGrid.cells[x][y].state = result.state;
				//NOw clear the potentials and update the ship locations in enemyGrid with '4'
				this.updateSunkShip(result.ship);
				break;

			default:
				break;
		}

		if (LOGGING != "OFF") {
			console.log("Taking a shot at: [" + x + "," + y + "]");
			logHuntingLocationsForGrid(this.enemyGrid);
		}
	};

	/**
	 * [called at the conclusion of each game]
	 */
	AI.prototype.endGame = function () {
		if (LOGGING != "OFF") {
			console.log("Taken: " + this.player.shotsTaken + " Dealt: " + this.player.hitsDealt);
		}
	};

//use to find the fleet by name
	var fleetFinderByShip = function (ship, fleet) {
		switch (ship) {
			case Fleet.CARRIER:
				return fleet.ships.CARRIER;
				break;
			case Fleet.BATTLESHIP:
				return fleet.ships.BATTLESHIP;
				break;
			case Fleet.DESTROYER:
				return fleet.ships.DESTROYER;
				break;
			case Fleet.SUBMARINE:
				return fleet.ships.SUBMARINE;
				break;
			case Fleet.PATROLBOAT:
				return fleet.ships.PATROLBOAT;
				break;
			default:
				return null;
		}
	};

//Helper to simply get some randoms
	var getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	};

//Helper to do logging to console so we can see where the SHIPS are located on the grid and what ships
//Initially, we know ours which is pretty much useless.  We cant legally call to see the enemy... but in testing it was nice to have in battleship.js at the end
	function logShipLocationsForGrid(grid, whos) {
		if (whos == undefined) {
			whos = "My";
		}
		var shipTable = "";
		shipTable += "    0  1  2  3  4  5  6  7  8  9\n";
		for (var row = 0; row < ROWS; row++) {

			shipTable += row + "  ";
			for (var column = 0; column < COLUMNS; column++) {
				var ship = grid.getShipByCoord(row, column);
				var shipType = ship ? ship.type : "";
				switch (shipType) {
					case Fleet.BATTLESHIP:
						shipTable += " B ";
						break;
					case Fleet.CARRIER:
						shipTable += " C ";
						break;
					case Fleet.PATROLBOAT:
						shipTable += " P ";
						break;
					case Fleet.DESTROYER:
						shipTable += " D ";
						break;
					case Fleet.SUBMARINE:
						shipTable += " S ";
						break;
					default:
						shipTable += " - ";
						break;
				}
			}
			shipTable += "\n";
		}
		shipTable += "\n";
		console.log(whos + " location: ");
		console.log(shipTable);
	}

//Helper to log to console and see what the enemy grid looks like and our hunting status.  Shows the state of the cell and next possible, next best, etc
	function logHuntingLocationsForGrid(grid) {
		var shipTable = "";
		shipTable += "    0  1  2  3  4  5  6  7  8  9\n";
		for (var row = 0; row < ROWS; row++) {
			shipTable += row + "  ";
			for (var column = 0; column < COLUMNS; column++) {
				var cell = grid.cells[row][column];
				var cellType = "-";
				if (cell.state != undefined) {
					cellType = cell.state;
				}
				else {
					debugger;
				}
				shipTable += " " + cellType + " ";
			}
			shipTable += "\n";
		}
		shipTable += "\n";
		console.log("Enemy Grid Table: ");
		console.log(shipTable);
	}

	function logProbability(potentialShots) {
		var shipTable, column, row, cell;

		for (var shipKey in potentialShots.ships) {
			if (!potentialShots.ships.hasOwnProperty(shipKey)) continue;
			var currentShip = potentialShots.ships[shipKey];
			shipTable = "";
			for (row = 0; row < ROWS; row++) {
				for (column = 0; column < COLUMNS; column++) {
					cell = currentShip.probability[row][column].p;
					shipTable += " " + cell + " ";
				}
				shipTable += "\n";
			}

			console.log("Enemy Probability Table for ship: " + shipKey);
			console.log(shipTable);
			shipTable += "\n";
		}

		shipTable = "";
		for (row = 0; row < ROWS; row++) {
			for (column = 0; column < COLUMNS; column++) {
				cell = potentialShots.probability[row][column].p;
				shipTable += " " + cell + " ";
			}
			shipTable += "\n";
		}

		console.log("Total Probability");
		console.log(shipTable);
	}



//*****END AI OBJECT*****

//*****BEGIN GAME OBJECT*****

/** global reference to the player one object */
var one;
/** global reference to the player two object */
var two;

/**
 * [constructor function for a Game object]
 * @param {Object} playerOne [the instance to the player one object]
 * @param {Object} playerTwo [the instance to the player two object]
 * @param {Object} AIOne	 [the instance to the player one AI]
 * @param {Object} AITwo	 [the instance to the player two AI]
 */
function Game(playerOne, playerTwo, AIOne, AITwo) {
	this.winner = null;
	two = playerTwo;
	one = playerOne;
	this.AIOne = AIOne;
	this.AITwo = AITwo;
}

/**
 * [initializes a Game by initializes both AIs and both players]
 */
Game.prototype.initialize = function() {
	this.winner = null;
	one.initialize();
	two.initialize();
	this.AIOne.initializeGame();
	this.AITwo.initializeGame();
};

/**
 * [start a game]
 */
Game.prototype.playGame = function() {
	this.AIOne.startGame();
	this.AITwo.startGame();

	//get the current state of the fleet
	this.playerOneState = one.grid.fleet.ships;
	this.playerTwoState = two.grid.fleet.ships;

	//TODO: check to make sure all ships are placed

	//pick a random player to go first
	var firstPlayer 	= this.getRandomPlayer();
	var secondPlayer 	= firstPlayer.type === Player.PLAYERONE ? two : one;
	var firstAI 		= firstPlayer.type === Player.PLAYERONE ? this.AIOne : this.AITwo;
	var secondAI 		= firstPlayer.type === Player.PLAYERONE ? this.AITwo : this.AIOne;
	this.winner 		= this.isOver();

	while( this.winner === false ) {
		firstAI.shoot();
		this.winner = this.isOver();
		if( this.winner !== false ) { break; }
		secondAI.shoot();
		this.winner = this.isOver();
	}

	//Call each AI's endGame() function
	this.AIOne.endGame();
	this.AITwo.endGame();
};

/**
 * [attempt to shoot a cell]
 * @param  {Object} player [a reference to the Player object doing the shooting]
 * @param  {Number} x      [x coordinate]
 * @param  {Number} y      [y coordinate]
 * @return {Object}        [the state of the cell AFTER the hit and the type of ship in the case of a hit.
 * state will be null if shot in invalid and ship will be null if no ship lies on the cell]
 */
Game.shoot = function(player, x, y) {
	//are the corrdinates in bounds?
	if(x < 0 || x > 9 || y < 0 || y > 9) {
		return false;
	}

	//get a pointer to the opponent
	var opponent = player.type === Player.PLAYERONE ? two : one;

	//get the location
	var cell = opponent.grid.getCell(x, y);

	//has this cell already been hit
	if( cell.state === Cell.TYPE_MISS || cell.state === Cell.TYPE_HIT || cell.state === Cell.TYPE_SUNK ) {
		return {
			state: null,
			ship: null
		};
	}

	//hit the cell
	++player.shotsTaken;

	//increase the temperature of that cell by 1
	++cell.temperature;

	if( cell.state === Cell.TYPE_SHIP ) {
		++player.hitsDealt;
		cell.state = Cell.TYPE_HIT;
		cell.ship.hit();
		if( cell.ship.isSunk ) {
			cell.ship.cells.filter( function(cell) {
				cell.state = Cell.TYPE_SUNK;
			});
		}
	} else { //cell.state === TYPE_EMPTY
		cell.state = Cell.TYPE_MISS;
	}

	return {
		state: cell.state,
		ship: cell.ship === null ? null : cell.ship.type
	};
};

/**
 * [checks to see whether game is over]
 * @return {Boolean} [whether game is over]
 */
Game.prototype.isOver = function() {
	if(one.grid.fleet.isSunk()) {
		return two;
	} else if(two.grid.fleet.isSunk()) {
		return one;
	} else if(!one.grid.fleet.isPlaced() && two.grid.fleet.isPlaced()) {
		return two;
	} else if(one.grid.fleet.isPlaced() && !two.grid.fleet.isPlaced()) {
		return one;
	} else if (!one.grid.fleet.isPlaced() && !two.grid.fleet.isPlaced()) {
		return this.getRandomPlayer();
	} else if(one.grid.fleet.hasMoved(this.playerOneState)) {
		return two;
	} else if(two.grid.fleet.hasMoved(this.playerTwoState)) {
		return one;
	} else {
		return false;
	}
};

/**
 * [get either player one or two randomly]
 * @return {Object} [the chose player at random]
 */
Game.prototype.getRandomPlayer = function() {
	if( Math.floor( Math.random() * 10 ) % 2 === 0 ) {
		return one;
	} else {
		return two;
	}
};

//*****END GAME OBJECT*****

//*****BEGIN PLAYER OBJECT*****

/**
 * [constructor function for a Player object]
 * @param {Number} type [the type of the player. designates player one vs player two]
 */
function Player (type) {
	this.type = type;
	/** @type {Grid} [if you are playing physical battleship, this grid would be the bottom grid (NOT the top grid)] */
	this.grid = new Grid();
	this.shotsTaken = 0;
	this.hitsDealt = 0;
	this.accuracy = function() {
		return this.hitsDealt / this.shotsTaken;
	}
}

/**
 * [initializes a Player object by initializes it's grid]
 */
Player.prototype.initialize = function() {
	this.grid.initialize();
	this.shotsTaken = 0;
	this.hitsDealt = 0;
};

/**
 * [attempt to hit a given coordinate]
 * @param  {Number} x [x coordinate]
 * @param  {Number} y [y coordinate]
 * @return {Number}   [the state of the cell AFTER the hit or false if the hit is invalid]
 */
Player.prototype.shoot = function(x, y) {
	return Game.shoot(this, x, y);
};

/** @type {Number} [represents player one] */
Player.PLAYERONE = 1;
/** @type {Number} [represents player two] */
Player.PLAYERTWO = 2;


//*****END PLAYER OBJECT*****

//*****BEGIN SIMULATOR OBJECT*****

/**
 * [constructor function for a Simulator object]
 * @param {Number} numSims [the number of simulations]
 */
function Simulator (numSims) {
	this.playerOne = new Player(Player.PLAYERONE);
	this.playerTwo = new Player(Player.PLAYERTWO);

	this.AIOne = new CandidateAI(this.playerOne);
	this.AITwo = new AI(this.playerTwo);

	this.game = new Game(this.playerOne, this.playerTwo, this.AIOne, this.AITwo);

	this.numSimulations = numSims;

	this.playerOneHeatMap = new Grid();
	this.playerTwoHeatMap = new Grid();

	this.scorecard = {
		Candidate_AI: 0,
		NM_AI: 0
	};

	this.accuracyByGame = {
		Candidate_AI: [],
		NM_AI: []
	};

	this.shotsByGame = {
		Candidate_AI: [],
		NM_AI: []
	};

	this.hitsByGame = {
		Candidate_AI: [],
		NM_AI: []
	};

	this.averageAccuracy = function() {
		var candidate_ai = 0;
		var nm_ai = 0;

		for(var i=0; i<numSims; ++i) {
			candidate_ai += this.accuracyByGame.Candidate_AI[i];
			nm_ai += this.accuracyByGame.NM_AI[i];
		}

		return {
			Candidate_AI: candidate_ai/numSims,
			NM_AI: nm_ai/numSims
		};
	};
}

/**
 * [begin a simulation]
 */
Simulator.prototype.startSimulation = function() {
	//initialize the AI's
	this.AIOne.initializeSimulation();
	this.AITwo.initializeSimulation();

	//for every simulation...
	for(var i=0; i<this.numSimulations; ++i) {
		//games should be played in parallel in case
		//the users AI adapts from previous games
		this.game.initialize(); //reset stuff for new game;
		this.game.playGame();

		//update scorecard
		if( this.game.winner.type === Player.PLAYERONE ) {
			++this.scorecard.Candidate_AI;
		} else {
			++this.scorecard.NM_AI;
		}

		//update accuracy
		this.accuracyByGame.Candidate_AI.push(this.playerOne.accuracy());
		this.accuracyByGame.NM_AI.push(this.playerTwo.accuracy());

		this.shotsByGame.Candidate_AI.push(this.playerOne.shotsTaken);
		this.shotsByGame.NM_AI.push(this.playerTwo.shotsTaken);

		this.hitsByGame.Candidate_AI.push(this.playerOne.hitsDealt);
		this.hitsByGame.NM_AI.push(this.playerTwo.hitsDealt);

		//after each game, update the heatmaps
		//note on runtime: the following code could be baked into
		//Player.prototype.shoot(). However, since the board size is known, we still 
		//achieve constant O(1) runtime here.
		for(var j=0; j<10; ++j) {
			for(var k=0; k<10; ++k) {
				this.playerOneHeatMap.cells[j][k].temperature += this.playerOne.grid.cells[j][k].temperature;
				this.playerTwoHeatMap.cells[j][k].temperature += this.playerTwo.grid.cells[j][k].temperature;
			}
		}

		this.AIOne.endGame();
		this.AITwo.endGame();
	}

	//need to verify this assumtion, but if we get this far i'm going to assume the Candidate AI is error free 
	//so let submit it.
	this.initializeSimulation	= this.AIOne.initializeSimulation.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
	this.initializeGame			= this.AIOne.initializeGame.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
	this.startGame				= this.AIOne.startGame.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
	this.shoot 					= this.AIOne.shoot.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
	this.endGame 				= this.AIOne.endGame.toString().match(/function[^{]+\{([\s\S]*)\}$/)[1];
};
//*****END SIMULATOR OBJECT*****

//*****LET US BEGIN*****
function getAvg(numArr) {
	var total = 0;
	for (var i = 0; i < numArr.length; i++){
		total += numArr[i];
	}
	return total / numArr.length;
}

var simulatorInstance = new Simulator(999);
simulatorInstance.startSimulation();


document.getElementById('nm-ai-score').innerHTML = simulatorInstance.scorecard.NM_AI;
document.getElementById('nm-ai-accuracy').innerHTML = (getAvg(simulatorInstance.accuracyByGame.NM_AI) * 100).toFixed(2) + "%";
document.getElementById('nm-ai-shots-taken').innerHTML = (getAvg(simulatorInstance.shotsByGame.NM_AI));
document.getElementById('nm-ai-hits').innerHTML = (getAvg(simulatorInstance.hitsByGame.NM_AI));

document.getElementById('candidate-ai-score').innerHTML = simulatorInstance.scorecard.Candidate_AI;
document.getElementById('candidate-ai-accuracy').innerHTML = (getAvg(simulatorInstance.accuracyByGame.Candidate_AI) * 100).toFixed(2) + "%";
document.getElementById('candidate-ai-shots-taken').innerHTML = (getAvg(simulatorInstance.shotsByGame.Candidate_AI));
document.getElementById('candidate-ai-hits').innerHTML = (getAvg(simulatorInstance.hitsByGame.Candidate_AI));


window.$vars = {
    candidate_initializeSimulation: simulatorInstance.initializeSimulation,
	candidate_initializeGame: simulatorInstance.initializeGame,
	candidate_startGame: simulatorInstance.startGame,
	candidate_shoot: simulatorInstance.shoot,
	candidate_endGame: simulatorInstance.endGame
};


if (simulatorInstance.scorecard.NM_AI > simulatorInstance.scorecard.Candidate_AI) {
	document.getElementById('candidate-ai-score').classList.add('loss');
	document.getElementById('nm-ai-score').classList.add('win');
}
else if (simulatorInstance.scorecard.NM_AI < simulatorInstance.scorecard.Candidate_AI) {
	document.getElementById('candidate-ai-score').classList.add('win');
	document.getElementById('nm-ai-score').classList.add('loss');
}
else {
	document.getElementById('candidate-ai-score').classList.add('tie');
	document.getElementById('nm-ai-score').classList.add('tie');
}


})();