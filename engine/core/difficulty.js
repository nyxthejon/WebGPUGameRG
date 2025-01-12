export const difficulty = {
    value: 1
};

export function makeGameHarder() {
    difficulty.value++;
}

export function resetGameDifficulty() {
    difficulty.value = 1;
}

export function getGameTime() {
   return 120/difficulty.value;
}

export function returnDifficulty() {
    return difficulty
 }