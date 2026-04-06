document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('sudoku-board');
    const numpadEl = document.getElementById('numpad');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffDisplay = document.getElementById('diff-display');
    const correctDisplay = document.getElementById('correct-display');
    const mistakeDisplay = document.getElementById('mistake-display');
    const victoryScreen = document.getElementById('victory-screen');
    const newGameBtn = document.getElementById('new-game-btn');

    let cells = [];
    let selectedCellIndex = null;
    let solvedBoard = []; 
    let correctCount = 0;
    let mistakeCount = 0;
    let targetCorrectCount = 0; // Tracks how many blanks exist in the current puzzle
    
    const difficulties = {
        easy: 30,
        medium: 40,
        hard: 50,
        extreme: 60
    };

    difficultySelect.addEventListener('change', (e) => {
            diffDisplay.textContent = e.target.value.toUpperCase();
            startNewGame();
        });

        // New listener for the victory screen button
        newGameBtn.addEventListener('click', startNewGame);

        document.addEventListener('keydown', handleKeyPress);

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
        // If clicking the already selected box, unselect it
        if (selectedCellIndex === index) {
            cells[selectedCellIndex].classList.remove('selected');
            selectedCellIndex = null;
            return;
        }

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
                if (value === '') {
                    cell.textContent = '';
                    cell.classList.remove('user-input');
                    return;
                }

                if (parseInt(value) === solvedBoard[selectedCellIndex]) {
                    // Correct answer
                    cell.textContent = value;
                    cell.classList.add('user-input');
                    
                    cell.classList.remove('selected');
                    selectedCellIndex = null;

                    // Update correct counter
                    correctCount++;
                    correctDisplay.textContent = `${correctCount} CORRECT`;

                    // Check for win condition
                    if (correctCount === targetCorrectCount) {
                        setTimeout(() => {
                            boardEl.classList.add('hidden');
                            numpadEl.classList.add('hidden');
                            victoryScreen.classList.remove('hidden');
                        }, 500); // 500ms delay before showing victory screen
                    }

                } else {
                    // Incorrect answer
                    cell.textContent = ''; 
                    cell.classList.remove('user-input');
                    
                    cell.classList.remove('rumble'); 
                    void cell.offsetWidth; 
                    cell.classList.add('rumble');

                    // Update mistake counter
                    mistakeCount++;
                    mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;
                }
            }
        }
    }

    function startNewGame() {
        const difficulty = difficultySelect.value;
        targetCorrectCount = difficulties[difficulty]; // Set the win condition
        
        // Reset UI visibility
        boardEl.classList.remove('hidden');
        numpadEl.classList.remove('hidden');
        victoryScreen.classList.add('hidden');

        // Reset counters
        correctCount = 0;
        mistakeCount = 0;
        correctDisplay.textContent = `${correctCount} CORRECT`;
        mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;

        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('given', 'selected', 'user-input'); 
        });
        selectedCellIndex = null;

        const board = generateBoard();
        solvedBoard = [...board]; 
        removeNumbers(board, targetCorrectCount);

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