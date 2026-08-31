window.MS = window.MS || {};

(function (MS) {
  'use strict';

  var SKY = '#67affc';
  var SHEET_SRC = 'assets/tiles.png';
  var CELL = 16;

  var SPRITES = {
    'X': [6, 0],
    'S': [2, 6],
    '?': [0, 1],
    '<': [2, 2],
    '>': [3, 2],
    '[': [4, 2],
    ']': [5, 2],
    'E': [0, 6],
    'o': [7, 1]
  };

  var STYLE = {
    '-': { fill: SKY, glyph: '' },
    'X': { fill: '#8d949e', glyph: 'G' },
    'S': { fill: '#aca69d', glyph: 'B' },
    '?': { fill: '#cbb277', glyph: '?' },
    '<': { fill: '#93aca3', glyph: 'P' },
    '>': { fill: '#93aca3', glyph: 'P' },
    '[': { fill: '#93aca3', glyph: 'P' },
    ']': { fill: '#93aca3', glyph: 'P' },
    'E': { fill: '#b98d8d', glyph: 'E' },
    'o': { fill: '#c8bd7c', glyph: 'C' }
  };

  var STROKE = 'rgba(0, 0, 0, .28)';
  var INK = '#22262c';

  var sheet = new Image();
  var sheetReady = false;
  var readyCallbacks = [];

  sheet.onload = function () {
    sheetReady = true;
    readyCallbacks.forEach(function (fn) { fn(); });
  };
  sheet.onerror = function () {
    sheetReady = false;
  };
  sheet.src = SHEET_SRC;

  function onSheetReady(fn) {
    if (sheetReady) fn();
    else readyCallbacks.push(fn);
  }

  function px(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawTile(ctx, code, x, y, s) {
    var cell = SPRITES[code];

    if (sheetReady) {
      px(ctx, SKY, x, y, s, s);
      if (cell) {
        ctx.drawImage(sheet, cell[0] * CELL, cell[1] * CELL, CELL, CELL, x, y, s, s);
      }
      return;
    }

    var st = STYLE[code] || STYLE['-'];
    px(ctx, st.fill, x, y, s, s);
    if (!st.glyph) return;

    ctx.strokeStyle = STROKE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);

    ctx.fillStyle = INK;
    ctx.font = 'bold ' + Math.round(s * 0.6) + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.glyph, x + s / 2, y + s / 2 + 1);
  }

  function paintGrid(ctx, grid, ts, ox, oy) {
    ox = ox || 0;
    oy = oy || 0;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        drawTile(ctx, grid[r][c], ox + c * ts, oy + r * ts, ts);
      }
    }
  }

  function drawLevel(canvas, grid, ts) {
    ts = ts || 16;
    canvas.width = grid[0].length * ts;
    canvas.height = grid.length * ts;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    paintGrid(ctx, grid, ts, 0, 0);
  }

  MS.renderer = {
    SKY: SKY,
    SPRITES: SPRITES,
    STYLE: STYLE,
    onSheetReady: onSheetReady,
    hasSheet: function () { return sheetReady; },
    paintGrid: paintGrid,
    drawTile: drawTile,
    drawLevel: drawLevel
  };
})(window.MS);
