import config from '../config.json';
import { Game } from 'game/canvas-setup';
//import { pool } from '../genetics/pool';
const {C_W,C_H} = config;
const topLeft = {
    x: 0,
    y: 0
};
const topRight = {
    x: C_W,
    y: 0
};
const bottomLeft = {
    x: 0,
    y: C_H
};
const bottomRight = {
    x: C_W,
    y: C_H
};
const HIT_BORDERS = [
    [
        topLeft, topRight
    ],
    [
        topLeft, bottomLeft
    ],
    [
        topRight, bottomRight
    ],
    [bottomLeft, bottomRight]
];

const curveSize = 6;
class Curve {
    constructor(curvesList, id, x, y) {
        this.curvesList = curvesList;
        x = x || 40 + Math.random() * (C_W - 80);
        y = y || 40 + Math.random() * (C_H - 80);
        this.diedAt = 0;
        this.x = x;
        this.id = id;
        this.y = y;
        this.vector;
        this.history = [];
        this.speed = 90 / 75; //maxspeed
        this.holesize = 16;
        this.size = curveSize;
        this.radius = 40; //Turning radius??? maxradius?
        this.angle = TWO_PI * Math.random(); //
        this.maxAngle = TWO_PI / 9;
        this.stepAngle = this.maxAngle / 20;
        this.noDrawing = this.size;
        //this.holeLeft = 2 * Math.PI * this.§_-MF§.radius;
        this.direction = 2; // LEFT RIGHT STILL
        this.whiskersize = config.whiskerSize;
        this.randomPos();
        this.lastInputLayer = Array.from(Array(config.InputSize)).map(k => 0); // Keeping it for debugging
        this.lastEvaluation = null; // Same
        this.diedOn = 0;
    }

    setStart() {
        this.history.length = 0;
        this.angle = TWO_PI * Math.random();
        this.noDrawing = this.size;
        let foundPos = false;
        while (!foundPos) {
            this.randomPos();
            if (this.curvesList.filter(c => c.id != this.id).some(c => distNotSquared(c.x, c.y, this.x, this.y) >= 100 * 100)) {
                foundPos = true;
            }
        }
        //curvesList.filter(c => c.id != this.id).forEach(c => console.log('Distance:',distNotSquared(c.x,c.y,this.x,this.y),140*140));
        this.dead = false;
        this.direction = 2;
    }

    randomPos() {
        this.x = 70 + Math.random() * (C_W - 140);
        this.y = 70 + Math.random() * (C_H - 140);
        this.pos = createVector(this.x, this.y);
    }
    // Only used by Human Player
    updateDir() {
        const left = keyIsDown(LEFT_ARROW);
        const right = keyIsDown(RIGHT_ARROW);
        if (left) {
            this.direction = 0;
        }
        if (right) {
            this.direction = 1;
        }
        if (!left && !right) {
            this.direction = 2;
        }
    }

    shouldDraw() {
      if ((Math.random() < 0.01) && (this.noDrawing == 0)) {
          //console.log('Hole!');
          this.noDrawing = this.holesize;
      }
    }

