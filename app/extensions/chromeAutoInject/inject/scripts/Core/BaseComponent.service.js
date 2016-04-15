angular.module('Pundit2.Core')

.constant("BASECOMPONENTDEFAULTS", {
    debug: false
})

.service('BaseComponent', function($log, Utils, BASECOMPONENTDEFAULTS, $window, Config) {

    var BaseComponent = function(name, options) {
        this.name = name;
        this.options = angular.extend({}, BASECOMPONENTDEFAULTS);

        // Extend the very basic defaults with given options
        if (typeof(options) !== "undefined") {
            Utils.deepExtend(this.options, options);
        }

        // The first one extending BaseComponent will create the
        // global PUNDIT object
        if (typeof($window.PUNDIT) === 'undefined') {
            $window.PUNDIT = {
                config: Config
            };
            this.log('Created PUNDIT global object');
        }

        // Try to see if there's a provided configuration for this module,
        // and use it to extend our options
        if (typeof(Config.modules[this.name]) !== "undefined") {
            Utils.deepExtend(this.options, Config.modules[this.name]);
            this.log('BaseComponent extending with Config.modules conf');
        }

        // Save the built configuration into the Config with our name
        Config.modules[this.name] = this.options;

    };

    // TODO: doc
    BaseComponent.prototype.err = function() {
        var fileErr = function() {
            try {
                throw Error('');
            } catch (err) {
                return err;
            }
        };
        var currentErr = fileErr();
        var callerLine = currentErr.stack.split('\n')[5];

        var args = Array.prototype.slice.call(arguments);
        args.unshift("#PUNDIT " + this.name + "#");
        args.push(callerLine);
        $log.error.apply(null, args);
    };

    // TODO: doc
    // We log if debugAllModules is true or this component's options
    // says so
    BaseComponent.prototype.log = function() {
        if (Config.debugAllModules === true || this.options.debug === true) {
            var args = Array.prototype.slice.call(arguments);
            args.unshift("#" + this.name + "#");
            $log.log.apply(null, args);
        }
    };

    return BaseComponent;
});