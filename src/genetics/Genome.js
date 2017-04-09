import config from '../config.json';
import { Architect, Network } from 'synaptic';

class Genome {
  constructor() {
    this.network = {};
    this.matches = [];
    this.addNetwork();
    this.fitness = 0;
    this.age = 0;
  }
  addNetwork() {
    // Remember to add bias when evaluating
    let network = new Architect.Perceptron(config.InputSize,config.HiddenLayerSize,config.HiddenLayerSize,config.Outputs);
    this.network = network;
    return network;
  }
  hydrateNetwork() {
    this.network = Network.fromJSON(this.network);
  }
  addMatch(result) {
    this.matches.push(result);
    this.fitness += result.score;
  }
}

export default Genome;
