var canvas = $('canvas.dots');
var canvasWidth = Math.round($(window).width() * 0.85);
var canvasHeight = Math.round($(window).height() * 0.85);
canvas.attr({height: canvasHeight, width: canvasWidth});
var context = canvas[0].getContext('2d');

// color canvas background
context.beginPath();
context.rect(0, 0, canvasWidth, canvasHeight);
context.fillStyle = "blue";
context.fill();

var imgData;
var percolating = true;
var frames = 1;

var rows = 3;
var cols = 3;
var board = [];
var s = 1;
var b = 3;
var baseColor = '#d3d3d3';
var sColor = '#ff0000';
var bColor = '#51beff';
var turnCounter = 0;
var gameType = 'two_player';
var neighbors = 2
var startingSet = []

function resetCanvas() {
    board = [];
    turnCounter = 0;
    percolating = true;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
}

$("#submit").click(function() {
    rows = Number($("#rows").val());
    cols = Number($("#cols").val());
    s = Number($("#s_moves").val());
    b = Number($("#b_moves").val());
    neighbors = Number($("#neighbors").val());
    gameType = $("#game_type").val();

    resetCanvas();
    startingSet = [];
    buildGrid(rows, cols);
})

function drawDot(x, y, radius, color, outline=false) {
    context.clearRect(x-(radius*1.1), y-(radius*1.1), 2.2*radius, 2.2*radius);
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    if (outline && color == sColor) {
        context.strokeStyle = "black";
        context.lineWidth = 4;
        context.stroke();
    }
}

function buildGrid(rows, cols) {
    var numRows = rows;
    var numCols = cols;

    console.log("rows: " + numRows)
    console.log("cols: " + numCols)

    console.log("canvasWidth: " + canvasWidth);
    console.log("canvasHeight: " + canvasHeight);

    var dotWidth = canvasWidth / ((2 * numCols));
    var dotHeight = canvasHeight/ ((2 * numRows));

    console.log("dotWidth: " + dotWidth);
    console.log("dotHeight: " + dotHeight);

    if (dotWidth > dotHeight) {
        var dotDiameter = dotMargin = dotHeight;
    } else {
        var dotDiameter = dotMargin = dotWidth;
    }

    console.log("dotDiameter: " + dotDiameter);
    console.log("dotMargin: " + dotMargin);

    var dotRadius = dotDiameter * 0.5;

    console.log("dotRadius: " + dotRadius);

    for (var i = 0; i < numRows; i++) {
        rowArray = []
        for (var j = 0; j < numCols; j++) {
            rowArray.push(0);
            var x = (j * (dotDiameter + dotMargin)) + dotMargin + dotRadius;
            var y = (i * (dotDiameter + dotMargin)) + dotMargin + dotRadius;
            drawDot(x, y, dotRadius, baseColor);
            console.log("drawing dot: " + x + " " + y)
            var xRange = [x - dotRadius, x + dotRadius];
            var yRange = [y - dotRadius, y + dotRadius];
            var coords = [xRange, yRange, false];
            board.push(coords);
        }
        startingSet.push(rowArray);
    }

    console.log('board length: ' + board.length)
};

function getXY(dot) {
    var radius = (dot[0][1] - dot[0][0]) / 2;
    var x = dot[0][0] + radius;
    var y = dot[1][0] + radius;
    return {'x': x, 'y': y, 'radius': radius};
};

function drawRandomDot(color) {
    r = Math.floor(Math.random() * (rows*cols + 1));
    var xy = getXY(board[r]);
    rowIndex = Math.floor(r/cols);
    colIndex = r % cols;
    startingSet[rowIndex][colIndex] = 1;
    drawDot(xy['x'], xy['y'], xy['radius'], color, true);
    return
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw ("Invalid color component");
    return ((r << 16) | (g << 8) | b).toString(16);
};

function highlightDot(x, y, radius) {
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "#ffffff";
    context.fill();
};

