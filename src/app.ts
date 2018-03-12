'use strict';

class Utils {
    constructor() {}

    static getRandomInt(min: number, max: number) {
        let high = Math.ceil(min);
        let low = Math.floor(max);
        return Math.floor(Math.random() * (high - low)) + low;
    }

    // Returns an array randomized
    static shuffle<T>(array: T[]): T[] {
        let curr: T,
            temp: T,
            j: number,
            dupe: T[] = [...array];

        for (let i = 0; i < dupe.length; i++) {
            j = Utils.getRandomInt(0, dupe.length);

            curr = dupe[i];
            temp = dupe[j];

            dupe[i] = temp;
            dupe[j] = curr;
        }

        return dupe;
    }
}

class Board {

    mines: Set<Space> = new Set<Space>();
    spaces: Space[][] = [];
    element: Element;
    rows: number;
    cols: number;
    numMines: number;
    revealedCount: number = 0;
    timerId: number;
    game: Game;

    constructor(rows: number, cols: number, numMines: number, game: Game) {
        this.rows = rows;
        this.cols = cols;
        this.numMines = numMines;
        this.game = game;
        this.element = document.createElement('table');

        this.element.addEventListener('mousedown', (event) => {
            if (!this.game.gameOver && this.game.flagCounter.count === 0 && ((this.revealedCount + this.numMines) === (this.rows * this.cols))) {
                this.game.end();
                alert('YOU WIN!');
            }
        });

        for (let i = 0; i < rows; i++) {
            let rowElem = document.createElement('tr');
            let rowData = [];

            for (let j = 0; j < cols; j++) {
                let space = new Space(i, j, this);
                rowElem.appendChild(space.element);
                rowData.push(space);
            }

            this.element.appendChild(rowElem);
            this.spaces.push(rowData);
        }

        let container = document.querySelector('#container');
        let currentBoard = document.querySelector('#container table');
        if (currentBoard) {
            currentBoard.remove();
        }
        container.appendChild(this.element);
    }

    setMines(init: Space) {
        let shuffledSpaces = Utils.shuffle([].concat(...this.spaces));

        while (this.mines.size < this.numMines && shuffledSpaces.length >= 0) {
            let s = shuffledSpaces.shift();

            if (s && !Object.is(s, init)) {
                s.setAsMine();
                this.mines.add(s);
            }
        }
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.game.timer.increment();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerId);
    }
}

class Space {
    row: number;
    col: number;
    element: Element;
    isMine: boolean = false;
    isRevealed: boolean = false;
    isFlagged: boolean = false;
    board: Board;

    constructor(row: number, col: number, board: Board) {
        this.row = row;
        this.col = col;
        this.board = board;
        this.element = document.createElement('td');

        this.element.addEventListener('contextmenu', (event) => event.preventDefault());

        this.element.addEventListener('mousedown', (event: MouseEvent) => {
            // If mines have not been set (i.e. on initial click)
            if (this.board.mines.size === 0) {
                this.board.setMines(this);
                this.board.startTimer();
            }

            // Ignore click if space has already been revealed
            if (this.isRevealed || this.board.game.gameOver) {
                return;
            }

            if (event.metaKey || event.button === 2) {
                this.handleRightClick();
            } else {
                this.handleRegularClick();
            }
        });
    }

    handleRightClick() {
        if (!this.isRevealed) {
            this.toggleFlagged();
            return;
        }
    }

    handleRegularClick() {
        if (!this.isFlagged) {
            this.setAsRevealed();

            if (this.isMine) {
                this.board.game.end();
                alert('KABOOM! You lose.');
            } else {
                this.checkNeighbors();
            }
        }
    }

    setAsMine() {
        this.isMine = true;
        this.element.classList.add('mine');
        let icon = document.createElement('i');
        icon.classList.add('fas', 'fa-bomb');
        this.element.appendChild(icon);
    }

    setAsRevealed() {
        this.isRevealed = true;
        this.element.classList.add('revealed');
        this.board.revealedCount++;
    }

    toggleFlagged() {
        if (this.isFlagged) {
            this.isFlagged = false;
            this.element.classList.remove('flagged');
            let elem = this.element.querySelector('.fa-flag');
            elem.remove();
            this.board.game.flagCounter.increment();
        } else {
            this.isFlagged = true;
            this.element.classList.add('flagged');
            let icon = document.createElement('i');
            icon.classList.add('fas', 'fa-flag');
            this.element.appendChild(icon);
            this.board.game.flagCounter.decrement();
        }
    }

    checkNeighbors() {
        let neighborCoors: number[][] = [
            [this.row - 1, this.col - 1],
            [this.row - 1, this.col],
            [this.row - 1, this.col + 1],
            [this.row, this.col + 1],
            [this.row, this.col - 1],
            [this.row + 1, this.col - 1],
            [this.row + 1, this.col],
            [this.row + 1, this.col + 1]
        ];

        let neighborMineCount: number = 0;
        let neighbors: Space[] = [];

        neighborCoors.forEach((coors: number[]) => {
            let row: number = coors[0];
            let col: number = coors[1];

            // If coordinates are in bounds of the board
            if (row >= 0 && row < this.board.spaces.length && col >= 0 && col < this.board.spaces[0].length) {
                let space = this.board.spaces[row][col];
                neighbors.push(space);
                if (space.isMine) {
                    neighborMineCount++;
                }
            }
        });

        if (neighborMineCount > 0) {
            let node = document.createElement('span');
            node.textContent = neighborMineCount.toString();
            this.element.appendChild(node);
        } else {
            neighbors.forEach((space: Space)  => {
                if (!space.isRevealed) {
                    space.setAsRevealed();
                    space.checkNeighbors();
                }
            });
        }
    }
}

/*
    TODO: Implement different settings levels
    Minesweeper levels
    Level           Rows    Cols    Mines
    Beginner        9       9       10
    Intermediate    16      16      40
    Expert          16      30      99
 */

interface Settings {
    rows: number,
    cols: number,
    mines: number
}

class Game {

    board: Board;
    timer: Counter;
    flagCounter: Counter;
    gameOver: boolean = false;
    settings: Settings = {
        rows: 16,
        cols: 16,
        mines: 40
    };

    constructor() {
        this.board = new Board(this.settings.rows, this.settings.cols,this.settings.mines, this);
        this.timer = new Counter(document.querySelector('.counter.timer'), 3);
        this.flagCounter = new Counter(document.querySelector('.counter.flag-counter'), 2, this.settings.mines);
    }

    reset() {
        this.gameOver = false;
        this.board.stopTimer();
        this.timer.reset();
        this.flagCounter.reset(this.settings.mines);
        this.board = new Board(this.settings.rows, this.settings.cols,this.settings.mines, this);
    }

    end() {
        this.board.stopTimer();
        this.gameOver = true;
    }
}

let game = new Game();

function reset() {
    game.reset();
}

