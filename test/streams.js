var Future = Npm.require('fibers/future');
var Fibers = Npm.require('fibers');

function Stream(name) {
  this.name = name;
  this.emitToSubscriptions;
}

function runInFiber(callback) {
  Fibers(callback).run();
}

Tinytest.addAsync('stream to redis', function(test, done) {
  var f = new Future();
  var cluster = new Meteor.Cluster.constructor();
  Meteor.Stream = Stream;
  var stream = new Meteor.Stream('hello');

  var args = ['env', {a: 10}];
  var subscriptionId = 'subscription-1';
  var userId = 'user-1';

  var redisClient = Meteor._createRedisClient();
  redisClient.on('subscribe', function() {
    f.ret();
  })
  redisClient.subscribe('streams');
  f.wait();
  
  cluster.init();
  cluster.sync(stream);

  redisClient.on('message', function(channel, message) {
    runInFiber(function() {
      var parseMessage = JSON.parse(message);
      test.equal(channel, 'streams');
      test.equal(parseMessage[1], stream.name);
      test.equal(parseMessage[2][0], args[0]);
      test.equal(parseMessage[3], subscriptionId);
      test.equal(parseMessage[4], userId);

      redisClient.end();
      cluster.close();
      done();
    });
  });

  stream.firehose(args, subscriptionId, userId);
});

Tinytest.addAsync('redis to stream', function(test, done) {
  var f = new Future();
  var cluster = new Meteor.Cluster.constructor();
  Meteor.Stream = Stream;
  var stream = new Meteor.Stream('hello');

  var args = ['env', {a: 10}];
  var subscriptionId = 'subscription-1';
  var userId = 'user-1';

  var redisClient = Meteor._createRedisClient();
  cluster.init();
  cluster.sync(stream);

  stream.emitToSubscriptions = function(_args, _subscriptionId, _userId) {
    runInFiber(function() {
      test.equal(_args[0], 'env');
      test.equal(_subscriptionId, subscriptionId);
      test.equal(_userId, userId);

      redisClient.end();
      cluster.close();
      done();
    });
  };

  var payload = ['fakeServerId', stream.name, args, subscriptionId, userId];
  setTimeout(function() {
    redisClient.publish('streams', JSON.stringify(payload));
  }, 50);
});
