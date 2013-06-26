var Future  = Npm.require('fibers/future');

Tinytest.add('update and subscribe', function(test) {
  var f = new Future();
  var cluster = new Meteor.Cluster.constructor();
  var pubClient = Meteor._createRedisClient();

  var collName = Random.id();
  var syncColl = new Meteor.Collection(collName);

  var orginalUpdate = syncColl.update;
  var updatingIds = [];
  syncColl.update = function(query, updateString) {
    updatingIds.push(query._id);
    orginalUpdate.call(syncColl, query, updateString);
    if(updatingIds.length == 2) {
      f.ret();
    }
  };

  syncColl.insert({_id: "1", room: 10});
  syncColl.insert({_id: "2", room: 10});

  cluster.onsubscribe = function() {
    f.ret();
  };
  cluster.init();
  cluster.sync(syncColl);
  f.wait();

  var json = [
    "server-id",
    collName,
    'update',
    [{room: 10}]
  ];

  pubClient.publish('collections', JSON.stringify(json));
  f = new Future();
  f.wait();
  test.equal(updatingIds[0], "1");
  test.equal(updatingIds[1], "2");

  cluster.close();
  pubClient.end();
});