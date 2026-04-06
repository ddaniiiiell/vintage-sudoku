/* script.js */

// --- Global Variables and Game State ---
let currentDifficulty = 'easy';
let prefilledBoard = [];
let userBoard = [];
const GRID_SIZE = 9;

// A basic solved Sudoku board for "Easy" difficulty. For other levels, we can derive new boards.
const solvedBaseBoard = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

// Determine number of cells to remove for each difficulty level
const difficultySettings = {
    'easy': 40,
    'medium': 50,
    'hard': 60
};

// --- DOM Elements ---
const gridElement = document.getElementById('sudoku-grid');
const resetBtn = document.getElementById('reset-button');
const difficultyBtns = document.querySelectorAll('.diff-btn');
let selectedCell = null;

// --- Helper Functions ---

function deepCopyGrid(grid) {
    return grid.map(row => [...row]);
}

// Fisher-Yates shuffle for a random set of cell indices
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Generate an initial board based on difficulty from a pre-solved one
function generateInitialBoard(difficulty) {
    prefilledBoard = deepCopyGrid(solvedBaseBoard);
    userBoard = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));

    const totalCells = GRID_SIZE * GRID_SIZE;
    const cellsToClear = difficultySettings[difficulty];
    
    // Create an array of 0-80 indices and shuffle them
    const indices = Array.from({length: totalCells}, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    const cellsToClearList = shuffledIndices.slice(0, cellsToClear);

    // Clear cells from both boards to start game
    cellsToClearList.forEach(index => {
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        prefilledBoard[row][col] = 0;
    });

    // Populate user board with initial numbers
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (prefilledBoard[r][c] !== 0) {
                userBoard[r][c] = prefilledBoard[r][c];
            }
        }
    }
}

// Clear visual effects from grid cells
function clearVisualEffects() {
    if (selectedCell) {
        selectedCell.classList.remove('selected', 'editable-active');
        selectedCell = null;
    }
}

// Render the entire grid from the current `userBoard` state
function renderGrid() {
    gridElement.innerHTML = ''; // Clear current grid

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('sudoku-cell');
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            const valueSpan = document.createElement('span');
            valueSpan.classList.add('sudoku-cell-content');
            
            if (prefilledBoard[r][c] !== 0) {
                cellDiv.classList.add('prefilled');
                valueSpan.textContent = prefilledBoard[r][c];
            } else if (userBoard[r][c] !== 0) {
                valueSpan.textContent = userBoard[r][c];
            }

            cellDiv.appendChild(valueSpan);
            gridElement.appendChild(cellDiv);
        }
    }
}

// Check if a number can be placed in a given cell according to Sudoku rules
function isValidMove(row, col, num) {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
        if (userBoard[row][c] === num && c !== col) return false;
    }
    // Check col
    for (let r = 0; r < GRID_SIZE; r++) {
        if (userBoard[r][col] === num && r !== row) return false;
    }
    // Check 3x3 block
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
        for (let c = blockCol; c < blockCol + 3; c++) {
            if (userBoard[r][c] === num && (r !== row || c !== col)) return false;
        }
    }
    return true;
}

// Check if the current user board is a valid and full solution
function isGameWon() {
    // Check all cells are filled
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (userBoard[r][c] === 0) return false;
        }
    }

    // Check all constraints on the full board (simple but effective for a completed board)
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const num = userBoard[r][c];
            // Clear the cell temporarily for validation logic
            userBoard[r][c] = 0;
            if (!isValidMove(r, c, num)) {
                userBoard[r][c] = num; // restore
                return false;
            }
            userBoard[r][c] = num; // restore
        }
    }
    return true;
}

// --- Interaction Logic ---

// Set the active difficulty button and regenerate board
function setDifficulty(newDifficulty) {
    if (currentDifficulty === newDifficulty) return;
    
    currentDifficulty = newDifficulty;
    difficultyBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.diff-btn[data-difficulty="${currentDifficulty}"]`).classList.add('active');

    resetBoard();
}

// Handle cell selection
function handleCellClick(event) {
    const clickedCell = event.target.closest('.sudoku-cell');
    
    if (!clickedCell || clickedCell.classList.contains('prefilled')) {
        clearVisualEffects();
        return;
    }

    if (selectedCell === clickedCell) {
        // Double click/tap - enter 'editable' mode
        selectedCell.classList.toggle('editable-active');
    } else {
        clearVisualEffects();
        selectedCell = clickedCell;
        selectedCell.classList.add('selected');
    }
}

// Handle keyboard input for selecting a cell and typing numbers
function handleKeyDown(event) {
    if (!selectedCell) return;

    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);

    if (selectedCell.classList.contains('editable-active')) {
        // Cell is in 'input' mode: Handle number entry
        const isDigit = /^[1-9]$/.test(event.key);
        const isDelete = ['Backspace', 'Delete', '0'].includes(event.key);

        if (isDigit) {
            const num = parseInt(event.key);
            userBoard[row][col] = num;
            renderGrid(); // Redraw grid with new number
            clearVisualEffects(); // Clear all state after input

            if (isGameWon()) {
                setTimeout(() => alert('You solved it! A moment of clarity.'), 10);
            }
        } else if (isDelete) {
            userBoard[row][col] = 0;
            renderGrid();
            clearVisualEffects();
        }
        
    } else if (event.key.startsWith('Arrow')) {
        // Cell is only highlighted: Handle navigation
        let nextRow = row, nextCol = col;
        switch (event.key) {
            case 'ArrowUp': nextRow = Math.max(0, row - 1); break;
            case 'ArrowDown': nextRow = Math.min(GRID_SIZE - 1, row + 1); break;
            case 'ArrowLeft': nextCol = Math.max(0, col - 1); break;
            case 'ArrowRight': nextCol = Math.min(GRID_SIZE - 1, col + 1); break;
        }
        
        // Select new cell with same state
        const nextCell = document.querySelector(`.sudoku-cell[data-row="${nextRow}"][data-col="${nextCol}"]`);
        if (nextCell) {
            nextCell.click();
        }
        event.preventDefault(); // Prevent page scroll
    }
}

// Reset the entire board to its starting state for current difficulty
function resetBoard() {
    clearVisualEffects();
    generateInitialBoard(currentDifficulty);
    renderGrid();
}

// --- Initialization ---
function init() {
    generateInitialBoard(currentDifficulty);
    renderGrid();

    // Event Listeners
    difficultyBtns.forEach(btn => btn.addEventListener('click', (e) => setDifficulty(e.target.dataset.difficulty)));
    resetBtn.addEventListener('click', resetBoard);
    gridElement.addEventListener('click', handleCellClick);
    document.addEventListener('keydown', handleKeyDown);
}

// Start game
init();