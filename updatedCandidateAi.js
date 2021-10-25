//Set global variables for keeping track of hits
var carrierShip = {hitsLeft:5};
var battleShipShip = {hitsLeft:4};
var DestroyerShip = {hitsLeft:3};
var SubShip = {hitsLeft:3};
var PBShip = {hitsLeft:2};
var shotsFiredGrid = [10];
var gridCount = 0;
for(var i=0;i<10;i++){
	shotsFiredGrid[i] = [];
	for(var j=0;j<10;j++){
		if(gridCount%3 === 0){
			shotsFiredGrid[i][j]= "";
		}else{
			shotsFiredGrid[i][j]= "";
		}		
		gridCount ++;
	}
}


/**
 * [constructor function for a CandidateAI object. A new instance of your AI is created for each game.]
 * @param {Object} player [your player instance]
 */
function CandidateAI (player) {
    this.player = player;
}

/**
 * []
 */
CandidateAI.prototype.initializeSimulation = function() {
};

/**
 * [initializes a CandidateAI instance.]
 */
CandidateAI.prototype.initializeGame = function() {
	carrierShip = {hitsLeft:5};
	battleShipShip = {hitsLeft:4};
	DestroyerShip = {hitsLeft:3};
	SubShip = {hitsLeft:3};
	PBShip = {hitsLeft:2};
	gridCount = 0;
	//This loop is to set a board to to help randominze the initail shooting points, Start with every 3rd space.
	for(var i=0;i<10;i++){
		shotsFiredGrid[i] = [];
		for(var j=0;j<10;j++){
			if(gridCount%3 === 0){
				shotsFiredGrid[i][j]= "S";
			}else{
				shotsFiredGrid[i][j]= "";
			}		
			gridCount ++;
		}
	}
    var x=0 , y =0;
    this.getNextCoord = function() {
		var array = [];
		var x,y;
			var potentialShipsLargerThan3 = [10];
			var P3Counter = 0;
			var P2Coutner = 0;
			//Set a matrix to find the best possible shooting area
			for(var i=0;i<10;i++){
				potentialShipsLargerThan3[i] = [];
				for(var j=0;j<10;j++){	
					potentialShipsLargerThan3[i][j] = 0;
				}
			}
			potentialGridCounter = 0;
			var shipProximity = 0;
			for(var i=0;i<10;i++){
				for(var j=0;j<10;j++){	
					if(shotsFiredGrid[i][j] == "" || shotsFiredGrid[i][j] == "S"){
						if(i<9){
							if(shotsFiredGrid[i+1][j] == "" || shotsFiredGrid[i+1][j] == "S"){
								if(i<8){
									if(shotsFiredGrid[i+2][j] == "" || shotsFiredGrid[i+2][j] == "S"){
											potentialShipsLargerThan3[i][j] += 2; //Increment the matrix spot to determine where the best possible shot is
											potentialShipsLargerThan3[i+1][j] += 1;
									}
								}else{
									potentialShipsLargerThan3[i][j] += 1;
								}
							}else if(shotsFiredGrid[i+1][j] >= 1  && shotsFiredGrid[i+1][j] <= 5){//detect if the current space has already hit ship
								if(carrierShip.hitsLeft + battleShipShip.hitsLeft + DestroyerShip.hitsLeft + SubShip.hitsLeft + PBShip.hitsLeft !=0){  //Sanity check to make sure there are hits left on any ship
									if(i<8){
										if(shotsFiredGrid[i+2][j] >= 1  && shotsFiredGrid[i+2][j] <= 5){  //If there is two or more hits in a row make sure those spots are selected next
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500; //Every other spot is only slighlty less lightly to be a potiential target.
										}
									}else if(i>1){
										if(shotsFiredGrid[i-1][j] >= 1  && shotsFiredGrid[i-1][j] <= 5){//Do the same thing in the other direction
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;
										}
									}else{
										potentialShipsLargerThan3[i][j] += 500;//If no spot has been hit around this spot make all spots the next possible target
									}
								}
							}
						}
						if(i>0){
							if(shotsFiredGrid[i-1][j] == "" || shotsFiredGrid[i-1][j] == "S"){
								if(i>1){
									if(shotsFiredGrid[i-2][j] == "" || shotsFiredGrid[i-2][j] == "S"){
											potentialShipsLargerThan3[i][j] += 2;
											potentialShipsLargerThan3[i-1][j] += 1;
									}
								}else{
									potentialShipsLargerThan3[i][j] += 1;
								}
							}else if(shotsFiredGrid[i-1][j] >= 1 shotsFiredGrid[i-1][j] <=5){//If the board shows a number that means a ship has been hit
								if(carrierShip.hitsLeft + battleShipShip.hitsLeft + DestroyerShip.hitsLeft + SubShip.hitsLeft + PBShip.hitsLeft !=0){//Sanity check to make sure there are hits left on any ship
									if(i>1){
										if(shotsFiredGrid[i-2][j] >= 1 && shotsFiredGrid[i-2][j] <=5){//If there is two or more hits in a row make sure those spots are selected next
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;//Every other spot is only slighlty less lightly to be a potiential target.
										}
									}else if(i<9){
										if(shotsFiredGrid[i+1][j] >= 1 shotsFiredGrid[i+1][j] <= 5){//Do the same thing in the other direction
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;
										}
									}else{
										potentialShipsLargerThan3[i][j] += 500;//If no spot has been hit around this spot make all spots the next possible target
									}
								}
							}
						}
						if(j>0){
							if(shotsFiredGrid[i][j-1] == "" || shotsFiredGrid[i][j-1] == "S"){
								if(j>1){
									if(shotsFiredGrid[i][j-2] == "" || shotsFiredGrid[i][j-2] == "S"){
											potentialShipsLargerThan3[i][j] += 2;
											potentialShipsLargerThan3[i][j-1] += 1;
									}
								}else{
									potentialShipsLargerThan3[i][j] += 1;
								}
							}else if(shotsFiredGrid[i][j-1] >= 1  && shotsFiredGrid[i][j-1] <=5){//If the board shows a number that means a ship has been hit
								if(carrierShip.hitsLeft + battleShipShip.hitsLeft + DestroyerShip.hitsLeft + SubShip.hitsLeft + PBShip.hitsLeft !=0){//Sanity check to make sure there are hits left on any ship
									if(j>1){
										if(shotsFiredGrid[i][j-2] >= 1  && shotsFiredGrid[i][j-2] <=5){//If there is two or more hits in a row make sure those spots are selected next
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;//Every other spot is only slighlty less lightly to be a potiential target.
										}
									}else if(j<9){
										if(shotsFiredGrid[i][j+1] >= 1  && shotsFiredGrid[i][j+1] <=5){//Do the same thing in the other direction
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;
										}
									}else{
										potentialShipsLargerThan3[i][j] += 500;//If no spot has been hit around this spot make all spots the next possible target
									}
								}
							}
						}
						if(j<9){
							if(shotsFiredGrid[i][j+1] == "" || shotsFiredGrid[i][j+1] == "S"){
								if(j<8){
									if(shotsFiredGrid[i][j+2] == "" || shotsFiredGrid[i][j+2] == "S"){
											potentialShipsLargerThan3[i][j] += 2;
											potentialShipsLargerThan3[i][j+1] += 1;
									}
								}else{
									potentialShipsLargerThan3[i][j] += 1;
								}
							}else if(shotsFiredGrid[i][j+1] >= 1 && shotsFiredGrid[i][j+1] <=5){//If the board shows a number that means a ship has been hit
								if(carrierShip.hitsLeft + battleShipShip.hitsLeft + DestroyerShip.hitsLeft + SubShip.hitsLeft + PBShip.hitsLeft !=0){//Sanity check to make sure there are hits left on any ship
									if(j<8){
										if(shotsFiredGrid[i][j+2] >= 1 && shotsFiredGrid[i][j+2] <=5){//If there is two or more hits in a row make sure those spots are selected next
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;//Every other spot is only slighlty less lightly to be a potiential target.
										}
									}else if(j>1){
										if(shotsFiredGrid[i][j-1] >= 1 && shotsFiredGrid[i][j-1] <=5){//Do the same thing in the other direction
											potentialShipsLargerThan3[i][j] += 1000;
										}else{
											potentialShipsLargerThan3[i][j] += 500;
										}
									}else{
										potentialShipsLargerThan3[i][j] += 500;//If no spot has been hit around this spot make all spots the next possible target
									}
								}
							}
						}
					}
					else{
						potentialShipsLargerThan3[i][j] = 0;
					}
					potentialGridCounter ++;
				}
			}
			var largestPotentialPoint = {x:-1,y:-1,potential:-1.1};//Set the larget point to the first point
			for(var i=0;i<10;i++){//loop through the board and find the largest potientail point
				for(var j=0;j<10;j++){	
					var potential = potentialShipsLargerThan3[i][j];
					if(potential > largestPotentialPoint.potential){
						largestPotentialPoint.x = j;
						largestPotentialPoint.y = i;
						largestPotentialPoint.potential = potential;
					}
				}
			}
			for(var i=0;i<10;i++){//loop though the grid one more time to find all the spots that are equal to the largest potiential shot
				for(var j=0;j<10;j++){	
					var potential = potentialShipsLargerThan3[i][j];
					if(potential == largestPotentialPoint.potential){
						shotsFiredGrid[i][j] = "S";//Set all potiential areas to shoot equal to S
					}else{
						if(shotsFiredGrid[i][j] == "S" || shotsFiredGrid[i][j] == ""){//All other areas equal blank
								shotsFiredGrid[i][j] = "";
						}
					}
				}
			}
			var test = true;
			while(test){//Randomly select between all of the best areas to shoot
				x = Math.floor((Math.random()*10)+ 0);
				y = Math.floor((Math.random()*10)+ 0);
				if(shotsFiredGrid[y][x] == "S"){			
					test = false;
	
				}
	
			}
	       return {
            x: x,
            y: y
        };
    }
	function checkCoords(checkX, checkY){//sanity check to make sure the shot is within the board
		var test = false;
		if(checkX <0 || checkX > 9 || checkY < 0 || checkY>9){
			test = false;
		}else{
			if(shotsFiredGrid[checkY][checkX] == "" || shotsFiredGrid[checkY][checkX] == "S"){
				test = true;
			}
		}
		return test;
	}
};

