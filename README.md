# 弓弦小鎮 · Cello Town

把一輪大提琴練習，種成一朵花。這是獨立的單人練習遊戲，和 [弓弦的每日音階練習](https://corcovadoming.github.io/daily-key-practice/) 不共用紀錄。

- [2D 小鎮](https://corcovadoming.github.io/cello-town/)：目前正式入口。
- [3D 日光更衣室](https://corcovadoming.github.io/cello-town/3D/)：正式版琴房，程式在 [main/3D](https://github.com/CorcovadoMing/cello-town/tree/main/3D)；不是整座小鎮的 3D 版。

## 2D：從練習到花園

走到老師旁接任務，再到戶外譜架練習 D 大調一個八度：聽連奏參考音、跟著節拍練習、收起提示再試。可用方向鍵、WASD、畫面方向鈕或點地圖移動。靠近互動點後按 E 或畫面按鈕。三項練習完成、向老師交付後種一朵花；這是自行確認練習，不是音準評分。

練習面板開啟時自動計時，離開面板或切到背景會暫停；交付時把時間寫進手札。花圃最多同時顯示六種花、各一朵，收藏數量另計。天氣、魚群和小動物是遊戲場景，不是即時氣象或定位資料。參考音和節拍器優先用 AudioWorklet，無法啟動時使用相容音訊路徑。

紀錄只保存在此瀏覽器的 `cello-town-rpg-v1`，不登入、不錄音、不上傳。開發模式的「清空所有紀錄」確認後不可復原，會清除花朵、手札、筆記、任務進度和計時，保留音量與速度。

## 3D：試造型和試走

固定斜視角的房間，提供臉型／神情、髮型、膚色、衣服和配件預設。可用鍵盤或觸控移動，造型儲存在獨立的 `cello-town-3d-avatar-v1`。預設使用 WebGL；無法啟用時使用同一場景的簡化 SVG 顯示。沒有完整小鎮、自由捏臉滑桿或跨裝置同步。

## 本機開發

2D 原始碼在 `rpg/`。從 repo 根目錄執行：

```sh
python3 -m http.server 8080 --directory rpg
node --test rpg/tests/*.test.js
```

開啟 `http://localhost:8080/`。根目錄保留早期原型；GitHub Pages 發布時使用 `rpg/` 作為首頁。3D 的相依版本、建置與測試方法見 [3D 說明](3D/README.md)。`main` 同時維護正式版 2D (`rpg/`) 和 3D (`3D/`)；`experimental` 保存完整獨立實驗版本。舊 `3d` 分支保留作歷史回復，不再參與部署。

- 正式版：`/cello-town/`、`/cello-town/3D/`，網址及本機紀錄不變。
- 實驗版：`/cello-town/experimental/`、`/cello-town/experimental/3D/`，使用獨立實驗紀錄。

`main` 推送或成功的「Verify experimental branch」會啟動 main 的 Pages publisher。它在同一佇列內取得、記錄並完整測試兩個分支快照，一起產出四個路徑；任一失敗都不替換現有網站。只有 main 的部署工作有 Pages 寫入權限；測試工作只有內容讀取權限。不需要新增 token 或變更 Pages 設定。

本機組合：先在兩個來源執行 `bash scripts/verify-snapshot.sh SOURCE`，再從 main 執行 `node scripts/package-pages.mjs STABLE EXPERIMENTAL OUTPUT`；OUTPUT 必須不存在。從 OUTPUT 啟動靜態伺服器。

## 著作權

© 2026 CorcovadoMing。對本專案中權利人持有著作權的原創內容保留所有權利。公開原始碼供閱覽，不另授予使用、修改、散布或商用的權利。法律和 GitHub 平台條款既有的權利不受影響。第三方元件各依其原授權；3D 頁面的 Three.js 依 MIT 授權，部署包附其授權文字。
