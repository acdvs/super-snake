$(() => {
    var test = 0;

    // Sizes and measurements
    const windowH = $(window).height();
    const windowW = $(window).width();
    var maxH = windowH - 134;
    var maxW = windowW - 60;
    var marginH = (windowH - maxH - 94) / 2;
    var marginW = (windowW - maxW - 20) / 2;
    var minH, minW, ptsInStgH, ptsInStgW, partSize;

    // Base elements
    var canvas = document.getElementById('stage').getContext('2d');
    var $stage = $('#stage');
    var $cover = $('#cover');
    var $count = $('#count');

    // Menu options
    var allowStart = true;
    var allowCancel = false;
    var speedNum = $('.speed').val();
    var speedTxt = $('.speedcont .val').text();
    var score = 0;

    function Part(x, y) {
        this.x = x;
        this.y = y;
    }

    var STAGE = {
        top: 0,
        left: 0,
        bottom: $stage.height(),
        right: $stage.width(),
        bounds: true
    };

    var SNAKE = {
        parts: [],
        length: 1,
        head: 0,
        tail: 0,
        direction: '',
        change: true,
        color: '#FF0000'
    };

    var FOOD = {
        x: 0,
        y: 0,
        color: '#FFFFFF'
    };

    var OBST = {
        parts: [],
        add: 0,
        color: '#333333'
    };

    setSizes();
    if (self !== top) $('.sizecont').remove();

    /*===================================================*\
    ||                                                   ||
    ||                MENU & KEY LISTENERS               ||
    ||                                                   ||
    \*===================================================*/
    
    $('.newgame').on('click', startButton);

    $('.bounds').change(function() {
        STAGE.bounds = $('.bounds').prop('checked');
    });

    $('.obst').change(function() {
        OBST.add = $('.obst').val();
        $('.obstcont .val').text(OBST.add);
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

    var stageH;
    $('.stageh').change(function() {
        stageH = fixSize($('.stageh').val());

        $stage.height(stageH);
        $stage.prop('height', stageH);

        STAGE.bottom = $stage.height();
        ptsInStgH = $stage.height() / partSize;
    });

    var stageW;
    $('.stagew').change(function() {
        stageW = fixSize($('.stagew').val());

        $stage.width(stageW);
        $stage.prop('width', stageW);

        STAGE.right = $stage.width();
        ptsInStgW = $stage.width() / partSize;
    });

    $(window).on('keydown', e => {
        switch (e.which) {
            case 37: // left
                e.preventDefault();
                if (!SNAKE.change) break;
                if (SNAKE.direction === 'right') break;
                SNAKE.direction = 'left';
                SNAKE.change = false;
                if (test) { update(); draw(); }
                break;
            case 39: // right
                e.preventDefault();
                if (!SNAKE.change) break;
                if (SNAKE.direction === 'left') break;
                SNAKE.direction = 'right';
                SNAKE.change = false;
                if (test) { update(); draw(); }
                break;
            case 38: // up
                e.preventDefault();
                if (!SNAKE.change) break;
                if (SNAKE.direction === 'down') break;
                SNAKE.direction = 'up';
                SNAKE.change = false;
                if (test) { update(); draw(); }
                break;
            case 40: // down
                e.preventDefault();
                if (!SNAKE.change) break;
                if (SNAKE.direction === 'up') break;
                SNAKE.direction = 'down';
                SNAKE.change = false;
                if (test) { update(); draw(); }
                break;
            case 13: // enter
                e.preventDefault();
                if (allowStart) countdown();
                break;
            case 27: // escape
                e.preventDefault();
                if (allowCancel) showMenu('escaped');
                break;
        }
    });

    /*===================================================*\
    ||                                                   ||
    ||                   MOVE AND DRAW                   ||
    ||                                                   ||
    \*===================================================*/

    var headX, headY, tailX, tailY, gate = false;
    function update() {
        gate = false;
        headX = SNAKE.parts[0].x;
        headY = SNAKE.parts[0].y;
        tailX = SNAKE.parts[SNAKE.tail].x;
        tailY = SNAKE.parts[SNAKE.tail].y;

        moveBody();
        moveHead();

        // if snake hits boundaries
        if (STAGE.bounds) {
            if (headX >= STAGE.right || headX < STAGE.left || headY >= STAGE.bottom || headY < STAGE.top) {
                showMenu('hit a wall');
                return;
            }
        }

        // if snake hits itself
        if (SNAKE.length > 3) {
            for (var i=4; i<SNAKE.length; i++) {
                if ((headX === SNAKE.parts[i].x) && (headY === SNAKE.parts[i].y)) {
                    showMenu('ran into itself');
                    return;
                }
            }
        }

        // if snake hits an object
        if (FOOD.x === headX && FOOD.y === headY) {
            score += 10;

            SNAKE.parts.push(new Part(tailX, tailY));
            SNAKE.tail = SNAKE.length++;

            FOOD.x = randomPos(1);
            FOOD.y = randomPos(0);

            // if food is moved under snake, relocate it
            for (var i=0; i<SNAKE.length; i++) {
                if (FOOD.x === SNAKE.parts[i].x && FOOD.y === SNAKE.parts[i].y) {
                    FOOD.x = randomPos(1);
                    FOOD.y = randomPos(0);
                }
            }

            // add obstacles if not under food or in the way
            for (var i=0; i<OBST.add; i++) {
                do {
                    var tempX = randomPos(1);
                    var tempY = randomPos(0);
                } while ((tempX === FOOD.x && tempY === FOOD.y) || (tempX === headX) || (tempY === headY));
                OBST.parts.push(new Part(tempX, tempY));
            }

            $('.score .num').text(score);
        }

        // if snake hits an obstacle
        if (OBST.add > 0 && SNAKE.length > 1) {
            for (var i=0; i<OBST.parts.length; i++) {
                if (headX === OBST.parts[i].x && headY === OBST.parts[i].y) {
                    showMenu('hit an obstacle');
                    return;
                }
            }
        }
    }

    function moveBody() {
        if (SNAKE.length === 1) return;

        for (var i=SNAKE.tail; i>0; i--) {
            var tempX1 = SNAKE.parts[i].x,
                tempY1 = SNAKE.parts[i].y,
                tempX2 = SNAKE.parts[i-1].x,
                tempY2 = SNAKE.parts[i-1].y;
            //normal cases
            if (tempX2 === tempX1 - partSize) tempX1 -= partSize;
            else if (tempX2 === tempX1 + partSize) tempX1 += partSize;
            else if (tempY2 === tempY1 - partSize) tempY1 -= partSize;
            else if (tempY2 === tempY1 + partSize) tempY1 += partSize;
            //"edge" cases
            else if (tempX2 < tempX1) tempX1 += partSize;
            else if (tempX2 > tempX1) tempX1 -= partSize;
            else if (tempY2 < tempY1) tempY1 += partSize;
            else if (tempY2 > tempY1) tempY1 -= partSize;

            if (!STAGE.bounds) {
                if (tempX1 < 0) tempX1 = STAGE.right - partSize;
                else if (tempX1 >= STAGE.right) tempX1 = 0;
                else if (tempY1 < 0) tempY1 = STAGE.bottom - partSize;
                else if (tempY1 >= STAGE.bottom) tempY1 = 0;
            }

            SNAKE.parts[i].x = tempX1;
            SNAKE.parts[i].y = tempY1;
        }
    }

    function moveHead() {
        if (SNAKE.direction === 'left') {
            headX -= partSize;
        } else if (SNAKE.direction === 'right') { // right
            headX += partSize;
        } else if (SNAKE.direction === 'up') { // up
            headY -= partSize;
        } else if (SNAKE.direction === 'down') { // down
            headY += partSize;
        }

        if (!STAGE.bounds) {
            if (headX < 0) {
                headX = STAGE.right - partSize;
            } else if (headX >= STAGE.right) {
                headX = 0;
            } else if (headY < 0) {
                headY = STAGE.bottom - partSize;
            } else if (headY >= STAGE.bottom) {
                headY = 0;
            }
        }

        SNAKE.parts[0].x = headX;
        SNAKE.parts[0].y = headY;
    }

    function draw() {
        if (gate) return;
        canvas.clearRect(0, 0, $stage.width(), $stage.height());

        canvas.fillStyle = SNAKE.color;
        for (var i=0; i<SNAKE.parts.length; i++) {
            canvas.fillRect(SNAKE.parts[i].x, SNAKE.parts[i].y, partSize, partSize);
        }

        canvas.fillStyle = FOOD.color;
        canvas.fillRect(FOOD.x, FOOD.y, partSize, partSize);

        canvas.fillStyle = OBST.color;
        for (i=0; i<OBST.parts.length; i++) {
            canvas.fillRect(OBST.parts[i].x, OBST.parts[i].y, partSize, partSize);
        }
    }

    /*===================================================*\
    ||                                                   ||
    ||                 BEGINNING & ENDING                ||
    ||                                                   ||
    \*===================================================*/

    // before game starts
    function countdown() {
        var count = 6;
        $cover.css('display', 'none');
        $('input').attr('disabled', true);
        $('.newgame p').text('End Game');
        allowStart = false;

        var startTime = setInterval(function() {
            if (count % 2 === 0 && count !== 0) {
                $stage.css('border', '10px solid #FF0000');
                $('#count p').text(count / 2);
            } else {
                $stage.css('border', '10px solid #333333');
            }
            count--;
            if (count < 0) {
                clearInterval(startTime);
                $('#count p').text('');
                startGame();
            }
        }, 500);
    }

    // when game starts
    var moveInterval;
    function startGame() {
        if (!test) {
            moveInterval = setInterval(() => {
                update();
                draw();
                SNAKE.change = true;
            }, speedNum);
        }
        allowCancel = true;
        gate = false;
        score = 0;
        SNAKE.direction = 'right';
        SNAKE.parts.push(new Part(0, 0));
        FOOD.x = randomPos(1);
        FOOD.y = randomPos(0);
        
        $('.score .num').text('0');
        $('.gameover, .reason').remove();

        draw();
    }

    // when game ends
    function showMenu(reason) {
        canvas.clearRect(0, 0, $stage.width(), $stage.height());
        clearInterval(moveInterval);
        allowStart = true;
        allowCancel = false;
        gate = true;
        SNAKE.parts = [];
        OBST.parts = [];
        FOOD.x = FOOD.y = 0;
        SNAKE.length = 1;
        SNAKE.head = 0;
        SNAKE.tail = 0;
        SNAKE.direction = '';
        
        $cover.css('display', 'initial');
        $cover.prepend('<p class="reason">The snake '+reason+'.</p>', '<p class="gameover">Game Over</p>');
        $('.menucover').remove();
        $('input').attr('disabled', false);
        $('.newgame p').text('New Game');
    }

    function startButton() {
        if (allowStart) countdown();
        if (allowCancel) showMenu('escaped');
    }
    
    /*===================================================*\
    ||                                                   ||
    ||                   CALCULATIONS                    ||
    ||                                                   ||
    \*===================================================*/

    function randomPos(num) {
        var unit = num ? ptsInStgW : ptsInStgH; // 1 = x, 0 = y
        var pos = partSize * (Math.floor(Math.random() * ptsInStgW));
        return pos;
    }

    // snaps raw values to window-size-friendly values
    function fixSize(num) {
        var temp = Math.floor(num);
        /*while (temp % partSize !== 0) {
            temp--;
        }*/
        var fixed = partSize * Math.floor(temp / partSize);
        return fixed;
    }

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
            min: minH+80,
            value: maxH,
            step: partSize
        });
        $('.stagew').attr({
            max: maxW,
            min: minW+20,
            value: maxH,
            step: partSize
        });

        ptsInStgH = $stage.height() / partSize;
        ptsInStgW = $stage.width() / partSize;

        STAGE.bottom = $stage.height();
        STAGE.right = $stage.width();

        console.log('Global interval: ' + partSize);
    }
});