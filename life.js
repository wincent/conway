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
  var $canvas   = $('#life'),
      height    = $canvas.height(),
      width     = $canvas.width(),
      white     = "rgb(255, 255, 255)",
      black     = "rgb(0, 0, 0)",
      cellCount = width * height,
      liveCount = cellCount / 10, // TODO: make that configurable
      cells     = [];

  if (!$canvas[0].getContext) {
    return; // no browser support
  }

  var context = $canvas[0].getContext('2d');

  function clearCanvas() {
    context.fillStyle = white;
    context.fillRect(0, 0, width, height);
  }

  function paintCell(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }

  function expireCell(x, y) {
    paintCell(x, y, white);
    cells[x * width + y] = false;
  }

  function reviveCell(x, y) {
    paintCell(x, y, black);
    cells[x * width + y] = true;
  }

  function prepareSeed(seed) {
    // use "inside-out" variant of the Fisher-Yates shuffle
    for (var i = 0; i < cellCount; i++) {
      var rand = Math.round(Math.random() * i);
      cells[i] = cells[rand];
      cells[rand] = i < liveCount;
    }
  }

  function renderCells() {
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        cells[y * width + x] ? reviveCell(x, y) : expireCell(x, y);
      }
    }
  }

  function iterate() {
    // build up a queue of operations
    var queue = [];

    for (var i = 0; i < cellCount; i++) {
      var alive          = cells[i],
          x              = i % width,
          y              = Math.floor(i / width),
          neighbourCount = 0;

      for (var j = x - 1, maxX = x + 1; j <= maxX; j++) {
        for (var k = y - 1, maxY = y + 1; k <= maxY; k++) {
          if (j >= 0 && j < width &&
              k >= 0 && k < height &&
              (j != x || k != y) &&
              cells[k * width + j]) {
            neighbourCount++;
          }
        }
      }

      if (alive) {
        if (neighbourCount < 2 || // rule 1
            neighbourCount > 3) { // rule 2
          queue.push({ expire: true, x: x, y: y});
        }
      } else { // dead
        if (neighbourCount == 3) { // rule 3
          queue.push({ revive: true, x: x, y: y });
        }
      }
    }

    // consume queue
    for (var i = 0, max = queue.length; i < max; i++) {
      var item = queue[i];
      item.revive ? reviveCell(item.x, item.y) : expireCell(item.x, item.y);
    }

    if (queue.length) {
      setTimeout(iterate, 10);
    } else {
      console.log('nothing else to do');
    }
  }

  prepareSeed();
  clearCanvas();
  renderCells();
  iterate();
})();
