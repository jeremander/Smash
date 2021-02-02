import numpy as np
import PIL.Image

path = 'img_orig/all_icons.png'
img = PIL.Image.open(path)
arr = np.array(img)

num_rows = 7
num_cols = 12

(m, n, _) = arr.shape

row_height = round(m / num_rows)
rows = [arr[round(i * m / num_rows) : round((i + 1) * m / num_rows)] for i in range(num_rows)]

def midpoint(i, j):
    return (i + j) / 2

def crop_vert(mat):
    y_is_blank = (mat[:, :, 3] == 0).all(axis = 1)
    y_transitions = np.where(y_is_blank[:-1] != y_is_blank[1:])[0]
    if (len(y_transitions) == 1):
        y = y_transitions[0]
        if (y <= len(mat) / 2):
            y_transitions = np.concatenate([y_transitions, [len(mat) - 1]])
        else:
            y_transitions = np.concatenate([[0], y_transitions])
    return mat[y_transitions[0] + 1 : y_transitions[-1] + 1]

def center(height, width, mat):
    (ht, wd, k) = mat.shape
    y_diff = max(0, height - ht)
    y_margin = int(y_diff / 2)
    top = np.ones((y_margin, wd, k), dtype = mat.dtype)
    bottom = np.zeros((height - ht - y_margin, wd, k), dtype = mat.dtype)
    mat2 = np.vstack([top, mat, bottom])
    x_diff = max(0, width - wd)
    x_margin = int(x_diff / 2)
    left = np.zeros((height, x_margin, k), dtype = mat.dtype)
    right = np.zeros((height, width - wd - x_margin, k), dtype = mat.dtype)
    return np.hstack([left, mat2, right])

def crop_center(img, width, frac):
    mat = np.array(img)
    if (mat.shape[2] == 3):
        empty = (mat[:, :, 0] == 255) & (mat[:, :, 1] == 255) & (mat[:, :, 2] == 255)
        mat[empty] = 0
        mat = np.dstack([mat, 255 * (~empty).astype(np.uint8)])
    else:
        empty = mat[:, :, 3] == 0
    h_empty, v_empty = empty.all(axis = 0), empty.all(axis = 1)
    cropped = mat[~v_empty][:, ~h_empty]
    w = round(max(cropped.shape[:2]) / frac)
    padded = center(w, w, cropped)
    return PIL.Image.fromarray(padded).resize((width, width))

def split_row(row):
    row = row[:row_height]
    x_is_blank = (row[:, :, 3] == 0).all(axis = 0)
    x_transitions = np.where(x_is_blank[:-1] != x_is_blank[1:])[0]
    x_pairs = [(x + 1, x_transitions[i + 1]) for (i, x) in enumerate(x_transitions[:-1]) if (x_transitions[i + 1] - x >= 50)]
    assert len(x_pairs) in [num_cols, 10]
    return [center(row_height, row_height, crop_vert(row[:, pair[0] : pair[1]])) for pair in x_pairs]

icon_arrs = [mat for row in rows for mat in split_row(row)]

def make_icons():
    i = 0
    for row in rows:
        for mat in split_row(row):
            im = PIL.Image.fromarray(mat)
            im.save(f'img/icon{i}.png')
            i += 1
