var express = require('express');
var router = express.Router();
var request = require('request');
var http = require('http');
var querystring = require('querystring');
var models = require('../models/models');
var lock = require('../models/lock');

var db = models.db;
var students = models.students;

router.get('/', function(req, res) {
    if (req.query.openid == null) {
        res.send("不要捣乱，要有openid！！");
        return;
    }

    db[students].find({weixin_id: req.query.openid, status: 1}, function(err, docs) {
        var isValidated = 1;
        if (docs.length == 0)
            isValidated = 0;
        res.render('validate', {openid: req.query.openid, isValidated: isValidated});
        return;
    });

});

router.get('/time', function(req, res) {
    request('http://' + models.authIP + ':' + models.authPort + models.authPrefix + '/time', //
    function(error, response, body){
        if (!error && response.statusCode == 200) {
            res.send(body);
        }
        else
            res.send('');
    });
});

router.post('/', function(req, res) {
    var tmp = req.body.secret;
    var openid = req.body.openid;
    var identity = req.body.identity;
    var cell = req.body.cell;
    var ques = req.body.ques;
    var depart = req.body.depart;
    if (!identity || get_identity_error(identity)) {
      res.send('ErrorIdentity');
      return;
    }
    if (!cell || !checkCell(cell)) {
      res.send('ErrorCell');
      return;
    }
    
    var post_option = {
        host: models.authIP,
        port: models.authPort,
        path: models.authPrefix,
        method: "POST",
        headers:{
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    };
    var r = http.request(post_option, function(resp) {
        resp.setEncoding('utf8');
        resp.on('data', function(chunk){
            //console.log(chunk);
            var stu = JSON.parse(chunk);
            if (stu.code == 0){
                lock.acquire(students, function(){
                    db[students].find({weixin_id: openid, status: 1}, function(err, docs) {
                        if (docs.length == 0){
                            db[students].find({stu_id:stu.data.ID}, function(err, docs) {
                                if (docs.length == 0){
                                    db[students].insert({stu_id: stu.data.ID, weixin_id: openid, status: 1,
                                          depart: depart, name: stu.data.name, zzmm: stu.data.zzmm, gender: stu.data.gender, folk: stu.data.folk,
                                          identity: identity, cell: cell, ques: ques}, function(){
                                        lock.release(students);
                                        res.send('Accepted');
                                        return;
                                    });
                                }
                                else{
                                    db[students].update({stu_id: stu.data.ID},  {$set : {status: 1, weixin_id: openid,
                                          depart: depart, name: stu.data.name, zzmm: stu.data.zzmm, gender: stu.data.gender, folk: stu.data.folk,
                                          identity: identity, cell: cell, ques: ques}}, function() {
                                        lock.release(students);
                                        res.send('Accepted');
                                        return;
                                    });
                                }
                            });
                        }
                        else{
                            var flag = false;
                            var i;
                            for (i = 0; i < docs.length; i++) {
                                if (docs[i].stu_id == stu.data.ID){
                                    flag = true;
                                    break;
                                }
                            }
                            if (flag){
                                    db[students].update({stu_id: stu.data.ID},  {$set : {
                                          depart: depart, name: stu.data.name, zzmm: stu.data.zzmm, gender: stu.data.gender, folk: stu.data.folk,
                                          identity: identity, cell: cell, ques: ques}}, function() {
                                        lock.release(students);
                                        res.send('Accepted');
                                        return;
                                    });
                                    lock.release(students);
                                    res.send('Accepted');
                                    return;
                            }
                            else{
                                lock.release(students);
                                res.send('Binded');
                                return;
                            }
                        }
                    });
                });
            }
            else {
                res.send(stu.message);
                return;
            }
        });
        resp.on('end', function(){});
    });
    var post_data = querystring.stringify({'secret':  tmp });
    r.write(post_data);
    r.end();
});

module.exports = router;


function get_identity_error(idcard) {
      function int(s) { return s | 0; }
  var Errors=['','身份证号码位数不对!','身份证号码出生日期超出范围或含有非法字符!','身份证号码校验错误!','身份证地区非法!'];
  var area={"11":"北京","12":"天津","13":"河北","14":"山西","15":"内蒙古","21":"辽宁","22":"吉林","23":"黑龙江","31":"上海",
    "32":"江苏","33":"浙江","34":"安徽","35":"福建","36":"江西","37":"山东","41":"河南","42":"湖北","43":"湖南","44":"广东",
    "45":"广西","46":"海南","50":"重庆","51":"四川","52":"贵州","53":"云南","54":"西藏","61":"陕西","62":"甘肃","63":"青海",
    "64":"宁夏","65":"新疆","71":"台湾","81":"香港","82":"澳门","91":"国外"};
  idcard = ("" + idcard).trim();
  // 地区校验
  if (!area[idcard.substring(0,2)]) {
    return Errors[4];
  }
  var ereg, s6;
  // 15位身份号码检测
  if (idcard.length == 15) {
    s6 = idcard.substring(6, 8) | 0;
    if ((s6 + 1900) % 4 == 0 || ((s6 + 1900) % 100 == 0 && (s6+1900) % 4 == 0 )) {
      ereg = new RegExp('^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}$'); //测试出生日期的合法性
    } else {
      ereg = new RegExp('^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}$'); //测试出生日期的合法性
    }
    return ereg.test(idcard) ? Errors[0] : Errors[2];
  }
  // 18位身份号码检测
  if(idcard.length == 18) {
    s6 = idcard.substring(6, 10) | 0;
    // 出生日期的合法性检查
    // 闰年月日:((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))
    // 平年月日:((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))
    if((s6 % 4) == 0 || ((s6 % 100) == 0 && (s6 % 4) == 0 )) {
      ereg=new RegExp('^[1-9][0-9]{5}(20[01]\\d|19\\d{2})((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}[0-9Xx]$'); //闰年出生日期的合法性正则表达式
    } else {
      ereg=new RegExp('^[1-9][0-9]{5}(20[01]\\d|19\\d{2})((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}[0-9Xx]$'); //平年出生日期的合法性正则表达式
    }
    //测试出生日期的合法性
    if(ereg.test(idcard)) {
      //计算校验位
      var S = (int(idcard[0]) + int(idcard[10])) * 7 + (int(idcard[1]) + int(idcard[11])) * 9 + (int(idcard[2]) +
          int(idcard[12])) * 10 + (int(idcard[3]) + int(idcard[13])) * 5 + (int(idcard[4]) + int(idcard[14])) * 8 +
          (int(idcard[5]) + int(idcard[15])) * 4 + (int(idcard[6]) + int(idcard[16])) * 2 + int(idcard[7]) * 1 +
          int(idcard[8]) * 6 + int(idcard[9]) * 3;
      var Y = S % 11;
      var JYM = "10X98765432";
      var M = JYM[Y]; // 判断校验位
      if(M == idcard[17]) { // 检测ID的校验位
        return Errors[0];
      } else {
        return Errors[3];
      }
    } else {
      return Errors[2];
    }
  } else {
    return Errors[1];
  }
}


function checkCell(cell) {
  var CELL_REGEXP_STR = '^(?:\\+\\d+\\s?)?1(?:[358]\\d|47|7\\d)\\d{8}$';
  var CELL_REGEXP = new RegExp(CELL_REGEXP_STR);
  if (!CELL_REGEXP.test(cell)) {
      return false;
  } else {
      return true;
  }
}

