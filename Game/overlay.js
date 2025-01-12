export function showGameOverOverlay(outcome, difficulty_achieved) {
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.visibility = 'visible';
    console.log(outcome);

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    if(outcome == "GameOver")
    {
        document.getElementById('gameover-title').style.visibility = 'visible';
        document.getElementById('gameover-score').innerHTML = "Game difficulty achieved: " + difficulty_achieved.value;

    }else
    {
        document.getElementById('gameover-title-win').style.visibility = 'visible';
        document.getElementById('continue-button').style.visibility = 'visible';
        if(difficulty_achieved){
            document.getElementById('gameover-score').innerHTML = "Current completed difficulty achieved: " + difficulty_achieved.value;
        }
        else 
        {
            document.getElementById('gameover-score').innerHTML = "Current completed difficulty achieved: Error with retrieving difficulty";
        }
    }
}

export function restartGame() {
    location.reload(); 
}




export function hideGameOverlay() {
    const overlay = document.getElementById('gameover-overlay');
    overlay.style.visibility = 'hidden';

    document.getElementById('gameover-title').style.visibility = 'hidden';
    document.getElementById('gameover-title-win').style.visibility = 'hidden';
    document.getElementById('continue-button').style.visibility = 'hidden';

}
