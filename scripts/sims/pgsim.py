# ---------------------------------------------------------------------------
# A small stand-in for pygame that runs anywhere (including in the browser).
# It has no window and plays no sound: it keeps the parts of pygame that
# are plain data and arithmetic (Rect, Vector2, Color, Surface pixels, events,
# sprites and groups, the K_* key constants) so that game LOGIC written for the
# real library can be run and checked. Behaviour follows pygame 2.6 for the
# parts used in the lessons; this is not a complete implementation of pygame.
# ---------------------------------------------------------------------------
import sys as _sys
import types as _types
import math as _math


class _PgError(RuntimeError):
    pass


_PgError.__name__ = 'error'
_PgError.__qualname__ = 'error'


# ----------------------------------------------------------------------- numbers
def _num(v):
    if isinstance(v, int):
        return int(v)
    if isinstance(v, float):
        return int(v)
    raise TypeError('Argument must be rect style object')


def _half(n):
    """Half of a length, as used by centre properties (rounds down)."""
    return n // 2


def _thalf(n):
    """C-style integer division by 2 (truncates toward zero)."""
    return int(n / 2)


def _snum(v):
    """Attribute assignment rounds floats to the nearest integer (halves away from zero)."""
    if isinstance(v, int):
        return int(v)
    if isinstance(v, float):
        return int(_math.floor(abs(v) + 0.5)) * (1 if v >= 0 else -1)
    raise TypeError('invalid rect assignment')


def _rect_tuple(args):
    if len(args) == 1:
        a = args[0]
        if isinstance(a, _Rect):
            return (a.x, a.y, a.w, a.h)
        if hasattr(a, 'rect') and not isinstance(a, (tuple, list)):
            r = a.rect
            if callable(r):
                r = r()
            return _rect_tuple((r,))
        try:
            seq = list(a)
        except TypeError:
            raise TypeError('Argument must be rect style object') from None
        if len(seq) == 4:
            return tuple(_num(v) for v in seq)
        if len(seq) == 2:
            return _rect_tuple((seq[0], seq[1]))
        raise TypeError('Argument must be rect style object')
    if len(args) == 2:
        try:
            (x, y), (w, h) = args[0], args[1]
        except (TypeError, ValueError):
            raise TypeError('Argument must be rect style object') from None
        return (_num(x), _num(y), _num(w), _num(h))
    if len(args) == 4:
        return tuple(_num(v) for v in args)
    raise TypeError('Argument must be rect style object')


def _pair(args, what='Argument must be a pair of numbers'):
    if len(args) == 1:
        try:
            a, b = args[0]
        except (TypeError, ValueError):
            raise TypeError(what) from None
        return a, b
    if len(args) == 2:
        return args[0], args[1]
    raise TypeError(what)


def _ipair(args):
    a, b = _pair(args)
    return _num(a), _num(b)


