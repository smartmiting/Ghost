'use strict';

var fs = require('fs')
var path = require('path')
var Promise = require('bluebird')
var OSS = require('ali-oss').Wrapper
	, utils = require(path.join(process.cwd(), 'core/server/utils'))
	, StorageBase = require('ghost-storage-base');

class AliOssStore extends StorageBase{
	constructor(config) {
        super();

        this.options = config || {};
  		this.client = new OSS(this.options);
    }

    save (file, targetDir) {
		var client = this.client
		var origin = this.options.origin  
		var key = this.getFileKey(file);

		return new Promise(function (resolve, reject) {
			return client.put(
			  key, 
			  fs.createReadStream(file.path)
			)
			.then(function (result) {
				console.log(result)
				if(origin){
					resolve(origin + result.name)
				}else{
					resolve(result.url)
				}      
			})
			.catch(function (err) {
				console.log('alioss-add-error', err)
				reject(false)
			})
		})
	}

	exists (filename) {
  		// console.log('exists',filename)
  		var client = this.client  

	  	return new Promise(function (resolve, reject) {
  			return client.head(filename).then(function (result) {
		      	// console.log(result)
		      	resolve(true)
	    	}).catch(function (err) {
	      		// console.log(err)
	      		reject(false)
	    	})
	  	})
	}

	serve (options) {  
	  	return function (req, res, next) {
	   		next();
	  	}
	}

	delete (filename) {
  		var client = this.client  

	  	// console.log('del',filename)
	  	return new Promise(function (resolve, reject) {
	    	return client.delete(filename).then(function (result) {
	      		// console.log(result)
	      		resolve(true)
	    	}).catch(function (err) {
	      		// console.log(err)
	      		reject(false)
	    	})
	  	})
	}

	/**
     * Not implemented.
     * @returns {Promise.<*>}
     */
    read() {
        return Promise.reject('alioss read not implemented');
    }

	getFileKey (file) {
		var ext = path.extname(file.name);

	  	return randomFileName(this.options.fileKey) + ext.toLowerCase();
	}
}

/**
 * create file folder by date
 * @param time
 * @returns {string}
 */
function createFolderName(time) {
    return time.getFullYear()
        + '/' + leftpad(time.getMonth() + 1, 2, '0')
        + '/' + leftpad(time.getDate(), 2, '0')
        + '/' + leftpad(time.getHours(), 2, '0');
}

//https://github.com/stevemao/left-pad
function leftpad(str, len, ch) {
    str = String(str);

    var i = -1;

    if (!ch && ch !== 0) ch = ' ';

    len = len - str.length;

    while (++i < len) {
        str = ch + str;
    }

    return str;
}

/**
 * create random the uploadFile name
 * @param opt  name config, support prefix & suffix
 */
function randomFileName(opt) {
    opt = opt || {};
    let curTime = new Date();

    let prefix = opt.prefix || createFolderName(curTime);
    let suffix = opt.suffix || '';

    let key = leftpad(Math.round(Math.random() * 99999), 5, 0);
    return prefix + curTime.getTime() + "_" + key + suffix;
}

module.exports = AliOssStore;