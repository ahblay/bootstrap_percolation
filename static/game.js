var canvas = $('canvas.dots');
var canvasWidth = Math.round($(window).width() * 0.75);
var canvasHeight = Math.round($(window).height() * 0.95);
canvas.attr({height: canvasHeight, width: canvasWidth});
var context = canvas[0].getContext('2d');

var imgData;
var percolating = true;
var frames = 1;

var rows = 0;
var cols = 0;
var board = [];
var s = 1;
var b = 3;
var baseColor = '#d3d3d3';
var sColor = '#ff0000';
var bColor = '#51beff';
var turnCounter = 0;
var gameType = 'sandbox';
var neighbors = 3;
var startingSet = [];
var boardHeight = 0;
var steps = [];
var success = false;
var frameIndex = 0;
var layers = 0;
var reflect = false;

function resetCanvas() {
    board = [];
    startingSet = [];
    turnCounter = 0;
    percolating = true;
    success = false;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
}

function initializeProperties(rows, cols, layers) {
    $("#run").prop('disabled', false);
    $("#animate").prop('disabled', false);
    $("#num_rand").prop('disabled', false);
    $("#randomize").prop('disabled', false);
    $("#download").prop('disabled', false);
    //$("#reflect").prop('disabled', false);
    $("#improve").prop('disabled', false);

    $("#left").prop('disabled', true);
    $("#right").prop('disabled', true);

    $("#lower_bound").empty();
    $("#lower_bound").append("SA bound: " + "0/" + calculateLowerBound(rows, cols, layers));

    $("#num_rand").val(calculateLowerBound(rows, cols, layers));


};

function readBoardData() {
    rows = Number($("#rows").val());
    cols = Number($("#cols").val());
    //s = Number($("#s_moves").val());
    //b = Number($("#b_moves").val());
    neighbors = Number($("#neighbors").val());
    gameType = $("#game_type").val();
    layers = Number($("#layers").val());
};

$("#submit").click(function() {
    readBoardData();
    resetCanvas();
    buildGrid(rows, cols, layers);
    initializeProperties(rows, cols, layers);
})

function calculateLowerBound(x, y, z) {
    return Math.round(100 * ((x*y + y*z + z*x)/3)) / 100;
};

function drawDot(x, y, radius, color, outline=false) {
    context.clearRect(x-(radius*1.1), y-(radius*1.1), 2.2*radius, 2.2*radius);
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
    if (outline && color == sColor) {
        /*
        context.strokeStyle = "black";
        context.lineWidth = radius / 7;
        context.stroke();
        */
        context.fillStyle = 'black';
        context.fill();
    }
}

function buildGrid(rows, cols, layers) {
    var numRows = rows;
    var numCols = cols;

    console.log("rows: " + numRows)
    console.log("cols: " + numCols)

    console.log("canvasWidth: " + canvasWidth);
    console.log("canvasHeight: " + canvasHeight);

    var dotWidth = canvasWidth / ((2 * numCols));
    // vvv leave space for other layers to be drawn below vvv
    var dotHeight = canvasHeight / (2 * (numRows * layers + (layers - 1)));

    console.log("dotWidth: " + dotWidth);
    console.log("dotHeight: " + dotHeight);

    if (dotWidth > dotHeight) {
        var dotDiameter = dotMargin = dotHeight;
    } else {
        var dotDiameter = dotMargin = dotWidth;
    }

    var boardHeight = (rows + 1) * dotDiameter * 2;

    console.log("dotDiameter: " + dotDiameter);
    console.log("dotMargin: " + dotMargin);

    var dotRadius = dotDiameter * 0.5;

    console.log("dotRadius: " + dotRadius);

    for (var k = 0; k < layers; k++) {
        layerArray = [];
        boardLayer = []
        for (var i = 0; i < numRows; i++) {
            rowArray = [];
            for (var j = 0; j < numCols; j++) {
                rowArray.push(0);
                var x = (j * (dotDiameter + dotMargin)) + dotMargin + dotRadius;
                var y = (i * (dotDiameter + dotMargin)) + dotMargin + dotRadius + (k * boardHeight);
                drawDot(x, y, dotRadius, baseColor);
                console.log("drawing dot: " + x + " " + y)
                var xRange = [x - dotRadius, x + dotRadius];
                var yRange = [y - dotRadius, y + dotRadius];
                var coords = [xRange, yRange, false];
                boardLayer.push(coords);
            }
            layerArray.push(rowArray);
        }
        startingSet.push(layerArray);
        board.push(boardLayer);
    }
    console.log(board)
    console.log('board length: ' + layers * board[0].length)
};

