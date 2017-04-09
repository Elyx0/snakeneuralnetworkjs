import { cloneDeep } from 'lodash';
import config from '../config.json';
import Genome from './Genome';
import { Network } from 'synaptic';
import { sm } from '../game/SaveManager';
class Pool {
  constructor() {
    this.roundTicksElapsed = 0;
    this.generation = 0;
    this.maxFitness = 0;
    this.currentGenerationMaxFitness = 0;
    this.previousMaxFitness = 0;
    this.championsPerfs = [];
    this.p1GenomeIndex = 0;
    this.p2GenomeIndex = 1;
    this.genomes = [];
  }

  newGeneration() {
    this.currentGenerationMaxFitness = 0;
    this.genomes.forEach(g => {
      if (g.fitness > this.maxFitness) this.maxFitness = g.fitness;
    });
    // Kill worst genomes
    this.genomes = this.selectBestGenomes(this.genomes,config.KeepAlivePercent,config.Population);


    const bestGenomes = _.clone(this.genomes);


    // Crossover
    while (this.genomes.length < config.Population - 2) {
      const gen1 = this.getRandomGenome(bestGenomes);
      const gen2 = this.getRandomGenome(bestGenomes);
      const newGenome = this.mutate(this.crossOver(gen1,gen2));
      this.genomes.push(newGenome);
    }
    // 2 random from the best will get mutations
    while (this.genomes.length < config.Population) {
      const gen = this.getRandomGenome(bestGenomes);
      const newGenome = this.mutate(gen);
      this.genomes.push(newGenome);
    }

    // Increment the age of a Genome for debug checking
    // If the top Genome keeps aging and aging it means no children was able to beat him
    // Which might indicate that we're stuck and the network converged
    this.genomes.forEach(g => { g.age++ });

    const generationMax = Math.max.apply(Math,this.genomes.map(g => g.fitness));
    const chartsData = {
      x:pool.generation,y:generationMax
    };
    this.championsPerfs.push(chartsData);
    this.hydrateChart();

    // Reset Matches & fitness
    this.genomes.forEach(g => {g.matches = []; g.fitness = 0});

    //Save JSON
    this.saveState(this);
    console.log(`Completed Generation ${this.generation}`);
    this.generation++;
  }

  saveState(pool) {
    sm.saveState(pool);
  }

  mutate(gen) {
    let networkJSON = gen.network.toJSON();
    const newGenome = new Genome();
    networkJSON.neurons = this.mutateDataKeys(networkJSON.neurons, 'bias', config.MutationChance);
    networkJSON.connections = this.mutateDataKeys(networkJSON.connections, 'weight', config.MutationChance);
    newGenome.network = Network.fromJSON(networkJSON);
    return newGenome;
  }

  // Given an array of object with key and mutationChance
  // randomly mutate the value of each key
  mutateDataKeys(obj,key,mutationChance) {
    const finalObj = cloneDeep(obj);
    finalObj.forEach(o => {
      if (Math.random() < mutationChance) {
        o[key] += o[key] * (Math.random() - 0.5) * 3 + (Math.random() - 0.5);
      };
    });
    return finalObj;
  }

  hydrateChart() {
    chart.data.datasets[0].data = this.championsPerfs.slice();
    chart.update();
    const ageStats = this.genomes.map(g => g.age);
    ageStats.length = ~~(config.Population * config.KeepAlivePercent);
    ageChart.data.datasets[0].data = ageStats;
    ageChart.update();
  }
  getRandomGenome(list) {
    return list[~~(Math.random()*list.length)];
  }

  // Will only touch the neurons part of the network
  // Taking some part from gen1 network, and the rest from gen2
  crossOver(gen1,gen2,swapChance=0.5) {
    // Grab the json version of their networks
    // then compute changes
    if (Math.random() < swapChance) [gen1,gen2] = [gen2,gen1];

    //Extract their networks
    const [ net1, net2 ] = [gen1,gen2].map(g => g.network.toJSON());
    const child = new Genome();

    // Get the result of crossover of the bias of the neurons
    const crossedNeurons = this.crossOverDataKey(net1.neurons,net2.neurons, 'bias');
    net1.neurons = crossedNeurons;
    // Reconstruct the synaptic Network back
    child.network = Network.fromJSON(net1);
    return child;
  }

