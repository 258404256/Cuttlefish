/*
！！！！20200925 glados改变策略，只能绑定TG进行签到，因此本脚本不再适用自动化签到！！！！

注册地址：https://github.com/glados-network/GLaDOS

激活码：QHU6W-Q7UDJ-N4CHO-HCUGU

注意事项：首先使用Gmail注册，然后升级成edu邮箱，即可白嫖一年魔法，每个月的魔法流量有50G

此脚本的用处：执行自动化签到，延长会员期限，不至于会员过期

登陆链接：https://glados.rocks/，登陆即可获取Cookie。

[rewrite_local]
https:\/\/glados\.rocks\/api\/user\/status url script-request-header https://raw.githubusercontent.com/ddgksf2013/Cuttlefish/master/Script/glados.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/ddgksf2013/Cuttlefish/master/Script/glados.js

hostname = glados.rocks
*/

const $ = new Env("GLaDOS");
const signcookie = "evil_gladoscookie";

var sicookie = $.getdata(signcookie);
var account;
var expday;
var remain;
var remainday;
var change;
var msge;
var message = [];

!(async () => {
  if (typeof $request != "undefined") {
    getCookie();
    return;
  }
  await signin();
  await status();
  $.done();
})()
  .catch(e => {
    $.log("", `❌失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function signin() {
  return new Promise(resolve => {
    const signinRequest = {
      url: "https://glados.rocks/api/user/checkin",
      headers: { Cookie: sicookie }
    };
    $.post(signinRequest, (error, response, data) => {
      var body = response.body;
      var obj = JSON.parse(body);
      if (obj.code == 0) {
        change = obj.list[0].change;
        changeday = parseInt(change);
        msge = obj.message;
        if (msge == "Please Checkin Tomorrow") {
          message.push("今日已签到");
        } else {
          message.push(`签到获得${changeday}天`);
        }
      }
      resolve();
    });
  });
}

function status() {
  return new Promise(resolve => {
    const statusRequest = {
      url: "https://glados.rocks/api/user/status",
      headers: { Cookie: sicookie }
    };
    $.get(statusRequest, (error, response, data) => {
      var body = response.body;
      var obj = JSON.parse(body);
      if (obj.code == 0) {
        account = obj.data.email;
        expday = obj.data.days;
        remain = obj.data.leftDays;
        remainday = parseInt(remain);
        message.push(`已用${expday}天,剩余${remainday}天`);
        $.msg("GLaDOS", `账户：${account}`, message);
      } else {
        $.log(response)
        $.msg("GLaDOS", "", "❌请重新登陆更新Cookie");
      }
      resolve();
    });
  });
}

function getCookie() {
  if (
    $request &&
    $request.method != "OPTIONS" &&
    $request.url.match(/status/)
  ) {
    const sicookie = $request.headers["Cookie"];
    $.log(sicookie);
    $.setdata(sicookie, signcookie);
    $.msg("GLaDOS", "", "获取签到Cookie成功🎉");
  }
}

//chavyleung
function Env(s) {
  (this.name = s),
    (this.data = null),
    (this.logs = []),
    (this.isSurge = () => "undefined" != typeof $httpClient),
    (this.isQuanX = () => "undefined" != typeof $task),
    (this.isNode = () => "undefined" != typeof module && !!module.exports),
    (this.log = (...s) => {
      (this.logs = [...this.logs, ...s]),
        s ? console.log(s.join("\n")) : console.log(this.logs.join("\n"));
    }),
    (this.msg = (s = this.name, t = "", i = "") => {
      this.isSurge() && $notification.post(s, t, i),
        this.isQuanX() && $notify(s, t, i);
      const e = [
        "",
        "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="
      ];
      s && e.push(s), t && e.push(t), i && e.push(i), console.log(e.join("\n"));
    }),
    (this.getdata = s => {
      if (this.isSurge()) return $persistentStore.read(s);
      if (this.isQuanX()) return $prefs.valueForKey(s);
      if (this.isNode()) {
        const t = "box.dat";
        return (
          (this.fs = this.fs ? this.fs : require("fs")),
          this.fs.existsSync(t)
            ? ((this.data = JSON.parse(this.fs.readFileSync(t))), this.data[s])
            : null
        );
      }
    }),
    (this.setdata = (s, t) => {
      if (this.isSurge()) return $persistentStore.write(s, t);
      if (this.isQuanX()) return $prefs.setValueForKey(s, t);
      if (this.isNode()) {
        const i = "box.dat";
        return (
          (this.fs = this.fs ? this.fs : require("fs")),
          !!this.fs.existsSync(i) &&
            ((this.data = JSON.parse(this.fs.readFileSync(i))),
            (this.data[t] = s),
            this.fs.writeFileSync(i, JSON.stringify(this.data)),
            !0)
        );
      }
    }),
    (this.wait = (s, t = s) => i =>
      setTimeout(() => i(), Math.floor(Math.random() * (t - s + 1) + s))),
    (this.get = (s, t) => this.send(s, "GET", t)),
    (this.post = (s, t) => this.send(s, "POST", t)),
    (this.send = (s, t, i) => {
      if (this.isSurge()) {
        const e = "POST" == t ? $httpClient.post : $httpClient.get;
        e(s, (s, t, e) => {
          t && ((t.body = e), (t.statusCode = t.status)), i(s, t, e);
        });
      }
      this.isQuanX() &&
        ((s.method = t),
        $task.fetch(s).then(
          s => {
            (s.status = s.statusCode), i(null, s, s.body);
          },
          s => i(s.error, s, s)
        )),
        this.isNode() &&
          ((this.request = this.request ? this.request : require("request")),
          (s.method = t),
          (s.gzip = !0),
          this.request(s, (s, t, e) => {
            t && (t.status = t.statusCode), i(null, t, e);
          }));
    }),
    (this.done = (s = {}) => (this.isNode() ? null : $done(s)));
}
