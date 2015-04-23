//Keep track of all the details of the canvas so I don't have to keep typing numbers and maybe get them wrong.
var canvasDetails = {
  "numCols": 5,
  "numRows": 6,
  "colWidth": 101,
  "rowHeight": 83,
  "rowStart": 43, //There is a little bit of a gap between the bottom row and the edge of the canvas
  "colStart": 0,
};

//This is our model prototype. All models have these features.
//Parameters:
//  x: Starting x location.
//  y: Starting y location of the model.
//  xSpeed: The starting speed at which the model moves left and right.
//  ySpeed: The starting speed at which the model moves up and down.
//  sprite: The location of the image to display.
var Model = function(x, y, xSpeed, ySpeed, sprite){

    // The image/sprite for each model, this uses  a helper we've provided to easily load images
    this.sprite = sprite;

    //This determines how fast each model will move.
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;

    //x and y are used to determine the location of the model on the screen.
    this.x = x;
    this.y = y;
};

//Draw the model on the screen, required method for the game.
Model.prototype.render = function(){
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

//Move the model around the screen.
//Parameters:
//  dx: Speed in the x direction.
//  dy: Speed in the y direction.
//  dt: Time delta between ticks. Use this to ensure the game runs at the same speed for all computers.
Model.prototype.move = function(dx, dy, dt) {
  this.x = this.x + dx * dt;
  this.y = this.y + dy * dt;
};

// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here
    var rand = Math.random();

    Model.call(this, -1 * canvasDetails.colWidth * Math.floor(rand * 3 + 1)          //x: Start on the left for now. Start somewhere off the left side of the canvas to make it appear like the objects are created at different times.
        , Math.floor(rand * 3) * canvasDetails.rowHeight + canvasDetails.rowStart //y: Pick a random row stone row. There are 3 stone rows.
        , Math.floor(rand * 100 + 60)  //xSpeed: random speed between 60 and 160
        , 0         //ySpeed: Bugs don't change lanes because they don't have blinkers.
        , "images/enemy-bug.png");
};

//Grab the prototype and set the constructor.
Enemy.prototype = Object.create(Model.prototype);
Enemy.prototype.constructor = Enemy;

// Update the enemy's position
// Parameters:
//  dt: Time delta between ticks
Enemy.prototype.update = function(dt) {

  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.

  this.move(this.xSpeed, this.ySpeed, dt);
  this.detectCollision();
  if(this.x > canvasDetails.colWidth * canvasDetails.numCols + canvasDetails.colWidth) {
    for (var key in allEnemies) {
      if(allEnemies[key] === this) {
        allEnemies[key] = null;
        //remove the finished enemy.
        allEnemies.splice(key, 1);

        //Lets add some new enemies.
        //I want no more than 5 enemies, and no fewer than 2
        var count = allEnemies.length;  //How many do I have
        var min = 2 - count;  //Do I have more than the minimum of 2?
        if(min < 0)
          min = 0;
        //How many should I create?
        var newEnemyCount = Math.floor(Math.random() * (5 - count + 1) + min);

        //Create them.
        for(var i = 0; i < newEnemyCount; i++)
        {
          allEnemies.push(new Enemy());
        };
        break;
      };
    };
  };
};

//In this bizarre world, bugs squash humans. Lets see if the bugs catch a human.
//The enemies move much more often than the player does, so lets check collision when the enemy moves.
Enemy.prototype.detectCollision = function() {

  //Is the enemy image inside the player box?
  if(((this.x >= player.x && this.x <= player.x + canvasDetails.rowHeight)
    || (this.x + canvasDetails.rowHeight > player.x && this.x + canvasDetails.rowHeight < player.x + canvasDetails.rowHeight))
    && (this.y == player.y))
      {
        //yes? Then the plucky here is squashed.
        player.killPlayer();
      };
};

//The heroic player. The chicken always makes it across. Maybe the player will too.
var Player = function(sprite) {
  //This is the players starting point. we should keep track of it so that we know where to reset the player when they reach the other side or are run over by an enemy.
  this.startingX = canvasDetails.colWidth * 2 + canvasDetails.colStart;
  this.startingY = canvasDetails.rowHeight * 3 + canvasDetails.rowStart;
  this.score = 0;     //Only players will have a score.
  this.highScore = 0; // Let's keep the high score.

  Model.call(this
      , this.startingX          //x: The players starting x location
      , this.startingY          //y: The players starting y location
      , canvasDetails.colWidth  //xSpeed: The distance a player will move in the x direction
      , canvasDetails.rowHeight //ySpeed: The distance a player will move in the y direction.
      , sprite);
};

//Grab the prototype and set the constructor.
Player.prototype = Object.create(Model.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt){
  //Do collision Detection here?
  //Reset at the very least.
  if(this.y < 0)  //We have crossed the pond
  {
    //Good things happen here.
    //Let's increase the score, and reset the player location for the next level.
    this.score++;
    this.resetPlayerLocation();
  };
};

//Accept the user input and move the character accordingly.
Player.prototype.handleInput = function(val){
  //The input is not valid so there is no input to handle.
  if(val == undefined)
    return;

    //The details on how the player will move.
    var dx = 0,
        dy = 0,
        dt = 1;

  switch(val)
  {
      case "left":
        if(this.x - this.xSpeed >= 0)
          dx = -1 * this.xSpeed;
        break;
      case "right":
        if(this.x + this.xSpeed < ctx.canvas.width)
          dx = this.xSpeed;
        break;
      case "up":
        //If we go above 0, no big deal. We're going to reset this in the update function.
          dy = -1 * this.ySpeed;
        break;
      case "down":
        if(this.y + this.ySpeed < ctx.canvas.height - 171)
          dy = this.ySpeed;
        break;
  };
  if(dx !== 0 || dy !== 0)  //Only move if we need to move. We might not move if the player tried to move off the screen.
    this.move(dx, dy,dt);
};

//Reset the player's location
Player.prototype.resetPlayerLocation = function() {
  this.y = this.startingY;
  this.x = this.startingX;
};

//The player has been squashed. Handle the score for restarting the game, then reset the player.
Player.prototype.killPlayer = function() {
  if(this.score > this.highScore){
      this.highScore = this.score;
    };

    this.score = 0;
    this.resetPlayerLocation();
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var player = new Player("images/char-boy.png");
var allEnemies = [new Enemy(),new Enemy(),new Enemy()];

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
