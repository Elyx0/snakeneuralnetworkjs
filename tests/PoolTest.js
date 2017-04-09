import test from 'tape';
import config from '../src/config.json';
import { pool } from '../src/genetics/Pool';
import Genome from '../src/genetics/Genome';
test('Init should populate the pool correctly',t => {
  t.plan(1);
  t.equal(config.Population,pool.buildInitGenomes().length,'Populated correctly');
});

test('selectBestGenomes must return a trimmed down version', t => {
  t.plan(1);

  const actual = pool.selectBestGenomes(
    [{fitness:2},{fitness:3},{fitness:0}], .4, 3);
  const expected = [{fitness:3}];
  t.deepEqual(actual,expected,'Correctly Trims down to 1');
});

test('crossover 2 genomes', t=> {
  t.plan(3);
  const gen1 = new Genome();
  const gen2 = new Genome();
  const [neurons1,neurons2] = [gen1,gen2].map(g => g.network.toJSON().neurons)
  const cutLocation = ~~(neurons1.length/2);
  const crossedKeys = pool.crossOverDataKey(neurons1,neurons2,'bias',cutLocation);
  const neuronsFrom = (arr1,arr2,key) => {
    return arr1.reduce((acc,neuron,i)=> { return (arr2[i][key] === neuron[key] ? acc+1 : acc)},0);
  };

  t.equal(neuronsFrom(crossedKeys,neurons1,'bias'),cutLocation,'Neurons from a after crossover');
  t.equal(neuronsFrom(crossedKeys,neurons2,'bias'),neurons1.length-cutLocation,'Neurons from b after crossover')
  const child = pool.crossOver(gen1,gen2,0);
  t.equal(child instanceof Genome,true,'Child is an instance of Genome');
});

test('Mutate',t => {
  t.plan(4);
  const gen = new Genome();
  const networkJSON = gen.network.toJSON();
  const newGen = pool.mutate(gen);
  const newGenNetworkJSON = newGen.network.toJSON();
  const hasAtLeastOneDifferentKeyIn = (obj1,obj2,param,key) => {
    return obj1[param].some((el,i) => obj2[param][i][key] !== el[key]);
  }
  t.equal(hasAtLeastOneDifferentKeyIn(newGenNetworkJSON,newGenNetworkJSON,'neurons','bias'),false,'Same network check');
  t.equal(hasAtLeastOneDifferentKeyIn(newGenNetworkJSON,networkJSON,'neurons','bias'),true,'Mutate changed some network neurons bias');
  t.equal(hasAtLeastOneDifferentKeyIn(newGenNetworkJSON,networkJSON,'connections','weight'),true,'Mutate changed some network neurons weights');
  t.equal(newGen instanceof Genome,true,'Mutated Genome is still a Genome proto');
});

test('Matches & Opponents', t => {
  t.plan(8);
  pool.init();
  const winner = {id:0,diedAt:150};
  const loser = {id:1,diedAt:10};
  const otherLoser = {id:2,diedAt:20};
  pool.matchResult({winner,loser});
  const match1 = pool.getGenomeOfCurve(winner.id).matches[0];
  const match2 = pool.getGenomeOfCurve(loser.id).matches[0];
  t.deepEqual(match1,{opponent:1,score:12,winner:true},'Winner should get its score');
  t.deepEqual(match2,{opponent:0,score:1,winner:false},'Loser should get its score');

  let p1Index = pool.findOpponent(false,pool.genomes);
  let p2Index = pool.findOpponent(0,pool.genomes);

  t.equal(p1Index,0,'Assigns correctly matches to P1');
  t.equal(p2Index,2,'Assign correctly matches to P2');

  pool.p1GenomeIndex = p1Index;
  pool.p2GenomeIndex = p2Index;

  pool.matchResult({winner,loser:otherLoser});

  const match3 = pool.getGenomeOfCurve(winner.id).matches[1];
  t.deepEqual(match3,{opponent:2,score:12,winner:true},'P1 winning subsequent matches');
  t.equal(pool.findOpponent(false,pool.genomes),0,'P1 is still the same Genome after 2 matches');
  t.equal(pool.findOpponent(0,pool.genomes),3,'P2 is set to the next Genome');
  t.equal(pool.getGenomeOfCurve(winner.id).fitness,24,'Winner Fitness Grew');
});
