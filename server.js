const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const webpackMiddleware = require('webpack-dev-middleware');
const config = require('./webpack.config.js');

app.set('port', (process.env.PORT || 8080));

app.use(bodyParser.json({limit: '50mb'}));

// Listing different saves
app.get('/listsaves', (req, res) => {
    glob('./saves/*.json', (err, files) => {
        res.json(files.sort((x, y) => {
            return y.match(/[0-9]+/)[0] - x.match(/[0-9]+/);
        }));
    })
});

if (!process.env.NODE_ENV !== 'production') {

    // In dev use webpack dev middleware
    const compiler = webpack(config);
    const middleware = webpackMiddleware(compiler, {
        publicPath: config.output.publicPath,
        contentBase: path.join(__dirname, 'dist'),
        stats: {
            colors: true
        }
    });
    app.use(middleware);
    app.get('/', function response(req, res) {
        res.write(middleware.fileSystem.readFileSync(path.join(__dirname, 'dist/index.html')));
        res.end();
    });
} else {

    // Run npm start build in prod and serve from static dist
    app.use(express.static(path.join(__dirname, '/dist')));
    app.get('/', function response(req, res) {
        res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
}

// Serving the saves files from /saves
app.use('/saves',express.static(path.join(__dirname, '/saves')));

// POST in local on /savestate stores in /saves
app.post('/savestate', (req, res) => {

    if (process.env.NODE_ENV != 'production') {
    var data = req.body;
    if (data) {
        fs.writeFile(`./saves/${data.generation}.json`, JSON.stringify(data), e => {
            if (e)
                console.log(e);
            }
        );
    }
  }
    res.send({status: true});
});



app.listen(app.get('port'), _ => {
    console.log(`App Running on ${app.get('port')}`);
});
