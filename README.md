# snakeneuralnetworkjs [![Build Status][travis-image]][travis-url]

DEMO: https://snakeneuralnetwork.herokuapp.com/
### Neuroevolution of Neural Network of snakes in the Browser.

This is a demonstration of evolving a neural network thanks to genetics algorithms in the browser
using a multilayer perceptron (150-15-15-1).

The initial population contains 36 individuals, each assigned a different genome.
They will fight following a round-robin tournament.
At the end the top 7 are kept alive, and the remaining 29 are created by breeding from the 7.

Each snake has 50 sensors, each reporting 3 inputs:
1) The distance the sensor has hit something normalized between 0 and 1
2) 1 if this sensor touched the enemy body
3) 1 if this sensor touched the enemy body

<br/>


## Screenshot

### Snakes fighting:
![Snakes](/demo/demo.gif)

### Sensors:
![Snakes](/demo/sensors.gif)

Green: The sensor touched the enemy body
Yellow: The sensor did not report any activity
Red: The sensor is hitting a wall or its own body
Blue: The sensor is touching the enemy head

## Install

* **Note: requires a node version >= 6 and an npm version >= 3.**

First, clone the repo via git:

```bash
git clone https://github.com/elyx0/snakeneuralnetworkjs.git your-project-name
```

And then install dependencies.

```bash
$ cd your-project-name && npm install
```

:bulb: *you will need to run npm run build for publishing like for heroku*

## Run

```bash
$ node server.js
```
Then head to `localhost:8080` in the browser.

## Testing
```bash
$ npm run test
```

[travis-image]: https://travis-ci.org/Elyx0/snakeneuralnetworkjs.svg?branch=master
[travis-url]: https://travis-ci.org/Elyx0/snakeneuralnetworkjs
