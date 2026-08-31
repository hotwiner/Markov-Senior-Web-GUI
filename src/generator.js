window.MS = window.MS || {};

(function (MS) {
  'use strict';

  var ROWS = 14;
  var COLS = 16;
  var GROUND_TOP = 12;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function int(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }

  function blank() {
    var g = [];
    for (var i = 0; i < ROWS; i++) g.push(new Array(COLS).fill('-'));
    return g;
  }

  function set(g, row, col, ch) {
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) g[row][col] = ch;
  }

  function makeSegment(r, opts) {
    opts = opts || {};
    var gaps = opts.gaps !== false;
    var pipes = opts.pipes !== false;
    var enemies = opts.enemies !== false;
    var blocks = opts.blocks !== false;

    var g = blank();

    var pit = gaps && r() < 0.3 ? { at: int(r, 4, COLS - 6), w: int(r, 2, 3) } : null;
    function solid(c) { return !(pit && c >= pit.at && c < pit.at + pit.w); }

    for (var c = 0; c < COLS; c++) {
      if (!solid(c)) continue;
      set(g, GROUND_TOP, c, 'X');
      set(g, GROUND_TOP + 1, c, 'X');
    }

    if (blocks && r() < 0.75) {
      var row = int(r, 5, 8);
      var start = int(r, 1, COLS - 6);
      var len = int(r, 3, 5);
      for (var i = start; i < start + len && i < COLS - 1; i++) {
        set(g, row, i, r() < 0.25 ? '?' : 'S');
        if (r() < 0.2) set(g, row - 1, i, 'o');
      }
    }

    if (blocks && r() < 0.4) {
      var row2 = int(r, 8, 10);
      var start2 = int(r, 1, COLS - 4);
      var len2 = int(r, 1, 3);
      for (var j = start2; j < start2 + len2 && j < COLS - 1; j++) {
        set(g, row2, j, pick(r, ['?', 'S', '?']));
      }
    }

    if (pipes && r() < 0.7) {
      var pc = int(r, 1, COLS - 4);
      if (solid(pc) && solid(pc + 1)) {
        var h = int(r, 2, 4);
        var top = GROUND_TOP - h;
        set(g, top, pc, '<');
        set(g, top, pc + 1, '>');
        for (var y = top + 1; y < GROUND_TOP; y++) {
          set(g, y, pc, '[');
          set(g, y, pc + 1, ']');
        }
        if (r() < 0.35) set(g, top - 1, pc, 'E');
      }
    }

    if (enemies) {
      var n = int(r, 0, 3);
      for (var k = 0; k < n; k++) {
        var ec = int(r, 1, COLS - 2);
        if (solid(ec) && g[GROUND_TOP - 1][ec] === '-') set(g, GROUND_TOP - 1, ec, 'E');
      }
    }

    return g.map(function (row) { return row.join(''); });
  }

  function joinSegments(segments) {
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      var line = '';
      for (var s = 0; s < segments.length; s++) line += segments[s][r];
      out.push(line);
    }
    return out;
  }

  function makeSegments(seed, n, opts) {
    var r = rng(seed);
    var segs = [];
    for (var i = 0; i < n; i++) segs.push(makeSegment(r, opts));
    return segs;
  }

  function makeLevel(seed, n, opts) {
    return joinSegments(makeSegments(seed, n, opts));
  }

  function toText(grid) { return grid.join('\n') + '\n'; }

  MS.generator = {
    ROWS: ROWS,
    COLS: COLS,
    rng: rng,
    makeSegment: makeSegment,
    makeSegments: makeSegments,
    makeLevel: makeLevel,
    joinSegments: joinSegments,
    toText: toText
  };
})(window.MS);