function gameOver() {
    percolating = false;
    for (var i = 0; i < (board.length - cols); i++) {
        var xy = getXY(board[i]);
        var index = (Math.round(xy['y']) * imgData.width + Math.round(xy['x'])) * 4;
        var hex = "#" + ("000000" + rgbToHex(imgData.data[index],
                                             imgData.data[index + 1],
                                             imgData.data[index + 2])).slice(-6);
        console.log('----------------------------------------')
        console.log(i)
        console.log("Columns: " + cols)
        console.log("xy: " + xy['x'] + " " + xy['y'])
        console.log("Index: " + index)
        console.log("Hex: " + hex)
        if (hex != sColor) {
            hexCounter = 0;
            try {
                var northXY = getXY(board[i - cols]);
                var index = (Math.round(northXY['y']) * imgData.width + Math.round(northXY['x'])) * 4;
                var northHex = "#" + ("000000" + rgbToHex(imgData.data[index],
                                                          imgData.data[index + 1],
                                                          imgData.data[index + 2])).slice(-6);
                //highlightDot(northXY['x'], northXY['y'], northXY['radius']);
                //drawDot(northXY['x'], northXY['y'], northXY['radius'], northHex);
                if (northHex == sColor) {
                    console.log("Northern neighbor")
                    hexCounter++;
                }
            } catch(err) {
                northHex = '';
                console.log('No northern dot.')
            }
            try {
                if (i % cols == cols - 1) {
                    eastHex = '';
                } else {
                    var eastXY = getXY(board[i + 1]);
                    var index = (Math.round(eastXY['y']) * imgData.width + Math.round(eastXY['x'])) * 4;
                    var eastHex = "#" + ("000000" + rgbToHex(imgData.data[index],
                                                             imgData.data[index + 1],
                                                             imgData.data[index + 2])).slice(-6);
                }

                //highlightDot(eastXY['x'], eastXY['y'], eastXY['radius']);
                //drawDot(eastXY['x'], eastXY['y'], eastXY['radius'], eastHex);
                if (eastHex == sColor) {
                    console.log("Eastern neighbor")
                    hexCounter++;
                }
            } catch(err) {
                eastHex = '';
                console.log('No eastern dot.')
            }
            try {
                console.log(board[i + cols])
                var southXY = getXY(board[i + cols]);
                console.log('southXY: ' + southXY['x'] + " " + southXY['y'])
                var index = (Math.round(southXY['y']) * imgData.width + Math.round(southXY['x'])) * 4;
                var southHex = "#" + ("000000" + rgbToHex(imgData.data[index],
                                                          imgData.data[index + 1],
                                                          imgData.data[index + 2])).slice(-6);
                //highlightDot(southXY['x'], southXY['y'], southXY['radius']);
                //drawDot(southXY['x'], southXY['y'], southXY['radius'], southHex);
                if (southHex == sColor) {
                    console.log("Southern neighbor")
                    hexCounter++;
                }
            } catch(err) {
                southHex = '';
                console.log('No southern dot.')
            }
            try {
                if (i % cols == 0) {
                    westHex = '';
                } else {
                    var westXY = getXY(board[i - 1]);
                    var index = (Math.round(westXY['y']) * imgData.width + Math.round(westXY['x'])) * 4;
                    var westHex = "#" + ("000000" + rgbToHex(imgData.data[index],
                                                             imgData.data[index + 1],
                                                             imgData.data[index + 2])).slice(-6);
                }

                //highlightDot(westXY['x'], westXY['y'], westXY['radius']);
                //drawDot(westXY['x'], westXY['y'], westXY['radius'], westHex);
                if (westHex == sColor) {
                    console.log("Western neighbor")
                    hexCounter++;
                }
            } catch(err) {
                westHex = '';
                console.log('No western dot.')
            }
            console.log("Neighbors: " + hexCounter)
            if (hexCounter >= neighbors) {
                drawDot(xy['x'], xy['y'], xy['radius'], sColor);
                percolating = true;
            }
        }
    }
};

function runPercolation(steps) {
    percolating = false;
    initialPosition = steps[0]
    step = steps[frames];
    for (r = 0; r < step.length; r++) {
        for (c = 0; c < step[r].length; c++) {
            if (step[r][c] == 1) {
                var xy = getXY(board[c+r*step[r].length]);
                if (initialPosition[r][c] == 1) {
                    drawDot(xy['x'], xy['y'], xy['radius'], sColor, true);
                } else {
                    drawDot(xy['x'], xy['y'], xy['radius'], sColor);
                }
            }
        }
    }
    frames++;
    if (frames < steps.length) {
        percolating = true;
    }
    if (percolating == false) {
        window.clearInterval(interval);
        console.log("Percolation complete!")
    }
}

function beginPercolation(success, steps) {
    console.log(steps)
    frames = 1
    percolating = true;
    if (steps.length > 1) {
        imgData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        interval = window.setInterval(function() {runPercolation(steps)}, 200);
    };
};

function twoPlayer(e) {
    var x = e.clientX - 10;
    var y = e.clientY - 10;

    var turn = baseColor;

    if (turnCounter % (s + b) < s) {
        turn = sColor;
    } else {
        turn = bColor;
    }

    for (var i = 0; i < board.length; i ++) {
        if (board[i][0][0] <= x && x <= board[i][0][1]) {
            if (board[i][1][0] <= y && y <= board[i][1][1]) {
                if (!board[i][2]) {
                    var results = getXY(board[i]);
                    drawDot(results['x'], results['y'], results['radius'], turn, true);
                    board[i][2] = true;
                    turnCounter++;
                }
            }
        }
    }
}

function sandbox(e) {
    var x = e.clientX - 10;
    var y = e.clientY - 10;

    var turn = sColor;

    for (var i = 0; i < board.length; i ++) {
        if (board[i][0][0] <= x && x <= board[i][0][1]) {
            if (board[i][1][0] <= y && y <= board[i][1][1]) {
                if (!board[i][2]) {
                    var results = getXY(board[i]);
                    drawDot(results['x'], results['y'], results['radius'], turn, true);
                    board[i][2] = true;
                    turnCounter++;

                    rowIndex = Math.floor(i/cols);
                    colIndex = i % cols;
                    startingSet[rowIndex][colIndex] = 1;
                }
            }
        }
    }
}

$('canvas.dots').click(function(e) {
    e.preventDefault();
    console.log(gameType)

    if (gameType == "two_player") {
        twoPlayer(e);
    } else if (gameType == "single_player") {
        onePlayer(e);
    } else {
        sandbox(e);
    }

    console.log(turnCounter)
    console.table(startingSet)

    if (turnCounter >= rows * cols) {
        beginPercolation();
    }
});

$("#randomize").click(function() {

    drawRandomDot(sColor);

})

$("#run").click(function() {
    console.log("Beginning percolation.")

    $.post("/run_percolation", {"startingSet": JSON.stringify(startingSet),
                                "rows": rows,
                                "cols": cols,
                                "neighbors": neighbors,
                                "gameType": gameType})
                                .done(function(data) {
                                    success = data["success"]
                                    steps = JSON.parse(data["steps"])
                                    beginPercolation(success, steps);
                                });
})
