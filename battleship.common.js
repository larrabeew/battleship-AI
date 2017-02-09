//*****BEGIN SHIP OBJECT*****

/**
 * [constructor function for a Ship object]
 * @param {Number} type   [the type of ship]
 * @param {Number} length [the length of the ship]
 */
function Ship (type, length) {
    this.length = length;
    this.type = type;
    this.initialize();
}

/**
 * [initializes a ship]
 */
Ship.prototype.initialize = function() {
    this.damage = 0;
    this.isSunk = false;
    this.isUsed = false;
    this.location = {
        x: null,
        y: null,
        direction: null
    };
    this.cells = [];
};

/**
 * [hit ths ship]
 */
Ship.prototype.hit = function() {
    if(++this.damage === this.length) {
        this.isSunk = true;
    }
};

/** @type {Number} [represents a horizontal orientation] */
Ship.HORIZONTAL = 0;
/** @type {Number} [represents a vertical orientation] */
Ship.VERTICAL   = 1;

//*****END SHIP OBJECT*****

//*****BEGIN FLEET OBJECT*****

/**
 * [constructor function for a Fleet object]
 */
function Fleet () {
    this.ships              = {};
    this.ships.CARRIER      = new Ship(Fleet.CARRIER, 5);
    this.ships.BATTLESHIP   = new Ship(Fleet.BATTLESHIP, 4);
    this.ships.DESTROYER    = new Ship(Fleet.DESTROYER, 3);
    this.ships.SUBMARINE    = new Ship(Fleet.SUBMARINE, 3);
    this.ships.PATROLBOAT   = new Ship(Fleet.PATROLBOAT, 2);
}

/**
 * [initializes a fleet by initialzing each ship in the fleet]
 */
Fleet.prototype.initialize = function() {
    this.ships.CARRIER.initialize();
    this.ships.BATTLESHIP.initialize();
    this.ships.DESTROYER.initialize();
    this.ships.SUBMARINE.initialize();
    this.ships.PATROLBOAT.initialize();
};

/**
 * [checks to see if every ship in the fleet has been placed on the grid]
 * @return {Boolean} [wheather each ship in the fleet has been placed on the grid]
 */
Fleet.prototype.isPlaced = function() {
    if( this.ships.CARRIER.isUsed && 
        this.ships.BATTLESHIP.isUsed &&
        this.ships.DESTROYER.isUsed &&
        this.ships.SUBMARINE.isUsed &&
        this.ships.PATROLBOAT.isUsed ) {

        return true;

    } else { return false; }
};

/**
 * [checks to see if every ship in the fleet has been sunk]
 * @return {Boolean} [whether each ship in the fleet has been sunk]
 */
Fleet.prototype.isSunk = function() {
    if( this.ships.CARRIER.isSunk && 
        this.ships.BATTLESHIP.isSunk &&
        this.ships.DESTROYER.isSunk &&
        this.ships.SUBMARINE.isSunk &&
        this.ships.PATROLBOAT.isSunk ) {

        return true;

    } else { return false; }
};

/**
 * [get a reference to ship in the fleet that matches a given ship type or null if type doesn't match]
 * @param  {Number} type [the type of the ship]
 * @return {Object}      [a reference to ship in the fleet that matches a given ship type or null if type doesn't match]
 */
Fleet.prototype.getShipByType = function(type) {
    switch(type) {
        case Fleet.CARRIER:
            return this.ships.CARRIER;
            break;
        case Fleet.BATTLESHIP:
            return this.ships.BATTLESHIP;
            break;
        case Fleet.DESTROYER:
            return this.ships.DESTROYER;
            break;
        case Fleet.SUBMARINE:
            return this.ships.SUBMARINE;
            break;
        case Fleet.PATROLBOAT:
            return this.ships.PATROLBOAT;
            break;
        default: 
            return null;
    }
};

/**
 * [checks to see whether the fleet resides at the same location (current state) as it was at before (old state)]
 * @param  {Object}  state [the old state of the fleet that we are checking against]
 * @return {Boolean}       [whether the state has changed or not]
 */
Fleet.prototype.hasMoved = function(state) {
    var stateChanged = false;

    for (var key in this.ships) {
        if ({}.hasOwnProperty.call(this.ships, key) && {}.hasOwnProperty.call(state, key) ) {
            var o = state[key].location;
            var n = this.ships[key].location;

            if(o.x !== n.x && o.y !== n.y && o.direction !== n.direction) {
                stateChanged = true;
                break;
            }
        }
    }
    return stateChanged;
};

/** @type {Number} [represents the CARRIER ship] */
Fleet.CARRIER       = 0;
/** @type {Number} [represents the BATTLESHP ship] */
Fleet.BATTLESHIP    = 1;
/** @type {Number} [represents the DESTROYER ship] */
Fleet.DESTROYER     = 2;
/** @type {Number} [represents the SUBMARINE ship] */
Fleet.SUBMARINE     = 3;
/** @type {Number} [represents the PATROLBOAT ship] */
Fleet.PATROLBOAT    = 4;

//*****END FLEET OBJECT*****

//*****BEGIN GRID OBJECT*****

/**
 * [constructor function for a Grid object]
 */
function Grid () {
    this.fleet = new Fleet();
    this.initialize();
}

/**
 * [initialize a grid by initializing its fleet and creating the grid]
 */
Grid.prototype.initialize = function() {
    this.fleet.initialize();
    this.create();
};

/**
 * [creates a 10x10 grid by creating a Cell object in each 2D array index]
 */
