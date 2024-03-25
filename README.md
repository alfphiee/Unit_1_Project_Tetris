# Tetris - Project One (GA)

This project was completed during Week 4 of the Software Engineering Immersive Course. The current focus was Frontend Development and the goal of the project was to produce a game using a combination of HTML, CSS & JavaScript. I chose Tetris as the game I would focus on as I thought it would be a good level of challenge for me in terms of the logic required.

![game-screenshot](https://i.imgur.com/aZjz845.png)

## Deployment

This game has been deployed using [GitHub Pages](https://alfphiee.github.io/Unit_1_Project_Tetris/).

## Getting started

This project is made using:

- HTML - index.html
- CSS - css/styles.css
- JavaScript - js/app.js

To run the project locally - 'Clone or Download' the repository and open the index.html file.

## Timeframe & Working Team

This was a solo project with a window of 4.5 days to complete the project and have it ready for presentation.

## Technologies Used

- HTMl5
- CSS3
- JavaScript
- Git

## Brief

The general brief was to:

- **Render a game in the browser**
- **Be built on a grid: do not use HTML Canvas for this**
- **Design logic for winning** & **visually display which player won**
- **Include separate HTML / CSS / JavaScript files**
- Use **Javascript** for **DOM manipulation**
- **Deploy your game online**

For Tetris, these were the following requirements:

- The game should stop if a Tetrimino fills the highest row of the game board
- The player should be able to rotate each Tetrimino about its axis
- If a line is completed it should be removed and the pieces above should take its place

## Planning

![game-planning](https://i.imgur.com/ptzrpAE.png)

To start the planning I created an initial wireframe of how I wanted the game to be laid out - this initial wireframe I began to add small notes to help understand how the game logic would move & interact with the UI elements.

Below the initial wireframe I added two areas to break down how to tackle what I considered to be the two more complex requirements:

- **The player should be able to rotate each Tetrimino about its axis**
- **If a line is completed it should be removed and the pieces above should take its place**

To allow for the rotation of Teriminoes I decided it would be easiest to add 'padding' into the array that stored the shape of the block to allow for me to force the center of rotation to the position I needed for proper rotation

To check if lines were completed it felt most logical to me to check from the top down - this would mean we were not moving rows in a way that they might 'skip' being checked

## Build/Code Process

I decided my order for working on this project would be:

1. Initially work on the HTML to create the board/grid that would be interacted with
2. Develop the game logic in JavaScript
3. Improve styling and add some polish

To start I created a basic 10x20 grid and added logic to allow me to move a single 1x1 block around this grid - I then started refining this to fit within the bounds of 'Tetris' by adding the following logic:

- block to fall every x seconds (gravity)
- block to not be able to move horizontally out of bounds
- block to place when hitting the bottom of the grid or an already placed block

I decided to make use of a Block Class to allow me to tie methods to the 'Tetrominoes' themselves - since despite having different shapes, the tetrominoes would have the same logic for placing, rotating, etc.

```javascript
class Block {
  constructor(shape, x, y, style) {
    this.shape = shape;
    this.x = x;
    this.y = y;
    this.style = style;
  }

  blockCoords() {
    const indexes = [];
    this.shape.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell) {
          indexes.push({ y: this.y + rowIdx, x: this.x + colIdx });
        }
      });
    });
    return indexes;
  }

  rotate(direction) {
    let rows = this.shape.length;
    let cols = this.shape[0].length;
    let newShape = Array.from({ length: cols }, () => new Array(rows).fill(0));
    let tempShape = [...this.shape];

    tempShape.reverse().forEach((row, rowIdx) => {
      row.forEach((cell, cellIdx) => {
        newShape[cellIdx][rowIdx] = cell;
      });
    });

    return direction === "clockwise"
      ? newShape
      : newShape.reverse().map((row) => row.reverse());
  }
}
```

I created the blockCoords() method with the intent to allow me to have a coordinate of each block in the Tetrimino - since each Tetrimino is a 2d array I did this by looping through the rows, checking if the cell was not empty - and then adding the index of the row and column to the current x,y position of the Tetromino as a whole - this method would help with simplifying the process of checking collisions.

The rotate() method was created to allow for rotation in either direction - this works by creating an empty new Array and a temporary copy of our current array which is reversed. The method then iterates over each row and cell of the reversed copy placing each cell into its new position in our new Array - this completed our clockwise rotation - if the rotation was in a counterclockwise direction we then reverse each row and reverse the entire new Array to complete the counterclockwise rotation.

```javascript
function handleControls(event) {
  if (!inProgress) return;
  const key = event.key;
  const left = "ArrowLeft",
    up = "ArrowUp",
    right = "ArrowRight",
    down = "ArrowDown",
    z = "z";
  currentBlock.render();

  switch (key) {
    case up:
      rotatedCoords = currentBlock.rotate("clockwise");
      if (canBlockRotate(rotatedCoords)) currentBlock.shape = rotatedCoords;
      break;
    case z:
      rotatedCoords = currentBlock.rotate("anti-clockwise");
      if (canBlockRotate(rotatedCoords)) currentBlock.shape = rotatedCoords;
      break;
    case down:
      moveBlockDown();
      break;
    case left:
      if (canBlockMove(canCellMoveLeft, currentBlock)) currentBlock.x--;
      break;
    case right:
      if (canBlockMove(canCellMoveRight, currentBlock)) currentBlock.x++;
      break;
  }
  renderLanding();
  currentBlock.render();
}
```

For this project, I had a real focus on not nesting too much logic and trying to make use of functions to simplify my code. This handleControls function initially was very messy with lots of repeated, hard-to-understand code.

I first created a switch statement to check which of the game controls had been used - if 'Arrow up' or 'z' were used these were rotation controls - since rotation isn't always possible due to potential obstructions we would first check the 'potential' rotated coordinates to see if these were possible - if not there were certain amount of shifting we would try (this is referred to as kicking in Tetris) if a rotation was possible with a small shift in the position then the function canBlockRotate would implement that movement in the x direction to the current Tetrimino before the rotation took place.

For left and right movement I attempted to create a generic function to check if the blocks could move - this would take the current Tetrimino and a callback function which would be used to check the movement we wanted to take place.

For downward movement I called the moveBlockDown() function which acted as my game loop function:

```javascript
function moveBlockDown() {
  if (level !== Math.floor(score / 1500)) {
    level = Math.floor(score / 1500);
    incrementSpeed();
  }
  if (canBlockMove(canCellMoveDown, currentBlock)) {
    currentBlock.y++;
    renderLanding();
    currentBlock.render();
  } else {
    updateBoard();
    currentBlock.setNotActive();
    currentBlock = nextBlock;
    nextBlock = generateBlock();
    displayNextBlock();
    if (isGameOver()) {
      endGame();
    } else {
      renderLanding();
      currentBlock.render();
    }
  }
}
```

This function first checks the level to see if the speed should be incremented - before checking if the Tetrimino can be moved down (i.e. not at the bottom of the grid and no blocks below) - if the Tetrimino can be moved down we move it down - otherwise, we place the Tetrimino and update to a new Tetrimino that the user is controlling as well as updating the displayed Next Tetrimino. If the game is over due to new Tetriminos not being able to enter the board we end the game - this consists of displaying a field to enter a name before displaying a leaderboard.

## Challenges

```javascript
function renderLanding() {
  for (let i = currentBlock.y; i < HEIGHT; i++) {
    let dummy = new Block(currentBlock.shape, currentBlock.x, i, [
      currentBlock.style,
      "outline",
    ]);
    if (!canBlockMove(canCellMoveDown, dummy)) {
      dummy.render(true);
      break;
    }
  }
}
```

I wanted the functionality to show where the current block would land if left to fall - to do this I attempted to make use of my already existing ‘Block’ class - this became awkward as the Block class had been designed with only active blocks - I had to extend the functionality to allow me to pass an additional outline style to the block and meant a lot of methods had to be adjusted - looking back it might have made more sense to just create a function to work out the logic for this functionality as opposed to extending my already operational methods.

## Wins

I was very proud of the look and feel of the game - I think it looks and feels like a well-designed Tetris game that you could find online.

I was also very happy with the way I managed to achieve the block's rotations - since blocks have a specific center point of rotation this means they rotate in a certain way - I had worked out the logic for rotating my arrays but this wasn’t rotating them in the way that they rotate in Tetris. To achieve this I added some dummy blocks around to force the center of rotation to be where I needed it to be - this means my block layouts had some additional whitespace around the outside in some cases

```javascript
const TETROMINOS = [
  { layout: "0000.1111.0000.0000", style: "i-piece" },
  { layout: "100.111.000", style: "j-piece" },
  { layout: "001.111.000", style: "l-piece" },
  { layout: "11.11", style: "o-piece" },
  { layout: "011.110.000", style: "s-piece" },
  { layout: "010.111.000", style: "t-piece" },
  { layout: "110.011.000", style: "z-piece" },
];
```

I used a string to store my tetrominoes in a format that wouldn’t take too much space in my code - previously I had them stored as 2d arrays.

e.g. "100.111.000" = `[[1,0,0],[1,1,1],[0,0,0]]`

## Key Learnings

- A key learning I took from this is the importance of the planning phase - I think it can sound a bit cliche but you get out what you put in when it comes to planning. In a project like this, decisions you make early on can have a big impact further down the line so it’s really important to have an idea of what the project as a whole looks like and what is required before you make these decisions.

- Another takeaway I have is how much more confident I am in terms of JavaScript and interacting with the DOM specifically - I felt like I had a good understanding of creating basic standalone functions but didn’t have that experience of creating lots of functions working together to make a bigger project.

## Future Improvements

As a future improvement, I would’ve loved the game to have functionality on mobile - currently, the controls are only really set up to allow for arrow key inputs. I think the site could also be improved in terms of how it displays on mobile.
