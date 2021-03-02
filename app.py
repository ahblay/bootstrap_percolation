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
    print(starting_set)
    rows = json.loads(request.form["rows"])
    cols = json.loads(request.form["cols"])
    game_type = request.form["gameType"]
    neighbors = json.loads(request.form["neighbors"])
    print(starting_set)
    print(neighbors)

    ss = []

    for i in range(cols):
        for j in range(rows):
            if starting_set[i][j] == 1:
                ss.append((i, j))

    print(ss)

    g = Grid((rows, cols))
    results = g.percolate(neighbors, ss)
    print(results)
    steps = json.dumps(results[1], cls=NumpyArrayEncoder)
    print(steps)
    return {"success": results[0], "steps": steps}


if __name__ == '__main__':
    app.run(debug=True)