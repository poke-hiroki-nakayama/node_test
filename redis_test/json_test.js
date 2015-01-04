// module load
var http = require('http'),
    fs = require('fs'),
    ejs = require('ejs'),
    qs = require('querystring'),
    redis = require("redis"),
    socket_io = require('socket.io').listen(http);
var server = http.createServer();
var host = '192.168.33.10';
var port = 1337;
// TODO ejsテンプレートの読み込み(サンプルなので不要なら削除)
var docRoot = '/vagrant/public_html'
var template = fs.readFileSync(docRoot + '/bbs.ejs', 'utf-8');

/**
 * ランキングタイプ
 */
function getRankingData(ranking_key) {

}

/**
 * ランキング結果表示(HTTP)
 */
function renderRankJson(req, _res) {
    var test_array = { key_1: 'あ行', key_2: 'か行' };
    // クエリストリングからランキングキー名を取得
    var ranking_key = '';
    // TODO ランキングの内容をredisに問い合わせて取得
    var ranking_data_array = getRankingData(ranking_key);
    // TODO 取得したランキングデータをJSON形式に変更
    var json_data = JSON.stringify(test_array);
    _res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    _res.write(json_data);
    _res.end();
}

/**
 * エラーレスポンス
 */
function responseError(_res, _errorCode) {
    _res.writeHead(_errorCode, {'Content-Type': 'text/html; charset=utf-8'});
    _res.write("");
    _res.end();
}

/**
 * HTTPリクエストが来た場合のイベントメソッド
 */
server.on('request', function(req, res) {
    console.log("リクエスト:"+req.url);
    console.log(req);
    // アクセスURLによって処理を分ける
    if (req.url == '/get_rank_json_http') {
        // それ以外(GET)の場合
        renderRankJson(req, res);
    } else if (req.url == '/get_rank_json_websocket') {
        // TODO WebSocket用のレスポンス処理を追加
    } else if (req.url == '/set_rank_http') {
        // TODO HTTP用のランキング追加処理を実装
    } else if (req.url == '/set_rank_websocket') {
        // TODO WebSocket用のランキング追加処理を実装
    } else {
        // ページが存在しない
        responseError(res, "404");
    }
});

// 指定ホスト名と指定ポートでコネクションの受け入れ開始
server.listen(port, host);
console.log("server listening ...");

