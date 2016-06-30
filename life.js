// The rules of the Game of Life:
//
// 1. Any live cell with fewer than two live neighbours dies, as if caused by
//    under-population.
// 2. Any live cell with two or three live neighbours lives on to the next
//    generation.
// 3. Any live cell with more than three live neighbours dies, as if by
//    overcrowding.
// 4. Any dead cell with exactly three live neighbours becomes a live cell, as
//    if by reproduction.
//
(function() {
  'use strict';

  var painting       = false,
      $canvas        = $('#life'),
      $fps           = $('#fps'),
      $start         = $('#start'),
      $stop          = $('#stop'),
      $step          = $('#step'),
      $reset         = $('#reset'),
      $seed          = $('#seed'),
      multiplier     = 5, // pixels per cell
      height         = $canvas.height() / multiplier,
      width          = $canvas.width() / multiplier,
      aliveColor     = 0,
      deadColor      = 255,
      dyingDelta     = 4, // set to 255 to behave like "normal" Game of Life
      cellCount      = width * height,
      liveCount      = cellCount / 10, // TODO: make that configurable
      cells          = [],
      iterating      = false,
      startTime      = (new Date) * 1,
      frameCount     = 0;

  if (!$canvas[0].getContext) {
    return; // no browser support
  }

  // Click and drag to "paint" onto the canvas.
  $canvas
    .on('mousedown', handleCanvasMousedown)
    .on('mousemove', handleCanvasMousemove);
  $('body')
    .on('mouseup', handleMouseup);

  var context = $canvas[0].getContext('2d');

  function rgb(color) {
    return 'rgb(' + color + ', ' + color + ', ' + color + ')';
  }

  function clearCanvas() {
    context.fillStyle = rgb(aliveColor);
    context.fillRect(0, 0, width * multiplier, height * multiplier);
  }

  function paintCell(x, y, color) {
    context.fillStyle = rgb(color);
    context.fillRect(x * multiplier, y * multiplier, multiplier, multiplier);
  }

  function expireCell(x, y) {
    cells[x][y] += dyingDelta;
    paintCell(x, y, cells[x][y]);
  }

  function reviveCell(x, y) {
    cells[x][y] = aliveColor;
    paintCell(x, y, aliveColor);
  }

  function paint(event) {
    if (painting) {
      var x = Math.floor(event.offsetX / multiplier),
          y = Math.floor(event.offsetY / multiplier);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        reviveCell(x, y);
      }
    }
  }

  function handleCanvasMousedown(event) {
    painting = true;
    paint(event);
  }

  function handleMouseup(event) {
    painting = false;
  }

  function handleCanvasMousemove(event) {
    paint(event);
  }

  function prepareSeed(seed) {
    if (seed) {
      Math.seedrandom(seed);
    }

    // use "inside-out" variant of the Fisher-Yates shuffle, tweaked to work
    // with a two-dimensional array
    for (var i = 0; i < cellCount; i++) {
      var rand  = Math.round(Math.random() * i),
          randX = rand % width,
          randY = Math.floor(rand / width),
          lastX = i % width,
          lastY = Math.floor(i / width);

      if (!cells[lastX]) {
        cells[lastX] = [];
      }

      cells[lastX][lastY] = cells[randX][randY];
      cells[randX][randY] = i < liveCount ? aliveColor : deadColor;
    }
  }

  function renderCells() {
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        paintCell(x, y, cells[x][y]);
      }
    }
  }

  function iterate() {
    // build up a queue of operations
    var queue = [];

    // check all cells
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var alive          = (cells[x][y] == aliveColor),
            neighbourCount = 0;

        // get count of live neighbours
        for (var j = x - 1, maxX = x + 1; j <= maxX; j++) {
          for (var k = y - 1, maxY = y + 1; k <= maxY; k++) {
            if (j == x && k == y) {
              continue;
            }

            // wrap around if necessary
            var neighbourX = (width + j) % width,
                neighbourY = (height + k) % height;

            if (cells[neighbourX][neighbourY] == aliveColor) {
              neighbourCount++;
            }
          }
        }

        // apply rules of Game of Life
        if (alive) {
          if (neighbourCount < 2 || // rule 1
              neighbourCount > 3) { // rule 2
            queue.push({ expire: true, x: x, y: y});
          }
        } else { // dead
          if (neighbourCount == 3) { // rule 3
            queue.push({ revive: true, x: x, y: y });
          } else if (cells[x][y] > 0) { // dying
            queue.push({ expire: true, x: x, y: y});
          }
        }
      }
    }

    // consume queue
    for (var i = 0, max = queue.length; i < max; i++) {
      var item = queue[i];
      item.revive ? reviveCell(item.x, item.y) : expireCell(item.x, item.y);
    }

    if (queue.length && iterating) {
      requestAnimationFrame(iterate);
    }

    frameCount++;
  }

  function reset() {
    stop();

    $reset.attr('disabled', 'disabled');
    $stop.attr('disabled', 'disabled');
    $start.removeAttr('disabled');
    $step.removeAttr('disabled');

    prepareSeed($seed.val() || 'seed');
    clearCanvas();
    renderCells();
  }

  function start() {
    $start.attr('disabled', 'disabled');
    $step.attr('disabled', 'disabled');
    $stop.removeAttr('disabled');
    $reset.removeAttr('disabled');

    iterating = true;
    iterate();
  }

  function stop() {
    $stop.attr('disabled', 'disabled');
    $start.removeAttr('disabled');
    $step.removeAttr('disabled');
    iterating = false;
  }

  function step() {
    $reset.removeAttr('disabled');
    iterate();
  }

  function updateFPS() {
    var now       = (new Date) * 1,
        timeDelta = now - startTime,
        fps       = frameCount / timeDelta * 1000;

    $fps.text((fps).toFixed(2));

    // reset
    startTime = now;
    frameCount = 0;
  }

  $seed.on('change keyup', function(evt) {
    if (evt.keyCode == 13) { // enter
      reset();
    } else {
      $reset.removeAttr('disabled');
    }
  });

  $start.on('click', start);
  $stop.on('click', stop);
  $reset.on('click', reset);
  $step.on('click', step);

  setInterval(updateFPS, 500);
  reset();
})();