function getXY(dot) {
    var radius = (dot[0][1] - dot[0][0]) / 2;
    var x = dot[0][0] + radius;
    var y = dot[1][0] + radius;
    return {'x': x, 'y': y, 'radius': radius};
};

function drawRandomDot(color) {
    // picks a random layer
    l = Math.floor(Math.random() * layers);
    console.log(l)
    r = Math.floor(Math.random() * (rows*cols));
    console.log(board[l][r])
    var xy = getXY(board[l][r]);
    rowIndex = Math.floor(r/cols);
    colIndex = r % cols;
    if (startingSet[l][rowIndex][colIndex] == 0) {
        board[l][r][2] = true;

        startingSet[l][rowIndex][colIndex] = 1;
        drawDot(xy['x'], xy['y'], xy['radius'], color, true);

        turnCounter++;
        $("#lower_bound").empty();
        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))
        return true;
    } else {
        return false;
    };
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
    for (l = 0; l < step.length; l++) {
        for (r = 0; r < step[l].length; r++) {
            for (c = 0; c < step[l][r].length; c++) {
                if (step[l][r][c] == 1) {
                    var xy = getXY(board[l][c+r*step[l][r].length]);
                    if (initialPosition[l][r][c] == 1) {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor, true);
                    } else {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor);
                    }
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
    console.log(success)
    console.log(steps)
    frames = 1
    percolating = true;
    if (steps.length > 1) {
        imgData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        interval = window.setInterval(function() {runPercolation(steps)}, 150);
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

    for (var l = 0; l < layers; l++) {
        for (var i = 0; i < board[l].length; i ++) {
            if (board[l][i][0][0] <= x && x <= board[l][i][0][1]) {
                if (board[l][i][1][0] <= y && y <= board[l][i][1][1]) {
                    if (!board[l][i][2]) {
                        var results = getXY(board[l][i]);
                        drawDot(results['x'], results['y'], results['radius'], turn, true);
                        board[l][i][2] = true;
                        turnCounter++;
                    }
                }
            }
        }
    }
}

// TODO: Fix functionality for handling reflections. Is extremely messy and filled with conditionals.
function sandbox(e) {
    var x = e.clientX - 10;
    var y = e.clientY - 10;

    var turn = sColor;

    if (reflect) {
        for (var i = 0; i < board[0].length; i++) {
            if (board[0][i][0][0] <= x && x <= board[0][i][0][1]) {
                if (board[0][i][1][0] <= y && y <= board[0][i][1][1]) {
                    // if already chosen, color gray
                    if (board[0][i][2]) {
                        console.log("uncolor this dot")

                        var results_top = getXY(board[0][i]);
                        var results_bottom = getXY(board[layers - 1][board[0].length - 1 - i]);

                        drawDot(results_top['x'], results_top['y'], results_top['radius'], baseColor);
                        drawDot(results_bottom['x'], results_bottom['y'], results_bottom['radius'], baseColor);

                        if (board[layers - 1][board[0].length - 1 - i][2]) {
                            turnCounter = turnCounter - 2;
                        } else {
                            turnCounter = turnCounter - 1;
                        }

                        $("#lower_bound").empty();
                        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                        rowIndex = Math.floor(i/cols);
                        colIndex = i % cols;
                        startingSet[0][rowIndex][colIndex] = 0;
                        startingSet[layers - 1][rows - 1 - rowIndex][cols - 1 - colIndex] = 0;

                        board[0][i][2] = false;
                        board[layers - 1][board[0].length - 1 - i][2] = false;
                    }

                    else {
                        var results_top = getXY(board[0][i]);
                        var results_bottom = getXY(board[layers - 1][board[0].length - 1 - i]);

                        drawDot(results_top['x'], results_top['y'], results_top['radius'], turn, true);
                        drawDot(results_bottom['x'], results_bottom['y'], results_bottom['radius'], turn, true);

                        if (board[layers - 1][board[0].length - 1 - i][2]) {
                            turnCounter = turnCounter + 1;
                        } else {
                            turnCounter = turnCounter + 2;
                        }

                        board[0][i][2] = true;
                        board[layers - 1][board[0].length - 1 - i][2] = true;

                        $("#lower_bound").empty();
                        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                        rowIndex = Math.floor(i/cols);
                        colIndex = i % cols;
                        startingSet[0][rowIndex][colIndex] = 1;
                        startingSet[layers - 1][rows - 1 - rowIndex][cols - 1 - colIndex] = 1
                    }
                }
            }
        }
        for (var l = 1; l < layers - 1; l++) {
            for (var i = 0; i < board[l].length; i++) {
                if (board[l][i][0][0] <= x && x <= board[l][i][0][1]) {
                    if (board[l][i][1][0] <= y && y <= board[l][i][1][1]) {
                        // if already chosen, color gray
                        if (board[l][i][2]) {
                            console.log("uncolor this dot")
                            var results = getXY(board[l][i]);
                            drawDot(results['x'], results['y'], results['radius'], baseColor);

                            turnCounter--;
                            $("#lower_bound").empty();
                            $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                            rowIndex = Math.floor(i/cols);
                            colIndex = i % cols;
                            startingSet[l][rowIndex][colIndex] = 0;
                            board[l][i][2] = false;
                        }

                        else {
                            var results = getXY(board[l][i]);

                            drawDot(results['x'], results['y'], results['radius'], turn, true);
                            board[l][i][2] = true;

                            turnCounter++;
                            $("#lower_bound").empty();
                            $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                            rowIndex = Math.floor(i/cols);
                            colIndex = i % cols;
                            startingSet[l][rowIndex][colIndex] = 1;
                        }
                    }
                }
            }
        }
    } else {
        for (var l = 0; l < layers; l++) {
            for (var i = 0; i < board[l].length; i++) {
                if (board[l][i][0][0] <= x && x <= board[l][i][0][1]) {
                    if (board[l][i][1][0] <= y && y <= board[l][i][1][1]) {
                        // if already chosen, color gray
                        if (board[l][i][2]) {
                            console.log("uncolor this dot")
                            var results = getXY(board[l][i]);
                            drawDot(results['x'], results['y'], results['radius'], baseColor);

                            turnCounter--;
                            $("#lower_bound").empty();
                            $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                            rowIndex = Math.floor(i/cols);
                            colIndex = i % cols;
                            startingSet[l][rowIndex][colIndex] = 0;
                            board[l][i][2] = false;
                        }

                        else {
                            var results = getXY(board[l][i]);

                            drawDot(results['x'], results['y'], results['radius'], turn, true);
                            board[l][i][2] = true;

                            turnCounter++;
                            $("#lower_bound").empty();
                            $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                            rowIndex = Math.floor(i/cols);
                            colIndex = i % cols;
                            startingSet[l][rowIndex][colIndex] = 1;
                        }
                    }
                }
            }
        }
    }
}

function applyChanges(changes) {
    for (var i = 0; i < changes.length; i++) {
        toRemove = changes[i][0];
        toAdd = changes[i][1];
        lRemove = toRemove[0];
        rRemove = toRemove[1];
        cRemove = toRemove[2];

        var results = getXY(board[lRemove][rRemove*cols + cRemove])
        drawDot(results['x'], results['y'], results['radius'], baseColor);
        turnCounter--;
        $("#lower_bound").empty();
        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))
        startingSet[lRemove][rRemove][cRemove] = 0;
        board[lRemove][rRemove*cols + cRemove][2] = false;
    }
}

