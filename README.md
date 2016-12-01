# REST API File Manager 
## Instructions
You can run server and client in docker or if you have installed mongodb 
run server and client on host machine in each directories. If you run 
in docker, you need to specify in /etc/hosts/ 
```
127.0.0.1 server
127.0.0.1 client
```
If don't, request from client won't be achieved by server.
To start docker run command
```
docker-compose up
```
To start locally run these command in client and server directories:
```
npm install
npm start
```
Server is running on port 3000. Client - 3001.
## Description
All data is storing in `USERS_DATA` directory. For each user is created
own directory with user name. All users files is saved in one directory.
I use data model tree structures with materialized paths to save files 
in mongodb. File is saved in users root directory with unique name which 
is equal to `id` in database. So directories are only existing in database.

## Documentation
To send request you need to register on server at first. Generate token
and then include that token in your request.

#### Create file
To create new file send POST request as in example:
```
POST: http://localhost:3000/api/v1/dir1/dir2/file1?type=file
```
Where `dir1/dir2` is subpath directories if they do not exist it will be 
created automatically. `file1` is the name of the file. And you must 
always mention in query the type of what are you creating. `dir` for 
directories and `file` for files. Data is uploading as `binary/*` or 
as `text/*` raw data. If file already exists it will create new file 
with incremented version.
```
Response. Status 200
   {
        "name": "file1"
        "message": "Successfully created"
   }
```
##### Get file
To get file send GET request as in example:
```
GET: http://localhost:3000/api/v1/dir1/dir2/file1
```
If it is file in response you will get whole file. And if this is 
directory in response you will get. You can also specify in query which
version of the file to get `?v=2`.
```
Response. Status 200
    {
        "dir": "dirName",
        "children": [<array of child files names>]
    }
```
##### Update content of the file
To update file send request as in example:
```
PUT: http://localhost:3000/api/v1/dir1/dir2/file1
```
```
Response. Status 201
    {
        "name": "file1",
        "message": "Successfully updated."
    }
```
Update the whole file content (rewrite file).
##### Rename or move file
To rename file send request as in example:
```
PATCH: http://localhost:3000/api/v1/dir1/dir2/file1?name=newName
```
You need to specify new name of the file in query parameter `name`.

To move file or dir to another place, you need to send request:
```
PATCH: http://localhost:3000/api/v1/dir1/dir2?path=/dir3/dir4
```
The directory `dir2` will be moved with all children files to the place
mentioned in query `path` parameter.
```
Response. Status 201
    {
        "name": "file1",
        "message": "Successfully updated."
    }
```
##### Get meta data
To get meta data, you need to send request:
```
HEAD: http://localhost:3000/api/v1/file
```
In response you will get additional headers such as `File-Version`, 
`Created-At`, `Updated-At`.
##### Remove file
To remove file send request:
```
DELETE: http://localhost:3000/api/v1/file
```
In response get status `204`.
##### Search data
To search data send request:
```
GET: http://localhost:3000/api/v1/search?dir1/dir2/file1
```
In query specify file name or subpath or full which you want to find.