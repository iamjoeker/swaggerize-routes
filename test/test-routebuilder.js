const Test = require('tape');
const Path = require('path');
const Buildroutes = require('../lib/builders/routes');
const Parser = require('swagger-parser');
const Thing = require('core-util-is');

const testRoute = (routes, t) => {
    routes.forEach(route => {
        t.comment('***** ' + route.name + ' *****');
        t.ok(route.method, 'Ok method property.');
        t.ok(route.description, 'Ok description property.');
        t.ok(route.name, 'Ok name property.');
        t.ok(route.path, 'Ok path property.');
        t.ok(route.security, 'Ok security property.');
        t.ok(route.validators && Thing.isObject(route.validators), 'Ok validators property.');
        t.ok(route.handler && Thing.isFunction(route.handler), 'Ok handler property.');
        t.ok(route.produces, 'Ok produces property.');
    });
};

const testRouteMustHave = (routes, t) => {
    routes.forEach(route => {
        t.ok(route.method, 'Ok method property.');
        t.ok(route.path, 'Ok path property.');
        t.ok(route.handler, 'Ok handler property.');
    });
};

const apiResolver = Parser.validate(Path.join(__dirname, './fixtures/defs/pets.json'));
let routes;

Test('routebuilder_build-directory', t => {
    routesResolver = Buildroutes(apiResolver, {
        basedir: Path.join(__dirname, 'fixtures'),
        handlers: Path.join(__dirname, 'fixtures/handlers'),
        security: Path.join(__dirname, 'fixtures/extensions')
    });
    routesResolver.then(resolved => {
        ({ routes } = resolved);
        t.strictEqual(routes.length, 6, 'added 6 routes.');
        testRoute(routes, t);
        t.end();
    }).catch(err => {
        t.error(err);
        t.end();
    });
});

Test('routerbuilder_security-definitions', t => {
    t.plan(5);

    const route = routes[1];
    t.ok(route.security, 'has security definition');
    t.ok(route.security.default && Array.isArray(route.security.default.scopes), 'default has scopes.');
    t.ok(route.security.default && typeof route.security.default.authorize === 'function', 'default has an authorize function.');
    //options.security
    t.ok(route.security.secondary && Array.isArray(route.security.secondary.scopes), 'secondary has scopes.');
    t.ok(route.security.secondary && typeof route.security.secondary.authorize === 'function', 'secondary has an authorize function.');
});

Test('routerBuilder_build-from-x-handler', t => {
    routesResolver = Buildroutes(apiResolver, {
        basedir: Path.join(__dirname, 'fixtures')
    });

    routesResolver.then(resolved => {
        ({ routes } = resolved);
        t.strictEqual(routes.length, 2, 'added 2 routes.');
        testRoute(routes, t);
        t.end();

    }).catch(err => {
        t.error(err);
        t.end();
    });
});


Test('routerBuild_build-with-object', t => {
    routesResolver = Buildroutes(apiResolver, {
        basedir: Path.join(__dirname, 'fixtures'),
        handlers: {
            'pets': {
                $get: function () { },
                $post: function () { },
                '{id}': {
                    $get: function () { },
                    $delete: function () { },
                    'items': {
                        $get: function () { },
                        $post: function () { }
                    }
                }
            }
        }
    });

    routesResolver.then(resolved => {
        ({ routes } = resolved);
        t.strictEqual(routes.length, 6, 'added 6 routes.');
        testRoute(routes, t);
        t.end();
    }).catch(err => {
        t.error(err);
        t.end();
    });
});

Test('routerBuilder_route-validators', t => {
    var route;

    route = routes[1];
    t.strictEqual(route.validators.length, 1, 'has a validator.');
    t.ok(typeof route.validators[0].spec === 'object', 'has spec object property.');
    t.ok(typeof route.validators[0].validate === 'function', 'has validate fn property.');

    route.validators[0].validate({
        id: 0
    }, function (error) {
        t.ok(error, 'validation failed.');
    });

    route.validators[0].validate({
        id: 0,
        name: 'Cat'
    }, function (error) {
        t.ok(!error, 'validation passed.');
    });

    t.end();
});

Test('routerBuilder_route-validator-merge', t => {
    var route;
    route = routes[5];

    t.strictEqual(route.validators.length, 3, 'has 3 validators.');

    var validator;
    validator = route.validators.filter(validator => { return validator.spec.name === 'date'; }).shift();
    t.ok(validator.spec.required, 'override by operation.');

    t.end();
});

Test('routerBuilder_bad-dir', t => {

    routesResolver = Buildroutes(apiResolver, {
        handlers: 'asdf'
    });
    routesResolver.catch(err => {
        t.ok(err);
        t.ok(err.code === 'ENOENT', 'Ok error for bad directory');
        t.end();
    });
});

Test('routerBuilder_build-with-root-path', function (t) {
    routesResolver = Buildroutes(Parser.validate(Path.join(__dirname, './fixtures/defs/testroot.json')), {
        basedir: Path.join(__dirname, 'fixtures'),
        handlers: {
            $get: function () { },
            other: {
                $get: function () { }
            }
        }
    });

    routesResolver.then(resolved => {
        ({ routes } = resolved);
        t.strictEqual(routes.length, 2, 'added 2 routes.');
        testRouteMustHave(routes, t);
        t.end();
    }).catch(err => {
        t.error(err);
        t.end();
    });
});