Grid.prototype.create = function() {
    this.cells = [];
    for(var i=0; i<10; ++i) {
        this.cells[i] = [];
        for(var j=0; j<10; ++j) {
            this.cells[i].push(new Cell());
        }
    }
};

/**
 * [get a reference to the cell located at the 2D array index represented by x and y values or null if invalid]
 * @param  {Number} x [x coordinate]
 * @param  {Number} y [y coordinate]
 * @return {Object}   [reference to the cell located at the 2D array index represented by x and y values or null if invalid]
 */
Grid.prototype.getCell = function(x, y) {
    var invalid = x > 9 || x < 0 || y > 9 || y < 0;
    return invalid ? null : this.cells[x][y];
};

/**
 * [places a ship at the given location. The x, y are the top cell (if vertical) or left cell (if horizontal)]
 * @param  {Number} x         [x coordinate]
 * @param  {Number} y         [y coordinate]
 * @param  {Number} direction [the ship's orientation]
 * @param  {Number} shipType  [the type of the ship]
 * @return {Boolean}          [was the ship successfully placed]
 */
Grid.prototype.dockShip = function(x, y, direction, shipType) {
    var ship = this.fleet.getShipByType(shipType);

    //see is it is valid to pace the ship there
    if(this.inBounds(x, y, direction, ship) && !this.doesCollide(x, y, direction, ship) && !ship.isUsed) {

        //dock the ship
        ship.isUsed = true;
        ship.location.x = x;
        ship.location.y = y;
        ship.location.direction = direction;

        var bound = direction === Ship.HORIZONTAL ? x : y;

        for( var i = bound; i < bound + ship.length; ++i ) {
            var cell = this.getCell(direction === Ship.HORIZONTAL ? i : x, direction === Ship.HORIZONTAL ? y : i);  
            cell.setShip(ship);
            cell.state = Cell.TYPE_SHIP;
            ship.cells.push(cell);
        }   

    } else {
        return false;
    }
    return true;
};

/**
 * [check to see whether a ship placed at the given coordinate and orientation will collide with an already placed ship. 
 * The x, y are the top cell (if vertical) or left cell (if horizontal)]
 * @param  {Number} x         [x coordinate]
 * @param  {Number} y         [y coordinate]
 * @param  {Number} direction [the ship's orientation]
 * @param  {Object} ship      [reference to the ship object]
 * @return {Boolean}          [whether the ship collides with an already placed ship or not]
 */
Grid.prototype.doesCollide = function(x, y, direction, ship) {
    var bound = direction === Ship.HORIZONTAL ? x : y;

    for( var i = bound; i < bound + ship.length; ++i ) {
        var cell = this.getCell(direction === Ship.HORIZONTAL ? i : x, direction === Ship.HORIZONTAL ? y : i);
        //even though there are other cell states, since we only place ships
        //when the board is empty, if the cell is not empty, it must have another ship
        if(cell.state !== Cell.TYPE_EMPTY) {
            return true;
        }
    }
    return false;
};

/**
 * [get reference to ship that lies on the given cell or null if invalid]
 * @param  {Number} x [x coordinate]
 * @param  {Number} y [y coordinate]
 * @return {Object}   [a reference to the ship that lies on the given cell or null if invalid]
 */
Grid.prototype.getShipByCoord = function(x, y) {
    return this.getCell(x, y) === null ? null : this.getCell(x, y).ship;
};

/**
 * [check to see whether a ship placed at the given coordinate and orientation will remain in the bounds of the grid. 
 * The x, y are the top cell (if vertical) or left cell (if horizontal)]
 * @param  {Number} x         [x coordinate]
 * @param  {Number} y         [y coordinate]
 * @param  {Number} direction [the ship's orientation]
 * @param  {Object} ship      [reference to the ship object]
 * @return {Boolean}          [whether a ship placed at the given coordinate and orientation will remain in the bounds of the grid]
 */
Grid.prototype.inBounds = function(x, y, direction, ship) {
    //are the corrdinates in bounds?
    if(x < 0 || x > 9 || y < 0 || y > 9) {
        return false;
    }

    return direction === Ship.VERTICAL ? (y + (ship.length - 1) <= 9) : (x + (ship.length - 1) <= 9);
};

//*****END GRID OBJECT*****

////*****BEGIN CELL OBJECT*****

/**
 * [constructor function for a Cell object]
 */
function Cell () {
    this.temperature = 0;
    this.state = Cell.TYPE_EMPTY;
    this.ship = null;
}

/**
 * [binds a ship to this cell..meaning one of the cells that the ships is docked on is this]
 * @param {Object} ship [the ship to be set]
 */
Cell.prototype.setShip = function(ship) {
    this.ship = ship;
};

/** @type {Number} [the cell has no ship on it and hasn't been 'hit' yet] */
Cell.TYPE_EMPTY = 0;
/** @type {Number} [the cell has a ship on it and hasn't been 'hit' yet] */
Cell.TYPE_SHIP  = 1;
/** @type {Number} [the cell has no ship on it and has been 'hit'] */
Cell.TYPE_MISS  = 2;
/** @type {Number} [the cell has a ship on it and has been 'hit'] */
Cell.TYPE_HIT   = 3;
/** @type {Number} [the cell has a ship on it and this 'hit' resulted in sinking the ship. 
All cells the sunk ship uses are updated with this value] */
Cell.TYPE_SUNK  = 4;

//*****END CELL OBJECT*****