/**
 * 4 位數幾 A 幾 B 猜數字遊戲 v4 - 後端程式碼 (Code.gs)
 */

const SPREADSHEET_NAME = "數位科技概論｜幾A幾B遊戲存檔v4";

// 取得當前 Google 帳號 Email
function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

// 取得或建立玩家個人的雲端試算表存檔
function getOrCreateUserSpreadsheet() {
  const email = getUserEmail();
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  let ss;

  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
    const sheet = ss.getActiveSheet();
    sheet.setName("遊戲紀錄");
    sheet.appendRow(["局數", "謎底", "狀態", "開始時間", "結束時間", "猜測歷程JSON"]);
    sheet.getRange("A1:F1").setFontWeight("bold");
  }

  return {
    spreadsheetId: ss.getId(),
    url: ss.getUrl(),
    email: email
  };
}

// 從試算表讀取遊戲資料
function loadGameDataFromSheet(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName("遊戲紀錄") || ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, games: [] };
    }

    const games = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let guesses = [];
      try {
        guesses = JSON.parse(row[5] || "[]");
      } catch (e) {
        guesses = [];
      }

      games.push({
        id: Number(row[0]),
        secret: String(row[1]),
        status: String(row[2]),
        startTime: String(row[3]),
        endTime: String(row[4]),
        guesses: guesses
      });
    }

    return { success: true, games: games };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// 儲存或更新當前局遊戲資料至試算表
function saveGameDataToSheet(spreadsheetId, gameData) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName("遊戲紀錄") || ss.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === Number(gameData.id)) {
        targetRowIndex = i + 1;
        break;
      }
    }

    const guessesJson = JSON.stringify(gameData.guesses || []);

    if (targetRowIndex !== -1) {
      // 更新舊有局數
      sheet.getRange(targetRowIndex, 3).setValue(gameData.status);
      sheet.getRange(targetRowIndex, 5).setValue(gameData.endTime || "");
      sheet.getRange(targetRowIndex, 6).setValue(guessesJson);
    } else {
      // 新增一局
      sheet.appendRow([
        gameData.id,
        "'" + gameData.secret, // 補單引號避免 0 開頭被自動修掉
        gameData.status,
        gameData.startTime,
        gameData.endTime || "",
        guessesJson
      ]);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// 提供 doGet 以正確顯示 HTML 頁面
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('4 位數幾 A 幾 B 猜數字遊戲 v4')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}