function parseFile(file) {
    // NOTE: There is some nastiness here with \n and \r\n. Windows .txt files use \r\n, whereas Mac uses \n. The code
    // below is written to accept \r\n only. I need to fix it to convert all newline characters to be the same.

    readBoardData();

    file = file.replace(/\r?\n|\r/g, '\n')
    console.log(file)
    console.log(file.split('\n\n'));

    data = []

    for (var i = 0; i < file.split('\n\n').length; i++) {
        layerArray = [];
        fileLayer = file.split('\n\n')[i];
        console.log(fileLayer)
        for (var j = 0; j < fileLayer.split('\n').length; j++) {
            rowArray = [];
            fileRow = fileLayer.split('\n')[j];
            console.log(fileRow)
            for (var k = 0; k < fileRow.split('', fileRow.length).length; k++) {
                fileCol = fileRow.split('', fileRow.length)[k];
                console.log(fileCol)
                if (fileCol == 'O') {
                    rowArray.push(0);
                } else if (fileCol == 'X') {
                    rowArray.push(1);
                } else {
                    alert("The contents of this file are not readable by this program. Please enter files containing only X's and O's.")
                    return false;
                };
            };
            layerArray.push(rowArray);
        };
        data.push(layerArray);
    };

    rows = Math.max(rows, data[0].length);
    cols = Math.max(cols, data[0][0].length);
    layers = Math.max(layers, data.length);

    resetCanvas();
    buildGrid(rows, cols, layers);
    initializeProperties(rows, cols, layers);

    $('#rows').val(rows);
    $('#cols').val(cols);
    $('#layers').val(layers);

    return data;
};

