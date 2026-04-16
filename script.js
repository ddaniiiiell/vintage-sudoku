document.addEventListener('DOMContentLoaded', () => {
    const boardEl = document.getElementById('sudoku-board');
    const numpadEl = document.getElementById('numpad');
    const resetBtn = document.getElementById('reset-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const diffDisplay = document.getElementById('diff-display');
    const correctDisplay = document.getElementById('correct-display');
    const mistakeDisplay = document.getElementById('mistake-display');
    const extremeWarning = document.getElementById('extreme-warning');
    
    const victoryScreen = document.getElementById('victory-screen');
    const victoryTitle = document.getElementById('victory-title'); 
    const gameOverScreen = document.getElementById('game-over-screen');
    const newGameBtn = document.getElementById('new-game-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    
    const statsBtn = document.getElementById('stats-btn');
    const statsScreen = document.getElementById('stats-screen');
    const closeStatsBtn = document.getElementById('close-stats-btn');
    const resetStatsBtn = document.getElementById('reset-stats-btn');

    const infoBtn = document.getElementById('info-btn');
    const infoScreen = document.getElementById('info-screen');
    const closeInfoBtn = document.getElementById('close-info-btn');

    const assistantBtn = document.getElementById('assistant-btn');
    const stencilBtn = document.getElementById('stencil-btn');
    const eraserBtn = document.getElementById('eraser-btn');

    let cells = [];
    let selectedCellIndex = null;
    let solvedBoard = [];
    let correctCount = 0;
    let mistakeCount = 0;
    let targetCorrectCount = 0;
    
    let isAssistantActive = false;
    let isStencilActive = false;

    let stats = { easy: 0, medium: 0, hard: 0, extreme: 0, totalCorrect: 0, totalMistakes: 0 };
    const difficulties = { easy: 30, medium: 40, hard: 50, extreme: 60 };

    function init() {
        loadStats();
        createBoard();
        createNumpad();

        // Try to load a saved game; if none exists, start a new one
        if (!loadGameState()) {
            startNewGame();
        }

        resetBtn.addEventListener('click', startNewGame);
        
        difficultySelect.addEventListener('change', (e) => {
            diffDisplay.textContent = e.target.value.toUpperCase();
            startNewGame();
        });
        
        newGameBtn.addEventListener('click', startNewGame);
        tryAgainBtn.addEventListener('click', startNewGame);
        document.addEventListener('keydown', handleKeyPress);

        statsBtn.addEventListener('click', showStats);
        closeStatsBtn.addEventListener('click', hideStats);
        resetStatsBtn.addEventListener('click', resetStats);

        infoBtn.addEventListener('click', showInfo);
        closeInfoBtn.addEventListener('click', hideInfo);

        assistantBtn.addEventListener('click', () => {
            isAssistantActive = !isAssistantActive;
            assistantBtn.classList.toggle('active-mode', isAssistantActive);
            clearHighlights();
            if (selectedCellIndex !== null) selectCell(selectedCellIndex);
        });

        stencilBtn.addEventListener('click', () => {
            isStencilActive = !isStencilActive;
            stencilBtn.classList.toggle('active-mode', isStencilActive);
        });

        eraserBtn.addEventListener('click', () => {
            cells.forEach(cell => {
                if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) {
                    const container = cell.querySelector('.stencil-container');
                    if (container) {
                        container.querySelectorAll('.stencil-num').forEach(num => num.textContent = '');
                    }
                }
            });
            saveGameState(); 
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
            btn.addEventListener('click', () => enterNumber(i.toString()));
            numpadEl.appendChild(btn);
        }
    }

    function clearHighlights() {
        cells.forEach(cell => cell.classList.remove('selected', 'highlight-axis', 'highlight-match'));
    }

    function selectCell(index) {
        const cell = cells[index];
        const isFilled = cell.classList.contains('given') || cell.classList.contains('user-input');

        if (isFilled && !isAssistantActive) {
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
        cell.classList.add('selected');

        const row = Math.floor(index / 9);
        const col = index % 9;

        cells.forEach((c, i) => {
            const r = Math.floor(i / 9);
            const cIdx = i % 9;
            if (r === row || cIdx === col) c.classList.add('highlight-axis');
        });

        if (isAssistantActive && isFilled) {
            const valSpan = cell.querySelector('.value');
            if (valSpan) {
                const val = valSpan.textContent;
                cells.forEach(c => {
                    const span = c.querySelector('.value');
                    if (span && span.textContent === val) c.classList.add('highlight-match');
                });
            }
        }
    }

    function handleKeyPress(e) {
        if (selectedCellIndex === null) return;
        if (e.key >= '1' && e.key <= '9') enterNumber(e.key);
        else if (e.key === 'Backspace' || e.key === 'Delete') enterNumber('');
    }

    function enterNumber(value) {
        if (selectedCellIndex === null) return;
        const cell = cells[selectedCellIndex];
        
        if (cell.classList.contains('given') || cell.classList.contains('user-input')) return;

        // Stencil Logic
        if (isStencilActive && value !== '') {
            let container = cell.querySelector('.stencil-container');
            if (!container) {
                cell.innerHTML = '<div class="stencil-container"></div>';
                container = cell.querySelector('.stencil-container');
                for(let i=1; i<=9; i++) {
                    const s = document.createElement('div');
                    s.className = 'stencil-num';
                    s.dataset.val = i;
                    container.appendChild(s);
                }
            }
            const targetNum = container.querySelector(`[data-val="${value}"]`);
            if (targetNum) {
                targetNum.textContent = targetNum.textContent === value ? '' : value;
            }
            saveGameState();
            return; 
        }

        // Deleting
        if (value === '') {
            cell.innerHTML = '';
            saveGameState();
            return;
        }

        // Checking Correctness
        if (parseInt(value) === solvedBoard[selectedCellIndex]) {
            const currentIndex = selectedCellIndex; // Store the index just in case
            
            cell.innerHTML = `<span class="value">${value}</span>`;
            cell.classList.add('user-input');
            clearHighlights();

            // Auto-erase matching stencils from axis and box
            autoEraseStencils(currentIndex, value);

            correctCount++;
            correctDisplay.textContent = `${correctCount} CORRECT`;
            stats.totalCorrect++;
            saveStats();

            checkCompletion(currentIndex);
            if (correctCount === targetCorrectCount) handleWin();
            
            // Handle selection clearing at the very end
            if (!isAssistantActive) selectedCellIndex = null;
            else selectCell(currentIndex);

            saveGameState();
        } else {
            // Update: Remove wrong guess from stencils if they exist, otherwise clear cell
            const container = cell.querySelector('.stencil-container');
            if (container) {
                const targetNum = container.querySelector(`[data-val="${value}"]`);
                if (targetNum) targetNum.textContent = '';
            } else {
                cell.innerHTML = ''; 
            }
            
            boardEl.classList.remove('rumble'); 
            void boardEl.offsetWidth; 
            boardEl.classList.add('rumble');

            mistakeCount++;
            mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;
            stats.totalMistakes++;
            saveStats();

            if (difficultySelect.value === 'extreme' && mistakeCount >= 6) {
                setTimeout(() => {
                    boardEl.classList.add('hidden');
                    numpadEl.classList.add('hidden');
                    gameOverScreen.classList.remove('hidden');
                }, 400);
            }

            saveGameState();
        }
    }

    function autoEraseStencils(index, val) {
        const row = Math.floor(index / 9);
        const col = index % 9;

        // 1. Erase from Row
        for (let i = 0; i < 9; i++) {
            clearStencilVal(row * 9 + i, val);
        }

        // 2. Erase from Column
        for (let i = 0; i < 9; i++) {
            clearStencilVal(i * 9 + col, val);
        }

        // 3. Erase from 3x3 Box
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                clearStencilVal((boxStartRow + r) * 9 + (boxStartCol + c), val);
            }
        }
    }

    function clearStencilVal(cellIndex, val) {
        const cell = cells[cellIndex];
        if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) {
            const container = cell.querySelector('.stencil-container');
            if (container) {
                const targetNum = container.querySelector(`[data-val="${val}"]`);
                if (targetNum) targetNum.textContent = '';
            }
        }
    }

    function checkCompletion(index) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        let rComplete = true, cComplete = true, bComplete = true;
        const rCells = [], cCells = [], bCells = [];

        // 1. Check Row (Waves Left to Right)
        for (let i = 0; i < 9; i++) {
            const cell = cells[row * 9 + i];
            rCells.push(cell);
            if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) rComplete = false;
        }

        // 2. Check Column (Waves Top to Bottom)
        for (let i = 0; i < 9; i++) {
            const cell = cells[i * 9 + col];
            cCells.push(cell);
            if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) cComplete = false;
        }

        // 3. Check Box (Waves Top-Left to Bottom-Right zigzag)
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartCol = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = cells[(boxStartRow + r) * 9 + (boxStartCol + c)];
                bCells.push(cell);
                if (!cell.classList.contains('given') && !cell.classList.contains('user-input')) bComplete = false;
            }
        }

        if (rComplete) triggerWave(rCells);
        if (cComplete) triggerWave(cCells);
        if (bComplete) triggerWave(bCells);
    }

    function triggerWave(cellArray) {
        cellArray.forEach((cell, i) => {
            setTimeout(() => {
                const span = cell.querySelector('.value');
                if (span) {
                    span.classList.remove('wave');
                    void span.offsetWidth;
                    span.classList.add('wave');
                }
            }, i * 40); 
        });
    }

    function handleWin() {
        const currentDiff = difficultySelect.value;
        stats[currentDiff]++;
        saveStats();

        // Check for a flawless game
        if (mistakeCount === 0) {
            victoryTitle.textContent = "Perfect Solve!";
        } else {
            victoryTitle.textContent = "Puzzle Solved!";
        }

        setTimeout(() => {
            boardEl.classList.add('hidden');
            numpadEl.classList.add('hidden');
            statsScreen.classList.add('hidden');
            infoScreen.classList.add('hidden');
            victoryScreen.classList.remove('hidden');
        }, 800);
    }

    function startNewGame() {
        const difficulty = difficultySelect.value;
        targetCorrectCount = difficulties[difficulty]; 
        
        boardEl.classList.remove('hidden', 'rumble'); 
        numpadEl.classList.remove('hidden');
        victoryScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        statsScreen.classList.add('hidden');
        infoScreen.classList.add('hidden');

        if (difficulty === 'extreme') extremeWarning.classList.remove('hidden');
        else extremeWarning.classList.add('hidden');

        correctCount = 0;
        mistakeCount = 0;
        correctDisplay.textContent = `${correctCount} CORRECT`;
        mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;

        clearHighlights();
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('given', 'user-input'); 
        });
        selectedCellIndex = null;

        const board = generateBoard();
        solvedBoard = [...board]; 
        removeNumbers(board, targetCorrectCount);

        for (let i = 0; i < 81; i++) {
            if (board[i] !== 0) {
                cells[i].innerHTML = `<span class="value">${board[i]}</span>`;
                cells[i].classList.add('given');
            }
        }

        saveGameState();
    }

    // --- Stats & Info Logic ---
    function loadStats() {
        const savedStats = localStorage.getItem('sudokuStats');
        if (savedStats) stats = { ...stats, ...JSON.parse(savedStats) };
    }
    
    function saveStats() { 
        localStorage.setItem('sudokuStats', JSON.stringify(stats)); 
    }
    
    function saveGameState() {
        const boardState = cells.map(cell => {
            let state = { type: 'empty', value: null, stencils: [] };
            if (cell.classList.contains('given')) {
                state.type = 'given';
                state.value = parseInt(cell.querySelector('.value').textContent);
            } else if (cell.classList.contains('user-input')) {
                state.type = 'user-input';
                state.value = parseInt(cell.querySelector('.value').textContent);
            } else {
                const container = cell.querySelector('.stencil-container');
                if (container) {
                    state.stencils = Array.from(container.querySelectorAll('.stencil-num'))
                        .map(n => n.textContent)
                        .filter(t => t !== '');
                }
            }
            return state;
        });

        const gameState = {
            difficulty: difficultySelect.value,
            correctCount,
            mistakeCount,
            targetCorrectCount,
            solvedBoard,
            boardState
        };
        localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
    }

    function loadGameState() {
        try {
            const savedState = localStorage.getItem('sudokuGameState');
            if (!savedState) return false;

            const gameState = JSON.parse(savedState);
            
            // Validate that the save file is completely intact
            if (!gameState || !gameState.boardState || !gameState.difficulty) {
                localStorage.removeItem('sudokuGameState'); // Clear the bad save
                return false;
            }

            // Prevent loading a game that was already won or lost
            if (gameState.correctCount === gameState.targetCorrectCount || (gameState.difficulty === 'extreme' && gameState.mistakeCount >= 6)) {
                return false;
            }

            difficultySelect.value = gameState.difficulty;
            diffDisplay.textContent = gameState.difficulty.toUpperCase();
            
            correctCount = gameState.correctCount;
            mistakeCount = gameState.mistakeCount;
            targetCorrectCount = gameState.targetCorrectCount;
            solvedBoard = gameState.solvedBoard;

            correctDisplay.textContent = `${correctCount} CORRECT`;
            mistakeDisplay.textContent = `${mistakeCount} MISTAKES`;
            if (gameState.difficulty === 'extreme') extremeWarning.classList.remove('hidden');
            else extremeWarning.classList.add('hidden');

            cells.forEach((cell, i) => {
                cell.innerHTML = '';
                cell.classList.remove('given', 'user-input', 'selected', 'highlight-axis', 'highlight-match');
                
                const state = gameState.boardState[i];
                if (state.type === 'given') {
                    cell.innerHTML = `<span class="value">${state.value}</span>`;
                    cell.classList.add('given');
                } else if (state.type === 'user-input') {
                    cell.innerHTML = `<span class="value">${state.value}</span>`;
                    cell.classList.add('user-input');
                } else if (state.stencils && state.stencils.length > 0) {
                    cell.innerHTML = '<div class="stencil-container"></div>';
                    const container = cell.querySelector('.stencil-container');
                    for(let s=1; s<=9; s++) {
                        const sDiv = document.createElement('div');
                        sDiv.className = 'stencil-num';
                        sDiv.dataset.val = s;
                        if (state.stencils.includes(s.toString())) sDiv.textContent = s;
                        container.appendChild(sDiv);
                    }
                }
            });

            return true; // Successfully loaded
        } catch (error) {
            console.error("Save file corrupted, starting fresh.", error);
            localStorage.removeItem('sudokuGameState');
            return false;
        }
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
        gameOverScreen.classList.add('hidden');
        infoScreen.classList.add('hidden');
        statsScreen.classList.remove('hidden');
    }

    function hideStats() {
        statsScreen.classList.add('hidden');
        boardEl.classList.remove('rumble');
        if (mistakeCount >= 6 && difficultySelect.value === 'extreme') gameOverScreen.classList.remove('hidden');
        else if (correctCount !== targetCorrectCount) boardEl.classList.remove('hidden');
        else victoryScreen.classList.remove('hidden');
    }

    function resetStats() {
        if(confirm("Are you sure you want to clear your stats?")) {
            stats = { easy: 0, medium: 0, hard: 0, extreme: 0, totalCorrect: 0, totalMistakes: 0 };
            saveStats();
            showStats(); 
        }
    }

    function showInfo() {
        boardEl.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        statsScreen.classList.add('hidden');
        infoScreen.classList.remove('hidden');
    }

    function hideInfo() {
        infoScreen.classList.add('hidden');
        boardEl.classList.remove('rumble');
        if (mistakeCount >= 6 && difficultySelect.value === 'extreme') gameOverScreen.classList.remove('hidden');
        else if (correctCount !== targetCorrectCount) boardEl.classList.remove('hidden');
        else victoryScreen.classList.remove('hidden');
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
        const row = Math.floor(index / 9), col = index % 9;
        const startRow = Math.floor(row / 3) * 3, startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 9; i++) {
            if (board[row * 9 + i] === num) return false;
            if (board[i * 9 + col] === num) return false;
            const boxRow = startRow + Math.floor(i / 3), boxCol = startCol + (i % 3);
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