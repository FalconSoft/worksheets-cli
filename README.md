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
node ./dist/index.js pull --app=Test1/NewAppToDel2
node ./dist/index.js pull -a=Test1/NewAppToDel2
```

### Push
```
node ./dist/index.js push --app=Test1/NewAppToDel2
node ./dist/index.js push -a=Test1/NewAppToDel2
```

### Config
```
node ./dist/index.js config --baseUrl=worksheets.systems/api
node ./dist/index.js config -a=Test1/NewAppToDel2
```
