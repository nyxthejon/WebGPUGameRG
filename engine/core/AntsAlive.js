export const aliveAnts = {
    value: 1
};

export function killAnt() {
    aliveAnts.value--;
}

export function resetAnts() {
    aliveAnts.value = 1;

}

export function returnAliveAnts(){
    return aliveAnts.value;
}

export function updateAntCount()
{
    document.getElementById('antNumber-text').textContent = returnAliveAnts(); 
}