# -------------------------------------------------------------------------- Rect
class _Rect:
    __slots__ = ('_x', '_y', '_w', '_h')
    __hash__ = None
    x = property(lambda s: s._x, lambda s, v: setattr(s, '_x', _snum(v)))
    y = property(lambda s: s._y, lambda s, v: setattr(s, '_y', _snum(v)))
    w = property(lambda s: s._w, lambda s, v: setattr(s, '_w', _snum(v)))
    h = property(lambda s: s._h, lambda s, v: setattr(s, '_h', _snum(v)))

    def __init__(self, *args):
        self.x, self.y, self.w, self.h = _rect_tuple(args)

    # edges and corners
    left = property(lambda s: s.x, lambda s, v: setattr(s, 'x', _snum(v)))
    top = property(lambda s: s.y, lambda s, v: setattr(s, 'y', _snum(v)))
    width = property(lambda s: s.w, lambda s, v: setattr(s, 'w', _snum(v)))
    height = property(lambda s: s.h, lambda s, v: setattr(s, 'h', _snum(v)))
    right = property(lambda s: s.x + s.w, lambda s, v: setattr(s, 'x', _snum(v) - s.w))
    bottom = property(lambda s: s.y + s.h, lambda s, v: setattr(s, 'y', _snum(v) - s.h))
    centerx = property(lambda s: s.x + _half(s.w), lambda s, v: setattr(s, 'x', _snum(v) - _half(s.w)))
    centery = property(lambda s: s.y + _half(s.h), lambda s, v: setattr(s, 'y', _snum(v) - _half(s.h)))

    def _set2(self, a, b, which):
        a, b = _snum(a), _snum(b)
        if which == 'topleft':
            self.x, self.y = a, b
        elif which == 'topright':
            self.x, self.y = a - self.w, b
        elif which == 'bottomleft':
            self.x, self.y = a, b - self.h
        elif which == 'bottomright':
            self.x, self.y = a - self.w, b - self.h
        elif which == 'midtop':
            self.x, self.y = a - _half(self.w), b
        elif which == 'midleft':
            self.x, self.y = a, b - _half(self.h)
        elif which == 'midbottom':
            self.x, self.y = a - _half(self.w), b - self.h
        elif which == 'midright':
            self.x, self.y = a - self.w, b - _half(self.h)
        elif which == 'center':
            self.x, self.y = a - _half(self.w), b - _half(self.h)
        elif which == 'size':
            self.w, self.h = a, b

    def _get2(self, which):
        x, y, w, h = self.x, self.y, self.w, self.h
        return {
            'topleft': (x, y), 'topright': (x + w, y), 'bottomleft': (x, y + h), 'bottomright': (x + w, y + h),
            'midtop': (x + _half(w), y), 'midleft': (x, y + _half(h)), 'midbottom': (x + _half(w), y + h),
            'midright': (x + w, y + _half(h)), 'center': (x + _half(w), y + _half(h)), 'size': (w, h),
        }[which]

    def _mk(which):
        def get(self):
            return self._get2(which)

        def put(self, v):
            try:
                a, b = v
            except (TypeError, ValueError):
                raise TypeError('Argument must be a sequence of 2 numbers') from None
            self._set2(a, b, which)
        return property(get, put)

    topleft = _mk('topleft')
    topright = _mk('topright')
    bottomleft = _mk('bottomleft')
    bottomright = _mk('bottomright')
    midtop = _mk('midtop')
    midleft = _mk('midleft')
    midbottom = _mk('midbottom')
    midright = _mk('midright')
    center = _mk('center')
    size = _mk('size')
    del _mk

    # sequence protocol
    def _t(self):
        return (self.x, self.y, self.w, self.h)

    def __len__(self):
        return 4

    def __iter__(self):
        return iter(self._t())

    def __getitem__(self, i):
        if isinstance(i, slice):
            return list(self._t()[i])
        try:
            return self._t()[i]
        except IndexError:
            raise IndexError('Invalid rect Index') from None

    def __setitem__(self, i, v):
        names = ('x', 'y', 'w', 'h')
        if not isinstance(i, int) or not -4 <= i < 4:
            raise IndexError('Invalid rect Index')
        setattr(self, names[i], _num(v))

    def __eq__(self, other):
        try:
            return self._t() == _rect_tuple((other,))
        except TypeError:
            return False

    def __ne__(self, other):
        return not self.__eq__(other)

    def __bool__(self):
        return self.w != 0 and self.h != 0

    def __repr__(self):
        return '<rect(%d, %d, %d, %d)>' % self._t()

    __str__ = __repr__

    def copy(self):
        return _Rect(self._t())

    __copy__ = copy

    # movement
    def move(self, *args):
        dx, dy = _ipair(args)
        return _Rect(self.x + dx, self.y + dy, self.w, self.h)

    def move_ip(self, *args):
        dx, dy = _ipair(args)
        self.x += dx
        self.y += dy

    def inflate(self, *args):
        dw, dh = _ipair(args)
        return _Rect(self.x - int(dw / 2), self.y - int(dh / 2), self.w + dw, self.h + dh)

    def inflate_ip(self, *args):
        r = self.inflate(*args)
        self.x, self.y, self.w, self.h = r._t()

    def update(self, *args):
        self.x, self.y, self.w, self.h = _rect_tuple(args)

    def clamp(self, *args):
        ox, oy, ow, oh = _rect_tuple(args)
        if self.w >= ow:
            x = ox + _thalf(ow) - _thalf(self.w)
        elif self.x < ox:
            x = ox
        elif self.x + self.w > ox + ow:
            x = ox + ow - self.w
        else:
            x = self.x
        if self.h >= oh:
            y = oy + _thalf(oh) - _thalf(self.h)
        elif self.y < oy:
            y = oy
        elif self.y + self.h > oy + oh:
            y = oy + oh - self.h
        else:
            y = self.y
        return _Rect(x, y, self.w, self.h)

    def clamp_ip(self, *args):
        r = self.clamp(*args)
        self.x, self.y = r.x, r.y

    def clip(self, *args):
        bx, by, bw, bh = _rect_tuple(args)
        ax, ay, aw, ah = self._t()
        empty = _Rect(ax, ay, 0, 0)
        if ax >= bx and ax < bx + bw:
            x = ax
        elif bx >= ax and bx < ax + aw:
            x = bx
        else:
            return empty
        if ax + aw > bx and ax + aw <= bx + bw:
            w = ax + aw - x
        elif bx + bw > ax and bx + bw <= ax + aw:
            w = bx + bw - x
        else:
            return empty
        if ay >= by and ay < by + bh:
            y = ay
        elif by >= ay and by < ay + ah:
            y = by
        else:
            return empty
        if ay + ah > by and ay + ah <= by + bh:
            h = ay + ah - y
        elif by + bh > ay and by + bh <= ay + ah:
            h = by + bh - y
        else:
            return empty
        return _Rect(x, y, w, h)

    def union(self, *args):
        bx, by, bw, bh = _rect_tuple(args)
        x = min(self.x, bx)
        y = min(self.y, by)
        return _Rect(x, y, max(self.x + self.w, bx + bw) - x, max(self.y + self.h, by + bh) - y)

    def union_ip(self, *args):
        r = self.union(*args)
        self.x, self.y, self.w, self.h = r._t()

    def unionall(self, others):
        r = self.copy()
        for o in others:
            r = r.union(o)
        return r

    def unionall_ip(self, others):
        r = self.unionall(others)
        self.x, self.y, self.w, self.h = r._t()

    def fit(self, *args):
        bx, by, bw, bh = _rect_tuple(args)
        xratio = self.w / bw
        yratio = self.h / bh
        maxratio = max(xratio, yratio)
        w = int(self.w / maxratio)
        h = int(self.h / maxratio)
        return _Rect(bx + _thalf(bw - w), by + _thalf(bh - h), w, h)

    def normalize(self):
        if self.w < 0:
            self.x += self.w
            self.w = -self.w
        if self.h < 0:
            self.y += self.h
            self.h = -self.h

    def contains(self, *args):
        bx, by, bw, bh = _rect_tuple(args)
        return self.x <= bx and self.y <= by and self.x + self.w >= bx + bw and self.y + self.h >= by + bh

    def collidepoint(self, *args):
        x, y = _ipair(args)
        return self.x <= x < self.x + self.w and self.y <= y < self.y + self.h

    def colliderect(self, *args):
        bx, by, bw, bh = _rect_tuple(args)
        ax, ay, aw, ah = self._t()
        if aw == 0 or ah == 0 or bw == 0 or bh == 0:
            return False
        return (min(ax, ax + aw) < max(bx, bx + bw) and min(ay, ay + ah) < max(by, by + bh)
                and max(ax, ax + aw) > min(bx, bx + bw) and max(ay, ay + ah) > min(by, by + bh))

    def collidelist(self, items):
        for i, r in enumerate(items):
            if self.colliderect(r):
                return i
        return -1

    def collidelistall(self, items):
        return [i for i, r in enumerate(items) if self.colliderect(r)]

    def collidedict(self, d, use_values=False):
        for k, v in d.items():
            if self.colliderect(v if use_values else k):
                return (k, v)
        return None

    def collidedictall(self, d, use_values=False):
        return [(k, v) for k, v in d.items() if self.colliderect(v if use_values else k)]


