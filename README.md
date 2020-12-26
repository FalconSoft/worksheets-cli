# worksheets-cli
A command line interface that synchronize files between Worksheets App and local file system

## Examples

### Help
```
node dist/index.js --help
node dist/index.js --help auth
```

### Auth
```
node ./dist/index.js auth
node ./dist/index.js auth -u=Test1 -p=******
```

### Pull
```
node ./dist/index.js pull
node ./dist/index.js pull --owner=Test1 --appName=NewAppToDel2
node ./dist/index.js pull -o=Test1 -a=NewAppToDel2
```

### Push
```
node ./dist/index.js push --owner=Test1 --appName=NewAppToDel2
node ./dist/index.js push -o=Test1 -a=NewAppToDel2
```
