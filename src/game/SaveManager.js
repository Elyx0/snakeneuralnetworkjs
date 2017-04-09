import Genome from '../genetics/Genome';
class SaveManager {
  constructor() {
    this.lastSaveTime = 0;
    this.previous = [];
  }
  elapsed() {
    return ~~((+(new Date()) - this.lastSaveTime) / 1000);
  }

  getLoadState(callback) {
    var sessionPool = sessionStorage.pool;
    if (sessionPool) {
      this.hydrate(JSON.parse(sessionPool),callback);
    } else {
      this.getPreviousSaves(saves => {
        if (!saves.length) {
            pool.init();
            setTimeout(callback,500);
        } else {
          this.loadFile(saves[0],callback);
        }
      });
    }
  }

  loadFile(file,callback) {
    var req = new XMLHttpRequest();
    req.open('GET',file,true);
    req.onreadystatechange = e => {
      if (req.readyState == 4) {
        this.hydrate(JSON.parse(req.responseText),callback);
      }
    }
    req.send(null);
  }

  hydrate(json,callback) {
    // json is a representation of pool
    // Copy all the keys
    Object.assign(pool,json);

    //Re Hydrate the genomes
    pool.genomes = pool.genomes.map(g => {
      const hGen = new Genome();
      Object.assign(hGen,g);
      hGen.hydrateNetwork();
      return hGen;
    });
    setTimeout(pool.hydrateChart.bind(pool),1000);
    callback();
  }

  getPreviousSaves(callback) {
    var req = new XMLHttpRequest();
    req.open('GET','/listsaves',true);
    req.onreadystatechange = e => {
      if (req.readyState == 4) {
        callback(JSON.parse(req.responseText));
      }
    }
    req.send(null);
  }

  saveState(pool,callback) {
    if (this.elapsed() < 60) return;
    this.lastSaveTime = +(new Date());
    callback = callback || function(){};
    var poolJSON = JSON.stringify(pool);

   if (location.hostname == 'localhost') {
     var req = new XMLHttpRequest();
     req.open('POST','/savestate',true);
     req.setRequestHeader("Content-Type", "application/json");
     req.onreadystatechange = e => {
       if (req.readyState == 4) callback();
     }
     req.onerror = e => console.log('Error Saving:',e),callback();
     req.send(poolJSON);

   } else {
     var poolToSession = pool;
     // Network are heavy in size 2mb -> 200ko
     // They will get regenerated in the loading
     sessionStorage.setItem('pool',JSON.stringify(poolToSession));
     callback();
   }

  }
}

export let sm = new SaveManager();
