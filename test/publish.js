var Future = Npm.require('fibers/future');

Tinytest.add('insert and publish', function(test) {
    var f = new Future();
    var cluster = new Meteor.Cluster.constructor();
    var coll = new Meteor.Collection(Random.id());

    var redisClient = Meteor._createRedisClient();
    redisClient.on('subscribe', function() {
        f.ret();
    })
    redisClient.subscribe('meteor');
    f.wait();
    
    cluster.init();
    cluster.sync(coll);

    var args;
    redisClient.on('message', function(channel, message) {
        args = JSON.parse(message);
        f.ret();
    })
    var doc = {_id: "abc", name: "arunoda"};
    coll.insert(doc);
    f = new Future();
    f.wait();

    test.equal(args[1], coll._name);
    test.equal(args[2], 'insert');
    test.equal(args[3][0]._id, doc._id);
    test.equal(_.keys(args[3][0]), ['_id']);

    redisClient.end();
    cluster.close();
});

Tinytest.add('update and publish', function(test) {
    var f = new Future();
    var cluster = new Meteor.Cluster.constructor();
    var coll = new Meteor.Collection(Random.id());

    var redisClient = Meteor._createRedisClient();
    redisClient.on('subscribe', function() {
        f.ret();
    })
    redisClient.subscribe('meteor');
    f.wait();
    
    cluster.init();
    cluster.sync(coll);

    var query = {name: 'hello'};
    var set = {$set: {room: 23}};
    var args;
    redisClient.on('message', function(channel, message) {
        args = JSON.parse(message);
        f.ret();
    })
    coll.update(query, set);
    f = new Future();
    f.wait();

    test.equal(args[1], coll._name);
    test.equal(args[2], 'update');
    test.equal(args[3][0].name, query.name);
    test.equal(args[3][1]['$set'].room, set['$set'].room);
    
    redisClient.end();
    cluster.close();
});

Tinytest.add('remove and publish', function(test) {
    var f = new Future();
    var cluster = new Meteor.Cluster.constructor();
    var coll = new Meteor.Collection(Random.id());

    var redisClient = Meteor._createRedisClient();
    redisClient.on('subscribe', function() {
        f.ret();
    })
    redisClient.subscribe('meteor');
    f.wait();
    
    cluster.init();
    cluster.sync(coll);

    var query = {name: 'hello'};
    var args;
    redisClient.on('message', function(channel, message) {
        args = JSON.parse(message);
        f.ret();
    })
    coll.remove(query);
    f = new Future();
    f.wait();

    test.equal(args[1], coll._name);
    test.equal(args[2], 'remove');
    test.equal(args[3][0].name, query.name);
    
    redisClient.end();
    cluster.close();
});