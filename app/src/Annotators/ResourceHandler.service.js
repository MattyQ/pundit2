angular.module('Pundit2.Annotators')

.constant('RESOURCEHANDLERDEFAULTS', {
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceHandler.ignoreClasses
     *
     * @description
     * `array of string`
     *
     * List of classes added to content to ignore it and not annotate it.
     * Any content classed with any of these class will get ignored by the handler.
     * If selection to annotate start, ends or contains one of those classes, nothing will happen
     *
     * Default value:
     * <pre> ignoreClasses: ['pnd-ignore'] </pre>
     */

    ignoreClasses: ['pnd-ignore'],


    // Contextual menu type triggered by the text fragment handler. An Item will
    // be passed as resource

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceHandler.cMenuType
     *
     * @description
     * `string`
     *
     * Contextual menu type shown over image
     *
     * Default value:
     * <pre> cMenuType: 'resourceHandlerItem' </pre>
     */
    cMenuType: 'resourceHandlerItem',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ResourceHandler.labelMaxLength
     *
     * @description
     * `number`
     *
     * Maximum characters number of image src used to create the label for annotation.
     *
     * Default value:
     * <pre> labelMaxLength: 40 </pre>
     */
    labelMaxLength: 40,

    /**
     * @module punditConfig
     * @ngdoc object
     * @name modules#ResourceHandler.useAsSubject
     *
     * @description
     * `boolean`
     *
     * Active 'Use as subject' in contextualMenu
     *
     * Default value:
     * <pre> 
     *    useAsSubject: true
     * </pre>
     */
    useAsSubject: true,

    /**
     * @module punditConfig
     * @ngdoc object
     * @name modules#ResourceHandler.useAsObject
     *
     * @description
     * `boolean`
     *
     * Active 'Use as object' in contextualMenu
     *
     * Default value:
     * <pre> 
     *    useAsObject: true
     * </pre>
     */
    useAsObject: true
})

.service('ResourceHandler', function(RESOURCEHANDLERDEFAULTS, NameSpace, BaseComponent, Config,
    TextFragmentHandler, XpointersHelper, Item, $compile, $timeout, $rootScope, ContextualMenu, AnnotationPopover, TripleComposer, ItemsExchange, $q, EventDispatcher, ResourcePanel) {

    var resourceHandler = new BaseComponent('ResourceHandler', RESOURCEHANDLERDEFAULTS);

    var resourceElem = angular.element('.pnd-resource'), //find pnd-resource
        promise = $q.defer();

    var initContextualMenu = function() {
        var templateConfig = Config.template;
        var cMenuTypes = [resourceHandler.options.cMenuType];

        ContextualMenu.addAction({
            name: 'resComment',
            type: cMenuTypes,
            label: 'Comment',
            showIf: function() {
                return true;
            },
            priority: 99,
            action: function(item) {
                var coordinates = ContextualMenu.getLastXY(),
                    fragmentId = ContextualMenu.getLastRef(),
                    resourceElem = angular.element("[about='" + item.uri + "']");
                resourceElem.addClass('pnd-range-pos-icon');
                AnnotationPopover.show(coordinates.x, coordinates.y, item, '', fragmentId, 'comment', resourceElem);
            }
        });

        ContextualMenu.addDivider({
            priority: 98,
            type: cMenuTypes
        });

        // TODO: move this in TripleComposer
        if (resourceHandler.options.useAsSubject) {
            ContextualMenu.addAction({
                name: 'resUseAsSubject',
                type: cMenuTypes,
                label: 'Use as subject',
                showIf: function() {
                    return true;
                },
                priority: 105,
                action: function(item) {

                    TripleComposer.addToSubject(item);
                }
            });
        }

        if (resourceHandler.options.useAsObject) {
            ContextualMenu.addAction({
                name: 'resUseAsObject',
                type: cMenuTypes,
                label: 'Use as Object',
                showIf: function() {
                    return true;
                },
                priority: 104,
                action: function(item) {
                    TripleComposer.addToObject(item);
                }
            });

        }
        if (resourceHandler.options.useAsObject || resourceHandler.options.useAsObject) {
            ContextualMenu.addDivider({
                priority: 100,
                type: cMenuTypes
            });
        }
        if (templateConfig.active) {
            if (typeof templateConfig.activeOnTextFragment !== 'undefined' && templateConfig.activeOnTextFragment === true) {
                cMenuTypes.push(Config.modules.TextFragmentHandler.cMenuType);
                // TODO: fix priority order
                ContextualMenu.addDivider({
                    priority: 89,
                    type: Config.modules.TextFragmentHandler.cMenuType
                });
            }
            for (var i = 0; i < templateConfig.list.length; i++) {
                if (templateConfig.list[i].types.indexOf('resource')) {
                    ContextualMenu.addAction({
                        name: templateConfig.list[i].label.replace(/\s/g, ''),
                        type: cMenuTypes,
                        label: templateConfig.list[i].label,

                        showIf: function() {
                            return true;
                        },
                        priority: 84,
                        action: (function(idx) {
                            return function(item) {
                                var triples = templateConfig.list[idx].triples;

                                // TripleComposer.wipeNotFixedItems();
                                TripleComposer.reset();

                                for (i = 1; i < triples.length; i++) {
                                    TripleComposer.addStatement();
                                }

                                $timeout(function() {
                                    for (var i in triples) {
                                        (function closure(_i) {
                                            var triple = triples[_i],
                                                predicateItem = {};


                                            if (triple.subject.selectedItem) {
                                                TripleComposer.addToSubject(item);
                                            }

                                            if (triple.object.forceFocus) {
                                                ResourcePanel.setSelector(triple.object.selectors, true);
                                                //TODO ASAP: handle this operation with TripleComposer.service
                                                setTimeout(function() {
                                                    angular.element('span.pnd-statement-label[ng-click="onClickObject($event)"]').click();
                                                }, 300);
                                            }

                                            if (triple.predicate.uri) {
                                                predicateItem = ItemsExchange.getItemByUri(triple.predicate.uri);
                                                TripleComposer.addToPredicate(predicateItem);
                                            }
                                        })(i);
                                    }
                                });

                                if (item.type.indexOf(NameSpace.fragments.text) !== -1) {
                                    EventDispatcher.sendEvent('ResounceHandler.addItemFromRapidAction', item);
                                }
                            };
                        })(i)
                    });
                }
            }
        }
    };

    resourceHandler.forceCompileButton = function() {
        var resourceElem = angular.element('.pnd-resource'); //find pnd-resource
        // add directive attribute
        promise = $q.defer();
        resourceElem.addClass('resource-menu');
        $compile(resourceElem)($rootScope);
        promise.resolve();

        setTimeout(function() {
            EventDispatcher.sendEvent('Pundit.forceCompileButton');
            $rootScope.$$phase || $rootScope.$digest();
        }, 10);

    };


    // add directive attribute
    resourceElem.addClass('resource-menu');
    //compile the DOM
    $compile(resourceElem)($rootScope);
    promise.resolve();

    initContextualMenu();

    return resourceHandler;
});