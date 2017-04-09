import config from '../config.json';
// Right side canvas for the debugging infos
const sketch = function (p) {
  const bgColor = 247;
  const D_W = 400;
  const D_H = 360;
  let speedSlider;

  p.setup = function () {
    p.textFont("Helvetica");
    var canvas = p.createCanvas(D_W, D_H);
    //canvas.parent('debug');
    speedSlider = p.createSlider(0, 300, Game.simulationSpeed,2);
    speedSlider.position(115,320);
    const showSensorsCheckbox = p.createCheckbox('Show Sensors',false);
    showSensorsCheckbox.position(270,248);
    showSensorsCheckbox.changed(_=>{
      Game.showCurvesSensors = !Game.showCurvesSensors;
      reset();
    });
    const showDrawCheckbox = p.createCheckbox('Show Curves',true);
    const showDebugCheckbox = p.createCheckbox('Show Debug',true);
    const showHumanControlledCheckbox = p.createCheckbox('Control P2 with arrows',false);
    showHumanControlledCheckbox.changed(_=>{Game.humanControlled = !Game.humanControlled; reset();});
    showHumanControlledCheckbox.position(85,248);

    // buttonFightCurrentStrongest = createButton('Play against current strongest');
    // buttonFightCurrentStrongest.position(80, C_H+10);
    // buttonFightCurrentStrongest.mousePressed(_=>{
    //   if (!pool.previousGenerationChampion) {
    //     alert('No champion yet! Wait at least one generation');
    //     return;
    //   };
    //   showHumanControlledCheckbox.elt.getElementsByTagName('input')[0].checked = true;
    //   humanControlled = true;
    //   pool.p1Specie = pool.previousGenerationChampion[0];
    //   pool.p1Genome = pool.previousGenerationChampion[1];
    //   pool.species[pool.p1Specie].genomes[pool.p1Genome].generateNetwork()
    //   reset();
    //});
    showDebugCheckbox.changed(_=>{Game.showDebug = !Game.showDebug});
    showDrawCheckbox.changed(_=>{Game.showDraw = !Game.showDraw});
    showDrawCheckbox.position(90,350);
    showDebugCheckbox.position(200,350);
  };

  // Shows who is fighting who
  function displayStats(color,y,pool,player) {
    p.fill(color);
    p.stroke('rgba(0,0,0,.2)');
    p.textFont("Helvetica");
    p.text(`[${player?'P1':'P2'}]` + "    Genome: " + (player?pool.p1GenomeIndex:pool.p2GenomeIndex), 0,y);
    const genome = player?  pool.getP1Genome():pool.getP2Genome();
    const played =  genome.matches.length;
    const wins = genome.matches.reduce((acc,m) => m.winner ? acc+1 : acc,0);
    const fitness = genome.fitness;
    p.text("Wins: " + wins , 160,y);
    p.text("Losses: " + (played-wins), 215,y);
    p.text("Fitness: " + ~~fitness, 285,y);

    if (player) {
      p.text("Inputs P1 ", 20,10);
      p.text("Output P1 ", 200,10);
    }
  }

  // Stores Inputs Neurons and Outputs positions and values
  function Cell(x,y,value) {
    this.x = x;
    this.y = y;
    this.value = value;
  }

  // Debug Canvas
  p.draw = function () {
    let curvesList = Game.curvesList;
    if (frameCount % 5 !== 0) return;
    if(!Game.curvesList[0] || !Game.curvesList[1]) return;
    //console.log('Update Canvas');
    //return;
    Game.simulationSpeed = speedSlider.value();
    p.background(bgColor);

    p.textSize(12);

    var p1Color = 'rgb(255,90,137)';
    var p2Color = 'rgb(110,80,187)';

    var p1 = curvesList[0];
    var p1Inputs = p1.lastInputLayer;



    var p2 = curvesList[1];

    var rows = Math.ceil(Math.sqrt(config.InputSize));
    var columns = rows;
    var blocSize = 8;

    p.fill(0);
    p.stroke(0);
    var pushY = 100;
      //  return; // REMOVE ME
    displayStats(p1Color,rows*blocSize+pushY,pool,1);
    displayStats(p2Color,rows*blocSize+pushY+20,pool,0);

    var bufferX = 5;
    var bufferY = 160;

    p.fill(0);
    p.noStroke()
    p.text("Generation: " + pool.generation + ' ( '+pool.getGenerationAdvancement()+'% )', 5,10+bufferY+rows*blocSize);
    p.text("Max Fitness: " + ~~(pool.maxFitness) + " || ~"  + '           Current Gen Max: ' + ~~(Math.max.apply(Math,pool.genomes.map(g => g.fitness))), 5,25+bufferY+rows*blocSize);
    p.text("Simulation Speed: " + speedSlider.value(),129,310);


    if (!Game.showDebug) return;

    var genome = pool.getP1Genome();
    var network = genome.network;


    //p.push()
    var topBuffer = p; //Hack because I used topBuffer as a buffer previously
    topBuffer.fill(bgColor)
    var view = p1Inputs;

    var inputsGridColor = 'rgba(0,0,0,.5)';
    var activeSignalColor = 230;

    var boxStrokeActiveColor = 0;
    var boxStrokeInactiveColor = 'rgba(0,0,0,.2)';

    var boxFillActiveColor = 255;
    var boxFillInactiveColor = 'rgba(255,255,255,.2)';

    var TextStrokeActiveColor = p1Color;
    var TextStrokeInactiveColor = 'rgba(0,0,0,.2)';
    //Initialize cells list to draw connections with coordinates
    var cells = {};
    topBuffer.translate(0,20);

    // Taking care of the inputs
    if (!p1.lastInputLayer) return;
    for (let i=0;i<p1.lastInputLayer.length;i++) {

      const input = p1.lastInputLayer[i];
      const x = (i%rows)*blocSize;
      const y = parseInt(i/columns)*blocSize;
      cells[i] = new Cell(x,y,input);
      if (input) {
        topBuffer.stroke(0);
        topBuffer.fill(activeSignalColor);
        topBuffer.rect(x,y,blocSize,blocSize);
      }
    }


    topBuffer.stroke(inputsGridColor);
    for (var x=0;x<rows;x++) {
      topBuffer.line(x*blocSize,0,x*blocSize,(rows-1)*blocSize)
    }
    for (var y=0;y<rows;y++) {
      topBuffer.line(0,y*blocSize,rows*blocSize,y*blocSize)
    }
    topBuffer.line(rows*blocSize,0,rows*blocSize,(rows-1)*blocSize)


    //Draw the outputs
    var OutputDrawStart = 200;

    for (var i=0;i<config.Outputs;i++) {
      var x = OutputDrawStart;
      var y = ((blocSize*rows-1)/5)*(i+1);
      var value = p1.lastController;

      cells[config.InputSize+i] = new Cell(x,y,value);

      var colorStroke = (value > 0 ? boxStrokeActiveColor : boxStrokeInactiveColor);
      var colorFill = (value > 0 ? boxFillActiveColor : boxFillInactiveColor);
      topBuffer.strokeWeight(1);
      topBuffer.stroke(colorStroke);
      topBuffer.fill(colorFill);
      topBuffer.rect(x,y,blocSize,blocSize);

      var direction = 'None';



      // Creating fake boxes to visually see the key from value
      if (config.Outputs == 1) {
        var m = blocSize/2;
        var color = [0,255,0];
        var alpha = .1;

        //Output1
        var boX= x+40;
        var boY= y-10;
        colorStroke = (value > .55 ? boxStrokeActiveColor : boxStrokeInactiveColor);
        colorFill = (value > .55 ? boxFillActiveColor : boxFillInactiveColor);
        topBuffer.strokeWeight(1);
        topBuffer.stroke(colorStroke);
        topBuffer.fill(colorFill);
        topBuffer.rect(boX,boY,blocSize,blocSize);
        //console.log(value);
        topBuffer.stroke(value > .55 ? TextStrokeActiveColor : TextStrokeInactiveColor);
        topBuffer.fill(value > .55 ? TextStrokeActiveColor : TextStrokeInactiveColor);
        topBuffer.text("Right",boX+20,boY+blocSize);
        if (value > .55) alpha = .9;

        topBuffer.stroke('rgba('+color.join(',')+ ',' +alpha + ')');
        topBuffer.line(x+m,y+m,boX+m,boY+m);

        //Output2
        boY+=20;
        colorStroke = (value < .45 ? boxStrokeActiveColor : boxStrokeInactiveColor);
        colorFill = (value <.45 ? boxFillActiveColor : boxFillInactiveColor);
        topBuffer.strokeWeight(1);
        topBuffer.stroke(colorStroke);
        topBuffer.fill(colorFill);
        topBuffer.rect(boX,boY,blocSize,blocSize);
        //console.log(value);
        topBuffer.stroke(value < .45 ? TextStrokeActiveColor : TextStrokeInactiveColor);
        topBuffer.fill(value < .45 ? TextStrokeActiveColor : TextStrokeInactiveColor);
        topBuffer.text("Left",boX+20,boY+blocSize);
        if (value < .45) alpha = .9;

        topBuffer.stroke('rgba('+color.join(',')+ ',' +alpha + ')');
        topBuffer.line(x+m,y+m,boX+m,boY+m);


      }
    }
    return;


    // Taking care of the middle now
    // Generating sample cells for each
    Object.keys(network.neurons).forEach(k => {
      if (k >= Inputs && k < MaxNodes) {
        var neuron = network.neurons[k];
        cells[k] = new Cell(230,62,neuron.value);
      }
    });

    // Find where to place middle cells
    var minX = rows*blocSize;
    var maxX = OutputDrawStart-blocSize;
    var minY = 0;
    var maxY = rows*blocSize;
    var c1Factor = 0.75;
    var c2Factor = 0.25;

    //Adjusting Wizardry.
    for (var i=0;i<3;i++) {

      genome.genes.forEach(g => {
        if (g.enabled) {
          var c1 = cells[g.into];
          var c2 = cells[g.out];
          if (g.into >= Inputs && g.into < MaxNodes) {
            c1.x = c1Factor*c1.x + c2Factor*c2.x;
            if (c1.x > c2.x) c1.x -= 40;
            if (c1.x < minX) c1.x = minX;
            if (c1.x > maxX) c1.x = maxX;
            c1.y = c1Factor*c1.y + c2Factor*c2.y
          }

          if (g.out >= Inputs && g.out < MaxNodes) {
            c2.x = c2Factor*c1.x + c1Factor*c2.x;
            if (c1.x > c2.x) c2.x += 40;
            if (c2.x < minX) c2.x = minX;
            if (c2.x > maxX) c2.x = maxX;
            c2.y = c2Factor*c1.y + c1Factor*c2.y;
          }
        }
      });

    }

    // Draw the middle cells
    Object.keys(cells).forEach(k => {
      if (k >= Inputs && k < MaxNodes) {
          var cell = cells[k];
          var value = cell.value;
          var colorStroke = (value > 0 ? boxStrokeActiveColor : boxStrokeInactiveColor);
          var colorFill = (value > 0 ? boxFillActiveColor : boxFillInactiveColor);
          topBuffer.stroke(colorStroke);
          topBuffer.fill(colorFill);
          topBuffer.rect(cell.x,cell.y,blocSize,blocSize);
      }

    });

    genome.genes.forEach(g => {
      if (g.enabled) {
        var c1 = cells[g.into];
        var c2 = cells[g.out];
        var alpha = .1;
        var color = [255,0,0]; // Red
        if (c1.value > 0) alpha = .9;
        if (g.weight > 0) {
          color = [0,255,0]; //Green
        }
        topBuffer.stroke('rgba('+color.join(',')+ ',' +alpha + ')');
        var m = blocSize/2;
        topBuffer.line(c1.x+m,c1.y+m,c2.x+m,c2.y+m);
      }
    });
    //p.image(topBuffer,bufferX,bufferY);

    //p.stroke(255);
    //p.line(0,0,400,400);
    //p.line(8,0,400,0);
  };
};

const debugSketch = new p5(sketch, 'debug');