    getDistanceToHitSensor(x, y, a) {
      //Debug;
      let minDistance = 3;
      x += minDistance * Math.cos(a);
      y += minDistance * Math.sin(a);

      let lineX = x + this.whiskersize * Math.cos(a);
      let lineY = y + this.whiskersize * Math.sin(a);
      let hit = false; // Is the whisker triggered ?
      let from = false; // Is it me&wall or enemy?
      let isHead = false; // Is it the enemy head?

      let shorttestDistance = this.whiskersize;
      //First Checking borders
      let hitBorders = HIT_BORDERS.map(b => {

          let hit2 = collideLineLine(b[0].x, b[0].y, b[1].x, b[1].y, x, y, lineX, lineY, true);
          return hit2.x == false && hit2.y == false
              ? false
              : [hit2.x, hit2.y];
      }).find(Boolean) || false;

      if (hitBorders) {
          //console.log('Whisker touching border!!',collided);
          hit = dist(this.pos.x, this.pos.y, hitBorders[0], hitBorders[1]);
          shorttestDistance = hit;
          lineX = hitBorders[0];
          lineY = hitBorders[1];
          from = false;
      }
      let curvesList = this.curvesList;
      let potentialColliders = [];
      //Loop through circles and check if line intersects
      for (let i = 0; i < curvesList.length; i++) {
          let c = curvesList[i];
          let history = c.history.slice();
          if (i==this.id) {
            potentialColliders = potentialColliders.concat(c.history);
          } else
          {
            potentialColliders = potentialColliders.concat(c.history,[c.pos.x,c.pos.y]);
          }
      }

      for (let i = 0; i < potentialColliders.length; i++) {
          let p = potentialColliders[i];
          //if further than this.whiskersizepx discard
          if (distNotSquared(x, y, p.x, p.y) > this.whiskersize*this.whiskersize)
              continue;
          let collided = collideLineCircle(x, y, lineX, lineY, p.x, p.y, this.size * 2)
          if (collided) {
              //console.log('Whisker touching!!',collided);
              let distance = dist(x, y, collided[0], collided[1]);
              if (distance < shorttestDistance) {
                  shorttestDistance = distance;
                  hit = distance;
                  lineX = collided[0];
                  lineY = collided[1];
                  from = (p.id != this.id);
                  isHead = p.head
                      ? 1
                      : 0;
              }

          }
      }

      if (this.debug) {

          fill(255, 0, 0);
          stroke(225, 204, 0);
          ellipse(lineX, lineY, 4)
          ellipse(x, y, 2);

          //let result = [this.pos.x+100*cos(angle),this.pos.y+100*sin(angle)];
          if (hit) {
              stroke(255, 0, 0);
              if (from) {
                  stroke(0, 255, 0);
              }
              if (isHead) {
                  stroke(0, 0, 255);
              }
          } else {
              stroke(225, 204, 0);
          };
          line(x, y, lineX, lineY);
      }
      //fill(255,0,0);
      let result = {x: lineX, y: lineY, hit: hit, from: from, isHead: isHead};

      return result;
    }

    getInputLayer(){
        //loadPixels(); // Nope too heavy

        let displayedWhiskers = config.nbWhiskers;
        //let inputLayer = Array.from(Array(displayedWhiskers * 4)).map(x => 0);
        let inputLayer = Array.from(Array(displayedWhiskers*config.inputsPerWhisker)).map(x => 0);

        let step = TWO_PI / (displayedWhiskers * 1.2);
        for (let i = 0; i < displayedWhiskers; i++) {
            let modifier = i > displayedWhiskers / 2
                ? -1
                : 1;
            let angle = this.angle + step * (i % (displayedWhiskers / 2)) * modifier;
            let x = this.pos.x;
            let y = this.pos.y;
            let result = this.getDistanceToHitSensor(x, y, angle);
            if (result.hit) {
               let index = i*3;
              //  inputLayer[index] = 1;
                result.hit = Math.min(result.hit,this.whiskersize);
                inputLayer[index] = 1 - map(result.hit,0,this.whiskersize,0,1);
                inputLayer[index + 1] = result.from;
                inputLayer[index + 2] = result.isHead;
            }
        }
        return inputLayer;
    }



    update() {
        if (this.dead) {
            //this.getInputLayer();
            if (Game.showDraw) this.showSkeleton();
            return;
        } else {
          // this.history.slice(0,-1).map(c => {
          //   fill(0,0,255);
          //   ellipse(c.x,c.y,this.size);
          // });

          if (this.humanControlled) {
            this.updateDir();
          }

          this.shouldDraw();
          this.move();
          if (Game.showDraw) this.show();
          if (this.noDrawing != 0) this.noDrawing--;
          if (this.checkCollisions()) {

              //console.warn('Collided!');
              //setup();
          }
          this.store();
        }


    }

    getInputsAndAssignDir() {
      //return; // REMOVE ME!!
      let inputs = this.getInputLayer();
      //Add sensorsData to Inputs?
      let controller = this.id == 0 ? pool.evaluateP1Genome(inputs) : pool.evaluateP2Genome(inputs);
      //console.log(inputs,controller);
      this.lastInputLayer = inputs;
      this.lastController = controller;
      this.setPressedKey(controller);
    }

