class Block {
    constructor(shape, x, y, style) {
        this.shape = shape
        this.x = x
        this.y = y
        this.style = style
    }

    blockCoords() {
        const indexes = []
        this.shape.forEach((row, rowIdx) => {
            row.forEach((cell, colIdx) => {
                if(cell) {
                    indexes.push({y: this.y + rowIdx, x: this.x + colIdx})
                }

            })
        })
        return indexes
    }

    rotate(direction) {
        let rows = this.shape.length;
        let cols = this.shape[0].length;
        let newShape = Array.from({ length: cols }, () => new Array(rows).fill(0))
        let tempShape = [...this.shape]

        tempShape.reverse().forEach((row, rowIdx) => {
            row.forEach((cell, cellIdx) => {
                newShape[cellIdx][rowIdx] = cell
            })
        })
        
        return direction === 'clockwise' ? newShape : newShape.reverse().map((row) => row.reverse())
    }

    render(isOutline=false) {

        if(isOutline) {
            document.querySelectorAll('.cell[data-outline="true"]').forEach(cell => {
                cell.removeAttribute('data-outline');
                cell.classList.remove(...this.style)
            })
        } else {
        document.querySelectorAll('.cell[data-active="true"]').forEach(cell => {
            cell.removeAttribute('data-active');
            cell.classList.remove(...this.style)
        })
    }
        const coords = this.blockCoords()
        coords.forEach((coord) => {
            updateGridCell(coord.y, coord.x, this.style, isOutline)
        })
    }

    setNotActive() {
        document.querySelectorAll('.cell[data-active="true"]').forEach(cell => {
            cell.removeAttribute('data-active');
        })
    }
}

//! AUDIO

const gameOverAudio = new Audio('audio/game-over.wav')
const gameMusic = new Audio('audio/baptiste-2.mp3')
gameMusic.loop = true

// ! CONSTANTS

const HEIGHT = 20
const WIDTH = 10
const NEXT_BLOCK_WIDTH = 4
const TETROMINOS = [
    { layout: '0000.1111.0000.0000', style: 'i-piece' },
    { layout: '100.111.000', style: 'j-piece' },
    { layout: '001.111.000', style: 'l-piece' },
    { layout: '11.11', style: 'o-piece' },
    { layout:'011.110.000', style: 's-piece' },
    { layout: '010.111.000', style: 't-piece' },
    { layout: '110.011.000', style: 'z-piece' }
]

const SCORE_PER_ROW = 100
const SCORE_MULTIPLIER = [0, 1, 1.5, 2, 2.5]
const SCORE_STRING_LENGTH = 12

const STARTING_GAME_SPEED = 500

const SIDE_LEADERBOARD_COUNT = 5
const LEADERBOARD_COUNT = 10
const LEADERBOARD_NAME_COL = 1
const LEADERBOARD_SCORE_COL = 2
const LEADERBOARD_IDENTIFIER = 'leaderboard'

const I_KICK_TESTS = [0, -1, 1, -2, 2]
const KICK_TESTS = [0, -1, 1]


// ! STATE VARIABLES

let board = [], inProgress, currentBlock, nextBlock, gameSpeed, score, gameLoop, level

// ! CACHED ELEMENTS


const boardEl = document.querySelector('.board')
let cellEls
const scoreEl = document.querySelector('.score')
const nextBlockCellEls = [...document.querySelectorAll('.next-block-container > div')]
const gameOverScreenEl = document.getElementById('game-over-overlay')
const saveScoreInputEl = document.getElementById('save-score-input')
const saveScoreButtonEl = document.getElementById('save-score-btn')
const leaderboardScreenEl = document.getElementById('leaderboard-overlay')
const sideLeaderboardEl = document.querySelector('.side-leaderboard table')
const leaderboardEls = document.querySelectorAll('#leaderboard tbody>tr')
const playAgainButtonEl = document.getElementById('play-again')
const playGameButtonEl = document.getElementById('play-game')

