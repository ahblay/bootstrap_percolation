from flask import Flask, render_template, request, json
from percolation import Grid
from json import JSONEncoder
import numpy

app = Flask(__name__)


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/run_percolation', methods=['POST'])
def run_percolation():
    starting_set = json.loads(request.form["startingSet"])
    rows = json.loads(request.form["rows"])
    cols = json.loads(request.form["cols"])
    layers = json.loads(request.form["layers"])
    game_type = request.form["gameType"]
    neighbors = json.loads(request.form["neighbors"])
    print(starting_set)
    print(neighbors)

    ss = []
    for l in range(layers):
        for i in range(rows):
            for j in range(cols):
                if starting_set[l][i][j] == 1:
                    ss.append((l, i, j))

    g = Grid((layers, rows, cols))
    results = g.percolate(neighbors, ss)
    steps = json.dumps(results[1], cls=NumpyArrayEncoder)
    return {"success": results[0], "steps": steps}


@app.route('/improve', methods=['POST'])
def improve():
    starting_set = json.loads(request.form["startingSet"])
    num_dots = json.loads(request.form["turnCounter"])
    rows = json.loads(request.form["rows"])
    cols = json.loads(request.form["cols"])
    layers = json.loads(request.form["layers"])
    neighbors = json.loads(request.form["neighbors"])

    ss = []
    for l in range(layers):
        for i in range(rows):
            for j in range(cols):
                if starting_set[l][i][j] == 1:
                    ss.append((l, i, j))

    # we need to handle a couple of cases:
    #
    # 1. if num_dots == lower_bound: swap dots until the resulting set percolates further (perhaps employ some of Jon's/
    # Peter's heuristics to ensure this process moves quickly)
    #
    # 2. if num_dots > lower_bound AND set percolates: check if removing any dot still permits percolation. if not,
    # remove dot that maximizes infected area
    #
    # 3. all remaining cases should not be handled

    g = Grid((layers, rows, cols))
    result = g.improve(ss, neighbors, num_dots)

    return {"success": result[0], "changes": result[1], "message": result[2]}


if __name__ == '__main__':
    app.run(debug=True)