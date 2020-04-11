/* global $:false */

'use strict';

$(function() {
  const test = 0;

  // =========================
  // SIZES
  // =========================

  let windowH = $(window).height();
  let windowW = $(window).width();
  let maxH = windowH - 134;
  let maxW = windowW - 60;
  let minH, minW, ptsInStgH, ptsInStgW, partSize;

  // =========================
  // BASE ELEMENTS
  // =========================

  let canvas = document.getElementById('stage').getContext('2d');
  let $stage = $('#stage');
  let $cover = $('#cover');

  // =========================
  // MENU OPTIONS
  // =========================

  let allowStart = true;
  let allowCancel = false;
  let speedNum = $('.speed').val();
  let speedTxt = $('.speedcont .val').text();
  let score = 0;

  // =========================
  // OBJECTS & ENUMS
  // =========================

  function Part(x, y) {
    this.x = x;
    this.y = y;
  }

  const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
  };

  const Axis = {
    X: 0,
    Y: 1
  };

  let Stage = {
    top: 0,
    left: 0,
    bottom: $stage.height(),
    right: $stage.width(),
    hasBounds: true
  };

  let Snake = {
    parts: [],
    direction: Direction.RIGHT,
    directionCanChange: true,
    color: '#ff0000'
  };

  let Food = {
    x: 0,
    y: 0,
    color: '#ffffff'
  };

  let Obstacle = {
    parts: [],
    addCount: 0,
    color: '#333333'
  };

  setSizes();

  if (self !== top) $('.sizecont').remove();

  // =========================
  // LISTENERS
  // =========================

  let stageH;
  let stageW;

  $('.newgame').on('click', startButton);

  $('.bounds').change(function() {
    Stage.hasBounds = $('.bounds').prop('checked');
  });

  $('.obst').change(function() {
    Obstacle.addCount = $('.obst').val();

    $('.obstcont .val').text(Obstacle.addCount);
  });

  $('.speed').change(function() {
    speedNum = $('.speed').val();

    if (speedNum > 72) {
      speedTxt = 'slow';
    } else if (speedNum > 46) {
      speedTxt = 'normal';
    } else {
      speedTxt = 'fast';
    }

    $('.speedcont .val').text(speedTxt);
  });

  $('.stageh').change(function() {
    stageH = fixSize($('.stageh').val());

    $stage.height(stageH);
    $stage.prop('height', stageH);

    Stage.bottom = $stage.height();
    ptsInStgH = $stage.height() / partSize;
  });

  $('.stagew').change(function() {
    stageW = fixSize($('.stagew').val());

    $stage.width(stageW);
    $stage.prop('width', stageW);

    Stage.right = $stage.width();
    ptsInStgW = $stage.width() / partSize;
  });

  $(window).on('keydown', function(e) {
    if ([13, 27, 37, 38, 39, 40].includes(e.which)) {
      e.preventDefault();
    }

    switch (e.which) {
      // Left
      case 37:
        if (Snake.directionCanChange && Snake.direction !== Direction.RIGHT) {
          Snake.direction = Direction.LEFT;
        }
        break;
      case 39:
        // Right
        if (Snake.directionCanChange && Snake.direction !== Direction.LEFT) {
          Snake.direction = Direction.RIGHT;
        }
        break;
      case 38:
        // Up
        if (Snake.directionCanChange && Snake.direction !== Direction.DOWN) {
          Snake.direction = Direction.UP;
        }
        break;
      case 40:
        // Down
        if (Snake.directionCanChange && Snake.direction !== Direction.UP) {
          Snake.direction = Direction.DOWN;
        }
        break;
      case 13:
        // Enter
        if (allowStart) countdown();
        break;
      case 27:
        // Escape
        if (allowCancel) showMenu('escaped');
        break;
    }

    if ([37, 38, 39, 40].includes(e.which)) {
      Snake.directionCanChange = false;

      if (test) {
        update();
        draw();
      }
    }
  });

  // =========================
  // MOVE & DRAW
  // =========================

  let headX, headY, tailX, tailY, gate = false;

  function update() {
    gate = false;
    headX = Snake.parts[0].x;
    headY = Snake.parts[0].y;
    tailX = Snake.parts[Snake.parts.length - 1].x;
    tailY = Snake.parts[Snake.parts.length - 1].y;

    moveBody();
    moveHead();

    // If snake hits a boundary
    if (Stage.hasBounds &&
        (headX >= Stage.right ||
        headX < Stage.left ||
        headY >= Stage.bottom ||
        headY < Stage.top)) {
      showMenu('hit a wall');
      return;
    }

    // If snake hits itself
    if (Snake.parts.length > 3) {
      for (let i = 4; i < Snake.parts.length; i++) {
        if (headX === Snake.parts[i].x && headY === Snake.parts[i].y) {
          showMenu('ran into itself');
          return;
        }
      }
    }

    // If snake hits an object
    if (Food.x === headX && Food.y === headY) {
      score += 10;
      $('.score .num').text(score);

      Snake.parts.push(new Part(tailX, tailY));

      Food.x = randomPos(Axis.X);
      Food.y = randomPos(Axis.Y);

      // If food is moved under snake, relocate it
      for (let i = 0; i < Snake.parts.length; i++) {
        if (Food.x === Snake.parts[i].x && Food.y === Snake.parts[i].y) {
          Food.x = randomPos(Axis.X);
          Food.y = randomPos(Axis.Y);
        }
      }

      // Add obstacles if not under food or in the way
      if (Obstacle.addCount > 0) {
        for (let i = 0; i < Obstacle.addCount; i++) {
          let tempX, tempY;

          do {
            tempX = randomPos(Axis.X);
            tempY = randomPos(Axis.Y);
          } while ((tempX === Food.x && tempY === Food.y) || tempX === headX || tempY === headY);

          Obstacle.parts.push(new Part(tempX, tempY));
        }
      }
    }

    // If snake hits an obstacle
    if (Obstacle.addCount > 0 && Snake.parts.length > 1) {
      for (let i = 0; i < Obstacle.parts.length; i++) {
        if (headX === Obstacle.parts[i].x && headY === Obstacle.parts[i].y) {
          showMenu('hit an obstacle');
          return;
        }
      }
    }
  }

  function moveBody() {
    if (Snake.parts.length === 1) return;

    for (let i = Snake.parts.length - 1; i > 0; i--) {
      let tempX1 = Snake.parts[i].x;
      let tempY1 = Snake.parts[i].y;
      let tempX2 = Snake.parts[i - 1].x;
      let tempY2 = Snake.parts[i - 1].y;

      if (tempX2 === tempX1 - partSize) tempX1 -= partSize;
      else if (tempX2 === tempX1 + partSize) tempX1 += partSize;
      else if (tempY2 === tempY1 - partSize) tempY1 -= partSize;
      else if (tempY2 === tempY1 + partSize) tempY1 += partSize;
      else if (tempX2 < tempX1) tempX1 += partSize;
      else if (tempX2 > tempX1) tempX1 -= partSize;
      else if (tempY2 < tempY1) tempY1 += partSize;
      else if (tempY2 > tempY1) tempY1 -= partSize;

      if (!Stage.hasBounds) {
        if (tempX1 < 0) tempX1 = Stage.right - partSize;
        else if (tempX1 >= Stage.right) tempX1 = 0;
        else if (tempY1 < 0) tempY1 = Stage.bottom - partSize;
        else if (tempY1 >= Stage.bottom) tempY1 = 0;
      }

      Snake.parts[i].x = tempX1;
      Snake.parts[i].y = tempY1;
    }
  }

  function moveHead() {
    if (Snake.direction === Direction.LEFT) {
      headX -= partSize;
    } else if (Snake.direction === Direction.RIGHT) {
      headX += partSize;
    } else if (Snake.direction === Direction.UP) {
      headY -= partSize;
    } else if (Snake.direction === Direction.DOWN) {
      headY += partSize;
    }

    if (!Stage.hasBounds) {
      if (headX < 0) {
        headX = Stage.right - partSize;
      } else if (headX >= Stage.right) {
        headX = 0;
      } else if (headY < 0) {
        headY = Stage.bottom - partSize;
      } else if (headY >= Stage.bottom) {
        headY = 0;
      }
    }

    Snake.parts[0].x = headX;
    Snake.parts[0].y = headY;
  }

  function draw() {
    if (gate) return;
    canvas.clearRect(0, 0, $stage.width(), $stage.height());

    canvas.fillStyle = Snake.color;
    for (let i = 0; i < Snake.parts.length; i++) {
      canvas.fillRect(Snake.parts[i].x, Snake.parts[i].y, partSize, partSize);
    }

    canvas.fillStyle = Food.color;
    canvas.fillRect(Food.x, Food.y, partSize, partSize);

    canvas.fillStyle = Obstacle.color;
    for (let i = 0; i < Obstacle.parts.length; i++) {
      canvas.fillRect(Obstacle.parts[i].x, Obstacle.parts[i].y, partSize, partSize);
    }
  }

  // =========================
  // START & END
  // =========================

  let moveInterval;

  // before game starts
  function countdown() {
    let count = 6;
    allowStart = false;

    $cover.css('display', 'none');
    $('input').attr('disabled', true);
    $('.newgame p').text('End Game');

    // Create interval to control countdown visual
    let startTime = setInterval(function() {
      if (count % 2 === 0 && count !== 0) {
        $stage.css('border', '10px solid #ff0000');
        $('#count p').text(count / 2);
      } else {
        $stage.css('border', '10px solid #333333');
      }

      if (--count < 0) {
        $('#count p').text('');

        clearInterval(startTime);
        startGame();
      }
    }, 500);
  }

  // When game starts
  function startGame() {
    if (!test) {
      moveInterval = setInterval(() => {
        update();
        draw();

        Snake.directionCanChange = true;
      }, speedNum);
    }

    allowCancel = true;
    gate = false;
    score = 0;

    Snake.direction = Direction.RIGHT;
    Snake.parts = [new Part(0, 0)];

    Food.x = randomPos(Axis.X);
    Food.y = randomPos(Axis.Y);

    Obstacle.parts = [];

    $('.score .num').text('0');
    $('.gameover, .reason').remove();

    draw();
  }

  // When game ends
  function showMenu(reason) {
    canvas.clearRect(0, 0, $stage.width(), $stage.height());
    clearInterval(moveInterval);

    allowStart = true;
    allowCancel = false;
    gate = true;

    $cover.css('display', 'initial');
    $cover.prepend('<p class="reason">The snake ' + reason + '.</p>', '<p class="gameover">Game Over</p>');
    $('.menucover').remove();
    $('input').attr('disabled', false);
    $('.newgame p').text('New Game');
  }

  function startButton() {
    if (allowStart) countdown();
    if (allowCancel) showMenu('escaped');
  }

  // =========================
  // CALCULATIONS
  // =========================

  // Get random position on an axis
  function randomPos(axis) {
    let ptsInStgAxis = axis === Axis.X ? ptsInStgW : ptsInStgH;
    let pos = partSize * Math.floor(Math.random() * ptsInStgAxis);

    return pos;
  }

  // Snap raw value to window-size-friendly value
  function fixSize(num) {
    let floorNum = Math.floor(num);
    let fixedNum = partSize * Math.floor(floorNum / partSize);

    return fixedNum;
  }

  // Set sizes of all elements
  function setSizes() {
    if (self === top) {
      partSize = Math.floor(windowH / 40);
    } else {
      partSize = Math.floor($(self).width() / 45);
    }

    maxH = fixSize(maxH);
    maxW = fixSize(maxW);
    minH = fixSize($cover.height());
    minW = fixSize($cover.width());

    $stage.height(maxH);
    $stage.width(maxH);
    $stage.attr({
      width: $stage.width(),
      height: $stage.height()
    });

    $('.stageh').attr({
      max: maxH,
      min: minH + 80,
      value: maxH,
      step: partSize
    });
    $('.stagew').attr({
      max: maxW,
      min: minW + 20,
      value: maxH,
      step: partSize
    });

    ptsInStgH = $stage.height() / partSize;
    ptsInStgW = $stage.width() / partSize;

    Stage.bottom = $stage.height();
    Stage.right = $stage.width();

    console.log('Global interval: ' + partSize);
  }
});