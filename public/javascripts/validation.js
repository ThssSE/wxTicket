var xmlhttp = null;

// 通过userAgent判断浏览器
var browserInfo = (function(){
    var userAgent = navigator.userAgent.toLowerCase();
    return {
        version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
        webkit: /webkit/.test( userAgent ),
        opera: /opera/.test( userAgent ),
        msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
        mozilla: /mozilla/.test(userAgent)&&!/(compatible|webkit)/.test(userAgent)
    };
})();

function hideElem(id) {
    document.getElementById(id).setAttribute('style', 'display:none');
}

function showElem(id) {
    document.getElementById(id).setAttribute('style', 'display:block');
}

function clearHelp(groupid, helpid) {
    document.getElementById(groupid).setAttribute('class', 'form-group');
    //document.getElementById(helpid).setAttribute('hidden', 'hidden');
    //document.getElementById(helpid).setAttribute('style', 'display:none;');
    hideElem(helpid);
}

function clearAllHelps() {
    clearHelp('usernameGroup', 'helpUsername');
    clearHelp('passwordGroup', 'helpPassword');
    clearHelp('groupIdentity', 'helpIdentity');
    clearHelp('groupCell', 'helpCell');
    clearHelp('submitGroup', 'helpSubmit');
}

function showSuccess(groupid, helpid) {
    document.getElementById(groupid).setAttribute('class', 'form-group has-success');
    //document.getElementById(helpid).setAttribute('hidden', 'hidden');
    hideElem(helpid);
}

function showError(groupid, helpid, text) {
    var dom = document.getElementById(helpid);
    if (browserInfo.msie)
        dom.innerText = text;
    else
        dom.textContent = text;
    //dom.removeAttribute('hidden');
    showElem(helpid);
    document.getElementById(groupid).setAttribute('class', 'form-group has-error');
}

function disableOne(id, flag) {
    var dom = document.getElementById(id);
    if (flag) {
        dom.setAttribute('disabled', 'disabled');
    } else {
        dom.removeAttribute('disabled');
    }
}

function disableAll(flag) {
    disableOne('inputUsername', flag);
    disableOne('inputPassword', flag);
    disableOne('inputIdentity', flag);
    disableOne('inputCell', flag);
    disableOne('inputQues', flag);
    disableOne('submitBtn', flag);
}

function showLoading(flag) {
    //var dom = document.getElementById('helpLoading');
    if (flag) {
        //dom.removeAttribute('hidden');
        showElem('helpLoading');
    } else {
        //dom.setAttribute('hidden', 'hidden');
        hideElem('helpLoading');
    }
}

function readyStateChanged() {
    if (xmlhttp.readyState==4)
    {// 4 = "loaded"
        if (xmlhttp.status==200)
        {// 200 = OK
            var result = xmlhttp.responseText;
            switch (result)
            {
                case 'Accepted':
                    //document.getElementById('validationHolder').setAttribute('hidden', 'hidden');
                    hideElem('validationHolder');
                    //document.getElementById('successHolder').removeAttribute('hidden');
                    showElem('successHolder');
                    return;

                case 'Rejected':
                    showError('usernameGroup', 'helpUsername', '');
                    showError('passwordGroup', 'helpPassword', '学号或密码错误！请输入登录info的学号和密码');
                    break;

                case 'Error':
                    showError('submitGroup', 'helpSubmit', '出现了奇怪的错误，我们已经记录下来了，请稍后重试。')
                    break;
            }
        }
        else
        {
            showError('submitGroup', 'helpSubmit', '服务器连接异常，请稍后重试。')
        }
        showLoading(false);
        disableAll(false);
    }
}

function submitValidation(openid) {
    if (checkUsername() & checkPassword() && checkIdentity() && checkCell()) {
        disableAll(true);
        showLoading(true);
        var form = document.getElementById('validationForm'),
            elems = form.elements,
            url = form.action,
            //params = "openid=" + encodeURIComponent(openid),
            i, len;
        /*for (i = 0, len = elems.length; i < len; ++i) {
            params += '&' + elems[i].name + '=' + encodeURIComponent(elems[i].value);
        }*/
        $.get("/validate/time", function(data) {
            if (data == '')
                return;
            var info = data + "|" + elems[0].value + "|" + elems[1].value;
            //console.log(data + "|" + elems[0].value + "|" + elems[1].value);
            var key = new RSAKeyPair("10001", "", "89323ab0fba8422ba79b2ef4fb4948ee5158f927f63daebd35c7669fc1af6501ceed5fd13ac1d236d144d39808eb8da53aa0af26b17befd1abd6cfb1dcfba937438e4e95cd061e2ba372d422edbb72979f4ccd32f75503ad70769e299a4143a428380a2bd43c30b0c37fda51d6ee7adbfec1a9d0ad1891e1ae292d8fb992821b");
            var encrypted = {
                secret:  encryptedString(key, info),
                identity: elems[2].value,
                cell: elems[3].value,
                ques: elems[4].value,
                openid: openid
            };
            $.post("/validate", encrypted, function(data) {
                if (data == 'Accepted'){
                    hideElem('validationHolder');
                    showElem('successHolder');
                }
                else if (data == 'Binded'){
                    showError('submitGroup', 'helpSubmit', '此微信号已被其它学号绑定，请先解绑');
                }
                else if (data == 'Wrong username or password.'){
                    showError('usernameGroup', 'helpUsername', '');
                    showError('passwordGroup', 'helpPassword', '学号或密码错误！请输入登录info的学号和密码');
                }
                else if (data == 'Unknown error.'){
                    showError('submitGroup', 'helpSubmit', '出现了奇怪的错误，我们已经记录下来了，请稍后重试。');
                }
                else if (data == 'Wrong format.'){
                    showError('submitGroup', 'helpSubmit', '信息格式错误');
                }
                else if (data == "Out of date."){
                    showError('submitGroup', 'helpSubmit', '认证过期');
                }
                else if (data == "ErrorCell"){
                    showError('submitGroup', 'helpSubmit', '手机号不合法');
                }
                else if (data == "ErrorIdentity"){
                    showError('submitGroup', 'helpSubmit', '身份证号不合法');
                }
                showLoading(false);
                disableAll(false);
            });
        });
    }
    return false;
}