# ------------------------------------------------------------------------ Vector2
def _g(v):
    return '%g' % v


class _Vector2:
    __slots__ = ('x', 'y')
    __hash__ = None
    _EPS = 1e-6

    def __init__(self, *args):
        if len(args) == 0:
            self.x = self.y = 0.0
        elif len(args) == 1:
            a = args[0]
            if isinstance(a, (int, float)):
                self.x = self.y = float(a)
            else:
                try:
                    x, y = a
                    self.x, self.y = float(x), float(y)
                except (TypeError, ValueError):
                    raise ValueError('Vector2 must be set with 2 real numbers, a sequence of 2 real numbers, or another Vector2 instance') from None
        elif len(args) == 2:
            try:
                self.x, self.y = float(args[0]), float(args[1])
            except (TypeError, ValueError):
                raise ValueError('Vector2 must be set with 2 real numbers, a sequence of 2 real numbers, or another Vector2 instance') from None
        else:
            raise TypeError('Vector2() takes at most 2 arguments (%d given)' % len(args))

    @staticmethod
    def _co(o):
        if isinstance(o, _Vector2):
            return o.x, o.y
        try:
            a, b = o
            return float(a), float(b)
        except (TypeError, ValueError):
            return None

    def __repr__(self):
        return '<Vector2(%s, %s)>' % (_g(self.x), _g(self.y))

    def __str__(self):
        return '[%s, %s]' % (_g(self.x), _g(self.y))

    def __len__(self):
        return 2

    def __iter__(self):
        return iter((self.x, self.y))

    def __getitem__(self, i):
        if isinstance(i, slice):
            return [self.x, self.y][i]
        if i in (0, -2):
            return self.x
        if i in (1, -1):
            return self.y
        raise IndexError('subscript out of range.')

    def __setitem__(self, i, v):
        if i in (0, -2):
            self.x = float(v)
        elif i in (1, -1):
            self.y = float(v)
        else:
            raise IndexError('subscript out of range.')

    xy = property(lambda s: (s.x, s.y), lambda s, v: s.update(v))

    def update(self, *args):
        self.x, self.y = _Vector2(*args).x, _Vector2(*args).y

    def __eq__(self, other):
        c = self._co(other)
        if c is None:
            return False
        return abs(self.x - c[0]) < self._EPS and abs(self.y - c[1]) < self._EPS

    def __ne__(self, other):
        return not self.__eq__(other)

    def __bool__(self):
        return self.x != 0 or self.y != 0

    def __add__(self, o):
        c = self._co(o)
        if c is None:
            return NotImplemented
        return _Vector2(self.x + c[0], self.y + c[1])

    __radd__ = __add__

    def __sub__(self, o):
        c = self._co(o)
        if c is None:
            return NotImplemented
        return _Vector2(self.x - c[0], self.y - c[1])

    def __rsub__(self, o):
        c = self._co(o)
        if c is None:
            return NotImplemented
        return _Vector2(c[0] - self.x, c[1] - self.y)

    def __mul__(self, o):
        if isinstance(o, (int, float)):
            return _Vector2(self.x * o, self.y * o)
        c = self._co(o)
        if c is None:
            return NotImplemented
        return self.x * c[0] + self.y * c[1]

    def __rmul__(self, o):
        if isinstance(o, (int, float)):
            return _Vector2(self.x * o, self.y * o)
        return NotImplemented

    def __truediv__(self, o):
        if isinstance(o, (int, float)):
            if o == 0:
                raise ZeroDivisionError('division by zero')
            return _Vector2(self.x / o, self.y / o)
        return NotImplemented

    def __floordiv__(self, o):
        if isinstance(o, (int, float)):
            if o == 0:
                raise ZeroDivisionError('division by zero')
            return _Vector2(self.x // o, self.y // o)
        return NotImplemented

    def __neg__(self):
        return _Vector2(-self.x, -self.y)

    def __pos__(self):
        return _Vector2(self.x, self.y)

    def copy(self):
        return _Vector2(self.x, self.y)

    __copy__ = copy

    def length(self):
        return _math.hypot(self.x, self.y)

    magnitude = length

    def length_squared(self):
        return self.x * self.x + self.y * self.y

    magnitude_squared = length_squared

    def normalize(self):
        n = self.length()
        if n == 0:
            raise ValueError("Can't normalize Vector of length Zero")
        return _Vector2(self.x / n, self.y / n)

    def normalize_ip(self):
        r = self.normalize()
        self.x, self.y = r.x, r.y

    def is_normalized(self):
        return abs(self.length_squared() - 1) < self._EPS

    def scale_to_length(self, n):
        cur = self.length()
        if cur == 0:
            raise ValueError('Cannot scale a vector with zero length')
        self.x, self.y = self.x / cur * n, self.y / cur * n

    def distance_to(self, o):
        c = self._co(o)
        return _math.hypot(self.x - c[0], self.y - c[1])

    def distance_squared_to(self, o):
        c = self._co(o)
        return (self.x - c[0]) ** 2 + (self.y - c[1]) ** 2

    def dot(self, o):
        c = self._co(o)
        return self.x * c[0] + self.y * c[1]

    def cross(self, o):
        c = self._co(o)
        return self.x * c[1] - self.y * c[0]

    def angle_to(self, o):
        c = self._co(o)
        return _math.degrees(_math.atan2(c[1], c[0]) - _math.atan2(self.y, self.x))

    def rotate_rad(self, a):
        s, c = _math.sin(a), _math.cos(a)
        return _Vector2(self.x * c - self.y * s, self.x * s + self.y * c)

    def rotate(self, deg):
        return self.rotate_rad(_math.radians(deg))

    def rotate_ip(self, deg):
        r = self.rotate(deg)
        self.x, self.y = r.x, r.y

    def rotate_rad_ip(self, a):
        r = self.rotate_rad(a)
        self.x, self.y = r.x, r.y

    def as_polar(self):
        return (self.length(), _math.degrees(_math.atan2(self.y, self.x)))

    def from_polar(self, pol):
        r, phi = pol
        self.x, self.y = r * _math.cos(_math.radians(phi)), r * _math.sin(_math.radians(phi))

    def reflect(self, normal):
        n = _Vector2(normal)
        if n.length() == 0:
            raise ValueError("Normal must not be of length zero.")
        n = n.normalize()
        d = self.dot(n)
        return _Vector2(self.x - 2 * d * n.x, self.y - 2 * d * n.y)

    def lerp(self, o, t):
        c = self._co(o)
        if not 0 <= t <= 1:
            raise ValueError('Argument 2 must be in range [0, 1]')
        return _Vector2(self.x * (1 - t) + c[0] * t, self.y * (1 - t) + c[1] * t)

    def project(self, o):
        c = _Vector2(o)
        d = c.length_squared()
        if d == 0:
            raise ValueError('Cannot project onto a zero length vector')
        k = self.dot(c) / d
        return _Vector2(c.x * k, c.y * k)

    def clamp_magnitude(self, *args):
        lo, hi = (0, args[0]) if len(args) == 1 else args
        n = self.length()
        if n == 0:
            raise ValueError('Cannot clamp a vector with zero length')
        if n < lo:
            return _Vector2(self.x / n * lo, self.y / n * lo)
        if n > hi:
            return _Vector2(self.x / n * hi, self.y / n * hi)
        return self.copy()

    def move_towards(self, target, max_distance):
        c = _Vector2(target)
        dx, dy = c.x - self.x, c.y - self.y
        d = _math.hypot(dx, dy)
        if d == 0 or (max_distance >= 0 and d <= max_distance):
            return c
        k = max_distance / d
        return _Vector2(self.x + dx * k, self.y + dy * k)


# ------------------------------------------------------------------------- Color
def _named_color(name):
    key = name.lower().replace(' ', '')
    if key in _PG_COLORS:
        return _PG_COLORS[key]
    raise ValueError('invalid color name')


def _color_tuple(*args):
    if len(args) == 1:
        a = args[0]
        if isinstance(a, _Color):
            return a._t()
        if isinstance(a, str):
            if a.startswith('#'):
                h = a[1:]
            elif a.lower().startswith('0x'):
                h = a[2:]
            else:
                return _named_color(a)
            try:
                if len(h) == 6:
                    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
                if len(h) == 8:
                    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16))
            except ValueError:
                pass
            raise ValueError('invalid color name')
        if isinstance(a, int):
            return ((a >> 24) & 255, (a >> 16) & 255, (a >> 8) & 255, a & 255)
        try:
            seq = list(a)
        except TypeError:
            raise TypeError('invalid color argument') from None
        return _color_tuple(*seq)
    if len(args) in (3, 4):
        vals = []
        for v in args:
            if not isinstance(v, int):
                raise ValueError('invalid color argument')
            if not 0 <= v <= 255:
                raise ValueError('invalid color argument')
            vals.append(v)
        if len(vals) == 3:
            vals.append(255)
        return tuple(vals)
    raise ValueError('invalid color argument')


