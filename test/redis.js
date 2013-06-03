var Future = Npm.require('fibers/future');

Tinytest.add('without env variable CLUSTER_URL', function(test) {
  var connObj = Meteor._parseRedisEnvUrl();
  test.equal(connObj, null);
});

Tinytest.add('invalid env variable CLUSTER_URL', function(test) {
  process.env.CLUSTER_URL = "invalid-url";
  try {
    var connObj = Meteor._parseRedisEnvUrl();
    test.equal(connObj, null);
    test.ok(false);
  } catch(ex) {
      delete process.env.CLUSTER_URL;
  }
});

Tinytest.add('parse correct redis url', function(test) {
  process.env.CLUSTER_URL = "redis://redis:pass@hostname:9389";
  var connObj = Meteor._parseRedisEnvUrl();
  test.equal(connObj.host, "hostname");
  test.equal(connObj.port, 9389);
  test.equal(connObj.auth, "pass");
  delete process.env.CLUSTER_URL;
});

Tinytest.add('redisConfToString with empty object', function(test) {
  var conn = {};
  var str = Meteor._redisConfToString(conn);
  test.equal(str, 'localhost:6379');
});

Tinytest.add('redisConfToString without auth', function(test) {
  var conn = {host: 'localhost', port: 8900};
  var str = Meteor._redisConfToString(conn);
  test.equal(str, 'localhost:8900');
});

Tinytest.add('redisConfToString with auth', function(test) {
  var conn = {host: 'localhost', port: 8900, auth: 'abc'};
  var str = Meteor._redisConfToString(conn);
  test.equal(str, 'redis:abc@localhost:8900');
});