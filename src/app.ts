'use strict';

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
    started: boolean = false;
    gameOver: boolean = false;
    timerId: number;
    revealedCount: number = 0;

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
        this.started = false;
        this.gameOver = false;
        this.stopTimer();
        this.timer.reset();
        this.flagCounter.reset(this.settings.mines);
        this.board = new Board(this.settings.rows, this.settings.cols,this.settings.mines, this);
    }

    start(initSpace: Space) {
        this.startTimer();
        this.board.setMines(initSpace);
        this.started = true;
    }

    end() {
        this.stopTimer();
        this.gameOver = true;
    }

    startTimer() {
        this.timerId = setInterval(() => {
            this.timer.increment();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerId);
    }
}


class Board {
    element: Element;
    game: Game;
    spaces: Space[][] = [];
    rows: number;
    cols: number;
    numMines: number;

    constructor(rows: number, cols: number, numMines: number, game: Game) {
        this.rows = rows;
        this.cols = cols;
        this.numMines = numMines;
        this.game = game;
        this.element = document.createElement('table');

        for (let i = 0; i < rows; i++) {
            let rowElem = document.createElement('tr');
            let rowData = [];

            for (let j = 0; j < cols; j++) {
                let space = new Space(i, j, this.game);
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
        let minesCreated: number = 0;
        let shuffledSpaces: Space[] = Utils.shuffle([].concat(...this.spaces));

        while (minesCreated < this.numMines && shuffledSpaces.length >= 0) {
            let s = shuffledSpaces.shift();

            if (s && !Object.is(s, init)) {
                s.setAsMine();
                minesCreated++
            }
        }
    }
}

class Space {
    row: number;
    col: number;
    element: Element;
    isMine: boolean = false;
    isRevealed: boolean = false;
    isFlagged: boolean = false;
    game: Game;

    constructor(row: number, col: number, game: Game) {
        this.row = row;
        this.col = col;
        this.game = game;
        this.element = document.createElement('td');

        this.element.addEventListener('contextmenu', (event) => event.preventDefault());

        this.element.addEventListener('mousedown', (event: MouseEvent) => {
            if (!this.game.started) {
                this.game.start(this);
            }

            if (!this.game.gameOver && this.game.flagCounter.getCount() === 0 &&
                (this.game.revealedCount + this.game.settings.mines) === (this.game.settings.rows * this.game.settings.cols)) {
                this.game.end();
                alert('YOU WIN!');
            }

            // Ignore click if space has already been revealed or if game is over
            if (this.isRevealed || this.game.gameOver) {
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
                this.game.end();
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
        this.game.revealedCount++;
    }

    toggleFlagged() {
        if (this.isFlagged) {
            this.isFlagged = false;
            this.element.classList.remove('flagged');
            let elem = this.element.querySelector('.fa-flag');
            elem.remove();
            this.game.flagCounter.increment();
        } else {
            this.isFlagged = true;
            this.element.classList.add('flagged');
            let icon = document.createElement('i');
            icon.classList.add('fas', 'fa-flag');
            this.element.appendChild(icon);
            this.game.flagCounter.decrement();
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
            if (row >= 0 && row < this.game.board.spaces.length && col >= 0 && col < this.game.board.spaces[0].length) {
                let space = this.game.board.spaces[row][col];
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
