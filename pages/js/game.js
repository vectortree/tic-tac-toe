let grid = Array(9).fill(" ");
let winner = " ";

window.addEventListener('DOMContentLoaded', () => {
    //const grid = Array(9).fill(" ");
    //const winner = " ";
    displayBoardRefresh();
});

function squareClicked(id) {
    //let id = event.target.id;
    updateBoard(parseInt(id), "X");
    //event.stopPropagation();
    // Send a POST request with move property to server
    let postReq = new XMLHttpRequest();
    postReq.open("POST", "/ttt/play", true);
    postReq.setRequestHeader('Content-Type', 'application/json');
    postReq.send(JSON.stringify({
        move: id
    }));
    // Receive response with grid and winner properties
    postReq.onreadystatechange = function() {
        if(postReq.readyState == XMLHttpRequest.DONE) {
            let data = JSON.parse(postReq.responseText);
            grid = data.grid;
            winner = data.winner;
            // Display updated board and/or winner
            displayBoard();
            displayWinner(winner);
            console.log("grid:", grid, "winner:", winner);
        }
    }
}

function updateBoard(index, playerType) {
    grid[index] = playerType;
}

function displayBoard() {
    for(let id = 0; id < grid.length; id++) {
        let square = document.getElementById(String(id));
        square.innerHTML = grid[id];
        square.setAttribute("onclick", "squareClicked(this.id)");
        square.style.cursor = 'pointer';
        if(grid[id] !== " ") {
            square.setAttribute("onclick", null);
            square.style.cursor = 'auto';
        }
    }
}

function displayBoardRefresh() {
    // Send a POST request without move property to server
    let postReq = new XMLHttpRequest();
    postReq.open("POST", "/ttt/play", true);
    postReq.setRequestHeader('Content-Type', 'application/json');
    postReq.send(JSON.stringify({
        move: null
    }));
    // Receive response with grid and winner properties
    postReq.onreadystatechange = function() {
        if(postReq.readyState == XMLHttpRequest.DONE) {
            let data = JSON.parse(postReq.responseText);
            grid = data.grid;
            winner = data.winner;
            console.log("grid:", grid, "winner:", winner);
            displayBoard();
        }
    }
}

function displayWinner(winner) {
    // If winner !== " ", display text at the bottom of the board
    // showing the state of the game (i.e., Player "X"/"O" won or tie)
    if(winner !== " ") {
        displayBoard();
        for (let id = 0; id < grid.length; id++) {
            document.getElementById(String(id)).setAttribute("onclick", null);
            document.getElementById(String(id)).style.cursor = 'auto';
        }
    }
    if(winner === "X")
        document.getElementById("game-state").innerHTML = "You won!";
    else if(winner === "O")
        document.getElementById("game-state").innerHTML = "You lost!";
    else if(winner === "T")
        document.getElementById("game-state").innerHTML = "Tie!";
}
