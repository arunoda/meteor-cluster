Package.describe({
  summary: "Smarter way to run cluster of meteor nodes"
});

Npm.depends({"redis" : "0.8.3"});

Package.on_use(function (api, where) {
  api.use(['mongo-livedata'], 'server');
  api.add_files(['cluster.js'], 'server');
});
