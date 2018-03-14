'use strict';

class Utils {
    constructor() {}

    static getRandomInt(min: number, max: number) {
        let high = Math.ceil(min);
        let low = Math.floor(max);
        return Math.floor(Math.random() * (high - low)) + low;
    }

    // Returns a randomized copy of the provided array
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