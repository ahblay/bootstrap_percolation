from flask import Flask, render_template, request, json
from percolation import Grid
from json import JSONEncoder
import numpy
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()

SQLALCHEMY_DATABASE_URI = "mysql+mysqlconnector://{username}:{password}@{hostname}/{databasename}".format(
    username=os.environ.get("db_user"),
    password=os.environ.get("db_password"),
    hostname=os.environ.get("db_host"),
    databasename=os.environ.get("db_name"),
)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_POOL_RECYCLE"] = 299
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

print(os.environ.get("db_host"))

db = SQLAlchemy(app)


class PercolatingSets(db.Model):

    __tablename__ = "percolating_sets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(16))
    neighbors = db.Column(db.Integer)
    starting_set = db.Column(db.Text)
    shape = db.Column(db.Text)


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

    if results[0] and len(ss) == g.lower_bound:
        starting_set = request.form["startingSet"]
        name = f"{rows}x{cols}x{layers}"
        query = PercolatingSets.query.filter_by(name=name).all()
        if query:
            for entry in query:
                if entry.starting_set == starting_set:
                    return {"success": results[0], "steps": steps}
        shape = json.dumps((layers, rows, cols))
        db_entry = PercolatingSets(name=name,
                                   neighbors=neighbors,
                                   starting_set=starting_set,
                                   shape=shape)
        db.session.add(db_entry)
        db.session.commit()
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


@app.route('/display_set', methods=['POST'])
def display_set():
    id = json.loads(request.form["id"])
    print(id)
    set = PercolatingSets.query.filter_by(id=id).first()
    return {"starting_set": set.starting_set, "neighbors": set.neighbors, "shape": set.shape}


@app.route('/get_optimal_sets', methods=['GET'])
def get_sets():
    sets = []
    for set in PercolatingSets.query.all():
        sets.append((set.name, set.id))
    return {'sets': sets}


if __name__ == '__main__':
    app.run(debug=True)