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

    print(ss)

    g = Grid((layers, rows, cols))
    results = g.percolate(neighbors, ss)
    print(results)
    steps = json.dumps(results[1], cls=NumpyArrayEncoder)
    print(steps)
    return {"success": results[0], "steps": steps}


if __name__ == '__main__':
    app.run(debug=True)