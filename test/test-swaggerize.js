const Test = require('tape');
const Thing = require('core-util-is');
const Parser = require('swagger-parser');
const Swaggerize = require('../lib/index');
const Path = require('path');

Test('configure: fail-no-options', t => {
    t.plan(1);
    t.throws(function () {
        Swaggerize();
    }, 'throws exception.');
});

Test('configure: fail no pi definition', t => {
    t.plan(1);

    t.throws(function () {
        Swaggerize({});
    }, 'throws exception.');
});

Test('configure: bad api definition', t => {
    const routeBuilder = Swaggerize({
        api: require('./fixtures/defs/badapi.json'),
        basedir: Path.join(__dirname, './fixtures')
    });

    routeBuilder.catch(err => {
        t.ok(err);
        t.ok(err.name === 'SyntaxError', 'Ok error name for bad api definition');
        t.ok(/not a valid Swagger API definition$/.test(err.message), 'Ok error for bad api definition');
        t.end();
    });
});

Test('configure: should not fail for missing handler path', t => {
    const routeBuilder = Swaggerize({
        api: require('./fixtures/defs/pets.json')
    });

    routeBuilder.then(routeObj => {
        let { api, routes } = routeObj;
        t.ok(Thing.isObject(api), 'Resolved api object should be returned');
        t.ok(Thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 0, 'routes.length 0.');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });
});

Test('configure: api as an object', t => {
    const routeBuilder = Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures')
    });

    routeBuilder.then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 6, 'routes.length 6.');
        t.end();
        return;
    }).catch(err => {
        t.error(err);
        t.end();
    });
});

Test('configure: api path', t => {
    const routeBuilder = Swaggerize({
        api: Path.join(__dirname, './fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures'),
        handlers: Path.join(__dirname, './fixtures/handlers')
    });

    routeBuilder.then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 6, 'routes.length 6.');
        t.end();
        return;
    }).catch(err => {
        t.error(err);
        t.end();
    });
});

Test('configure: fail wrong api path', t => {
    const routeBuilder = Swaggerize({
        api: 'wrongpath'
    });

    routeBuilder.catch(err => {
        t.ok(err);
        t.ok(err.code === 'ENOENT', 'Ok error for wrong path');
        t.end();
    });
});

Test('configure: validated api', t => {
    const apiResolver = Parser.validate(Path.join(__dirname, './fixtures/defs/pets.json'));
    const routeBuilder = Swaggerize({
        validated: true,
        api: apiResolver,
        basedir: Path.join(__dirname, './fixtures'),
        handlers: Path.join(__dirname, './fixtures/handlers')
    });

    routeBuilder.then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 6, 'routes.length 6.');
        t.end();
        return;
    }).catch(err => {
        t.error(err);
        t.end();
    });
});

Test('configure: callback response', t => {
    Swaggerize({
        api: Path.join(__dirname, './fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures'),
        handlers: Path.join(__dirname, './fixtures/handlers')
    }, (err, routeObj) => {
        let { routes } = routeObj;
        t.error(err);
        t.ok(Thing.isArray(routes), 'returns array.');
        t.strictEqual(routes.length, 6, 'routes.length 6.');
        t.end();
    });
});


Test('handlers: absolute path', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        handlers: Path.join(__dirname, './fixtures/handlers')
    }).then(routeObj => {
        let { api, routes } = routeObj;
        t.ok(api, 'Resolved api from absolute handler path');
        t.ok(Thing.isArray(routes), 'constructed routes from absolute handler path');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });

});

Test('handlers: relative path', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        handlers: './fixtures/handlers'
    }).then(routeObj => {
        let { api, routes } = routeObj;
        t.ok(api, 'Resolved api from relative handler path');
        t.ok(Thing.isArray(routes), 'constructed routes from relative handler path');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });

});

Test('handlers: empty path', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures'),
        handlers: ''
    }).then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'constructed routes from empty handler path');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });
});

Test('handlers: relative path with basedir', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures'),
        handlers: './handlers'
    }).then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'constructed routes from relative handler path with basedir');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });
});

Test('handlers: basedir with no handlers property', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        basedir: Path.join(__dirname, './fixtures')
    }).then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'constructed routes from basedir with no handlers property');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });

});

Test('handlers: handlers as object', t => {
    Swaggerize({
        api: require('./fixtures/defs/pets.json'),
        handlers: {
            'pets': {
                $get: function () {
                    return 'hi';
                }
            }
        }
    }).then(routeObj => {
        let { routes } = routeObj;
        t.ok(Thing.isArray(routes), 'constructed routes from handlers as object');
        t.strictEqual(routes.length, 1, 'routes.length 1.');
        t.ok(Thing.isFunction(routes[0].handler), 'handler function');
        t.strictEqual(routes[0].handler(), 'hi', 'Ok handler function execution.');
        t.end();
        return;
    }).catch(error => {
        t.error(error);
        t.end();
    });

});
