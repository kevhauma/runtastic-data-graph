let express = require("express");
let bodyParser = require("body-parser");
let opn = require('opn');
let fs = require('fs');
let app = express();

let data = require("./data");

app.use(express.static('client'));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.get('/data', async(req, res) => {
    console.log("--------------------")
    try {
        res.status(200).json(await data(req.query.points));
    } catch (e) {
        res.status(500).json(e);
    }
});

app.listen(3000, () => {
    console.log("listening on 3000")
    console.log("opening browser")
    opn('http://localhost:3000');
});