// ! EVENT LISTENERS

document.addEventListener('keydown', handleControls)
saveScoreButtonEl.addEventListener('click', saveScore)
playAgainButtonEl.addEventListener('click', resetGame)
playGameButtonEl.addEventListener('click', playGame)

// ! FUNCTIONS

updateSideLeaderboardElements()

function playGame() {
    initGame()
    startGameLoop()
}

function startGameLoop() {
    gameLoop && clearInterval(gameLoop)
    gameLoop = setInterval(moveBlockDown, gameSpeed)
}

function initGame() {
    gameMusic.play()
    initBoard()
    initDOM()
    initGameState()
}

function initBoard() {
    for(let i = 0; i < HEIGHT; i++) {
        board[i] = []
        for(let j = 0; j < WIDTH; j++) {
            board[i][j] = 0
        }
    }
}

function initGameState() {
    gameSpeed = STARTING_GAME_SPEED
    score = 0
    level = 0
    updateScoreMessage()
    inProgress = true
    currentBlock = generateBlock()
    currentBlock.render()
    nextBlock = generateBlock()
    displayNextBlock()
    updateSideLeaderboardElements()
}

function initDOM() {

    //clear Play Game button
    playGameButtonEl.remove()

    if(cellEls) cellEls.forEach((cellEl) => cellEl.remove())

    for(let i = 0; i < (WIDTH*HEIGHT); i++) {
        let gridCell = document.createElement('div')
        gridCell.classList.add('cell')
        boardEl.insertBefore(gridCell, boardEl.firstChild)
    }
    cellEls = [...document.querySelectorAll('.board > .cell')]
    
}

function updateBoard() {
    currentBlock.blockCoords().forEach((coord) => {
        board[coord.y][coord.x] = 1
    })
    checkRows()
}

function displayNextBlock() {
    clearNextBlockDisplay()
    nextBlock.shape.forEach((row, rowIdx) => {
        row.forEach((cell ,cellIdx) => {
            if(cell) updateNextBlockGridCell(rowIdx, cellIdx, nextBlock.style)
        })
    })
}

function incrementSpeed() {
    gameSpeed = Math.max(STARTING_GAME_SPEED - (Math.floor(score/1500)*25), 300)
    startGameLoop()
}

function checkRows() {
    let clearedRows = 0
    board.forEach((row, rowIdx) => {
        const rowSum = row.reduce((acc, cell) => acc + cell, 0)
        if (rowSum === WIDTH) {
            clearRow(rowIdx)
            clearedRows++
        }
    })
    updateScore(clearedRows)
}

function clearRow(rowIndex) {
    clearBoardRow(rowIndex)
    clearDOMRow(rowIndex)
}

function clearBoardRow(rowIndex) {
    board.splice(rowIndex, 1)
    board.unshift(new Array(WIDTH).fill(0))
}

function clearDOMRow(rowIndex) {
    let startCellIndex = rowColumnToIndex(rowIndex, 0, WIDTH)
    let endCellIndex = startCellIndex + WIDTH
    
    for(let i = startCellIndex; i < endCellIndex; i++) {
        cellEls[i].remove()
    }

    for(let i = 0; i < WIDTH; i++) {
        let newCellEl = document.createElement('div')
        newCellEl.classList.add('cell')
        boardEl.insertBefore(newCellEl, boardEl.firstChild)
    }

    cellEls = [...document.querySelectorAll('.board > .cell')]
}

function generateBlock() {
    let tetromino = randomTetromino()
    // TODO Change this so not hard coded
    let offset = tetromino.layout === '0000.1111.0000.0000' ? -1 : 0
    return new Block(stringLayoutTo2DArray(tetromino.layout), 3, offset, [tetromino.style])
}

function randomTetromino() {
    return TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)]
}


