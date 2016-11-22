git pull
node ./node_modules/gulp/bin/gulp.js dist
pm2 kill
cd dist/server
pm2 start prod-cluster.json
cd ..
cd ..