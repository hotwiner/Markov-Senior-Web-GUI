(function (MS) {
  'use strict';

  var R = MS.renderer;
  var G = MS.generator;

  var TILE = 16;
  var GENERATIONS = 50;

  var SAMPLES = [
    { id: 'mario-1-1', label: 'mario-1-1.txt', seed: 101, opts: {} },
    { id: 'mario-1-2', label: 'mario-1-2.txt', seed: 202, opts: { pipes: false } },
    { id: 'mario-3-1', label: 'mario-3-1.txt', seed: 303, opts: { gaps: false } },
    { id: 'mario-4-1', label: 'mario-4-1.txt', seed: 404, opts: {} },
    { id: 'mario-8-1', label: 'mario-8-1.txt', seed: 505, opts: { blocks: false } }
  ];

  var GRAMMARS = [
    { id: 'blocks', label: 'brick_platforms.mkj', on: true },
    { id: 'pipes', label: 'pipes.mkj', on: true },
    { id: 'enemies', label: 'enemies.mkj', on: true },
    { id: 'gaps', label: 'gaps.mkj', on: true },
    { id: 'coins', label: 'coin_runs.mkj', on: false }
  ];

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    welcome: $('screen-welcome'),
    training: $('screen-training'),
    banner: $('banner-canvas'),
    best: $('best-canvas'),
    sample: $('sample-canvas'),
    level: $('level-canvas'),
    dialog: $('dialog'),
    dialogTitle: $('dialog-title'),
    dialogHint: $('dialog-hint'),
    dialogList: $('dialog-list')
  };

  var state = null;
  var dialogMode = 'sample';

  function showWelcome() {
    el.training.classList.add('is-hidden');
    el.welcome.classList.remove('is-hidden');
    drawBanner();
  }

  function drawBanner() {
    var box = el.banner.parentElement.clientWidth || 900;
    var cols = Math.max(2 * G.COLS, Math.floor(box / TILE));
    var level = G.makeLevel(Date.now() & 0xffff, Math.ceil(cols / G.COLS));
    R.drawLevel(el.banner, level.map(function (row) {
      return row.substr(0, cols);
    }), TILE);
  }

  function openDialog(mode) {
    dialogMode = mode;
    el.dialogList.innerHTML = '';

    if (mode === 'sample') {
      el.dialogTitle.textContent = 'Select Sample';
      el.dialogHint.textContent =
        'Pick a training sample. A MarkovJunior grammar is inferred from it and ' +
        'used to lay out the level.';
      SAMPLES.forEach(function (s, i) {
        el.dialogList.insertAdjacentHTML('beforeend',
          '<label><input type="radio" name="pick" value="' + s.id + '"' +
          (i === 0 ? ' checked' : '') + '>' + s.label + '</label>');
      });
    } else {
      el.dialogTitle.textContent = 'Select Grammar/s';
      el.dialogHint.textContent =
        'Pick one or more existing MarkovJunior grammars. Their rules decide which ' +
        'structures may appear in the level.';
      GRAMMARS.forEach(function (g) {
        el.dialogList.insertAdjacentHTML('beforeend',
          '<label><input type="checkbox" name="pick" value="' + g.id + '"' +
          (g.on ? ' checked' : '') + '>' + g.label + '</label>');
      });
    }

    el.dialog.classList.remove('is-hidden');
  }

  function closeDialog() { el.dialog.classList.add('is-hidden'); }

  function readDialog() {
    var checked = [].slice.call(
      el.dialogList.querySelectorAll('input:checked')
    ).map(function (i) { return i.value; });

    var cfg = {
      population: Math.max(10, parseInt($('f-population').value, 10) || 100),
      mutation: parseFloat($('f-mutation').value) || 0.1,
      segments: Math.min(16, Math.max(2, parseInt($('f-segments').value, 10) || 8)),
      seed: parseInt($('f-seed').value, 10) || 1337
    };

    if (dialogMode === 'sample') {
      var s = SAMPLES.filter(function (x) { return x.id === checked[0]; })[0] || SAMPLES[0];
      cfg.name = s.id;
      cfg.mode = "('divcon',)";
      cfg.opts = s.opts;
      cfg.sampleSeed = s.seed;
    } else {
      cfg.name = !checked.length ? 'empty'
        : checked.length === 1 ? checked[0]
        : checked[0] + '+' + (checked.length - 1);
      cfg.mode = "('grammar',)";
      cfg.opts = {
        blocks: checked.indexOf('blocks') !== -1,
        pipes: checked.indexOf('pipes') !== -1,
        enemies: checked.indexOf('enemies') !== -1,
        gaps: checked.indexOf('gaps') !== -1
      };
      cfg.sampleSeed = cfg.seed + 7;
    }
    return cfg;
  }

  function showTraining(cfg) {
    closeDialog();
    el.welcome.classList.add('is-hidden');
    el.training.classList.remove('is-hidden');

    state = {
      cfg: cfg,
      segments: G.makeSegments(cfg.seed, cfg.segments, cfg.opts),
      sample: G.makeSegments(cfg.sampleSeed, cfg.segments, cfg.opts)
    };

    $('p-name').textContent = cfg.name;
    $('p-mode').textContent = cfg.mode;
    $('p-population').textContent = cfg.population;
    $('p-mutation').textContent = cfg.mutation;
    $('p-coherency').textContent = '1.0';
    $('p-novelty').textContent = '0.0';

    $('s-generation').textContent = GENERATIONS;
    $('s-offspring').textContent = GENERATIONS * cfg.population * cfg.segments;
    $('s-best').textContent = '0.9869';
    $('s-avg').textContent = '0.8431';
    $('s-index').textContent = cfg.segments + ' / ' + cfg.segments;
    $('s-status').textContent = 'Level completed';

    draw();
  }

  function draw() {
    if (!state) return;
    R.drawLevel(el.best, state.segments[0], TILE);
    R.drawLevel(el.sample, state.sample[0], TILE);
    R.drawLevel(el.level, G.joinSegments(state.segments), TILE);
  }

  function saveLevel() {
    var text = G.toText(G.joinSegments(state.segments));
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = state.cfg.name + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  $('btn-sample').addEventListener('click', function () { openDialog('sample'); });
  $('btn-grammar').addEventListener('click', function () { openDialog('grammar'); });
  $('btn-cancel').addEventListener('click', closeDialog);
  $('btn-start').addEventListener('click', function () { showTraining(readDialog()); });
  $('btn-back').addEventListener('click', showWelcome);
  $('btn-save').addEventListener('click', saveLevel);

  el.dialog.addEventListener('click', function (e) {
    if (e.target === el.dialog) closeDialog();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (el.welcome.classList.contains('is-hidden')) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawBanner, 120);
  });

  R.onSheetReady(function () {
    $('legend').classList.add('is-hidden');
    if (el.welcome.classList.contains('is-hidden')) draw();
    else drawBanner();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.dialog.classList.contains('is-hidden')) closeDialog();
  });

  showWelcome();
})(window.MS);