    // Outputs is an array with 3 elements [a,b,c]
    // We arbitrarily decided which is going to do what
    // I could have decided a was stay-still, b was left
    setPressedKey(outputs) {
       var value = outputs[0];
       //console.log(value);
       this.direction = 2;
       if (outputs > 0.55) this.direction = 1;
       if (outputs < .45) this.direction = 0;
      }

    // Adds the snake position to its history if far enough from last one
    store() {
        if (this.noDrawing > 0)
            return;
        var farEnough = false;
        var lastHistory = this.history.length && this.history[this.history.length - 1];
        if (!!lastHistory) {
              farEnough = distNotSquared(lastHistory.x, lastHistory.y, this.pos.x, this.pos.y) > ((this.size*this.size) + 1);
        } else {
            farEnough = true;
        }
        if (farEnough) {
            var history = this.pos.copy();
            if (this.history.length) {
                this.history[this.history.length - 1].head = false;
            }
            history.head = true;
            history.id = this.id;
            this.history.push(history);
        }
    }

    // Did we collide?
    checkCollisions() {
        let curvesList = this.curvesList;
        if (this.history.length < 1)
            return false;
        var potentialColliders = this.history.slice(0, -1);

        //Adding current pos and history
        potentialColliders.push([this.pos.x,this.pos.y]);
        var ownHistoryIndex = potentialColliders.length;
        var others = curvesList.filter(c => c.id != this.id);


        others.forEach(o => {
          potentialColliders = potentialColliders.concat(o.history);
        });


        var target = this.history[this.history.length - 1];
        var isColliding = potentialColliders.some((pos,i) => {
            var d = distNotSquared(pos.x, pos.y, target.x, target.y);
            var colliding = d < this.size*this.size;
            if (colliding) {
                if (i > ownHistoryIndex) {
                  this.diedOn = 1; // He died on enemy

                }
                this.diedAt = pool.roundTicksElapsed;
                if (Game.showDraw) this.showSkeleton(pos, target);
                this.stop();
            };
            return colliding;
        });

        var isOutOfBounds = (this.pos.x > C_W || this.pos.x < 0 || this.pos.y > C_W || this.pos.y < 0);
        if (isOutOfBounds) {
            if (Game.showDraw) this.showSkeleton(this.pos);
            this.diedAt = pool.roundTicksElapsed;
            this.stop();
        }
        return isColliding || isOutOfBounds;
    }

    // Debug curve skeleton
    showSkeleton(pos, target) {
      pos = pos || this.pos;
        this.history.slice(0, -1).map(c => {
            if (this.id <= 0) {
              stroke(255,90,137);
              fill(251, 71, 107);
            } else {
              fill(102, 51, 153);
              stroke(110,80,187);
             }

            ellipse(c.x, c.y, this.size);
        });
        if (target) {
            fill(255, 0, 0);
            ellipse(target.x, target.y, this.size);
        }
        fill(0, 255, 0);
        ellipse(pos.x, pos.y, this.size);
    }

    stop() {
        //console.log('RIP',this.id);
        this.dead = true;
    }

    show() {
        //frameCount % (this.size/2) == 0
        if (this.id <= 0) {
          stroke(255,90,137);
        //  fill(251, 71, 107);
        } else {
          //fill(102, 51, 153);
          stroke(110,80,187);
         }

        if (this.noDrawing == 0) {

            fill('rgba(255,255,255,1)');
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
        } else {

            if (this.debug) {
              fill('rgba(255,255,255,0.2)');
              ellipse(this.pos.x, this.pos.y, this.size, this.size);
            } else {
              fill('rgba(255,255,255,.2)');
              stroke(51);
              ellipse(this.pos.x, this.pos.y, this.size/2, this.size/2);
            }
        }
    }

    setDebug() {
      this.debug = true;
    }

    move() {
        if (this.direction != 2) {
            this.angle += (this.direction == 1
                ? 1
                : -1) * this.stepAngle;
        }
        this.pos.x += this.speed * Math.cos(this.angle);
        this.pos.y += this.speed * Math.sin(this.angle);
    }


}

export default Curve;
