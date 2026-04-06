document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('sudoku-board');
    const numpadEl = document.getElementById('numpad');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffDisplay = document.getElementById('diff-display');

    let cells = [];
    let selectedCellIndex = null;
    let solvedBoard = []; // Add this to store the solution
    
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

        // Keyboard support for typing numbers and deleting
        document.addEventListener('keydown', handleKeyPress);
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
        // Numbers 1-9
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.classList.add('num-btn');
            btn.textContent = i;
            btn.addEventListener('click', () => enterNumber(i.toString()));
            numpadEl.appendChild(btn);
        }
        // Erase Button
        const eraseBtn = document.createElement('button');
        eraseBtn.classList.add('num-btn');
        eraseBtn.textContent = 'x'; // Changed from ⌫ to x
        eraseBtn.addEventListener('click', () => enterNumber(''));
        numpadEl.appendChild(eraseBtn);
    }

    function selectCell(index) {
        if (selectedCellIndex !== null) {
            cells[selectedCellIndex].classList.remove('selected');
        }
        selectedCellIndex = index;
        cells[selectedCellIndex].classList.add('selected');
    }

    function handleKeyPress(e) {
        if (selectedCellIndex === null) return;
        
        if (e.key >= '1' && e.key <= '9') {
            enterNumber(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            enterNumber('');
        }
    }

    function enterNumber(value) {
        if (selectedCellIndex !== null) {
            const cell = cells[selectedCellIndex];
            
            if (!cell.classList.contains('given')) {
                // Handle the erase button
                if (value === '') {
                    cell.textContent = '';
                    cell.classList.remove('user-input');
                    return;
                }

                // Check if the input matches the background solution
                if (parseInt(value) === solvedBoard[selectedCellIndex]) {
                    // Correct answer
                    cell.textContent = value;
                    cell.classList.add('user-input');
                    
                    // Deselect the box
                    cell.classList.remove('selected');
                    selectedCellIndex = null;
                } else {
                    // Incorrect answer
                    cell.textContent = ''; // Delete the input
                    cell.classList.remove('user-input');
                    
                    // Trigger the rumble animation
                    cell.classList.remove('rumble'); // Reset animation if clicked quickly
                    void cell.offsetWidth; // Trigger reflow to restart animation
                    cell.classList.add('rumble');
                }
            }
        }
    }

    function startNewGame() {
        const difficulty = difficultySelect.value;
        const blanksToCreate = difficulties[difficulty];
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('given', 'selected', 'user-input'); // Also clear user-input class
        });
        selectedCellIndex = null;

        const board = generateBoard();
        solvedBoard = [...board]; // Save the complete solution in the background
        removeNumbers(board, blanksToCreate);

        for (let i = 0; i < 81; i++) {
            if (board[i] !== 0) {
                cells[i].textContent = board[i];
                cells[i].classList.add('given');
            }
        }
    }

    function generateBoard() {
        const board = new Array(81).fill(0);
        solve(board);
        return board;
    }

    function solve(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
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
            if (board[row * 9 + i] === num) return false;
            if (board[i * 9 + col] === num) return false;
            
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