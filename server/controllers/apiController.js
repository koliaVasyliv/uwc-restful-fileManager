const fsp = require('fs-promise'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');


module.exports = function (User, File) {
    'use strict';

    function post(req, res) {
        let {params, userDir, pattern} = handleInitVars(req);
        let content = req.data;
        File.find({ name: params[params.length - 1], path: pattern }).sort('-v')
            .then(files => {
                let file = new File({
                    name: params[params.length - 1],
                    type: req.query.type,
                    path: params.slice(0, params.length - 1).join('/')
                });
                //Check if file already exist create new version of the file
                file.v = files.length === 0 ? 1 : files[0].v + 1;
                return file.save();
            })
            .then(file => {
                if (file.type === 'dir') {
                    res.json({ name: params[params.length -1], message: 'Successfully created.'});
                    return Promise.reject();
                } else if (file.type === 'file') {
                    return fsp.writeFile(path.join(userDir, file.id), content);
                } else {
                    res.status(400).json({ message: 'You need to specify what type of file: `dir` or `file`.'})
                }
            })
            .then(() => {
                //check if we need to create path directories
                if (params.length > 2) {
                    return  File.find({ name: { $in: [...params.slice(1, params.length - 1)]}});
                } else {
                    res.status(201).json({ name: params[params.length -1], message: 'Successfully created.'});
                    return Promise.reject();
                }
            })
            .then(files => {
                return checkDirExist(files, params);
            })
            .then(names => {
                if (names) {
                    return createDirs(params, names, File)
                } else {
                    res.status(201).json({ name: params[params.length -1], message: 'Successfully created.'});
                    return Promise.reject();
                }
            })
            .then(() => {
                res.status(201).json({ name: params[params.length -1], message: 'Successfully created.'});
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: { message: 'Internal error.', status: 500 }});
                }
            });
    }


    function get(req, res) {
        let {params, userDir, pattern} = handleInitVars(req);
        if (params.length > 2) {
            File.find({ name: params[params.length - 1], path: pattern }).sort('-v')
                .then(files => {
                    if (files.length === 0) handleEmpty(files, res);
                    let file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                    if (!file) return handleVersionNotExist(res);
                    // If file is directory then we need to search for files in this directory
                    // and return them to user
                    if (file.type === 'dir') {
                        return File.find({ path: params.join('/')});
                    } else if (file.type === 'file') {
                        res.sendFile(path.join(userDir, file.id));
                        return Promise.reject();
                    }
                })
                .then(files => {
                    let filteredFiles = filterFileVersions(files);
                    let names = filteredFiles.map(v => v.name);
                    res.json({ dir: params[params.length - 1], children: names});
                })
                .catch(err => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                    }
                });
        } else if (params.length === 2){
            File.find({ name: params[params.length - 1] }).sort('-v')
                .then(files => {
                    let file = files[0];
                    if (files.length === 0) return handleEmpty(res);
                    if (file.type === 'file') {
                        res.sendFile(path.join(userDir, file.id));
                        return Promise.reject();
                    } else if (file.type === 'dir') {
                        return File.find({ path: params.slice(0,2).join('/') });
                    }
                })
                .then(files => {
                    let filteredFiles = filterFileVersions(files);
                    let fileNames = filteredFiles.map(v => v.name);
                    res.json({ dir: params[0], children: fileNames});
                })
                .catch(err => {
                    if (err) {
                        console.log(err);
                        res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                    }
                });
        }
    }


    /**
     * Handle functionality of updating full file with new content
     * @param req
     * @param res
     */
    function put(req, res) {
        let {params, userDir, pattern} = handleInitVars(req);
        File.find({name: params[params.length - 1], path: pattern}).sort('-v')
            .then(files => {
                if (files.length === 0) return handleEmpty(files, res);
                //Return last version of the file if there is more than one
                let file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                if (!file) return handleVersionNotExist(res);
                fs.truncateSync(path.join(userDir, file.id), 0);
                return fsp.writeFile(path.join(userDir, file.id), req.data);
            })
            .then(() => {
                res.status(201).json({ name: params[params.length -1], message: 'Successfully updated.'});
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                }
            });
    }


    /**
     * Handle functionality of updating some attributes of resource:
     * renaming, moving files
     * New name of file or directory where you want to move files is set in query {name}
     * @param req
     * @param res
     */
    function patch(req, res) {
        let {params, pattern} = handleInitVars(req);
        File.find({ name: params[params.length - 1], path: pattern}).sort('-v')
            .then(files => {
                if (files.length === 0) return handleEmpty(res);
                let file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                if (!file) return handleVersionNotExist(res);
                if (req.query.name) {
                    file.name = req.query.name;
                } else if (req.query.path) {
                    file.path = req.query.path;
                }
                return file.save();
            })
            .then(result => {
                if (result.type === 'dir') {
                    const newPath = req.query.path ? params[0].concat(req.query.path, result.name)
                                    : params.slice(0, params.length - 1).join('/').concat('/', result.name);
                    return updatePath(File, new RegExp(params.join('/')), newPath);
                } else {
                    res.status(201).json({ name: params[params.length -1], message: 'Successfully updated.'});
                    return Promise.reject();
                }
            })
            .then(() => {
                res.status(201).json({ name: params[params.length -1], message: 'Successfully updated.'});
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.json({ error: { message: 'Internal error.'}, status: 500});
                }
            })
    }

    function head(req, res) {
        let {params, pattern} = handleInitVars(req);
        File.find({ name: params[params.length - 1], path: pattern}).sort('-v')
            .then(files => {
                if (files.length === 0) return handleEmpty(res);
                const file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                if (!file) return handleVersionNotExist(res);
                res.set({
                    'File-Name': file.name,
                    'Created-At': file.createdAt,
                    'Updated-At': file.updatedAt,
                    'File-Type': file.type,
                    'File-Version': file.v.toString()
                });
                res.end();
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                }
            });
    }


    function remove(req, res) {
        let {params, userDir, pattern} = handleInitVars(req);
        File.find({ name: params[params.length - 1], path: pattern }).sort('-v')
            .then(files => {
                if (files.length === 0) return handleEmpty(res);
                let file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                if (!file) return handleVersionNotExist(res);
                if (file.type === 'file') {
                    //If it is just one file, simple delete it
                    let id = file.id;
                    file.remove()
                        .then(r => {
                            fsp.unlink(path.join(userDir, id))
                        });
                } else if (file.type === 'dir') {
                    //Else we need to find all files in this directory
                    return File.find({ path: new RegExp(params.join('/'))});
                }
            })
            .then(files => {
                if (files === undefined) {
                    res.status(204).end();
                    return Promise.reject();
                } else if (files.length === 0) {
                    //No files in directory so just remove it from database
                    return File.remove({ name: params[params.length - 1]});
                } else {
                    //Delete files that directory includes
                    files.forEach(v => {
                       fs.unlinkSync(path.join(userDir, v.id));
                    });
                    //Remove form database directory and files that this directory includes
                    File.remove({ $or: [ {name: params[params.length - 1], path: pattern},
                        { path: new RegExp(params.join('/'))}]});
                }
            })
            .then(() => {
                res.status(204).end();
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                }
            });
    }

    
    
    function checkParams(req, res, next) {
        if (!req.params[0] || req.params.length === 0) {
            res.status(400).json({ message: 'You need to specify path for file or directory.', status: 400 });
        } else {
            next();
        }
    }

    function search(req, res) {
        let params = Object.keys(req.query)[0].split('/');
        params.unshift(req.user.username);
        let pattern = new RegExp(params.slice(0, params.length - 1).join('/'));
        File.find({ name: params[params.length - 1],  path: pattern }).sort('-v')
            .then(files => {
                if (files.length === 0 ) return handleEmpty(res);
                let file = {};
                //If user specified version take it
                file = req.query.v ? exactVersion(files, req.query.v) : files[0];
                if (!file) return handleVersionNotExist(res);
                res.json({ name: file.name, version: file.v, type: file.type });
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({ error: { message: 'Internal error.'}, status: 500});
                }
            });
    }

    
    function handleIncomeData(req, res, next) {
        if (req.is('text/*')) {
            req.data = '';
            req.on('data', chunk => req.data += chunk);
            req.on('end', next);
        } else if (req.is('binary/*')) {
            req.data = [];
            req.on('data', chunk => req.data.push(chunk));
            req.on('end', () => {
                req.data = Buffer.from(req.data).toString();
                next();
            });
        }
        else {
            next();
        }
    }

    return {
        get: get,
        post: post,
        checkParams: checkParams,
        put: put,
        remove: remove,
        patch: patch,
        head: head,
        search: search,
        handleIncomeData: handleIncomeData
    }
};