function initializeGrid(data) {
    if (reflect) {
        for (var l = 0; l < layers - 1; l++) {
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    if (data[l][r][c] == 1) {
                        // color the corresponding dot
                        // mark dot as selected
                        boardIndex = cols*r + c;
                        var results = getXY(board[l][boardIndex]);

                        drawDot(results['x'], results['y'], results['radius'], sColor, true);
                        board[l][boardIndex][2] = true;

                        turnCounter++;
                        $("#lower_bound").empty();
                        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                        startingSet[l][r][c] = 1;
                    }
                }
            }
        }
        // Reflects the first layer onto the bottom layer.
        for (var r = rows - 1; r >= 0; r--) {
            for (var c = cols - 1; c >= 0; c--) {
                if (data[0][r][c] == 1) {
                    // color the corresponding dot
                    // mark dot as selected
                    boardIndex = -cols*(r-rows+1) - (c-cols+1);
                    var results = getXY(board[layers - 1][boardIndex]);

                    drawDot(results['x'], results['y'], results['radius'], sColor, true);
                    board[layers - 1][boardIndex][2] = true;

                    turnCounter++;
                    $("#lower_bound").empty();
                    $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                    startingSet[layers - 1][-r+rows-1][-c+cols-1] = 1;
                }
            }
        }
    } else {
        for (var l = 0; l < layers; l++) {
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    if (data[l][r][c] == 1) {
                        // color the corresponding dot
                        // mark dot as selected
                        boardIndex = cols*r + c;
                        var results = getXY(board[l][boardIndex]);

                        drawDot(results['x'], results['y'], results['radius'], sColor, true);
                        board[l][boardIndex][2] = true;

                        turnCounter++;
                        $("#lower_bound").empty();
                        $("#lower_bound").append("SA bound: " + turnCounter + "/" + calculateLowerBound(rows, cols, layers))

                        startingSet[l][r][c] = 1;
                    }
                }
            }
        }
    }
};

$('canvas.dots').click(function(e) {
    e.preventDefault();
    console.log(gameType)

    if (gameType == "two_player") {
        twoPlayer(e);
    } else if (gameType == "single_player") {
        onePlayer(e);
    } else {
        $("#right").prop('disabled', true);
        sandbox(e);
    }

    console.log(turnCounter)
    console.log(startingSet)
    for (var i = 0; i < startingSet.length; i++) {
        console.table(startingSet[i])
    }

    if (turnCounter >= rows * cols) {
        // Commented out as there is no reason to begin percolation at this point vvv
        // beginPercolation();
    }
});

$("#num_rand").on('input', function() {
    numRand = Number($("#num_rand").val());
    if (turnCounter + numRand > layers * rows * cols) {
        $("#randomize").prop('disabled', true);
    } else {
        $("#randomize").prop('disabled', false);
    }
});

$("#randomize").click(function() {
    numRand = Number($("#num_rand").val());
    counter = 0;
    while (counter < numRand) {
        drawn = drawRandomDot(sColor);
        if (drawn) {
            counter++;
        };
    };
    if (turnCounter + numRand > layers * rows * cols) {
        $("#randomize").prop('disabled', true);
    };
});

$("#left").click(function() {
    console.log("Displaying previous percolation frame...");
    frameIndex--;

    $("#right").prop('disabled', false);
    initialPosition = steps[0];

    step = steps[frameIndex];
    for (l = 0; l < step.length; l++) {
        for (r = 0; r < step[l].length; r++) {
            for (c = 0; c < step[l][r].length; c++) {
                var xy = getXY(board[l][c+r*step[l][r].length]);
                drawDot(xy['x'], xy['y'], xy['radius'], baseColor);
                if (step[l][r][c] == 1) {
                    if (initialPosition[l][r][c] == 1) {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor, true);
                    } else {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor);
                    }
                }
            }
        }
    }

    if (frameIndex - 1 < 0) {
        $("#left").prop('disabled', true);
    }
});

