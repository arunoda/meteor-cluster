meteor-cluster
==============

### Smarter way to run cluster of meteor nodes

Meteor is not a toy anymore. People keen to build enterprise apps on top of the meteor. So people need to run cluster of meteor nodes for several reasons. 

But when running cluster of meteor nodes, meteor is not realtime anymore(between nodes). It get synced but takes few seconds.

**Here comes the solution - `meteor-cluster`**

### Installation

just run `mrt add cluster`

### Redis

`meteor-cluster` needs redis to for communicate between nodes. It uses pub/sub functionality of redis.
So you need to have redis-server running.

If you are new to redis, [read this guide](http://redis.io/topics/quickstart)

### Configurations

`meteor-cluster` needs to know 

* how to connect to redis
* what collections it need to sync and 

run following in the server

~~~js
Meteor.startup(function() {
    Meteor.Cluster.init(); //assumes you are running redis-server locally
    Meteor.Cluster.sync(Posts, Notifications, Comments); //these are my collections
});
~~~

### How to scale

Just fire up new nodes and it just works.

### API

#### Meteor.Cluster.init(redisConfig)

Initialize and connect to redis.

* redisConfig - null or `{port: 6337, host: "localhost", auth: null, db: null}`

#### Meteor.Cluster.sync(collections...)

Sync given set of collection between nodes

* collections... - Collections defined as list of arguments
