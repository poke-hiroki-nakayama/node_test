var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});

client.set("test", "うひょー");

client.get("test", function(err, data){
    console.log(data);
});

var args = [ 'myzset', 2, 'two', 3, 'three', 1, 'one' , 99, 'ninety-nine' ];
client.zadd( args, function (err, response) {
    if (err) throw err;
    console.log('added ' + response + ' items.');
});

var args1 = [ 'myzset', 0, 10, 'WITHSCORES' ];
client.zrange(args1, function (err, response) {
    if (err) throw err;
    console.log('example1', response);
});

var max = 3, min= 1, offset = 1, count = 2;
var args2 = [ 'myzset', max, min, 'WITHSCORES', 'LIMIT', offset, count ];
client.zrevrangebyscore(args2, function (err, response) {
    if (err) throw err;
    console.log('example2', response);
});
