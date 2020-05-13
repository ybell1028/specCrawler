const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');  
const cluster = module.exports = require('cluster');
cluster.schedulingPolicy = cluster.SCHED_RR;
const cors = require('cors');
const util = require('./middleware/util');

const crawling = require('./crawling');

let app = express();

//environment
app.set('port', process.env.PORT || 8080);
app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/crawling', crawling);

const router = express.Router();

/* sequelize setting */
const models = require("./models/index.js");

router.route('/crawling').get(function (req, res) {
    models.spec
    .findAll()
    .then(data => { //ID 중복 검사
        res.status(200);
        res.json(util.successTrue(data));
    })
    .catch(err => {
        console.log('스펙 리스트 조회 실패.');
        res.status(500);
        res.json(util.successTrue(err, '스펙 리스트 조회 실패.'));
    });
});

app.use('/', router);

app.use(function(req, res, next) {
    res.status(404);
    res.json(util.successFalse({
        name:'404 Not Found'
    }, '404 Not Found'));
});

models.sequelize.sync().then(() => {
}).catch(err => {
    console.log("연결 실패");
    console.log(err);
});

// 멀티 스레드
/* cluster(multithread) setting */

// if (cluster.isMaster) {
    
//     for (let i = 1; i <= numCPUs; i++) {
//         console.log('worker process create[' + i + ']');
//         cluster.fork();
//     }

//     cluster.on('listening', function(worker, address) {
//         console.log("Worker " + worker.id + " is now connected to " + address.address + ":" + address.port);
//     });
 
//     cluster.on('exit',function(worker, code, signal){
//         console.log(`worker ${worker.process.pid} died`);
//         cluster.fork();
//     });
 
// } else {
//     http.createServer(app).listen(app.get('port'), function () {
//         console.log('slave server '+cluster.worker.process.pid);
//     });



// 싱글 스레드
http.createServer(app).listen(app.get('port'), function () {
    console.log('crawling is running');
});


module.exports = router;