/**
 * [called before each game. This is where you must place your ships.]
 */
CandidateAI.prototype.startGame = function() {
    this.player.grid.dockShip(0, 0, Ship.VERTICAL, Fleet.CARRIER);
    this.player.grid.dockShip(1, 0, Ship.VERTICAL, Fleet.BATTLESHIP);
    this.player.grid.dockShip(2, 0, Ship.VERTICAL, Fleet.DESTROYER);
    this.player.grid.dockShip(3, 0, Ship.VERTICAL, Fleet.SUBMARINE);
    this.player.grid.dockShip(4, 0, Ship.VERTICAL, Fleet.PATROLBOAT);
};

/**
 * [called each time it is your turn to shoot]
 */
CandidateAI.prototype.shoot = function() {
    var coords = this.getNextCoord();
    var result = this.player.shoot(coords.x, coords.y);	
	if (result.ship != null){
			//Keep track of hits to narrow down on where ship is.
			var hitsLeft;
				if(result.ship == 0){
					hitsLeft = carrierShip.hitsLeft - 1;
					carrierShip.hitsLeft = hitsLeft;
				}
				else if(result.ship == 1){
					hitsLeft = battleShipShip.hitsLeft - 1;
					battleShipShip.hitsLeft = hitsLeft;
				}
				else if(result.ship == 2){
					hitsLeft = DestroyerShip.hitsLeft - 1;
					DestroyerShip.hitsLeft = hitsLeft;
				}
				else if(result.ship == 3){
					hitsLeft = SubShip.hitsLeft - 1;
					SubShip.hitsLeft = hitsLeft;
				}
				else if(result.ship == 4){
					hitsLeft = PBShip.hitsLeft - 1;
					PBShip.hitsLeft = hitsLeft;
				}
				shotsFiredGrid[coords.y][coords.x] = result.ship + 1;
		}
		else{
			shotsFiredGrid[coords.y][coords.x] = "M";
		}
    //result is one of Cell.<type> so that you can re-shoot if necessary. (e.g. you are shooting someplace you already shot)
};

/**
 * [called at the conclusion of each game]
 */
CandidateAI.prototype.endGame = function() {
};