  // Given 2 arrays of objects,
  // select a crossOver point randomly,
  // swap values starting at cut
  crossOverDataKey(a,b, key, cutLocation) {
      const childNeurons = cloneDeep(a);
      cutLocation = cutLocation || ~~(Math.random()*a.length);
      for (let i=cutLocation;i<a.length;i++) {
        childNeurons[i][key] = b[i][key];
      }
      return childNeurons;
  }

  // Return a sorted version of the genomes array based on fitness key
  selectBestGenomes(genomes,keepRatio,populationCount) {
    genomes.sort((g1,g2) => g2.fitness - g1.fitness);
    genomes.length = ~~(keepRatio * populationCount);
    return genomes;
  }

  // Populate according to the config with random mutated Genomes
  buildInitGenomes() {
    let builded = [];
    for (let i=0;i<config.Population;i++) {
      builded.push(this.mutate(new Genome()));
    }
    return builded;
  }

  init() {
    this.maxFitness = 0;
    this.generation = 0;
    this.championsPerfs = [];
    this.currentGenerationMaxFitness = 0;
    this.genomes = this.buildInitGenomes();
  }
  reboot() {
    this.init();
    this.hydrateChart();

  }
  // Given some inputs activate the network assigned to P1 and return the output
  evaluateP1Genome(inputs) {
    const networkInputs = inputs;
    const output = this.genomes[this.p1GenomeIndex].network.activate(networkInputs);
    //console.log(networkInputs,output); // Uncomment to see what is passed and received
    return output;
  }

  evaluateP2Genome(inputs) {
    const networkInputs = inputs;
    const output = this.genomes[this.p2GenomeIndex].network.activate(networkInputs);
    return output;
  }

  // Returns a percent of the current generation advancement
  getGenerationAdvancement() {
    return ~~(this.genomes.map(g => g.matches.length).reduce((x,y)=> x+y,0)/config.Population);
  }

  getP1Genome() { return this.genomes[this.p1GenomeIndex] }

  getP2Genome() { return this.genomes[this.p2GenomeIndex] }

  getGenomeOfCurve(id) {
    return id ? this.getP2Genome() : this.getP1Genome();
  }

  // P1 aka curvesList[0] is played by p1GenomeIndex Genome
  getIndexOfCurveGenome(id) {
    return id ? this.p2GenomeIndex : this.p1GenomeIndex;
  }

  // Receives both Curves and id of the
  matchResult({winner, loser}) {
    // Winner adds loser to its matches
    const winnerGenome = this.getGenomeOfCurve(winner.id);
    const loserGenome = this.getGenomeOfCurve(loser.id);
    winnerGenome.addMatch(
      {
        opponent: this.getIndexOfCurveGenome(loser.id),
        score: ~~(10 + Math.log10(winner.diedAt)),
        winner:true,
      });
    loserGenome.addMatch(
      {
        opponent: this.getIndexOfCurveGenome(winner.id),
        score: ~~(Math.log10(loser.diedAt)),
        winner:false,
      });
  }

  pickPlayers() {
    let foundP1 = false;
    let foundP2 = false;
    foundP1 = this.findOpponent(false,this.genomes);
    if (foundP1 === false) {
      this.p1GenomeIndex = 0;
      this.p2GenomeIndex = 1;
      this.newGeneration();
    } else {
      foundP2 = this.findOpponent(foundP1, this.genomes);
      if (!foundP2) throw new Error('Could not find opponent');
      this.p1GenomeIndex = foundP1;
      this.p2GenomeIndex = foundP2;
    }
  }

  findOpponent(specificOpponent=false, genomesList) {
    const { Population } = config;
    const matchesToplay = Population - 1;

    for (let i = 0,l = genomesList.length; i<l;i++) {
      const candidate = genomesList[i];
      const matches = candidate.matches.length;
      if (matches < matchesToplay){
        if (specificOpponent === false) {
          // Return the first index that didn't do all his matches
          return i;
        } else {
          // Is it not me?
          if (specificOpponent !== i) {
            // Does this candidate work against specificOpponent?
            const alreadyPlayed = candidate.matches.some(m => m.opponent == specificOpponent);
            if (!alreadyPlayed) return i;
          }

        }
      }
    }
    return false;
  }

}
export let pool = new Pool();
