document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const boardEl = document.getElementById('sudoku-board');
    const numpadEl = document.getElementById('numpad');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffDisplay = document.getElementById('diff-display');
    const correctDisplay = document.getElementById('correct-display');
    const mistakeDisplay = document.getElementById('mistake-display');
    const victoryScreen = document.getElementById('victory-screen');
    const newGameBtn = document.getElementById('new-game-btn');
    
    // Stats DOM Elements
    const statsBtn = document.getElementById('stats-btn');
    const statsScreen = document.getElementById('stats-screen');
    const closeStatsBtn = document.getElementById('close-stats-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');

    // Game Variables
    let cells = [];
    let selectedCellIndex = null;
    let solvedBoard = [];
    let correctCount = 0;
    let mistakeCount = 0;
    let targetCorrectCount = 0;

    // Stats Object
    let stats = {
        easy: 0,
        medium: 0,
        hard: 0,
        extreme: 0,
        totalCorrect: 0,
        totalMistakes: 0
    };

    const difficulties = {
        easy: 30,
        medium: 40,
        hard: 50,
        extreme: 60
    };

    function init() {
        loadStats();
        createBoard();
        createNumpad();
        startNewGame();

        // Listeners
        resetBtn.addEventListener('click', startNewGame);
        difficultySelect.addEventListener('change', (e) => {
            diffDisplay.textContent = e.target.value.toUpperCase();
            startNewGame();
        });
        newGameBtn.addEventListener('click', startNewGame);
        document.addEventListener('keydown', handleKeyPress);

        // Stats Listeners
        statsBtn.addEventListener('click', showStats);
        closeStatsBtn.addEventListener('click', hideStats);
        resetStatsBtn.addEventListener('click', resetStats);
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
            btn.addEventListener('click', () => enterNumber(i.toString()));
            numpadEl.appendChild(btn);
        }
        const eraseBtn = document.createElement('button');
        eraseBtn.classList.add('num-btn');
        eraseBtn.textContent = 'x';
        eraseBtn.addEventListener('click', () => enterNumber(''));
        numpadEl.appendChild(eraseBtn);
    }

    function clearHighlights() {
        cells.forEach(cell => {
            cell.classList.remove('selected', 'highlight-axis');
        });
    }

    function selectCell(index) {
        // Prevent selecting given numbers or already correct inputs
        if (cells[index].classList.contains('given') || cells[index].classList.contains('user-input')) {
            clearHighlights();
            selectedCellIndex = null;
            return;
        }

        if (selectedCellIndex === index) {
            clearHighlights();
            selectedCellIndex = null;
            return;
        }

        clearHighlights();
        selectedCellIndex = index;
        cells[selectedCellIndex].classList.add('selected');

        // Apply Row and Column Highlights
        const row = Math.floor(index / 9);
        const col = index % 9;

        cells.forEach((cell, i) => {
            const r = Math.floor(i / 9);
            const c = i % 9;
            if (r === row || c === col) {
                cell.classList.add('highlight-axis');
            }
        });
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
            
            if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) {
                if (value === '') {
                    cell.textContent = '';
                    return;
                }

                if (parseInt(value) === solvedBoard[selectedCellIndex]) {
                    // Correct answer
                    cell.textContent = value;
                    cell.classList.add('user-input');
                    clearHighlights();
                    selectedCellIndex = null;

                    correctCount++;
                    correctDisplay.textContent = `${correctCount} CORRECT`;

                    // Update and save lifetime stats
                    stats.totalCorrect++;
                    saveStats();

                    if (correctCount === targetCorrectCount) {
                        handleWin();
                    }

                } else {
                    // Incorrect answer
                    cell.textContent = ''; 
                    
                    boardEl.classList.remove('rumble'); 
                    void boardEl.offsetWidth; 
                    boardEl.classList.add('rumble');

                    mistakeCount++;
                    mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;

                    // Update and save lifetime stats
                    stats.totalMistakes++;
                    saveStats();
                }
            }
        }
    }

    function handleWin() {
        // Update stats
        const currentDiff = difficultySelect.value;
        stats[currentDiff]++;
        saveStats();

        setTimeout(() => {
            boardEl.classList.add('hidden');
            numpadEl.classList.add('hidden');
            statsScreen.classList.add('hidden');
            victoryScreen.classList.remove('hidden');
        }, 500);
    }

    function startNewGame() {
        const difficulty = difficultySelect.value;
        targetCorrectCount = difficulties[difficulty]; 
        
        boardEl.classList.remove('hidden');
        numpadEl.classList.remove('hidden');
        victoryScreen.classList.add('hidden');
        statsScreen.classList.add('hidden');

        correctCount = 0;
        mistakeCount = 0;
        correctDisplay.textContent = `${correctCount} CORRECT`;
        mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;

        clearHighlights();
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('given', 'user-input'); 
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

    // --- Stats Logic ---
    function loadStats() {
        const savedStats = localStorage.getItem('sudokuStats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            // This merges the old saved stats with the new default stats 
            // so totalCorrect and totalMistakes don't break if they are missing
            stats = { ...stats, ...parsed };
        }
    }

    function saveStats() {
        localStorage.setItem('sudokuStats', JSON.stringify(stats));
    }

    function showStats() {
        document.getElementById('stat-easy').textContent = stats.easy;
        document.getElementById('stat-medium').textContent = stats.medium;
        document.getElementById('stat-hard').textContent = stats.hard;
        document.getElementById('stat-extreme').textContent = stats.extreme;
        document.getElementById('stat-correct').textContent = stats.totalCorrect;
        document.getElementById('stat-mistakes').textContent = stats.totalMistakes;

        boardEl.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        statsScreen.classList.remove('hidden');
    }

    function hideStats() {
        statsScreen.classList.add('hidden');
        if (correctCount !== targetCorrectCount) {
            boardEl.classList.remove('hidden');
        } else {
            victoryScreen.classList.remove('hidden');
        }
    }

    function resetStats() {
        if(confirm("Are you sure you want to clear your stats?")) {
            stats = { easy: 0, medium: 0, hard: 0, extreme: 0, totalCorrect: 0, totalMistakes: 0 };
            saveStats();
            showStats(); 
        }
    }

    // --- Generator Logic ---
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