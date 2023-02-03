var sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("touhou");
var sheetData2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("手動");


// 自動ツイート
function postUpdateTweet() {
  var cells = sheetData.getRange(2, 2, sheetData.getLastRow() - 1, 2).getValues();
  var randomValue = Math.random();

  var postMessage = "";
  for (var i = 0, il = cells.length; i < il; i++ ) {
    randomValue -= cells[i][1] / 100;
    if (randomValue < 0) {
      postMessage = cells[i][0];
      console.log(i);
      break;
    }
  }
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json', {
    method: 'post',
    payload: { status: postMessage }
  });
}


//　手動ツイート
function postTweet() {
  var tweet = sheetData2.getRange('C4').getValue();
  var tweetid = sheetData2.getRange('C2').getValue();
  var user = sheetData2.getRange('B2').getValue();
  var option = {
    "status":user+" " +tweet,
    "in_reply_to_status_id": tweetid
  }

  Twitter.api("statuses/update",option);
}
