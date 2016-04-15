angular.module('KorboEE')
/**
 * @ngdoc directive
 * @name korboEntityEditor
 * @restrict E
 * @module KorboEE
 *
 * @description
 * korbo Entity Editor directive will be rendered in two different way, in according to usage defined in configuration object.
 *
 * In case of Tafony Compatibility usage, it will be rendered with an input text. For details see {@link #!/tafony-compatibility Tafony Compatibility}
 *
 * In case of Use Only Callback usage, no GUI elements are rendered, but will get called function onLoad() defined in configuration object when
 * component is ready to use with callback. For details see {@link #!/only-callback Use Only Callback}
 *
 * @param {string} conf-name Object configuration name.
 **/
.directive('korboEntityEditor', function(korboConf, APIService, $window){
        return {
            restrict: 'E',
            scope: {
                korboSearchLimit: '=korboSearchLimit',
                korboMinLength: '=korboMinLength'
            },
            templateUrl: function(element, attrs) {
                var confName = attrs.confName || '';
                var conf = korboConf.setConfiguration(confName);
                attrs.korboSearchLimit = "'"+conf.limitSearchResult+"'";
                attrs.korboMinLength = "'"+conf.labelMinLength+"'";
                // APIService is initialized only if globalObjectName doesn't exist yet in $window
                // if it exists, show error template and set error attribute to true

                if(typeof($window[conf.globalObjectName]) !== "undefined" ){
                    attrs.error = true;
                    attrs.errorType = 'globalObject';
                    return 'src/KorboEE/Korboee-error-config.tmpl.html';
                }

                // if it doesn't exist, set error attribute to false
                // and APIService is initialized

                attrs.error = false;

                // Initialize API, registering features and events.
                var api = APIService.init(conf),
                    features = ['OpenSearch', 'OpenNew', 'Cancel', 'ClearForm', 'Edit', 'CopyAndUse'],
                    events = ['Open','Cancel','Save'];

                /**
                 * @ngdoc object
                 * @name EE
                 * @module KorboEE
                 * @description
                 * Global Object exposed by the Entity Editor to interact with callbacks and features.
                 */

                /**
                 * @ngdoc method
                 * @name EE#onCancel
                 * @module KorboEE
                 * @description
                 * Register a callback function on the Cancel event. When the modal is closed, Cancel event is fired and
                 * registered function will get called
                 *
                 * @param {function} callback The callback function gets called when the Cancel event is fired
                 */

                /**
                 * @ngdoc method
                 * @name EE#onOpen
                 * @module KorboEE
                 *
                 * @description
                 * Register a function on the Open event. When the modal is opened, the Open event is fired and
                 * registered function will get called
                 *
                 * @param {function} callback The callback function gets called when the Open event is fired
                 *
                 */

                /**
                 * @ngdoc method
                 * @name EE#onSave
                 * @module KorboEE
                 * @description
                 * Register a callback function on the Save event.
                 * A Save event is fired when a new entity is saved, or copied or just used.
                 * To the registered function will be passed the use/saved entity with the `entity` parameter.
                 *
                 * @param {function} callback The callback function gets called when the Save event is fired,
                 * passing the `entity` object which is the saved/used semantic entity having the following properties:
                 *
                 ** `value`: entity URL
                 ** `label`: entity label
                 ** `type`: array of types
                 ** `image`: entity depiction URL
                 ** `description`: entity abstract
                 ** `language`: entity language
                 *
                 */

                api.addEvent(events);
                api.addFeature(features);

                // Now that features and events are set up, we can call the onload
                // and let the world subscribe and interact with them
                if (conf.onLoad !== null && typeof(conf.onLoad) === 'function' && conf.useOnlyCallback){
                    conf.onLoad();
                }

                if(conf.useOnlyCallback || (!conf.useTafonyCompatibility && !conf.useOnlyCallback)){
                    return 'src/KorboEE/Korboee-callback.tmpl.html';
                }

                if(conf.useTafonyCompatibility) {
                    return 'src/KorboEE/korboee-entity.tmpl.html';
                }

            },

            link: function($scope, element, attrs) {
                var confName = attrs.confName || '';
                // Saving this conf into this directive scope, when .open()
                // gets called $rootScope.conf will be set to this object
                $scope.conf = korboConf.setConfiguration(confName);
                $scope.abstract = '';
                $scope.location = '';
                $scope.errorGlobalObjName = attrs.error;
                $scope.errorType = attrs.errorType;
                korboConf.setIsOpenModal(false);

            },
            controller: 'EEDirectiveCtrl'
        };
    });