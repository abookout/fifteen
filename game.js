const DEFAULT_SIZE = 4;
const TIMER_PRECISION = 3;    // num. of displayed decimals for timer
const SHUFFLE_RETRIES = 10;   // how many times to try shuffling until we give up

const DIRECTIONS = Object.freeze({
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
});

const BACKGROUND_COLORS = Object.freeze({
  WHITE: "#fff",
  GREEN: "#EBF3CB",
  RED: "#F3D2CB",
})

// A cell is one of (ROWS*COLS) div elements, and a tile is the "value"
//  (number) corresponding to one of those cells.
let cells = [];
// Numbers to show in each cell ordered left to right, top to bottom
let tiles = [];
let size = DEFAULT_SIZE;
let empty_tile = size * size - 1;
let playing = false;

// Store size select buttons to update style when one is selected
let size_select_btns = [];

// Create dom elements, populating cells and tiles lists
function createGrid() {
  const grid = document.getElementById("grid");

  for (let y = 0; y < size; y++) {
    let row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.onmousedown = cell.ontouchstart = (e) => {
        e.preventDefault();
        clickMove(x + y * size);
      }
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
    setBackgroundColor(BACKGROUND_COLORS.RED);
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

// Attempt to move a tile into the empty spot in the given direction
function keyMove(direction) {
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

// Attempt to move the tile at tile_index into the empty spot
function clickMove(tile_index) {
  if (!playing) return;
  const empty_index = tiles.indexOf(empty_tile);
  console.assert(empty_index !== -1);

  // Check that the clicked tile and empty tile are adjacent
  if (empty_index !== tile_index - 1
    && empty_index !== tile_index + 1
    && empty_index !== tile_index + size
    && empty_index !== tile_index - size) {
    return;
  }

  swap(tiles, tile_index, empty_index);
  draw();

  if (checkBoard()) {
    // Player wins!
    win();
  }
}

// Timer functions

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

// Game flow functions

function init(init_size = DEFAULT_SIZE) {
  size = init_size;
  empty_tile = size * size - 1;
  playing = false;
  timer_element.innerHTML = Number(0).toFixed(TIMER_PRECISION);

  setBackgroundColor(BACKGROUND_COLORS.WHITE);
  destroyGrid();
  stopTimer();
  createGrid();
  draw();
}

// Begin the game; clear info text, shuffle the board, and start the timer. 
function reset() {
  setBackgroundColor(BACKGROUND_COLORS.WHITE);
  setInfoText(" ");
  shuffle(SHUFFLE_RETRIES);
  draw();
  startTimer();
  playing = true;
}

function win() {
  playing = false;
  stopTimer();
  setBackgroundColor(BACKGROUND_COLORS.GREEN);
}

function setGridSize(new_size) {
  // Resize all cells
  document.querySelector(":root").style.setProperty("--grid_size", new_size);
}

function setInfoText(text) {
  document.getElementById("info").innerHTML = text;
}

function setBackgroundColor(color) {
  document.body.style.background = color;
}

function onKeyDown(e) {
  const keynum = Number(e.key);
  if (!playing) {
    // The only keys that are relevant are the arrows and numbers. 
    if (e.key !== " " && isNaN(keynum)) return;
  }

  if (e.key === " ") reset();
  else if (e.key === "ArrowLeft") keyMove(DIRECTIONS.LEFT);
  else if (e.key === "ArrowRight") keyMove(DIRECTIONS.RIGHT);
  else if (e.key === "ArrowUp") keyMove(DIRECTIONS.UP);
  else if (e.key === "ArrowDown") keyMove(DIRECTIONS.DOWN);
  else if (!isNaN(keynum) && 0 <= keynum < 10) {
    onSizeSelected(keynum);
  }
}

function onSizeSelected(tile) {
  init(tile);
  setGridSize(tile);
  for (let btn of size_select_btns) {
    if (btn.innerHTML === String(tile)) {
      btn.className = "size-select-btn selected";
    } else {
      btn.className = "size-select-btn";
    }
  }
}

function onLoad() {
  document.getElementById("start-btn").onclick = reset;

  // Create size select button elements
  const size_select = document.getElementById("size-select");
  // Hardcoded 10 for allowing sizes 0-9
  for (let i = 0; i < 10; i++) {
    let btn = document.createElement("div");
    btn.className = "size-select-btn" + (i === size ? " selected" : "");
    btn.innerHTML = i;
    btn.onclick = () => onSizeSelected(i);

    size_select.appendChild(btn);
    size_select_btns.push(btn);
  }

  // Initialize board
  init();
}

document.onkeydown = onKeyDown;
window.onload = onLoad;