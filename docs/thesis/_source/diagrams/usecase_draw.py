# Draws UML use case diagrams with a controlled layout: actors on the left and right,
# use cases in one or two columns inside the system boundary, straight association lines.
import math, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
S = 2  # supersampling factor
F = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
FB = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
font = ImageFont.truetype(F, 22 * S)
font_small = ImageFont.truetype(F, 20 * S)
font_bold = ImageFont.truetype(FB, 24 * S)
INK = (40, 40, 40)
FILL = (242, 242, 242)

ROW_H = 100
UC_W, UC_H = 300, 66
COL_X = {'A': 520, 'B': 900}       # centres of the use case columns
LEFT_X, RIGHT_X = 110, 1300        # centres of the actors
BOX = (300, 1110)                  # system boundary, left and right


def draw_diagram(title, usecases, actors, links, relations, out, rows):
    top = 90
    height = top + rows * ROW_H + 110
    W, H = 1420, height
    img = Image.new('RGB', (W * S, H * S), 'white')
    d = ImageDraw.Draw(img)
    s = lambda v: v * S

    def uc_center(uid):
        col, row = usecases[uid][0], usecases[uid][1]
        return COL_X[col], top + 30 + row * ROW_H + UC_H / 2

    # system boundary
    d.rectangle([s(BOX[0]), s(top - 40), s(BOX[1]), s(top + 30 + rows * ROW_H - 10)], outline=INK, width=s(2))
    tw = d.textlength(title, font=font_bold)
    d.text((s((BOX[0] + BOX[1]) / 2) - tw / 2, s(top - 32)), title, font=font_bold, fill=INK)

    def ellipse_edge(cx, cy, tx, ty):
        a, b = UC_W / 2, UC_H / 2
        ang = math.atan2(ty - cy, tx - cx)
        r = a * b / math.sqrt((b * math.cos(ang)) ** 2 + (a * math.sin(ang)) ** 2)
        return cx + r * math.cos(ang), cy + r * math.sin(ang)

    def actor_pos(aid):
        side, row = actors[aid][1], actors[aid][2]
        return (LEFT_X if side == 'L' else RIGHT_X), top + 30 + row * ROW_H + UC_H / 2

    # associations
    for aid, uid in links:
        ax, ay = actor_pos(aid)
        cx, cy = uc_center(uid)
        # the line enters the ellipse at its outer end, so it never crosses the other use cases of the column
        ex, ey = (cx - UC_W / 2, cy) if ax < cx else (cx + UC_W / 2, cy)
        sx = ax + (32 if ex > ax else -32)
        d.line([s(sx), s(ay), s(ex), s(ey)], fill=INK, width=s(2))

    # include / extend
    for src, dst, label in relations:
        x1, y1 = uc_center(src)
        x2, y2 = uc_center(dst)
        p1 = ellipse_edge(x1, y1, x2, y2)
        p2 = ellipse_edge(x2, y2, x1, y1)
        L = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        n = int(L / 10)
        for i in range(0, n, 2):
            a0, a1 = i / n, min((i + 1) / n, 1)
            d.line([s(p1[0] + (p2[0] - p1[0]) * a0), s(p1[1] + (p2[1] - p1[1]) * a0),
                    s(p1[0] + (p2[0] - p1[0]) * a1), s(p1[1] + (p2[1] - p1[1]) * a1)], fill=INK, width=s(2))
        ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        for da in (0.45, -0.45):
            d.line([s(p2[0]), s(p2[1]), s(p2[0] - 16 * math.cos(ang + da)), s(p2[1] - 16 * math.sin(ang + da))], fill=INK, width=s(2))
        txt = '«' + label + '»'
        tw = d.textlength(txt, font=font_small)
        d.text((s((p1[0] + p2[0]) / 2) - tw / 2, s((p1[1] + p2[1]) / 2 - 30)), txt, font=font_small, fill=INK)

    # use cases
    for uid, (col, row, text) in usecases.items():
        cx, cy = uc_center(uid)
        d.ellipse([s(cx - UC_W / 2), s(cy - UC_H / 2), s(cx + UC_W / 2), s(cy + UC_H / 2)], outline=INK, width=s(2), fill=FILL)
        lines = text.split('\n')
        lh = 25
        y0 = cy - lh * len(lines) / 2
        for i, ln in enumerate(lines):
            tw = d.textlength(ln, font=font)
            d.text((s(cx) - tw / 2, s(y0 + i * lh)), ln, font=font, fill=INK)

    # actors (stick figures)
    for aid, (name, side, row) in actors.items():
        x, y = actor_pos(aid)
        y -= 22
        d.ellipse([s(x - 13), s(y - 42), s(x + 13), s(y - 16)], outline=INK, width=s(2), fill='white')
        d.line([s(x), s(y - 16), s(x), s(y + 22)], fill=INK, width=s(2))
        d.line([s(x - 24), s(y - 4), s(x + 24), s(y - 4)], fill=INK, width=s(2))
        d.line([s(x), s(y + 22), s(x - 18), s(y + 50)], fill=INK, width=s(2))
        d.line([s(x), s(y + 22), s(x + 18), s(y + 50)], fill=INK, width=s(2))
        for i, ln in enumerate(name.split('\n')):
            tw = d.textlength(ln, font=font)
            d.text((s(x) - tw / 2, s(y + 56 + i * 24)), ln, font=font, fill=INK)

    img = img.resize((W * 2, H * 2), Image.LANCZOS)
    img.save(os.path.join(HERE, out), dpi=(200, 200))