function moveBlockDown() {
    if(level !== Math.floor(score / 1500)) {
        level = Math.floor(score / 1500)
        incrementSpeed()
    }
    if(canBlockMove(canCellMoveDown, currentBlock)) {
        currentBlock.y++
        renderLanding()
        currentBlock.render()
    } else {
        updateBoard()
        currentBlock.setNotActive()
        currentBlock = nextBlock
        nextBlock = generateBlock()
        displayNextBlock()
        if(isGameOver()) {
            endGame()
        } else {
            renderLanding()
            currentBlock.render()
        }
    }
}

function handleControls(event) {
    if (!inProgress) return
    const key = event.key
    const left = 'ArrowLeft', up = 'ArrowUp', right = 'ArrowRight', down = 'ArrowDown', z = 'z'
    currentBlock.render()


    switch(key) {
        case up:
            rotatedCoords = currentBlock.rotate('clockwise')
            if(canBlockRotate(rotatedCoords)) currentBlock.shape = rotatedCoords
            break
        case z:
            rotatedCoords = currentBlock.rotate('anti-clockwise')
            if(canBlockRotate(rotatedCoords)) currentBlock.shape = rotatedCoords
            break
        case down:
            moveBlockDown()
            break
        case left:
            if(canBlockMove(canCellMoveLeft, currentBlock)) currentBlock.x--
            break
            case right:
                if(canBlockMove(canCellMoveRight, currentBlock)) currentBlock.x++
                break
            }
        renderLanding()
        currentBlock.render()
}

function renderLanding() {
    for(let i = currentBlock.y; i < HEIGHT; i++) {
        let dummy = new Block(currentBlock.shape, currentBlock.x, i, [currentBlock.style, 'outline'])
        if(!canBlockMove(canCellMoveDown, dummy)) {
            dummy.render(true)
            break
        }

    }
}

function attemptRotate() {

}


function updateScore(rowsCleared) {
    score += SCORE_PER_ROW * rowsCleared * SCORE_MULTIPLIER[rowsCleared]
    updateScoreMessage()
}

function updateScoreMessage() {
    scoreEl.innerHTML = scoreFormatter(score)
}

function canBlockMove(directionCheck, block) {
    return block.blockCoords().every(directionCheck)
}

function canBlockRotate(rotateShape) {
    let kickTests = currentBlock.style.includes('i-piece') ? I_KICK_TESTS : KICK_TESTS
    console.log(currentBlock.style)
    for(let i = 0; i < kickTests.length; i++) {
        const kickOffset = kickTests[i]
        if (rotateCoords(rotateShape, kickOffset).every(canCellRotate)) {
            currentBlock.x += kickOffset
            return true
        }
    }
    return false
    //console.log(rotateCoords(rotateShape,1).every(canCellRotate))
    //return rotateCoords(rotateShape,1).every(canCellRotate)
}

function rotateCoords(rotateShape, kickOffset) {
    const indexes = []
    rotateShape.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
            if(cell) {
                indexes.push({y: currentBlock.y + rowIdx, x: currentBlock.x + colIdx + kickOffset})
            }

        })
    })
        return indexes
}

function canCellRotate(cell) {
    const boardRow = board[cell.y]
    if (boardRow === undefined) return false
    const boardCell = boardRow[cell.x]
    if (boardCell === undefined || boardCell === 1) return false
    return true

}

function canCellEnterBoard(cell) {
    const cellInSpawn = board[cell.y]
    return cellInSpawn !== undefined && cellInSpawn[cell.x] !== 1
}

function canCellMoveDown(cell) {
    const cellBelow = board[cell.y+1]
    return cellBelow !== undefined && cellBelow[cell.x] !== 1
}

function canCellMoveLeft(cell) {
    const cellLeft = board[cell.y][cell.x-1]
    return cellLeft !== undefined && cellLeft !== 1
}

