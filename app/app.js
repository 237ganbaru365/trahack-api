//requireでexpressを入れる
const express = require("express");
//appにexpressを実行して代入
const app = express();
//requireでsqlite3を入れる
const sqlite3 = require("sqlite3");
//pathはpath指定用の組み込みモジュール
const path = require("path");
const bodyParser = require("body-parser");
const { resolve } = require("path");
const { rejects } = require("assert");
const dbPath = "app/db/database.sqlite3";

//リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//path.joinで第一引数のディレクトリとpathを繋げる
//__dirnameが、app.jsがいるディレクトリを指定。その中のpublicを静的ファイルとして扱えるようになる
app.use(express.static(path.join(__dirname, "public")));

//expressのGETメソッドを投げた時に実行する関数(=api)をつくる
//この構文は覚えておこう！
//=>　　第一引数に先に設計したURIを記述
//=> 第二引数にreq,resの二つの引数を持つアロー関数を記述し、resがもつjsonメソッドの中を書いて何を返すかを記述
app.get("/api/v1/users", (req, res) => {
  //Connect database
  const db = new sqlite3.Database(dbPath);

  //第一引数にはsql構文を記入、これは形があるから必要に応じて覚えておこう！
  //第二引数にコールバック関数を入れる、その引数にはerrとrows
  db.all("SELECT * FROM users", (err, rows) => {
    //もしも正しくデータ（rows）を取得できた場合、json形式に変換してデータを取得
    res.json(rows);
  });

  //dbに接続した後は必ず最後に解除する
  db.close();
});

//Get a user
app.get("/api/v1/users/:id", (req, res) => {
  //Connect database
  const db = new sqlite3.Database(dbPath);
  //paramsを使用することで動的にidを取得できる
  const id = req.params.id;

  //バッククオーテーションでsql文を囲うことによってJS文を使用できる
  //WHEREを記載することで指定したidのdataを取得することができる
  db.get(`SELECT * FROM users WHERE id = ${id}`, (err, row) => {
    if (!row) {
      res.status(404).send({ error: "Not Found!" });
    } else {
      res.status(200).json(row);
    }
  });

  //Disconnect database
  db.close();
});

//Get followimg users
app.get("/api/v1/users/:id/following", (req, res) => {
  //Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  db.all(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${id}`,
    (err, rows) => {
      if (!rows) {
        res.status(404).send({ error: "Not Found!" });
      } else {
        res.status(200).json(rows);
      }
    }
  );

  db.close();
});

//Search users matching keyword
app.get("/api/v1/search", (req, res) => {
  //Connect database
  const db = new sqlite3.Database(dbPath);
  //queryを使うことで、.以下に入ってくる任意の定数の値を取得できる
  const keyword = req.query.q;

  //バッククオーテーションでsql文を囲うことによってJS文を使用できる
  //WHERE name LIKE ""<-今回文字列を使用するためダブルクオーテーション
  //"%%"<- 部分一致で検索することができる
  db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err, rows) => {
    res.json(rows);
  });

  //Disconnect database
  db.close();
});

//post,put,deleteで共通
const run = async (sql, db) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
};

//Create a new user
app.post("/api/v1/users", async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" });
  } else {
    //Connect database
    const db = new sqlite3.Database(dbPath);

    const name = req.body.name;
    const profile = req.body.profile ? req.body.profile : "";
    const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : "";

    try {
      await run(
        `INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
        db
      );
      res.status(201).send({ message: "新規ユーザーを作成しました！" });
    } catch (e) {
      res.status(500).send({ error: e });
    }
    db.close();
  }
});

//Update user data
app.put("/api/v1/users/:id", async (req, res) => {
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" });
  } else {
    //Connect database
    const db = new sqlite3.Database(dbPath);
    const id = req.params.id;

    //現在のユーザー情報を取得する
    db.get(`SELECT * FROM users WHERE id=${id}`, async (err, row) => {
      if (!row) {
        res.status(404).send({ error: "指定されたユーザーが見つかりません。" });
      } else {
        const name = req.body.name ? req.body.name : row.name;
        const profile = req.body.profile ? req.body.profile : row.profile;
        const dateOfBirth = req.body.date_of_birth
          ? req.body.date_of_birth
          : row.date_of_birth;
        try {
          await run(
            `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id=${id}`,
            db
          );
          res.status(200).send({ message: "ユーザーを編集しました！" });
        } catch (error) {
          res.status(500).send({ error: error });
        }
      }
    });

    db.close();
  }
});

//Delete user data
app.delete("/api/v1/users/:id", async (req, res) => {
  //Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  //現在のユーザー情報を取得する
  db.get(`SELECT * FROM users WHERE id=${id}`, async (err, row) => {
    if (!row) {
      res.status(404).send({ error: "指定されたユーザーが見つかりません。" });
    } else {
      try {
        await run(`DELETE FROM users WHERE id=${id}`, db);
        res.status(200).send({ message: "ユーザーを削除しました！" });
      } catch (error) {
        res.status(500).send({ error: error });
      }
    }
  });

  db.close();
});

//ローカル環境変数を参照するのが、process.env
//もしもユーザーがローカル環境変数を指定しなければ3000を使用
const port = process.env.PORT || 3000;
app.listen(port);
console.log("Listen on port: ", port);
