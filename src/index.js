// Note: if you wanna change the size, also change grid_size in style.css.
const SIZE = 4;
const EMPTY_TILE = SIZE * SIZE - 1;

const DIRECTIONS = Object.freeze({
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UP: "UP",
  DOWN: "DOWN",
});

// A cell is one of (ROWS*COLS) div elements, and a tile is the "value"
//  (number) corresponding to one of those cells.
const cells = [];
const tiles = [...Array(SIZE * SIZE).keys()];
let playing = false;

// Create dom elements, populating cells list. Intended to not be reordered.
function createGrid() {
  const grid = document.getElementById("grid");
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const index = x + y * SIZE;
      const cell = document.createElement("div");
      cell.className = "cell";
      setCellData(cell, index);

      grid.appendChild(cell);
      cells.push(cell);
    }
  }
}

// Draw numbers according to their positions in the tiles array
function draw() {
  console.assert(cells.length === tiles.length, cells, tiles);

  for (let i = 0; i < cells.length; i++) {
    setCellData(cells[i], tiles[i]);
  }
}

// Set cell's data according to the new tile value
function setCellData(cell, value) {
  cell.dataset.tileNum = value + 1;
  cell.innerHTML = value === SIZE * SIZE - 1 ? null : value + 1;
}

// Swap two array elements in place, given their indices
function swap(arr, i, j) {
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Check if the player has got the tiles in the right spots
function checkBoard() {
  const compare = [...Array(SIZE * SIZE).keys()];
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
      if (t_a === EMPTY_TILE || t_b === EMPTY_TILE) continue;
      if (t_a > t_b) num_inversions++;
    }
  }
  const inversions_even = num_inversions % 2 === 0;

  if (SIZE % 2 !== 0) {
    // SIZE odd: puzzle is solvable if inversions is even
    if (inversions_even) {
      // Solvable
      return;
    } else {
      // Not solvable
      shuffle(tries - 1);
      return;
    }
  } else {
    // SIZE even:
    //  inversions odd: solvable if the blank is on an even row from the bottom
    //  inversions even: solvable if the blank is on an odd row from the bottom
    //  Otherwise, puzzle is not solvable.
    const empty_index = tiles.indexOf(SIZE * SIZE - 1);
    const empty_row_from_bottom = SIZE - Math.floor(empty_index / SIZE);

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
  const empty_index = tiles.indexOf(EMPTY_TILE);
  console.assert(empty_index !== -1);

  let tile_index; // Tile to move
  switch (direction) {
    case DIRECTIONS.LEFT:
      if (empty_index % SIZE === SIZE - 1) return;
      tile_index = empty_index + 1;
      break;
    case DIRECTIONS.RIGHT:
      if (empty_index % SIZE === 0) return;
      tile_index = empty_index - 1;
      break;
    case DIRECTIONS.UP:
      if (empty_index >= SIZE * (SIZE - 1)) return;
      tile_index = empty_index + SIZE;
      break;
    case DIRECTIONS.DOWN:
      if (empty_index < SIZE) return;
      tile_index = empty_index - SIZE;
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
    timer_element.innerHTML = ((Date.now() - initial_time) / 1000).toFixed(1);
  }, 50);
}

function win() {
  playing = false;
  clearInterval(timer_interval);
  setInfoText("Nice! Press space to play again!");
}

function reset() {
  setInfoText(" ");
  shuffle(10);
  draw();
  startTimer();
  playing = true;
}

function setInfoText(text) {
  document.getElementById("info").innerHTML = text;
}

document.onkeydown = (e) => {
  if (!playing && e.key !== " ") return;

  switch (e.key) {
    case " ":
      reset();
      break;
    case "ArrowLeft":
      move(DIRECTIONS.LEFT);
      break;
    case "ArrowRight":
      move(DIRECTIONS.RIGHT);
      break;
    case "ArrowUp":
      move(DIRECTIONS.UP);
      break;
    case "ArrowDown":
      move(DIRECTIONS.DOWN);
      break;
  }
};

window.onload = () => {
  createGrid();
  setInfoText("Spacebar to start");
};