class _Color:
    __slots__ = ('r', 'g', 'b', 'a')
    __hash__ = None

    def __init__(self, *args):
        self.r, self.g, self.b, self.a = _color_tuple(*args)

    def _t(self):
        return (self.r, self.g, self.b, self.a)

    def __len__(self):
        return 4

    def __iter__(self):
        return iter(self._t())

    def __getitem__(self, i):
        return self._t()[i]

    def __eq__(self, other):
        try:
            return self._t() == _color_tuple(other)
        except (TypeError, ValueError):
            return False

    def __ne__(self, other):
        return not self.__eq__(other)

    def __repr__(self):
        return '(%d, %d, %d, %d)' % self._t()

    __str__ = __repr__

    def lerp(self, other, t):
        o = _color_tuple(other)
        if not 0 <= t <= 1:
            raise ValueError('Argument 2 must be in range [0, 1]')
        return _Color(*[int(a + (b - a) * t + 0.5) for a, b in zip(self._t(), o)])

    def normalize(self):
        return tuple(v / 255 for v in self._t())

    def copy(self):
        return _Color(*self._t())


# ----------------------------------------------------------------------- Surface
_SRCALPHA = 0x00010000


class _Surface:
    def __init__(self, size, flags=0, depth=0, masks=None):
        try:
            w, h = size
        except (TypeError, ValueError):
            raise ValueError('size needs to be (number width, number height)') from None
        if w < 0 or h < 0:
            raise _PgError('Invalid resolution for Surface')
        self._w, self._h = int(w), int(h)
        self._flags = flags
        self._alpha_px = bool(flags & _SRCALPHA)
        self._parent = None
        self._ox = self._oy = 0
        self._ck = None
        self._px = [(0, 0, 0, 255 if not self._alpha_px else 0)] * (self._w * self._h)

    # raw pixel access (works for sub-surfaces too)
    def _get(self, x, y):
        if self._parent is not None:
            return self._parent._get(x + self._ox, y + self._oy)
        return self._px[y * self._w + x]

    def _put(self, x, y, c):
        if self._parent is not None:
            self._parent._put(x + self._ox, y + self._oy, c)
        else:
            self._px[y * self._w + x] = c

    def get_width(self):
        return self._w

    def get_height(self):
        return self._h

    def get_size(self):
        return (self._w, self._h)

    def get_rect(self, **kw):
        r = _Rect(0, 0, self._w, self._h)
        for k, v in kw.items():
            setattr(r, k, v)
        return r

    def get_flags(self):
        return self._flags

    def get_at(self, *pos):
        x, y = _ipair(pos)
        if not (0 <= x < self._w and 0 <= y < self._h):
            raise IndexError('pixel index out of range')
        return _Color(*self._get(x, y))

    def set_at(self, *args):
        if len(args) == 2:
            (x, y), color = args[0], args[1]
        else:
            x, y, color = args
        x, y = _num(x), _num(y)
        if 0 <= x < self._w and 0 <= y < self._h:
            self._put(x, y, self._store(color))

    def _store(self, color):
        r, g, b, a = _color_tuple(color)
        return (r, g, b, a if self._alpha_px else 255)

    def fill(self, color, rect=None, special_flags=0):
        c = self._store(color)
        area = _Rect(0, 0, self._w, self._h)
        if rect is not None:
            area = area.clip(_Rect(rect))
        for y in range(area.y, area.y + area.h):
            for x in range(area.x, area.x + area.w):
                self._put(x, y, c)
        return area

    def copy(self):
        s = _Surface((self._w, self._h), self._flags)
        for y in range(self._h):
            for x in range(self._w):
                s._px[y * self._w + x] = self._get(x, y)
        s._ck = self._ck
        return s

    def convert(self, *args):
        s = self.copy()
        s._flags &= ~_SRCALPHA
        s._alpha_px = False
        s._px = [(r, g, b, 255) for r, g, b, a in s._px]
        return s

    def convert_alpha(self, *args):
        s = self.copy()
        s._flags |= _SRCALPHA
        s._alpha_px = True
        return s

    def set_colorkey(self, color, flags=0):
        self._ck = None if color is None else _color_tuple(color)[:3]

    def get_colorkey(self):
        return None if self._ck is None else _Color(*self._ck)

    def set_alpha(self, value, flags=0):
        self._alpha = value

    def get_alpha(self):
        return getattr(self, '_alpha', 255)

    def subsurface(self, *args):
        r = _Rect(*args)
        if not _Rect(0, 0, self._w, self._h).contains(r):
            raise ValueError('subsurface rectangle outside surface area')
        s = _Surface((r.w, r.h), self._flags)
        s._parent = self
        s._ox, s._oy = r.x, r.y
        return s

    def blit(self, source, dest, area=None, special_flags=0):
        if isinstance(dest, _Rect):
            dx, dy = dest.x, dest.y
        else:
            try:
                dx, dy = _ipair((dest,))
            except TypeError:
                dx, dy = _rect_tuple((dest,))[:2]
        src_area = _Rect(0, 0, source._w, source._h)
        if area is not None:
            src_area = src_area.clip(_Rect(area))
        clip = _Rect(0, 0, self._w, self._h).clip(_Rect(dx, dy, src_area.w, src_area.h))
        if clip.w <= 0 or clip.h <= 0:
            return _Rect(dx, dy, 0, 0)
        # copy first, so blitting a surface onto itself behaves
        rows = []
        for y in range(clip.y, clip.y + clip.h):
            row = []
            for x in range(clip.x, clip.x + clip.w):
                row.append(source._get(src_area.x + x - dx, src_area.y + y - dy))
            rows.append(row)
        for j, row in enumerate(rows):
            for i, (sr, sg, sb, sa) in enumerate(row):
                x, y = clip.x + i, clip.y + j
                if source._ck is not None and (sr, sg, sb) == source._ck:
                    continue
                if source._alpha_px:
                    if sa == 0:
                        continue
                    if sa < 255:
                        dr, dg, db, da = self._get(x, y)
                        nr = dr + (((sr - dr) * sa + sr) >> 8)
                        ng = dg + (((sg - dg) * sa + sg) >> 8)
                        nb = db + (((sb - db) * sa + sb) >> 8)
                        na = sa + da - (sa * da) // 255 if self._alpha_px else 255
                        self._put(x, y, (nr, ng, nb, na))
                        continue
                self._put(x, y, (sr, sg, sb, sa if self._alpha_px else 255))
        return clip

    def get_bounding_rect(self, min_alpha=1):
        xs, ys = [], []
        for y in range(self._h):
            for x in range(self._w):
                if self._get(x, y)[3] >= min_alpha:
                    xs.append(x)
                    ys.append(y)
        if not xs:
            return _Rect(0, 0, 0, 0)
        return _Rect(min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1)

    def __repr__(self):
        return '<Surface(%dx%dx%d SW)>' % (self._w, self._h, 32 if self._alpha_px else 24)


