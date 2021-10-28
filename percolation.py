import numpy as np
import itertools, copy
import math, random


class Grid:
    def __init__(self, shape):
        self.grid = self.build_grid(shape)
        self.shape = shape
        self.result = None
        self.steps = []
        self.lower_bound = math.ceil((shape[0]*shape[1] + shape[1]*shape[2] + shape[2]*shape[0]) / 3)

    def build_grid(self, shape):
        grid = np.zeros(shape, dtype=np.int)
        return grid

    def percolate(self, r, start_set):
        self.steps = []
        self.result = self.build_grid(self.shape)
        temp = self.build_grid(self.shape)
        for vertex in start_set:
            self.result[vertex] = 1
            temp[vertex] = 1
        iterations = 0
        active = True
        complete = False
        while active:
            self.steps.append(self.result.copy())
            active = False
            complete = True
            for index in np.ndindex(self.shape):
                if self.result[index] == 0:
                    complete = False
                    if self.get_neighbors(self.result, index) >= r:
                        temp[index] = 1
                        active = True
            iterations += 1
            self.result = copy.deepcopy(temp)
        return complete, self.steps

    def get_neighbors(self, grid, index):
        val = 0
        for i in range(len(index)):
            index_plus = list(index)
            i_plus = index[i] + 1
            index_plus[i] = i_plus
            if i_plus < self.shape[i]:
                val += grid[tuple(index_plus)]

            index_minus = list(index)
            i_minus = index[i] - 1
            index_minus[i] = i_minus
            if i_minus >= 0:
                val += grid[tuple(index_minus)]
        return val

    def improve(self, ss, r, num_dots):
        if num_dots == self.lower_bound:
            message = "Functionality for this test does not exist."
            changes = []
            if self.test_set(r, ss):
                message = "This set cannot be improved. You did it. Congrats."
                return False, changes, message
            # swap dots until some metric (possibily uninfected area?) is improved
            for index in range(len(ss)):
                new_ss = [x for i, x in enumerate(ss) if i != index]

            return False, changes, message
        else:
            # remove dots and test percolation
            message = "Could not improve percolation by removing dots."
            changes = []
            if not self.test_set(r, ss):
                message = "You can only improve a set above the lower bound if it percolates."
                return False, changes, message
            # shuffle list of indices and iterate through them
            indices = list(range(len(ss)))
            random.shuffle(indices)
            for index in indices:
                new_ss = [x for i, x in enumerate(ss) if i != index]
                if self.test_set(r, new_ss):
                    message = f"Successfully removed dot at coordinate {ss[index]}."
                    changes.append((ss[index], None))
                    return True, changes, message
            return False, changes, message

    def test_set(self, r, set):
        self.result = self.build_grid(self.shape)
        for vertex in set:
            self.result[vertex] = 1
        iterations = 0
        active = True
        complete = False
        while active:
            active = False
            complete = True
            for index in np.ndindex(self.shape):
                if self.result[index] == 0:
                    complete = False
                    if self.get_neighbors(self.result, index) >= r:
                        self.result[index] = 1
                        active = True
            iterations += 1
        return complete


def generate_coords(shape, n):
    l = []
    for i in shape:
        r = range(i)
        l.append(r)
    all_coords = [i for i in itertools.product(*l)]
    sets = list(itertools.combinations(all_coords, n))
    '''
    print(f"Total sets: {len(sets)}")
    counter = 0
    for s in sets:
        counter += 1
        if counter % 1 == 0:
            print(f"{round(counter/len(sets)*100, 2)}%")
        syms = generate_symmetries(shape, s)
        for t in syms:
            if t in sets:
                sets.remove(list(t))
    '''
    return sets


def generate_symmetries(shape, coords):
    translate = tuple([(shape[i] - 1)/2 for i in range(len(shape))])
    coords = [tuple(np.subtract(coord, translate)) for coord in coords]
    s_r1 = []
    s_r2 = []
    s_r3 = []
    s_f = []
    s_fr1 = []
    s_fr2 = []
    s_fr3 = []
    for c in coords:
        cf = (c[1], c[0])
        s_r1.append(tuple(np.add((-c[1], c[0]), translate).astype(int)))
        s_r2.append(tuple(np.add((-c[1], -c[0]), translate).astype(int)))
        s_r3.append(tuple(np.add((c[1], -c[0]), translate).astype(int)))
        s_fr1.append(tuple(np.add((-cf[1], cf[0]), translate).astype(int)))
        s_fr2.append(tuple(np.add((-cf[1], -cf[0]), translate).astype(int)))
        s_fr3.append(tuple(np.add((cf[1], -cf[0]), translate).astype(int)))
        s_f.append(tuple(np.add(cf, translate).astype(int)))
    sym = [set(s_r1), set(s_r2), set(s_r3), set(s_fr1), set(s_fr2), set(s_fr3), set(s_f)]
    sym.sort()
    return list(k for k, _ in itertools.groupby(sym))


def construct_starting_set(shape):
    ss = []
    x, y, h = shape[0], shape[1], shape[2]
    for i in range(h):
        for j in range(x):
            for k in range(y):
                if i == 0:
                    coord = (k,j,i)
                    ss.append(coord)
                elif i == 1 % 2:
                    if j == k and j < int(x/2) + 1:
                        coord = (k, j, i)
                        ss.append(coord)
                elif i == 0 % 2:
                    if j >= int(x/2) - 1:
                        pass


'''
shape = (5,5)
test_coords = [(0, 0), (0, 2), (0, 4)]
syms = generate_symmetries(shape, test_coords)
print(syms)
'''


'''
sets = generate_coords(shape, 13)

counter = 0
print(f"Total sets: {len(sets)}")
for s in sets:
    counter += 1
    if counter % 2220 == 0:
        print(f"{round(counter/len(sets)*100, 2)}%")
    result = g.percolate(3, list(s)+start_set)
    if result[0]:
        print(f"Iterations: {result[1]}")
        print(f"Starting set: {list(s)+start_set}")
        print("############################################")
'''



