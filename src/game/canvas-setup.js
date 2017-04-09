import config from '../config.json';
import { pool } from '../genetics/Pool';
import charts from './charts';
import Curve from './Curve';

class MainCanvas {
    constructor() {
        this.curvesList = [];
        this.simulationSpeed = 1;
        this.showDebug = 1;
        this.showDraw = 1;
        this.showCurvesSensors = 0;
        this.humanControlled = 0;
        this.waitForReset = 0;
        this.setupChart();
    }
    setupChart() {
        document.addEventListener("DOMContentLoaded", e => {
            window.chart = charts.perfChart();
            window.ageChart = charts.ageChart();
        });
      }
    setup() {
      this.curvesList.length = 0;
      const {C_W,C_H} = config;
      const canv = createCanvas(C_W,C_H);
      canv.parent('sketch-holder');
    }
    reset() {
      background(51);
      this.curvesList.length = 0;
      this.waitForReset = 0;
      this.curvesList.push(new Curve(this.curvesList,0),new Curve(this.curvesList,1));
      this.curvesList[1].setStart();
      if (this.showCurvesSensors) {
        this.curvesList[0].setDebug();
        this.curvesList[1].setDebug();
      }

      if (this.humanControlled) {
        this.curvesList[1].humanControlled = true;
        return;
      }
      pool.roundTicksElapsed = 0;
      pool.pickPlayers();
    }
    draw() {
      if (this.curvesList.length != 2) return;
      if (this.curvesList.some(c => c.debug)) background(51);

      // Speed up simulation
      for (var i=0;i<this.simulationSpeed;i++) {
        var allDead = this.curvesList.every(c => c.dead);
        if (allDead) {
          if (this.humanControlled) {
            // Human VS Ai rounds don't count
            if (!this.waitForReset) this.waitForReset = setTimeout(reset,3000);
            this.handleNextTick();
          }
          else {
            //2 A.I Fighting
            //Compute who died first
            let winner = this.curvesList[0];
            let loser = this.curvesList[1];
            if (winner.diedAt < loser.diedAt) {
              const tmp = loser;
              loser = winner;
              winner = tmp;
            }
            if (winner.id == 0) {
              // P1 Died.
              //console.log('P1, died');
              pool.matchResult({winner,loser});
            } else {
              //console.log('P2, died');
              // P2 Died.
              pool.matchResult({winner,loser});
            }

            reset();
            return;
          }
        } else {
          // One curve is still alive, let it go
          this.handleNextTick();
        }
      }
    }
    handleNextTick() {
      pool.roundTicksElapsed++;
      const [p1,p2] = this.curvesList;
      if (pool.roundTicksElapsed % 2 == 0) {
        !p1.dead && p1.getInputsAndAssignDir();

        if (!this.humanControlled) {
          !p2.dead && p2.getInputsAndAssignDir();
        } else {
          if (p2.debug == 1) {
            p2.getInputLayer();
          }
        }
      }
      this.curvesList.forEach(c => c.update());
    }

}

export let Game = new MainCanvas();