function canCellMoveRight(cell) {
    const cellRight = board[cell.y][cell.x+1]
    return cellRight !== undefined && cellRight !== 1
}

function updateGridCell(row, column, style, isOutline) {
    let cell = cellEls[rowColumnToIndex(row, column, WIDTH)]
    cell.classList.add(...style)
    if (isOutline){
        cell.setAttribute('data-outline', 'true')
    } else {
        cell.setAttribute('data-active', 'true')
        cell.removeAttribute('data-outline')
        cell.classList.remove('outline')
    }
}

function updateNextBlockGridCell(row, column, style) {
    nextBlockCellEls[rowColumnToIndex(row, column, NEXT_BLOCK_WIDTH)].classList.toggle(style) 
}

function isGameOver() {
    return !canBlockMove(canCellEnterBoard, currentBlock)
}

function endGame() {
    resetGameMusic()
    clearInterval(gameLoop)
    gameOverAudio.play()
    inProgress = false
    displayGameOver()
}

function resetGameMusic() {
    gameMusic.pause()
    gameMusic.currentTime = 0
}

function displayGameOver() {
    gameOverScreenEl.classList.add('visible')
}

function hideGameOver() {
    gameOverScreenEl.classList.remove('visible')
}

function saveScore() {
    saveToLeaderboard(saveScoreInputEl.value)
    hideGameOver()
    displayLeaderboard()
}

function saveToLeaderboard(name) {
    const leaderboard = getLeaderboard()
    leaderboard.push({name, score})
    leaderboard.sort((a, b) => b.score - a.score)
    localStorage.setItem(LEADERBOARD_IDENTIFIER, JSON.stringify(leaderboard))
}

function displayLeaderboard() {
    updateLeaderboardElements()
    updateSideLeaderboardElements()
    leaderboardScreenEl.classList.add('visible')
}

function hideLeaderboard() {
    leaderboardScreenEl.classList.remove('visible')
}

function getLeaderboard() {
    const highScores = localStorage.getItem(LEADERBOARD_IDENTIFIER)
    return highScores ? JSON.parse(highScores) : []
}

function updateLeaderboardElements() {
    const leaderboardEntries =  getLeaderboard()
    const leaderboardLength = leaderboardEntries.length
    for(let i = 0; i < Math.min(LEADERBOARD_COUNT, leaderboardLength); i++) {
        let currentLeaderboardCellEls = leaderboardEls[i].children
        currentLeaderboardCellEls[LEADERBOARD_NAME_COL].innerText = leaderboardEntries[i].name
        currentLeaderboardCellEls[LEADERBOARD_SCORE_COL].innerText = leaderboardEntries[i].score
    }
}

function updateSideLeaderboardElements() {
    sideLeaderboardEl.innerHTML = ''
    const leaderboardEntries = getLeaderboard().slice(0, SIDE_LEADERBOARD_COUNT)
    leaderboardEntries.forEach((entry) => {
        let leaderboardline = document.createElement('tr')
        leaderboardline.innerHTML = `<td>${entry.name}</td><td></td>-><td>${entry.score}</td>`
        sideLeaderboardEl.appendChild(leaderboardline)
    })
}


function resetGame() {
    hideLeaderboard()
    playGame()
}

// * HELPER FUNCTIONS

function rowColumnToIndex(row, column, width) {
    return (row * width) + column
}

function clearNextBlockDisplay() {
    nextBlockCellEls.forEach((cellEl) => cellEl.className = 'cell')
}

function stringLayoutTo2DArray(string) {
    return string.split('.').map((row) => row.split('').map((cell) => parseInt(cell)))
}

function scoreFormatter(score) {
    let scoreStr = score.toString()
    let scoreHtml = `<span class="active-score">${scoreStr}</span>`
    for(let i = scoreStr.length; i < SCORE_STRING_LENGTH; i++) {
        scoreHtml = '0' + scoreHtml
    }
    return scoreHtml
}