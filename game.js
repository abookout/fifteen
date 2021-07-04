const DEFAULT_SIZE = 4;
const TIMER_PRECISION = 3;    // num. of displayed decimals
const SHUFFLE_RETRIES = 10;   // how many times to try shuffling until we give up

const DIRECTIONS = Object.freeze({
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
});

// A cell is one of (ROWS*COLS) div elements, and a tile is the "value"
//  (number) corresponding to one of those cells.
let cells = [];
// Numbers to show in each cell ordered left to right, top to bottom
let tiles = [];
let size = DEFAULT_SIZE;
let empty_tile = size * size - 1;
let playing = false;

// Create dom elements, populating cells and tiles lists
function createGrid() {
  const grid = document.getElementById("grid");

  for (let y = 0; y < size; y++) {
    let row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      row.appendChild(cell);
      cells.push(cell);
    }
    grid.appendChild(row);
  }
  tiles = [...Array(size * size).keys()];
}

// Remove all child elements of the grid (rows and cells)
function destroyGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  cells.length = tiles.length = 0;
}

// Draw numbers according to their positions in the tiles array
function draw() {
  console.assert(cells.length === tiles.length, cells, tiles);

  // Set cell's data according to the new tile value
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i],
      value = tiles[i];
    cell.dataset.tileNum = value + 1;
    if (value === size * size - 1) {
      cell.innerHTML = null;
      cell.className = "cell empty";
    } else {
      cell.innerHTML = value + 1;
      cell.className = "cell full";
    }
  }
}

// Swap two array elements in place, given their indices
function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Check if the player has got the tiles in the right spots
function checkBoard() {
  const compare = [...Array(size * size).keys()];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== compare[i]) return false;
  }

  return true;
}

// Shuffle randomly and check that the puzzle is solvable. If not,
//  shuffle some more. It fails 50% of the time.
function shuffle(tries) {
  if (tries === 0) {
    // The current board is unsolvable lol
    setInfoText("Have fun solving this one ;)");
    return;
  }

  //https://stackoverflow.com/a/12646864
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    swap(tiles, i, j);
  }

  if (checkBoard()) {
    // Shuffled and got the solution....
    shuffle(tries - 1);
  }

  //https://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/
  let num_inversions = 0;
  for (let a = 0; a < tiles.length - 1; a++) {
    for (let b = a + 1; b < tiles.length; b++) {
      const t_a = tiles[a];
      const t_b = tiles[b];
      if (t_a === empty_tile || t_b === empty_tile) continue;
      if (t_a > t_b) num_inversions++;
    }
  }
  const inversions_even = num_inversions % 2 === 0;

  if (size % 2 !== 0) {
    // size odd: puzzle is solvable if inversions is even
    if (inversions_even) {
      // Solvable
      return;
    } else {
      // Not solvable
      shuffle(tries - 1);
      return;
    }
  } else {
    // size even:
    //  inversions odd: solvable if the blank is on an even row from the bottom
    //  inversions even: solvable if the blank is on an odd row from the bottom
    //  Otherwise, puzzle is not solvable.
    const empty_index = tiles.indexOf(size * size - 1);
    const empty_row_from_bottom = size - Math.floor(empty_index / size);

    const blank_on_even = empty_row_from_bottom % 2 === 0;
    if (
      (!inversions_even && blank_on_even) ||
      (inversions_even && !blank_on_even)
    ) {
      // Solvable
      return;
    }
    // Not solvable
    shuffle(tries - 1);
    return;
  }
}

function move(direction) {
  const empty_index = tiles.indexOf(empty_tile);
  console.assert(empty_index !== -1);

  // Tile to move into empty spot
  let tile_index;
  switch (direction) {
    case DIRECTIONS.LEFT:
      if (empty_index % size === size - 1) return;
      tile_index = empty_index + 1;
      break;
    case DIRECTIONS.RIGHT:
      if (empty_index % size === 0) return;
      tile_index = empty_index - 1;
      break;
    case DIRECTIONS.UP:
      if (empty_index >= size * (size - 1)) return;
      tile_index = empty_index + size;
      break;
    case DIRECTIONS.DOWN:
      if (empty_index < size) return;
      tile_index = empty_index - size;
      break;
  }

  console.assert(tile_index !== undefined, tile_index);

  swap(tiles, tile_index, empty_index);
  draw();

  if (checkBoard()) {
    // Player wins!
    win();
  }
}

const timer_element = document.getElementById("timer");
let initial_time, timer_interval;

function startTimer() {
  if (timer_interval) clearInterval(timer_interval);
  initial_time = Date.now();

  timer_interval = setInterval(() => {
    timer_element.innerHTML = ((Date.now() - initial_time) / 1000).toFixed(
      TIMER_PRECISION
    );
  }, 20);
}

function stopTimer() {
  clearInterval(timer_interval);
}

function init(init_size = DEFAULT_SIZE) {
  size = init_size;
  empty_tile = size * size - 1;
  playing = false;
  timer_element.innerHTML = Number(0).toFixed(TIMER_PRECISION);

  destroyGrid();
  stopTimer();
  createGrid();
  draw();
  setInfoText("0-9 to resize or spacebar to start");
}

// Begin the game; clear info text, shuffle the board, and start the timer. 
function reset() {
  setInfoText(" ");
  shuffle(SHUFFLE_RETRIES);
  draw();
  startTimer();
  playing = true;
}

function win() {
  playing = false;
  stopTimer();
  setInfoText("Nice! Press space to play again!");
}

function setGridSize(new_size) {
  // Resize all cells
  document.querySelector(":root").style.setProperty("--grid_size", new_size);
}

function setInfoText(text) {
  document.getElementById("info").innerHTML = text;
}

document.onkeydown = (e) => {
  const keynum = Number(e.key);
  if (!playing) {
    // The only keys that are relevant are the arrows and numbers. 
    if (e.key !== " " && isNaN(keynum)) return;
  }

  if (e.key === " ") reset();
  else if (e.key === "ArrowLeft") move(DIRECTIONS.LEFT);
  else if (e.key === "ArrowRight") move(DIRECTIONS.RIGHT);
  else if (e.key === "ArrowUp") move(DIRECTIONS.UP);
  else if (e.key === "ArrowDown") move(DIRECTIONS.DOWN);
  else if (!isNaN(keynum) && 0 <= keynum < 10) {
    init(keynum);
    setGridSize(keynum);
  }
};

window.onload = () => init();