# ------------------------------------------------------------------------- draw
def _clip_rect(surface, x, y, w, h):
    return _Rect(0, 0, surface._w, surface._h).clip(_Rect(x, y, w, h))


def _draw_rect(surface, color, rect, width=0, border_radius=0, *a, **k):
    r = _Rect(rect)
    c = surface._store(color)
    if width < 0:
        return _Rect(r.x, r.y, 0, 0)
    if width == 0 or width * 2 >= min(r.w, r.h):
        area = _clip_rect(surface, r.x, r.y, r.w, r.h)
        for y in range(area.y, area.y + area.h):
            for x in range(area.x, area.x + area.w):
                surface._put(x, y, c)
        return area
    inner = _Rect(r.x + width, r.y + width, r.w - 2 * width, r.h - 2 * width)
    area = _clip_rect(surface, r.x, r.y, r.w, r.h)
    for y in range(area.y, area.y + area.h):
        for x in range(area.x, area.x + area.w):
            if not inner.collidepoint(x, y):
                surface._put(x, y, c)
    return area


def _plot(surface, c, x, y):
    if 0 <= x < surface._w and 0 <= y < surface._h:
        surface._put(x, y, c)


def _draw_line(surface, color, start, end, width=1):
    c = surface._store(color)
    x0, y0 = int(start[0]), int(start[1])
    x1, y1 = int(end[0]), int(end[1])
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    pts = []
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    half = (width - 1) // 2
    for (x, y) in pts:
        for k in range(width):
            if abs(int(end[0]) - int(start[0])) >= abs(int(end[1]) - int(start[1])):
                _plot(surface, c, x, y - half + k)
            else:
                _plot(surface, c, x - half + k, y)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return _clip_rect(surface, min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1)


