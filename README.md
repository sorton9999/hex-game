Hexel 2026 -- A simple hex traversal game developed with React

This game was vibe-coded using AI tools.  Nothing more than a search term entered into vanilla Google.  I asked a simple question, "How do you implement a hex-based gameboard and what development framework will work best?".  I continued asking questions and following prompts given by the AI assistant and came up with this game.

I took my years of experience in software engineering and working with general software algorithms and came up with this implementation in a language I have next to no experience in.  It was a curious exercise that on its surface came out quite well.  The way I came up with this
implementation was really quite by accident.  It started with a simple query and by using AI prompts and additional queries it morphed into something I didn't start out to make.

So this is a simple hex game.  You use keyboard arrows to move a hex tile located at the bottom of a hex gameboard to a goal at the opposite end of the board.  While moving the tile, the gameboard has obstacles to avoid.  These obstacles consist of immovable hex walls and randomly flashing hex tiles.  Your fastest time and least number of collisions are scored.

There is a difficulty level that can be set to make the game more challenging.

See if you can better your previous high score.

--- Screenshots ---

(Hexel 2026 v.1)
![Hexel 2026 v.1](/../screenshots/Hexel.v.1-start.png?raw=true "Hexel 2026 v.1")


(Hexel 2026 v.2)
![Hexel 2026 v.1](/../screenshots/Hexel.v.2-start.png?raw=true "Hexel 2026 v.2")


--- ChangeLog ---

02/14/2026 -- v.2.2:
  1. Upgraded sounds and added new sound files
  2. Added intro button to start game and activate sounds
  3. Fixed GOAL and START labels

02/07/2026 -- v2.1:
  1. Introduced increasing the number of walls in response to increasing difficulty selections
  2. Fixed the game tile movement
  3. Increased the spawn rate of the obstacle tiles for the elite difficulty setting

02/01/2026 -- v.2:
  1. New walls replacing blocking hex tiles
  2. Better difficulty algorithm
  3. Additional labels for things

01/31/2026 -- v.1:
  1. Provides 3 levels of difficulty -- Easy, Hard, Elite
  2. Scoring for the recently ended game -- Time and # Hits
  3. Simple sound effects when bumping into obstacles and reaching the goal

Proposed additions for v.2:
1. Change blockers from using whole hex tiles to walls using individual hex segments [DONE]
2. Additional blocker walls with increasing difficulty [DONE] (investigate moving walls)
3. Different gameboard sizes
4. Better sound effects
5. Lighting effects
6. Randomized start and end points (investigate moving end goal)