draw_diagram(
    'AgroHub: access and administration',
    {
        'UC01': ('A', 0, 'UC01 Browse and search\nthe catalogue'),
        'UC02': ('A', 1, 'UC02 Register an account'),
        'UC03': ('B', 1, 'UC03 Verify the e-mail\nwith a code'),
        'UC04': ('A', 2, 'UC04 Sign in'),
        'UC04a': ('B', 3, 'UC04a Sign in\nwith Google'),
        'UC14': ('A', 5, 'UC14 Moderate accounts'),
        'UC15': ('A', 6, 'UC15 Moderate listings\nand reviews'),
        'UC16': ('A', 7, 'UC16 Configure automatic\nmoderation'),
    },
    {
        'G': ('Guest', 'L', 1),
        'A': ('Administrator', 'L', 6),
        'MAIL': ('E-mail service', 'R', 1),
        'GOOGLE': ('Google Identity\nServices', 'R', 3),
        'AI': ('AI moderation\nservice', 'R', 6),
    },
    [('G', 'UC01'), ('G', 'UC02'), ('G', 'UC04'), ('A', 'UC14'), ('A', 'UC15'), ('A', 'UC16'),
     ('MAIL', 'UC03'), ('GOOGLE', 'UC04a'), ('AI', 'UC15')],
    [('UC02', 'UC03', 'include'), ('UC04a', 'UC04', 'extend')],
    'usecases_access.png', rows=8,
)

draw_diagram(
    'AgroHub: trading',
    {
        'UC05': ('A', 0, 'UC05 Manage listings\nand stock'),
        'UC06': ('B', 0, 'UC06 Check a listing\nautomatically'),
        'UC09': ('A', 1, 'UC09 Accept or reject\nan order'),
        'UC10': ('A', 2, 'UC10 Mark an order\nas delivered'),
        'UC11': ('A', 3, 'UC11 Exchange messages\non an order'),
        'UC12': ('A', 4, 'UC12 Leave a review'),
        'UC13': ('A', 5, 'UC13 Follow orders\nand notifications'),
        'UC07': ('A', 6, 'UC07 Place an order'),
        'UC08': ('A', 7, 'UC08 Edit or cancel\nan order'),
    },
    {
        'S': ('Seller', 'L', 3.1),
        'D': ('Distributor', 'R', 5.2),
        'AI': ('AI moderation\nservice', 'R', 0),
        'MAIL': ('E-mail service', 'L', 6.8),
    },
    [('S', 'UC05'), ('S', 'UC09'), ('S', 'UC10'), ('S', 'UC11'), ('S', 'UC12'), ('S', 'UC13'),
     ('D', 'UC11'), ('D', 'UC12'), ('D', 'UC07'), ('D', 'UC08'), ('D', 'UC13'),
     ('AI', 'UC06'), ('MAIL', 'UC13')],
    [('UC05', 'UC06', 'include')],
    'usecases_trading.png', rows=8,
)
