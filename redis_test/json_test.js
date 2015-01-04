// module load
var http = require('http'),
    url_mod = require('url'),
    fs = require('fs'),
    ejs = require('ejs'),
    qs = require('querystring'),
    redis = require("redis"),
    socket_io = require('socket.io').listen(http);
var server = http.createServer();
var redis_client = redis.createClient();
var host = '192.168.33.10';
var port = 1337;
// TODO ejsテンプレートの読み込み(サンプルなので不要なら削除)
var docRoot = '/vagrant/public_html'
var template = fs.readFileSync(docRoot + '/bbs.ejs', 'utf-8');

/**
 * redisクライアントエラーイベント
 */
redis_client.on("error", function (err) {
    console.log("Error " + err);
});

/**
 * ランキングタイプ
 */
function getRankingData(ranking_key) {
    // TODO ランキングデータの作成
    var min = 0;
    var max = 10;
    var response_data = null;
    // TODO redisからソート済みセットを取得する
    var arg1 = [ ranking_key, max, min, 'WITHSCORES'];
    console.log('arg1=' + arg1);
    redis_client.zrevrange(arg1, function (err, response) {
        if (err) {
            throw err;
        }
        console.log('zrevrange :' + response);
        response_data = response;
    });
}

/**
 * ランキング結果表示(HTTP)
 */
function renderRankJson(_req, _res) {
    var test_array = { key_1: 'あ行', key_2: 'か行' };
    // クエリストリングを取得
    query_params_array = url_mod.parse(_req.url,true).query;
    // クエリストリングからランキングキー名を取得
    var ranking_key = query_params_array.rank_key;
    if(ranking_key == null) {
        // ランキングキーが指定されていない場合はエラー
        responseError(_res,500);
    }
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
    console.log(url_mod.parse(req.url,true));
    // アクセスURL部分を取得
    var request_pathname = url_mod.parse(req.url,true).pathname;
    // アクセスURLによって処理を分ける
    if (request_pathname == '/get_rank_json_http') {
        // HTTP用のJSONランキングデータ取得処理
        renderRankJson(req, res);
    } else if (request_pathname == '/get_rank_json_websocket') {
        // TODO WebSocket用のランキングデータ取得処理
    } else if (request_pathname == '/set_rank_http') {
        // TODO HTTP用のランキング追加処理を実装
    } else if (request_pathname == '/set_rank_websocket') {
        // TODO WebSocket用のランキング追加処理を実装
    } else {
        // ページが存在しない
        responseError(res, "404");
    }
});

// 指定ホスト名と指定ポートでコネクションの受け入れ開始
server.listen(port, host);
console.log("server listening ...");