$("#right").click(function() {
    console.log("Displaying next percolation frame...")
    frameIndex++;

    $("#left").prop('disabled', false);
    initialPosition = steps[0];

    step = steps[frameIndex];
    for (l = 0; l < step.length; l++) {
        for (r = 0; r < step[l].length; r++) {
            for (c = 0; c < step[l][r].length; c++) {
                if (step[l][r][c] == 1) {
                    var xy = getXY(board[l][c+r*step[l][r].length]);
                    if (initialPosition[l][r][c] == 1) {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor, true);
                    } else {
                        drawDot(xy['x'], xy['y'], xy['radius'], sColor);
                    }
                }
            }
        }
    }

    if (frameIndex + 1 >= steps.length) {
        $("#right").prop('disabled', true);
    }
});

$("#run").click(function() {
    console.log("Beginning percolation.")
    var animate = $('#animate').is(":checked");
    console.log(animate)

    $.post("/run_percolation", {"startingSet": JSON.stringify(startingSet),
                                "rows": rows,
                                "cols": cols,
                                "layers": layers,
                                "neighbors": neighbors,
                                "gameType": gameType})
                                .done(function(data) {
                                    success = data["success"];
                                    steps = JSON.parse(data["steps"]);
                                    if (animate) {
                                        beginPercolation(success, steps);
                                    } else {
                                        //stepByStepPercolation(success, steps);
                                        // highlight arrow buttons
                                        frameIndex = 0;

                                        if (frameIndex + 1 < steps.length) {
                                            $("#right").prop('disabled', false);
                                        };
                                    };
                                });
});

$("#upload").click(function() {
    var file = fileupload.files[0];
    var reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function() {
        console.log(reader.result);
        data = parseFile(reader.result);
        if (data) {
            console.log(data);
            initializeGrid(data);
        };
    };

    reader.onerror = function() {
        console.log(reader.error);
    };
});

$("#reflect").change(function() {
    if (this.checked) {
        reflect = true;
    } else {
        reflect = false;
    }
});

function getTextFile() {
    text = "";

    for (i = 0; i < layers; i++) {
        for (j = 0; j < rows * cols; j++) {
            if (j % cols == 0 && j != 0) {
                text = text.concat("\n")
            }
            if (board[i][j][2] == true) {
                text = text.concat("X")
            } else if (board[i][j][2] == false) {
                text = text.concat("O")
            }
        }
        if (i+1 < layers) {
            text = text.concat("\n\n")
        }
    }
    return text
};

$("#download").click(function() {
    text = getTextFile();
    filename = rows + "x" + cols + "x" + layers;

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
});

$("#improve").click(function() {
    if (turnCounter < Math.ceil(calculateLowerBound(rows, cols, layers))) {
        alert("You cannot improve a set below the lower bound. It is too computationally expensive.");
        return;
    }

    // POST starting_set to back end

    $.post("/improve", {"startingSet": JSON.stringify(startingSet),
                        "turnCounter": turnCounter,
                        "rows": rows,
                        "cols": cols,
                        "layers": layers,
                        "neighbors": neighbors})
                        .done(function(data) {
                            applyChanges(data["changes"]);
                            if (!data["success"]) {
                                alert(data["message"]);
                            }
                        });

});

$("#showsets").click(function() {
    // query all optimal percolating sets and display links their links.
    $.get("/get_optimal_sets", function(data) {
        console.log(data);
        buildModalContent(data["sets"]);
    });
    $("#setsmodal").css("display", "block");
});

function buildModalContent(names) {
    $("#sets-modal-content").children().not(':first').remove();
    for (i = 0; i < names.length; i++) {
        name = names[i][0];
        id = names[i][1];
        var $set = $("<a>", {text: name,
                             href: "#",
                             id: id,
                             "class": "set",
                             click: function() {
                                id = this.id;
                                console.log(this)
                                $.post("/display_set", {"id": JSON.stringify(id)}).done(function(data){
                                    ss = JSON.parse(data['starting_set']);
                                    neighbors = JSON.parse(data['neighbors']);
                                    shape = JSON.parse(data['shape']);
                                    layers = shape[0];
                                    rows = shape[1];
                                    cols = shape[2];

                                    $("#setsmodal").css("display", "none");

                                    resetCanvas();
                                    buildGrid(rows, cols, layers);
                                    initializeProperties(rows, cols, layers);

                                    $('#rows').val(rows);
                                    $('#cols').val(cols);
                                    $('#layers').val(layers);
                                    initializeGrid(ss);
                                });
                             }
                             });
        console.log($set);
        $("#sets-modal-content").append($set);
        if (i < names.length -1) {
            $("#sets-modal-content").append("<br><br>");
        }
    }
}

$("#exitsets").click(function() {
    $("#setsmodal").css("display", "none");
});

