import config from '../config';
const perfChart = () => {
  return new Chart(document.getElementById("perfChart"), {
      type: 'line',
      data: {
          datasets: [
              {
                  fill: false,
                  //  xAxisID: 'Generations',
                  //    yAxisID: 'Fitness',
                  pointBorderColor: 'rgb(255,255,255)',
                  pointBackgroundColor: 'rgb(255,90,137)',
                  label: 'Champion Fitness per Generation',
                  data: []
              }
          ]
      },
      options: {
          scales: {
              xAxes: [
                  {
                      type: 'linear',
                      position: 'bottom'
                  }
              ]
          }
      }
  });
};

const ageChart = () => {
  const baseArrayPop = Array.from(Array(~~(config.Population*config.KeepAlivePercent)));
  return new Chart(document.getElementById("ageChart"), {
      type: 'bar',
      data: {
          labels: baseArrayPop.map((x,i) => i+1),
          datasets: [
              {
                  label: 'Age of the top ' + baseArrayPop.length + ' genomes',
                  backgroundColor: baseArrayPop.map(e => 'rgb(255,90,137)'),
                  borderColor: baseArrayPop.map(e => 'rgb(230,230,230)'),
                  data: baseArrayPop.map(e => 0),
              }
          ]
      },
      options: {
       scales: {
           yAxes: [{
               ticks: {
                   beginAtZero:true
               }
           }]
       }
   }
  });
};

export default {
  perfChart,
  ageChart
}
