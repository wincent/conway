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
  var $canvas    = $('#life'),
      multiplier = 5, // pixels per cell
      height     = $canvas.height() / multiplier,
      width      = $canvas.width() / multiplier,
      aliveColor = 0,
      deadColor  = 255,
      dyingDelta = 4, // set to 255 to behave like "normal" Game of Life
      cellCount  = width * height,
      liveCount  = cellCount / 10, // TODO: make that configurable
      cells      = [],
      iterating  = false,
      timer;

  if (!$canvas[0].getContext) {
    return; // no browser support
  }

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
            var neighbourX, neighbourY;

            // wrap around if necessary
            if (j < 0) {
              neighbourX = width - 1;
            } else if (j == width) {
              neighbourX = 0;
            } else {
              neighbourX = j;
            }

            if (k < 0) {
              neighbourY = height - 1;
            } else if (k == height) {
              neighbourY = 0;
            } else {
              neighbourY = k;
            }

            if ((neighbourX != x || neighbourY != y) &&
                cells[neighbourX][neighbourY] == aliveColor) {
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
      timer = setTimeout(iterate, 10);
    }
  }

  function reset() {
    prepareSeed('seed');
    clearCanvas();
    renderCells();
  }

  function start() {
    iterating = true;
    iterate();
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    iterating = false;
  }

  reset();

  var $start = $('#start'),
      $stop  = $('#stop'),
      $step  = $('#step'),
      $reset = $('#reset');

  $start.on('click', function() {
    $start.attr('disabled', 'disabled');
    $step.attr('disabled', 'disabled');
    $stop.removeAttr('disabled');
    $reset.removeAttr('disabled');
    start();
  });

  $stop.on('click', function() {
    $stop.attr('disabled', 'disabled');
    $start.removeAttr('disabled');
    $step.removeAttr('disabled');
    stop();
  });

  $step.on('click', function() {
    $reset.removeAttr('disabled');
    iterate();
  });

  $reset.on('click', function() {
    $reset.attr('disabled', 'disabled');
    $stop.attr('disabled', 'disabled');
    $start.removeAttr('disabled');
    $step.removeAttr('disabled');
    stop();
    reset();
  });
})();
