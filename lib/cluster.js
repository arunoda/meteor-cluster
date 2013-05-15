function Cluster() {
    
    var serverId = Random.id();
    var redisPublishClient;
    var redisSubscribeClient;

    var collections = {};

    this.sync = function() {
        _.each(arguments, function(collection) {
            collections[collection._name] = collection;
            watchCollection(collection);
        });
    }

    this.init = function(redisConfig) {
        redisConfig = redisConfig || Meteor._parseRedisEnvUrl() || {};

        redisPublishClient = Meteor._createRedisClient(redisConfig);
        redisSubscribeClient = Meteor._createRedisClient(redisConfig);

        redisSubscribeClient.once('subscribe', this.onsubscribe);

        redisSubscribeClient.on('message', function(channel, message) {
            var parsedMessage = JSON.parse(message);
            if(parsedMessage[0] != serverId) {
                onMessage(parsedMessage[1], parsedMessage[2], parsedMessage[3]);
            }
        });

        redisSubscribeClient.subscribe('meteor');
    };

    this.close = function() {
        redisSubscribeClient.unsubscribe('meteor');
        redisSubscribeClient.end();
        redisPublishClient.end();
    };

    this.onsubscribe = function() {};

    function watchCollection(collection) {    
        var methods = ['insert', 'update', 'remove'];
        methods.forEach(function(method) {
            var original = collection._collection[method];
            collection._collection[method] = function() {
                //find a better way to do this rather than ._dontPublish
                //delete is expensive
                var dontPublish = arguments[0]._dontPublish;
                delete arguments[0]._dontPublish;
                original.apply(collection, arguments);
                
                if(!dontPublish) {
                    publishAction(collection._name, method, arguments);                 
                }
            };
        });
    }

    function publishAction(collectionName, method, arguments) { 
        if(method == 'insert') {
            arguments = [{_id: arguments[0]._id}];
        }
        onAction(collectionName, method, arguments);
    }

    function onAction(collectionName, method, args) {   
        if(redisPublishClient) {
            var sendData = [serverId, collectionName, method, args];
            var sendDataString = JSON.stringify(sendData);

            redisPublishClient.publish('meteor', sendDataString);
        }
    }

    function onMessage(collectionName, method, args) {
        var collection = collections[collectionName];
        var Fiber = Npm.require('fibers');
        
        if(collection) {
            if(method == 'insert') {
                Fiber(function() {
                    collection.update(args[0]._id, {$set: {}});
                }).run();
            } else if (method == 'update') {
                //get this from somewhere else
                Fiber(function() {
                    var docs = collection.find(args[0], {fields: {_id: 1}});
                    docs.forEach(function(doc) {
                        var query = {_id: doc._id, _dontPublish: true};
                        collection.update(query, {$set: {}});
                    });
                }).run();
            } else if (method == 'remove') {
                var query = (typeof(args[0]) == 'object')? args[0]: { _id: args[0]};
                query._dontPublish = true;

                Fiber(function() {
                    collection.remove(query);
                }).run();
            }
        }
    }
}

Meteor.Cluster = new Cluster();