/**
 * Return array of files with last versions
 * @param files
 * @returns {Array.<File>}
 */
function filterFileVersions(files) {
    let sortArr = files.sort((a, b) => {
        if (a.name < b.name) return -1;
        if(a.name > b.name) return 1;
        return 0;
    });
    return sortArr.filter(function(file, i, arr) {
        if (i === (arr.length - 1)) {
            if (file.name === arr[i - 1].name) {
                return file.v > arr[i - 1].v;
            }
        }
        else {
            if (file.name === (arr[i+1].name)) {
                return file.v > arr[i+1].v
            }
        }
        return true;
    })
}

/**
 * Update path of each file that includes old one
 * @param File
 * @param {RegExp} lastPath
 * @param {String} newPath
 * @returns {Promise}
 */
function updatePath(File, lastPath, newPath) {
    File.find({ path: lastPath })
        .then(files => {
            files.forEach(v => {
                v.path = v.path.replace(lastPath, newPath);
            });
            return async.each(files, fileSave, function (err) {
                if (err) return  Promise.reject(err);
                return Promise.resolve();
            });
        });
}

function fileSave(file, callback) {
    file.save().then(result => callback(), err => callback(err));
}

function handleEmpty(res) {
    res.status(400).json({error: {message: 'Such file or directory does not exist.'}, status: 400});
    return Promise.reject();
}

