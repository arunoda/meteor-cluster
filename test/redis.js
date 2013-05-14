var Future = Npm.require('fibers/future');

Tinytest.add('without env variable REDIS_URL', function(test) {

    var connObj = Meteor._parseRedisEnvUrl();
    test.equal(connObj, null);
});

Tinytest.add('invalid env variable REDIS_URL', function(test) {

    process.env.REDIS_URL = "invalid-url";
    try {
        var connObj = Meteor._parseRedisEnvUrl();
        test.equal(connObj, null);
        test.ok(false);
    } catch(ex) {
        delete process.env.REDIS_URL;
    }
});

Tinytest.add('parse correct redis url', function(test) {

    process.env.REDIS_URL = "redis://redis:pass@hostname:9389";
    var connObj = Meteor._parseRedisEnvUrl();
    test.equal(connObj.host, "hostname");
    test.equal(connObj.port, 9389);
    test.equal(connObj.auth, "pass");
    delete process.env.REDIS_URL;
});