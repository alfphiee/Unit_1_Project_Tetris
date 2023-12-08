# Tetris

## HTML NEEDS:

- Game Heading
- Grid 10\*20
- Button to start game
- Button to reset game(?)

## HTML NICE TO HAVE:

- Area showing the next tetromino
- Leaderboard

## CSS NEEDS:

- Styling for each Tetromino
- Basic page styling
- Grid Styling

## CSS NICE TO HAVE:

- Preview style to be applied where the block is currently going to fall

## Basic Requirements for Tetris:

- When Board is filled game ends - not necessarily every block filled
- Tetrominos can be rotated & moved
  - Can not be moved outside of the grid
  - Rotations must be able to handle grid edge
- Completion of a row should shift above rows down and increment score
- 7 Different Tetromino pieces
  - All with the logic to rotate around their center

## Additional Enhancmenets

- Leaderboard
- Increasing difficulty
  - Increasing Speed
  - Ability to choose smaller starting board?

## Questions to think about

Is there ever a time I need to differentiate between blocks once they are placed?

My current thinking is no - unless there is some more complicated logic to the falling of blocks than I currently understand

How do I implement the blocks falling at a set rate and how do I adjust this speed?

Will need to do further research around this

How do I detect if a block has reached a point it should settle?

Check blocks below each block to see if element there
