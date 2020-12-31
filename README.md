# worksheets-cli
A command line interface that synchronize files between Worksheets App and local file system

## Install
```
npm i worksheets-cli -g
```

## Usage

### Help
```
worksheets-cli --help
worksheets-cli --help auth
```

### Auth
```
worksheets-cli auth
worksheets-cli auth -u=Test1 -p=******
```

### Pull
```
worksheets-cli pull
worksheets-cli pull --app=Test1/NewAppToDel2
worksheets-cli pull -a=Test1/NewAppToDel2
```

### Push
```
worksheets-cli push --app=Test1/NewAppToDel2
worksheets-cli push -a=Test1/NewAppToDel2
```

### Config
```
worksheets-cli config --baseUrl=worksheets.systems/api
worksheets-cli config -a=Test1/NewAppToDel2
```
