var util = {};

util.successTrue = function (data) {
    return {
        success: true,
        timestamp: new Date(Date.now()),
        data: data
    };
};

util.successFalse = function (err, comment) {
    if (!err && !comment) comment = 'data not found';

    return {
        success: false,
        timestamp: new Date(Date.now()),
        data: (err) ? util.parseError(err) : null,
        comment: (comment) ? comment : null
    };
};

util.parseError = function (err) {
    var parsed = {
        name: err.name,
        msg: err.message
    };
    if (err.name == 'ValidationError') {
        return err;
    }
    else {
        return parsed;
    }
};


exports.result = (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        res.status(422);
        console.dir(err);
        err.errors.name = err.name
        res.json(util.successFalse({ 
            name: 'ValidationError',
            errors : err.errors //에러가 ID에서만 나면 [0], password까지 나면 [1]까지 배열 출력
            })
        );
    }
    else next();
}

module.exports = util;