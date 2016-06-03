var template = require('./reply_template');
var urls = require("../address_configure");
var checker = require("./checkRequest");
var dir = "http://" + urls.IP + "/public/apps/";

var announcement_doc = {
    title: "学生清华校内应用平台免责声明",
    url: dir + "mzsm.pdf",
};

exports.check_apps=function(msg)
{
    if (checker.checkMenuClick(msg).substring(0, 4) === "APP_")
        return true;
    return false;
};

exports.faire_apps = function(msg, res) {
  var app = checker.checkMenuClick(msg).substring(4).toLowerCase();
  var picture, title, url;
  switch (app) {
  case "course":
    title = "ExChange";
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
};
