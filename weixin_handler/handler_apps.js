var template = require('./reply_template');
var urls = require("../address_configure");
var checker = require("./checkRequest");
var dir = "http://" + urls.IP + "/public/apps/";

var announcement_doc = {
    title: "学生清华校内应用平台声明",
    url: dir + "shengming.htm",
};
/*
exports.check_apps=function(msg)
{
    if (checker.checkMenuClick(msg).substring(0, 4) === "APP_" || msg.MsgType[0]==="text" && msg.Content[0]==="马兰花开")
        return true;
    return false;
};

exports.faire_apps = function(msg, res) {
  var app;
  if (msg.MsgType[0]==="text" && msg.Content[0]==="马兰花开") {
    title = "马兰花开抢票";
    url = "http://mp.weixin.qq.com/s?__biz=MzA5MjEzOTQwNA==&mid=502275193&idx=1&sn=e12a14a97fa17961ab6acc652763b4e0&scene=19#wechat_redirect";
    picture = dir + "mlhk.jpg";
    description = "";
    res.send(template.getRichTextTemplate(msg, [{
      title: title,
      url: url,
      picture: picture
    }]));
    return;
  }
  var app = checker.checkMenuClick(msg).substring(4).toLowerCase();
  var picture, title, url;
  switch (app) {
  case "course":
    title = "ExChangeX";
    url = "http://exchangex.cn/";
    picture = dir + "exchangex.jpg";
    break;
  case "market":
    title = "跳蚤园";
    url = "http://www.tiaozy.cn";
    picture = dir + "tiaozy.jpg";
    description = "";
    break;
  }
  res.send(template.getRichTextTemplate(msg, [{
    title: title,
    url: url,
    picture: picture
  }, announcement_doc]));
};*/