function handleVersionNotExist(res) {
    res.status(400).json({ message: 'File with such version does not exist.', status: 400 });
    return Promise.reject();
}
/**
 * Handle some routines stuff as predefining necessary variables
 * in case to not repeat every time code
 * @param req
 * @returns {{}}
 */
function handleInitVars(req) {
    let initVars = {};
    initVars.params = req.params[0].split('/');
    initVars.params.unshift(req.user.username);
    initVars.userDir = path.resolve(__dirname, '../USERS_DATA', req.user.username);
    initVars.pattern = new RegExp(initVars.params.slice(0, initVars.params.length - 1).join('/'));
    return initVars;
}


function exactVersion(files, v) {
    return files.filter(file => file.v == v)[0];
}

/**
 * Checks if directories in path of file already exists
 * @param {Array.<File>} files
 * @param {Array.<Object>} params
 */
function checkDirExist(files, params) {
    if (files.length >= params.length) return Promise.resolve(false);
    if (files.length === 0) return Promise.resolve(params.slice(1, params.length));
    files.forEach(v => {
        params.splice(params.indexOf(v.name), 1);
    });
    return Promise.resolve(params);
}

/**
 * cr
 * @param {Array.<Object>} params
 * @param {Array.<String>} names
 * @param {Model} File
 */
function createDirs(params, names, File) {
    let filesArr = names.map(name => {
        return new File({
            name: name,
            type: 'dir',
            path: params.slice(0, params.indexOf(name)).join('/'),
            v: 1
        });
    });

    async.each(filesArr, fileSave, err => {
        if (err) return Promise.reject(err);
        return Promise.resolve();
    });
}
