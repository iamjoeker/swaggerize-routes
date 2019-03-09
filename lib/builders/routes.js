const { merge } = require('merge-object-files');
const Thing = require('core-util-is');
const Utils = require('../utils');
const buildSecurity = require('./security');
const buildValidator = require('@iamjoeker/swagvali');

const BuildRoutes = (apiResolver, options) => {
    let { handlers, basedir } = options;
    let fileResolver = Thing.isObject(handlers)
        // Use the handlers object
        ? Promise.resolve(handlers)
        // Construct the handler object using `merge-object-files` for a valid dir path.
        : (Thing.isString(handlers) ? merge(handlers, ['js']) : Promise.resolve(null));
    let validatorResolver = buildValidator(apiResolver, { validated: true });

    return Promise.all([apiResolver, fileResolver, validatorResolver]).then(resolved => {
        let routes = [];
        const [api, files, validators] = resolved;

        Object.keys(api.paths).forEach(path => {
            let pathObj = api.paths[path];
            Object.keys(pathObj).forEach(operation => {
                let operationObj;
                let handler;

                //If the key is not a valid operation, skip the iteration.
                if (!Utils.verbs.includes(operation)) {
                    return;
                }

                operationObj = pathObj[operation];
                //Find the handler function from handler directory.
                handler = pathfinder(path, operation, files);
                if (!handler) {
                    //Resolve the x-handler if exists
                    handler = operationObj['x-handler'] || pathObj['x-handler'];
                    if (handler) {
                        handler = Utils.resolve(basedir, handler, operation);
                    }
                }

                //Push the handler to the route definition.
                if (handler) {
                    routes.push({
                        path,
                        name: operationObj.operationId,
                        description: operationObj.description,
                        method: operation,
                        security: buildSecurity(operationObj.security || pathObj.security || api.security, api.securityDefinitions, options),
                        validators: validators[path][operation]['parameters'],
                        handler,
                        consumes: operationObj.consumes || api.consumes,
                        produces: operationObj.produces || api.produces
                    });
                }
            });
        });

        return {
            api,
            routes
        };
    });
};

const opsFinder = (source, operation) => {
    let $find = source[`$${operation}`];
    // Check if there is an operation key prefixed with `$` sign. (e.g:- $get, $post)
    // Handlers option passed as an object should have `$` prefixed operation key
    // to avoid namespace collisions.
    if ($find) {
        return $find;
    }
    return source[operation];
};

const pathfinder = (path, operation, files) => {
    let pathNames = path.split('/').filter(el => el);
    if (!files) {
        return;
    }
    return (pathNames[0] ? matchPath(operation, pathNames, files[pathNames[0]]) : opsFinder(files, operation));
};

/**
 * Match a route handler to a given path name set.
 * @param method
 * @param pathNames
 * @param handlers
 * @returns {*}
 */
const matchPath = (method, pathNames, handlers) => {
    if (!handlers) {
        return null;
    }
    if (pathNames.length > 1) {
        pathNames.shift();
        return matchPath(method, pathNames, handlers[pathNames[0]]);
    }

    return handlers[pathNames[0]] ? handlers[pathNames[0]] : opsFinder(handlers, method);
};

module.exports = BuildRoutes;
