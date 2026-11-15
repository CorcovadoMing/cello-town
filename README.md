# 弓弦小鎮 · Cello Town

把一輪大提琴練習，種成一朵花。這是獨立的單人練習遊戲，和 [弓弦的每日音階練習](https://corcovadoming.github.io/daily-key-practice/) 不共用紀錄。

- [2D 小鎮](https://corcovadoming.github.io/cello-town/)：目前正式入口。
- [3D 日光更衣室](https://corcovadoming.github.io/cello-town/3D/)：獨立測試版，程式在 [3d](https://github.com/CorcovadoMing/cello-town/tree/3d/3D)；不是整座小鎮的 3D 版。

## 2D：從練習到花園

走到老師旁接任務，再到戶外譜架練習 D 大調一個八度：聽連奏參考音、跟著節拍練習、收起提示再試。可用方向鍵、WASD、畫面方向鈕或點地圖移動。靠近互動點後按 E 或畫面按鈕。三項練習完成、向老師交付後種一朵花；這是自行確認練習，不是音準評分。

練習面板開啟時自動計時，離開面板或切到背景會暫停；交付時把時間寫進手札。花圃最多同時顯示六種花、各一朵，收藏數量另計。天氣、魚群和小動物是遊戲場景，不是即時氣象或定位資料。參考音和節拍器優先用 AudioWorklet，無法啟動時使用相容音訊路徑。

紀錄只保存在此瀏覽器的 `cello-town-rpg-v1`，不登入、不錄音、不上傳。開發模式的「清空所有紀錄」確認後不可復原，會清除花朵、手札、筆記、任務進度和計時，保留音量與速度。

## 3D：試造型和試走

固定斜視角的房間，提供臉型／神情、髮型、膚色、衣服和配件預設。可用鍵盤或觸控移動，造型儲存在獨立的 `cello-town-3d-avatar-v1`。預設使用 WebGL；無法啟用時使用同一場景的簡化 SVG 顯示。沒有完整小鎮、自由捏臉滑桿或跨裝置同步。

## 本機開發

2D 原始碼在 `rpg/`。從 repo 根目錄執行：

```sh
python3 -m http.server 8080
node --test rpg/tests/*.test.js
```

開啟 `http://localhost:8080/rpg/`。根目錄保留早期原型；GitHub Pages 發布時使用 `rpg/` 作為首頁。3D 的相依版本、建置與測試方法見 [3D 分支說明](https://github.com/CorcovadoMing/cello-town/tree/3d/3D)。程式只分兩條開發線：`main` 維護 2D，`3d` 維護 3D；任一分支推送都會重新測試並組合發布。首頁與 `/rpg/` 使用 `main` 的相同 2D 來源，`/3D/` 使用 `3d` 的 3D 來源。部署日誌記錄兩邊實際使用的提交。

## 著作權

© 2026 CorcovadoMing。對本專案中權利人持有著作權的原創內容保留所有權利。公開原始碼供閱覽，不另授予使用、修改、散布或商用的權利。法律和 GitHub 平台條款既有的權利不受影響。第三方元件各依其原授權；3D 頁面的 Three.js 依 MIT 授權，部署包附其授權文字。
