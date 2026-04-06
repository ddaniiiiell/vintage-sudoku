document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('sudoku-board');
    const numpadEl = document.getElementById('numpad');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffDisplay = document.getElementById('diff-display');

    let cells = [];
    let selectedCellIndex = null;

    // Difficulty settings (number of empty cells to remove)
    const difficulties = {
        easy: 30,
        medium: 40,
        hard: 50,
        extreme: 60
    };

    function init() {
        createBoard();
        createNumpad();
        startNewGame();

        resetBtn.addEventListener('click', startNewGame);
        difficultySelect.addEventListener('change', (e) => {
            diffDisplay.textContent = e.target.value.toUpperCase();
            startNewGame();
        });
    }

    function createBoard() {
        boardEl.innerHTML = '';
        cells = [];
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', () => selectCell(i));
            boardEl.appendChild(cell);
            cells.push(cell);
        }
    }

    function createNumpad() {
        numpadEl.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.classList.add('num-btn');
            btn.textContent = i;
            btn.addEventListener('click', () => enterNumber(i));
            numpadEl.appendChild(btn);
        }
    }

    function selectCell(index) {
        if (selectedCellIndex !== null) {
            cells[selectedCellIndex].classList.remove('selected');
        }
        selectedCellIndex = index;
        cells[selectedCellIndex].classList.add('selected');
    }

    function enterNumber(num) {
        if (selectedCellIndex !== null) {
            const cell = cells[selectedCellIndex];
            if (!cell.classList.contains('given')) {
                cell.textContent = num;
            }
        }
    }

    function startNewGame() {
        const difficulty = difficultySelect.value;
        const blanksToCreate = difficulties[difficulty];
        
        // Clear board visually
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('given', 'selected');
        });
        selectedCellIndex = null;

        // Generate a valid board and remove numbers
        const board = generateBoard();
        removeNumbers(board, blanksToCreate);

        // Populate DOM
        for (let i = 0; i < 81; i++) {
            if (board[i] !== 0) {
                cells[i].textContent = board[i];
                cells[i].classList.add('given');
            }
        }
    }

    // --- Basic Sudoku Generator ---
    function generateBoard() {
        const board = new Array(81).fill(0);
        solve(board);
        return board;
    }

    function solve(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                // Shuffle numbers 1-9 to ensure random boards
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (let num of nums) {
                    if (isValid(board, i, num)) {
                        board[i] = num;
                        if (solve(board)) return true;
                        board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    function isValid(board, index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 9; i++) {
            if (board[row * 9 + i] === num) return false; // Check row
            if (board[i * 9 + col] === num) return false; // Check col
            
            // Check 3x3 box
            const boxRow = startRow + Math.floor(i / 3);
            const boxCol = startCol + (i % 3);
            if (board[boxRow * 9 + boxCol] === num) return false;
        }
        return true;
    }

    function removeNumbers(board, count) {
        let removed = 0;
        while (removed < count) {
            const index = Math.floor(Math.random() * 81);
            if (board[index] !== 0) {
                board[index] = 0;
                removed++;
            }
        }
    }

    init();
});