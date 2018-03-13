'use strict';

class Counter {
    private count: number;
    private element: Element;
    private zeroPadding: number;

    constructor(element: Element, zeroPadding: number = 0, initCount: number = 0) {
        this.element = element;
        this.zeroPadding = zeroPadding;
        this.count = initCount;

        let background = document.createElement('span');
        background.classList.add('background');

        let places = ['thousands', 'hundreds', 'tens'];

        let foreground = document.createElement('span');
        foreground.classList.add('foreground');

        let countString = this.count.toString().padStart(this.zeroPadding, '0');

        for (let i = 0; i < this.zeroPadding; i++) {
            let backgroundDigit = document.createElement('span');
            let foregroundDigit = document.createElement('span');

            backgroundDigit.classList.add('digit', places[i]);
            backgroundDigit.textContent = '8';
            background.appendChild(backgroundDigit);

            foregroundDigit.classList.add('digit', places[i]);
            foregroundDigit.textContent = countString[i];
            foreground.appendChild(foregroundDigit);
        }

        this.element.appendChild(background);
        this.element.appendChild(foreground);
    }

    getCount() {
        return this.count;
    }

    increment() {
        this.count++;
        this.updateDOM();
    }

    decrement() {
        this.count--;
        this.updateDOM();
    }

    reset(count: number = 0) {
        this.count = count;
        this.updateDOM();
    }

    private updateDOM() {
        let string = this.count.toString().padStart(this.zeroPadding, '0');
        this.element.querySelectorAll('.foreground .digit').forEach((element: Element, index: number) => {
            element.textContent = string[index];
        });
    }
}