function checkNotEmpty(groupid, helpid, inputid, hintName) {
    if (document.getElementById(inputid).value.trim().length == 0) {
        document.getElementById(groupid).setAttribute('class', 'form-group has-error');
        var dom = document.getElementById(helpid);
        if (browserInfo.msie)
            dom.innerText = '请输入' + hintName + '！';
        else
            dom.textContent = '请输入' + hintName + '！';
        //dom.removeAttribute('hidden');
        showElem(helpid);
        return false;
    } else {
        showSuccess(groupid, helpid);
        return true;
    }
}

function checkIsDigit(groupid, helpid, inputid, hintName) {
    if (isNaN(document.getElementById(inputid).value)) {
        document.getElementById(groupid).setAttribute('class', 'form-group has-error');
        var dom = document.getElementById(helpid);
        if (browserInfo.msie)
            dom.innerText = hintName + '必须为数字！';
        else
            dom.textContent = hintName + '必须为数字！';
        //dom.removeAttribute('hidden');
        showElem(helpid);
        return false;
    } else {
        showSuccess(groupid, helpid);
        return true;
    }
}

function checkUsername() {
    if (checkNotEmpty('usernameGroup', 'helpUsername', 'inputUsername', '学号')) {
        return checkIsDigit('usernameGroup', 'helpUsername', 'inputUsername', '学号');
    }
    return false;
}

function checkPassword() {
    return checkNotEmpty('passwordGroup', 'helpPassword', 'inputPassword', '密码');
}

function get_identity_error(idcard) {
  var Errors=['','身份证号码位数不对!','身份证号码出生日期超出范围或含有非法字符!','身份证号码校验错误!','身份证地区非法!'];
  var area={"11":"北京","12":"天津","13":"河北","14":"山西","15":"内蒙古","21":"辽宁","22":"吉林","23":"黑龙江","31":"上海",
    "32":"江苏","33":"浙江","34":"安徽","35":"福建","36":"江西","37":"山东","41":"河南","42":"湖北","43":"湖南","44":"广东",
    "45":"广西","46":"海南","50":"重庆","51":"四川","52":"贵州","53":"云南","54":"西藏","61":"陕西","62":"甘肃","63":"青海",
    "64":"宁夏","65":"新疆","71":"台湾","81":"香港","82":"澳门","91":"国外"};
  var idcard = ("" + idcard).trim();
  // 地区校验
  if (!area[idcard.substring(0,2)]) {
    return Errors[4];
  }
  // 15位身份号码检测
  if (idcard.length == 15) {
    var ereg, s6 = idcard.substring(6, 8) | 0;
    if ((s6 + 1900) % 4 == 0 || ((s6 + 1900) % 100 == 0 && (s6+1900) % 4 == 0 )) {
      ereg = new RegExp('^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}$'); //测试出生日期的合法性
    } else {
      ereg = new RegExp('^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}$'); //测试出生日期的合法性
    }
    return ereg.test(idcard) ? Errors[0] : Errors[2];
  }
  // 18位身份号码检测
  if(idcard.length == 18) {
    var ereg, s6 = idcard.substring(6, 10) | 0;
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
      function int(s) { return s | 0; }
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

function checkIdentity() {
  var val = document.getElementById("inputIdentity").value.trim();
  var err = get_identity_error(val);
  if (err) {
      document.getElementById("groupIdentity").setAttribute('class', 'form-group has-error');
      var dom = document.getElementById("helpIdentity");
      if (browserInfo.msie)
          dom.innerText = err;
      else
          dom.textContent = err;
      //dom.removeAttribute('hidden');
      showElem("helpIdentity");
      return false;
  } else {
      showSuccess("groupIdentity", "helpIdentity");
      return true;
  }
}

function checkCell() {
  var CELL_REGEXP_STR = '^1(?:[358]\\d|47|7\\d)\\d{8}$';
  var CELL_REGEXP = new RegExp(CELL_REGEXP_STR);
  var val = document.getElementById("inputCell").value.trim();
  if (!CELL_REGEXP.test(val)) {
      var hintName = "正确的手机号";
      document.getElementById("groupCell").setAttribute('class', 'form-group has-error');
      var dom = document.getElementById("helpCell");
      if (browserInfo.msie) {
          dom.innerText = '请输入' + hintName + '！';
      } else {
          dom.textContent = '请输入' + hintName + '！';
      }
      //dom.removeAttribute('hidden');
      showElem("helpCell");
      return false;
  } else {
      showSuccess("groupCell", "helpCell");
      return true;
  }
}

window.setupWeixin({'optionMenu':false, 'toolbar':false});

$(clearAllHelps);

/*
document.getElementById('inputUsername').onfocus = function(){
    setfooter();
}

document.getElementById('inputPassword').onfocus = function(){
    setfooter();
}*/

function showValidation(isValidated) {
    if (!isValidated) {
        document.getElementById('inputUsername').focus();
    } else {
        showElem('successHolder');
        hideElem('validationHolder');
    }
}
