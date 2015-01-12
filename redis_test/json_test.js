// module load
var http = require('http'),
    url_mod = require('url'),
    fs = require('fs'),
    ejs = require('ejs'),
    qs = require('querystring'),
    redis = require("redis"),
    socket_io_mod = require('socket.io');
var server = http.createServer(handler);
var socket_io = socket_io_mod.listen(server)
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
 * ランキング結果取得コールバック処理
 * @param _ranking_key ランキングキー名
 * @param _offset ランキング取得オフセット
 * @param _limit データ取得数
 * @param _callback コールバック関数
 */
function getRankingCallback (_ranking_key, _offset, _limit, _callback) {
    var arg1 = [ _ranking_key, _offset, _offset+_limit-1, 'WITHSCORES' ];
    redis_client.zrevrange(arg1, function (err, response) {
        if (err) {
            throw err;
        }

        // 取得したデータを整形
        var response_rank_data = [];
        for (var i=0,rank_no=_offset+1; i<response.length; i=i+2,rank_no++) {
            response_rank_data.push({"rank":rank_no, "name":response[i], "score":response[i+1]});
        }

        // 取得データを渡しコールバック関数を呼び出す
        _callback(response_rank_data);
    });
}

/**
 * ランキング結果表示(HTTP)
 */
function renderRankJson(_req, _res) {
    // クエリストリングを取得
    query_params_array = url_mod.parse(_req.url,true).query;
    // クエリストリングからランキングキー名を取得
    var ranking_key = query_params_array.rank_key;
    if(ranking_key == null) {
        // ランキングキーが指定されていない場合はエラー
        responseError(_res,500);
        return;
    }
    // ランキング取得範囲を設定
    var offset = Number(query_params_array.offset);
    var limit = Number(query_params_array.limit);
    if(offset == null || isNaN(offset)) {
        // デフォルト値
        offset = 0;
    }
    if(limit == null || isNaN(limit)) {
        // デフォルト値
        limit = 4;
    }

    // ランキングの内容をredisに問い合わせて取得
    getRankingCallback(ranking_key, offset, limit, function(response_rank_data){
        // 取得したランキングデータをJSON形式に変更
        var json_data = JSON.stringify(response_rank_data);
        _res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        _res.write(json_data);
        _res.end();
    });
}

/**
 * リアルタイムランキング結果表示(HTML+Socketio)
 */
function renderRankHtmlSocket(_req, _res) {
    // クエリストリングを取得
    query_params_array = url_mod.parse(_req.url,true).query;
    // クエリストリングからランキングキー名を取得
    var ranking_key = query_params_array.rank_key;
    if(ranking_key == null) {
        // ランキングキーが指定されていない場合はエラー
        responseError(_res,500);
        return;
    }
    // ランキング取得範囲を設定
    var offset = Number(query_params_array.offset);
    var limit = Number(query_params_array.limit);
    if(offset == null || isNaN(offset)) {
        // デフォルト値
        offset = 0;
    }
    if(limit == null || isNaN(limit)) {
        // デフォルト値
        limit = 4;
    }

    // HTMLを出力
    console.log(__dirname + '/realtime_ranking.html');
    fs.readFile(__dirname + '/realtime_ranking.html', function(err, data) {
        if (err) {
            _res.writeHead(500);
            return _res.end('Error');
        }
       _res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
       _res.write(data);
       _res.end();
    });
}

/**
 * HTTP用ランキング設定処理
 */
function execSetRankHttp(_req, _res){
    // クエリストリングを取得
    query_params_array = url_mod.parse(_req.url,true).query;
    // クエリストリングからランキングキー名を取得
    var ranking_key = query_params_array.rank_key;
    if(ranking_key == null) {
        // ランキングキーが指定されていない場合はエラー
        responseError(_res,500);
        return;
    }
    // クエリストリングからメンバー名を取得
    var member_name = query_params_array.member_name;
    if(member_name == null) {
        // メンバー名が指定されていない場合はエラー
        responseError(_res,500);
        return;
    }
    // スコアを設定
    var score = Number(query_params_array.score);
    if(score == null || isNaN(score)) {
        // スコアが指定されていない場合はエラー
        responseError(_res,500);
        return;
    }

    // redisに追加処理を実装
    var arg1 = [ ranking_key, score, member_name ];
    redis_client.zadd(arg1, function (err, response) {
        if(err) {
            throw err;
        }

        // 結果をJSON形式に変更
        var json_data = JSON.stringify({'err': err});
        _res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
        _res.write(json_data);
        _res.end();

        // ランキングデータが更新された旨を通知する
        socket_io.sockets.emit('emit_ranking_update', ranking_key);
    });
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
function handler(req, res) {
    // アクセスURL部分を取得
    var request_pathname = url_mod.parse(req.url,true).pathname;
    // アクセスURLによって処理を分ける
    if (request_pathname == '/get_rank_json_http') {
        // HTTP用のJSONランキングデータ取得処理
        renderRankJson(req, res);
    } else if (request_pathname == '/get_rank_html_websocket') {
        // TODO socketioを使用したHTML形式のリアルタイムランキング
        renderRankHtmlSocket(req, res);
    } else if (request_pathname == '/set_rank_http') {
        // HTTP用のランキング追加処理を実装
        execSetRankHttp(req, res);
    } else {
        console.log("リクエストデータ"+req);
        // ページが存在しない
        //responseError(res, "404");
    }
}


/**
 * ソケット接続処理
 */
socket_io.sockets.on('connection', function(socket) {
    // ランキングリクエスト処理発光のイベント処理
    socket.on('emit_ranking_request', function(ranking_key, offset, limit) {
        //console.log(data);
        // 接続しているソケットのみ
        //socket.emit('emit_from_server', 'hello from server: ' + data);
        // 接続しているソケット以外全部
        //socket.broadcast.emit('emit_from_server', 'hello from server: ' + data);
        // 接続しているソケット以外全部

        if(ranking_key == null) {
            return;
        }
        // ランキング取得範囲を設定
        if(offset == null || isNaN(offset)) {
            // デフォルト値
            offset = 0;
        }
        if(limit == null || isNaN(limit)) {
            // デフォルト値
            limit = 4;
        }
       
        // TODO ランキングデータを取得して接続クライアントに通知
        // ランキングの内容をredisに問い合わせて取得
        getRankingCallback(ranking_key, offset, limit, function(response_rank_data){
            // 取得したランキングデータをJSON形式に変更
            var json_data = JSON.stringify(response_rank_data);
            socket_io.sockets.emit('emit_push_ranking', response_rank_data);
        });
    });
});

// 指定ホスト名と指定ポートでコネクションの受け入れ開始
server.listen(port, host);
console.log("server listening ...");