def _draw_circle(surface, color, center, radius, width=0, *a, **k):
    c = surface._store(color)
    cx, cy = int(center[0]), int(center[1])
    r = int(radius)
    if r < 1 or width < 0:
        return _Rect(cx, cy, 0, 0)
    big = (r - 0.2) ** 2
    small = (r - width - 0.2) ** 2
    for y in range(cy - r, cy + r):
        for x in range(cx - r, cx + r):
            d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2
            if d <= big and (width == 0 or width >= r or d > small):
                _plot(surface, c, x, y)
    return _clip_rect(surface, cx - r, cy - r, 2 * r, 2 * r)


# --------------------------------------------------------------------- transform
def _flip(surface, flip_x, flip_y):
    s = surface.copy()
    w, h = surface._w, surface._h
    for y in range(h):
        for x in range(w):
            s._put(x, y, surface._get(w - 1 - x if flip_x else x, h - 1 - y if flip_y else y))
    return s


def _scale(surface, size, dest_surface=None):
    nw, nh = int(size[0]), int(size[1])
    s = _Surface((nw, nh), surface._flags)
    for y in range(nh):
        for x in range(nw):
            s._put(x, y, surface._get(x * surface._w // nw, y * surface._h // nh))
    return s


# ------------------------------------------------------------------------ events
_NOEVENT = 0
_EVENT_NAMES = {256: 'Quit', 768: 'KeyDown', 769: 'KeyUp', 1024: 'MouseMotion', 1025: 'MouseButtonDown',
                1026: 'MouseButtonUp', 1027: 'MouseWheel', 0: 'NoEvent', 32768: 'UserEvent'}
_queue = []
_custom = [0]


class _Event:
    __hash__ = None

    def __init__(self, type, dict=None, **kw):
        d = {}
        if dict is not None:
            d.update(dict)
        d.update(kw)
        self.__dict__.update(d)
        self.__dict__['type'] = type
        self.__dict__['_d'] = d

    @property
    def dict(self):
        return self._d

    def __eq__(self, other):
        return isinstance(other, _Event) and self.type == other.type and self._d == other._d

    def __ne__(self, other):
        return not self.__eq__(other)

    def __repr__(self):
        return '<Event(%d-%s %s)>' % (self.type, _EVENT_NAMES.get(self.type, 'Unknown'), self._d)


def _types_filter(t):
    if t is None:
        return None
    if isinstance(t, int):
        return (t,)
    return tuple(t)


def _ev_post(e):
    if not isinstance(e, _Event):
        raise TypeError('argument 1 must be pygame.event.Event, not %s' % type(e).__name__)
    _queue.append(e)
    return True


def _ev_get(eventtype=None, pump=True, exclude=None):
    f = _types_filter(eventtype)
    out, keep = [], []
    ex = _types_filter(exclude)
    for e in _queue:
        if (f is None or e.type in f) and (ex is None or e.type not in ex):
            out.append(e)
        else:
            keep.append(e)
    _queue[:] = keep
    return out


def _ev_poll():
    return _queue.pop(0) if _queue else _Event(_NOEVENT)


def _ev_peek(eventtype=None, pump=True):
    f = _types_filter(eventtype)
    return any(f is None or e.type in f for e in _queue)


def _ev_clear(eventtype=None, pump=True):
    f = _types_filter(eventtype)
    _queue[:] = [e for e in _queue if f is not None and e.type not in f]


def _ev_custom_type():
    _custom[0] += 1
    return 32866 + _custom[0]


# ------------------------------------------------------------------------ sprites
class _Sprite:
    def __init__(self, *groups):
        self.__g = {}
        if groups:
            self.add(*groups)

    def add(self, *groups):
        for g in groups:
            if hasattr(g, 'add_internal'):
                if g not in self.__g:
                    g.add_internal(self)
                    self.__g[g] = 0
            else:
                self.add(*g)

    def remove(self, *groups):
        for g in groups:
            if hasattr(g, 'remove_internal'):
                if g in self.__g:
                    g.remove_internal(self)
                    del self.__g[g]
            else:
                self.remove(*g)

    def add_internal(self, group):
        self.__g[group] = 0

    def remove_internal(self, group):
        del self.__g[group]

    def update(self, *args, **kwargs):
        pass

    def kill(self):
        for g in list(self.__g):
            g.remove_internal(self)
        self.__g.clear()

    def groups(self):
        return list(self.__g)

    def alive(self):
        return bool(self.__g)

    def __repr__(self):
        return '<%s Sprite(in %d groups)>' % (self.__class__.__name__, len(self.__g))


class _Group:
    def __init__(self, *sprites):
        self.spritedict = {}
        self.add(*sprites)

    def add_internal(self, sprite):
        self.spritedict[sprite] = None

    def remove_internal(self, sprite):
        self.spritedict.pop(sprite, None)

    def has_internal(self, sprite):
        return sprite in self.spritedict

    def sprites(self):
        return list(self.spritedict)

    def add(self, *sprites):
        for s in sprites:
            if isinstance(s, _Sprite) or hasattr(s, 'add_internal') and hasattr(s, 'groups') and not hasattr(s, 'sprites'):
                if not self.has_internal(s):
                    self.add_internal(s)
                    s.add_internal(self)
            elif hasattr(s, 'sprites'):
                self.add(*s.sprites())
            else:
                try:
                    items = list(s)
                except TypeError:
                    raise TypeError('Sprite must be a Sprite, a Group or an iterable of sprites') from None
                self.add(*items)

    def remove(self, *sprites):
        for s in sprites:
            if hasattr(s, 'sprites'):
                self.remove(*s.sprites())
            elif hasattr(s, 'remove_internal') and hasattr(s, 'groups'):
                if self.has_internal(s):
                    self.remove_internal(s)
                    s.remove_internal(self)
            else:
                self.remove(*list(s))

    def has(self, *sprites):
        for s in sprites:
            if hasattr(s, 'sprites'):
                if not all(self.has_internal(x) for x in s.sprites()):
                    return False
            elif hasattr(s, 'groups'):
                if not self.has_internal(s):
                    return False
            elif not self.has(*list(s)):
                return False
        return True

    def update(self, *args, **kwargs):
        for s in self.sprites():
            s.update(*args, **kwargs)

    def draw(self, surface, bgsurf=None, special_flags=0):
        for s in self.sprites():
            surface.blit(s.image, s.rect)
        return []

    def empty(self):
        for s in self.sprites():
            self.remove_internal(s)
            s.remove_internal(self)

    def copy(self):
        return self.__class__(self.sprites())

    def __len__(self):
        return len(self.spritedict)

    def __iter__(self):
        return iter(self.sprites())

    def __contains__(self, sprite):
        return self.has(sprite)

    def __bool__(self):
        return len(self) > 0

    def __repr__(self):
        return '<%s(%d sprites)>' % (self.__class__.__name__, len(self))


def _spritecollide(sprite, group, dokill, collided=None):
    hits = []
    for s in group.sprites():
        if (collided(sprite, s) if collided else sprite.rect.colliderect(s.rect)):
            hits.append(s)
    if dokill:
        for s in hits:
            s.kill()
    return hits


def _spritecollideany(sprite, group, collided=None):
    for s in group.sprites():
        if (collided(sprite, s) if collided else sprite.rect.colliderect(s.rect)):
            return s
    return None


def _groupcollide(groupa, groupb, dokilla, dokillb, collided=None):
    crashed = {}
    for s in groupa.sprites():
        c = _spritecollide(s, groupb, dokillb, collided)
        if c:
            crashed[s] = c
            if dokilla:
                s.kill()
    return crashed


def _collide_rect(left, right):
    return left.rect.colliderect(right.rect)


def _collide_rect_ratio(ratio):
    def f(left, right):
        a = left.rect
        b = right.rect
        l = a.inflate(int(a.w * ratio) - a.w, int(a.h * ratio) - a.h)
        r = b.inflate(int(b.w * ratio) - b.w, int(b.h * ratio) - b.h)
        return l.colliderect(r)
    return f


def _collide_circle(left, right):
    dx = left.rect.centerx - right.rect.centerx
    dy = left.rect.centery - right.rect.centery
    dist2 = dx * dx + dy * dy
    try:
        lr = left.radius
    except AttributeError:
        lr = 0.5 * ((left.rect.width ** 2 + left.rect.height ** 2) ** 0.5)
    try:
        rr = right.radius
    except AttributeError:
        rr = 0.5 * ((right.rect.width ** 2 + right.rect.height ** 2) ** 0.5)
    return dist2 <= (lr + rr) ** 2


def _collide_circle_ratio(ratio):
    def f(left, right):
        dx = left.rect.centerx - right.rect.centerx
        dy = left.rect.centery - right.rect.centery
        dist2 = dx * dx + dy * dy
        try:
            lr = left.radius
        except AttributeError:
            lr = 0.5 * ((left.rect.width ** 2 + left.rect.height ** 2) ** 0.5)
        try:
            rr = right.radius
        except AttributeError:
            rr = 0.5 * ((right.rect.width ** 2 + right.rect.height ** 2) ** 0.5)
        return dist2 <= (lr * ratio + rr * ratio) ** 2
    return f


# -------------------------------------------------------------------- time, key
_clock_ms = [0]


class _Clock:
    def __init__(self):
        self._last = _clock_ms[0]
        self._fps = 0.0

    def tick(self, framerate=0):
        if framerate:
            _clock_ms[0] += int(1000 / framerate)
        dt = _clock_ms[0] - self._last
        self._last = _clock_ms[0]
        self._fps = 1000.0 / dt if dt else 0.0
        return dt

    tick_busy_loop = tick

    def get_fps(self):
        return self._fps

    def get_time(self):
        return 0

    def get_rawtime(self):
        return 0


def _wait(ms):
    _clock_ms[0] += int(ms)
    return int(ms)


class _KeyState:
    """What key.get_pressed() returns: indexable by any K_* constant."""
    def __getitem__(self, k):
        return False

    def __len__(self):
        return 512


_display = [None]
_caption = ['pygame window']


def _set_mode(size=(0, 0), flags=0, depth=0, display=0, vsync=0):
    w, h = size if size and size[0] else (1280, 720)
    _display[0] = _Surface((w, h), flags & ~_SRCALPHA)
    return _display[0]


def _unavailable(what):
    def f(*a, **k):
        raise _PgError('%s is not available in the in-app Python runner; run this on your PC' % what)
    return f


# ----------------------------------------------------------------------- install
def _mod(_name, **attrs):
    m = _types.ModuleType(_name)
    m.__dict__.update(attrs)
    m.__path__ = []
    _sys.modules[_name] = m
    return m


def _install():
    for cls, nm in ((_Rect, 'Rect'), (_Vector2, 'Vector2'), (_Color, 'Color'), (_Surface, 'Surface'),
                    (_Event, 'Event'), (_Sprite, 'Sprite'), (_Group, 'Group'), (_Clock, 'Clock')):
        cls.__name__ = nm
        cls.__qualname__ = nm
        cls.__module__ = 'pygame'
    consts = dict(_PG_CONSTS)
    consts['NOEVENT'] = 0
    consts['SRCALPHA'] = _SRCALPHA
    pg = _mod('pygame')
    math_m = _mod('pygame.math', Vector2=_Vector2,
                  lerp=lambda a, b, t: a + (b - a) * t,
                  clamp=lambda v, lo, hi: max(lo, min(hi, v)))
    sprite_m = _mod('pygame.sprite', Sprite=_Sprite, Group=_Group, spritecollide=_spritecollide,
                    spritecollideany=_spritecollideany, groupcollide=_groupcollide, collide_rect=_collide_rect,
                    collide_rect_ratio=_collide_rect_ratio, collide_circle=_collide_circle,
                    collide_circle_ratio=_collide_circle_ratio)
    sprite_m.AbstractGroup = _Group
    event_m = _mod('pygame.event', Event=_Event, post=_ev_post, get=_ev_get, poll=_ev_poll, peek=_ev_peek,
                   clear=_ev_clear, custom_type=_ev_custom_type, pump=lambda: None,
                   event_name=lambda t: _EVENT_NAMES.get(t, 'Unknown'), EventType=_Event)
    draw_m = _mod('pygame.draw', rect=_draw_rect, line=_draw_line, circle=_draw_circle)
    transform_m = _mod('pygame.transform', flip=_flip, scale=_scale)
    time_m = _mod('pygame.time', Clock=_Clock, get_ticks=lambda: _clock_ms[0], wait=_wait, delay=_wait,
                  set_timer=lambda *a, **k: None)
    key_m = _mod('pygame.key', get_pressed=lambda: _KeyState(), get_mods=lambda: 0,
                 set_repeat=lambda *a, **k: None, name=lambda k, *a, **kw: _PG_KEYNAMES.get(k, ''))
    mouse_m = _mod('pygame.mouse', get_pos=lambda: (0, 0), get_pressed=lambda *a, **k: (False, False, False),
                   get_rel=lambda: (0, 0), set_visible=lambda v: True)
    display_m = _mod('pygame.display', set_mode=_set_mode, get_surface=lambda: _display[0],
                     set_caption=lambda title, icontitle=None: _caption.__setitem__(0, title),
                     get_caption=lambda: (_caption[0], _caption[0]), flip=lambda: None,
                     update=lambda *a, **k: None, init=lambda: None, quit=lambda: None,
                     get_init=lambda: True, set_icon=lambda s: None)
    version_m = _mod('pygame.version', ver='2.6.1', vernum=(2, 6, 1))
    unavailable = {}
    for name in ('image', 'font', 'mixer'):
        unavailable[name] = _mod('pygame.' + name, load=_unavailable('pygame.%s.load' % name),
                                 Font=_unavailable('pygame.font.Font'), SysFont=_unavailable('pygame.font.SysFont'),
                                 Sound=_unavailable('pygame.mixer.Sound'), init=lambda *a, **k: None,
                                 get_init=lambda: False, save=_unavailable('pygame.image.save'))
    rect_m = _mod('pygame.rect', Rect=_Rect)
    color_m = _mod('pygame.color', Color=_Color, THECOLORS={k: _Color(*v) for k, v in _PG_COLORS.items()})
    surface_m = _mod('pygame.surface', Surface=_Surface)
    pg.__dict__.update(consts)
    pg.__dict__.update(dict(
        Rect=_Rect, Vector2=_Vector2, Color=_Color, Surface=_Surface, error=_PgError,
        init=lambda: (6, 0), quit=lambda: None, get_init=lambda: True,
        math=math_m, sprite=sprite_m, event=event_m, draw=draw_m, transform=transform_m, time=time_m,
        key=key_m, mouse=mouse_m, display=display_m, version=version_m, rect=rect_m, color=color_m,
        surface=surface_m, __version__='2.6.1', __file__='pygame',
        **unavailable))
    loc = {k: v for k, v in consts.items()}
    loc.update(Rect=_Rect, Color=_Color, Surface=_Surface)
    locals_m = _mod('pygame.locals', **loc)
    consts_m = _mod('pygame.constants', **consts)
    pg.locals = locals_m
    pg.constants = consts_m
    return pg


_install()
