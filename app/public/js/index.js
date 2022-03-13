//ページ読み込み時に関数を実行

const indexModule = (() => {
  const path = window.location.pathname;

  switch (path) {
    case "/":
      //検索ボタンをクリックした時のイベントリスナー設定
      document.getElementById("search-btn").addEventListener("click", () => {
        return serachModule.serachUsers();
      });

      //UsersモジュールのfetchAllUsersメソッドを呼び出す
      return usersModule.fetchAllUsers();

    case "/create.html":
      //保存ボタンをクリックした時のイベントリスナー設定
      document.getElementById("save-btn").addEventListener("click", () => {
        return usersModule.createUser();
      });

      //キャンセルボタンをクリックした時のイベントリスナー設定
      document.getElementById("cancel-btn").addEventListener("click", () => {
        return (window.location.pathname = "/");
      });
      break;

    case "/edit.html":
      const uid = window.location.search.split("?uid=")[1];
      //保存ボタンをクリックした時のイベントリスナー設定
      document.getElementById("save-btn").addEventListener("click", () => {
        return usersModule.editUser(uid);
      });

      //キャンセルボタンをクリックした時のイベントリスナー設定
      document.getElementById("cancel-btn").addEventListener("click", () => {
        return (window.location.pathname = "/");
      });

      //削除ボタンをクリックした時のイベントリスナー設定
      document.getElementById("delete-btn").addEventListener("click", () => {
        return usersModule.deleteUser(uid);
      });

      return usersModule.setExistingValue(uid);

    default:
      break;
  }
})();
