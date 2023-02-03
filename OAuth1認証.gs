// 最初にこの関数を実行し、ログに出力されたURLにアクセスしてOAuth認証する
function twitterAuthorizeUrl() {
  Twitter.oauth.showUrl();
}

// OAuth認証成功後のコールバック関数
function twitterAuthorizeCallback(request) {
  return Twitter.oauth.callback(request);
}

// OAuth認証のキャッシュをを削除する場合はこれを実行（実行後は再度認証が必要）
function twitterAuthorizeClear() {
  Twitter.oauth.clear();
}


var Twitter = {
  projectKey: "****",
  
  consumerKey: "****",
  consumerSecret: "****",
  
  apiUrl: "https://api.twitter.com/1.1/",
  
  oauth: {
    name: "twitter",
    
    service: function(screen_name) {
      // 参照元：https://github.com/googlesamples/apps-script-oauth2
      
      return OAuth1.createService(this.name)
      // Set the endpoint URLs.
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
      
      // Set the consumer key and secret.
      .setConsumerKey(this.parent.consumerKey)
      .setConsumerSecret(this.parent.consumerSecret)
      
      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('twitterAuthorizeCallback')
      
      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties());
    },
    
    showUrl: function() {
      var service = this.service();
      if (!service.hasAccess()) {
        Logger.log(service.authorize());
      } else {
        Logger.log("認証済みです");
      }
    },
    
    callback: function (request) {
      var service = this.service();
      var isAuthorized = service.handleCallback(request);
      if (isAuthorized) {
        return HtmlService.createHtmlOutput("認証に成功しました！このタブは閉じてかまいません。");
      } else {
        return HtmlService.createHtmlOutput("認証に失敗しました・・・");
      }
    },
    
    clear: function(){
      OAuth1.createService(this.name)
      .setPropertyStore(PropertiesService.getUserProperties())
      .reset();
    }
  },
  
  api: function(path, data) {
    var that = this, service = this.oauth.service();
    if (!service.hasAccess()) {
      Logger.log("先にOAuth認証してください");
      return false;
    }
    
    path = path.toLowerCase().replace(/^\//, '').replace(/\.json$/, '');
    
    var method = (
         /^statuses\/(destroy\/\d+|update|retweet\/\d+)/.test(path)
      || /^media\/upload/.test(path)
      || /^direct_messages\/(destroy|new)/.test(path)
      || /^friendships\/(create|destroy|update)/.test(path)
      || /^account\/(settings|update|remove)/.test(path)
      || /^blocks\/(create|destroy)/.test(path)
      || /^mutes\/users\/(create|destroy)/.test(path)
      || /^favorites\/(destroy|create)/.test(path)
      || /^lists\/[^\/]+\/(destroy|create|update)/.test(path)
      || /^saved_searches\/(create|destroy)/.test(path)
      || /^geo\/place/.test(path)
      || /^users\/report_spam/.test(path)
      ) ? "post" : "get";
    
    var url = this.apiUrl + path + ".json";
    var options = {
      method: method,
      muteHttpExceptions: true
    };
    
    if ("get" === method) {
      if (!this.isEmpty(data)) {
        url += '?' + Object.keys(data).map(function(key) {
          return that.encodeRfc3986(key) + '=' + that.encodeRfc3986(data[key]);
        }).join('&');
      }
    } else if ("post" == method) {
      if (!this.isEmpty(data)) {
        options.payload = Object.keys(data).map(function(key) {
          return that.encodeRfc3986(key) + '=' + that.encodeRfc3986(data[key]);
        }).join('&');
        
        if (data.media) {
          options.contentType = "multipart/form-data;charset=UTF-8";
        }
      }
    }

    try {
      var result = service.fetch(url, options);
      var json = JSON.parse(result.getContentText());
      if (json) {
        if (json.error) {
          throw new Error(json.error + " (" + json.request + ")");
        } else if (json.errors) {
          var err = [];
          for (var i = 0, l = json.errors.length; i < l; i++) {
            var error = json.errors[i];
            err.push(error.message + " (code: " + error.code + ")");
          }
          throw new Error(err.join("\n"));
        } else {
          return json;
        }
      }
    } catch(e) {
      this.error(e);
    }
    
    return false;
  },
  
  error: function(error) {
    var message = null;
    if ('object' === typeof error && error.message) {
      message = error.message + " ('" + error.fileName + '.gs:' + error.lineNumber +")";
    } else {
      message = error;
    }
    
    Logger.log(message);
  },
  
  isEmpty: function(obj) {
    if (obj == null) return true;
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  },
  
  encodeRfc3986: function(str) {
    return encodeURIComponent(str).replace(/[!'()]/g, function(char) {
      return escape(char);
    }).replace(/\*/g, "%2A");
  },
  
  init: function() {
    this.oauth.parent = this;
    return this;
  }
}.init();
