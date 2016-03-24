angular.module('Pundit2.Annomatic')

.constant('ANNOMATICDEFAULTS', {
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic
     *
     * @description
     * `object`
     *
     * Configuration for Annomatic module
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.container
     *
     * @description
     * `string`
     *
     * Container in which will be saved items created by automatic annotation
     *
     * Default value:
     * <pre> container: 'annomatic' </pre>
     */
    container: 'annomatic',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.cMenuType
     *
     * @description
     * `string`
     *
     * Contextual menu type showed by items contained inside directive
     *
     * Default value:
     * <pre> cMenuType: 'annomatic' </pre>
     */
    cMenuType: 'annomatic',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.source
     *
     * @description
     * `string`
     *
     * Set the service called by Annomatic to get annotation suggested: 'DataTXT' or 'gramsci' or 'NER'
     *
     * Default value:
     * <pre> source: 'gramsci' </pre>
     */
    source: 'DataTXT',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.sourceLang
     *
     * @description
     * `string`
     *
     * Set the lang for DataTXT
     * TODO: the default conf can't be read in DataTXT service, but can be overwritten by an external conf
     *
     * Default value:
     * <pre> sourceLang: undefined </pre>
     */
    sourceLang: undefined,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.sourceURL
     *
     * @description
     * `string`
     *
     * Propety used to set the NER resource URL. At the moment you can't set DataTXT. NB: you must set this value in the conf if you use NER
     *
     * Default value:
     * <pre> sourceURL: 'http://localhost/ner' </pre>
     */
    sourceURL: 'http://localhost/ner',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.property
     *
     * @description
     * `string` or `obj`
     *
     * Propety used to save the annotations on the server. You can pass the uri of the property (this must be available in pundit)
     * or the complete object as pundit property convention ({uri, type, label, range, domain ...})
     *
     * Default value:
     * <pre> property: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy' </pre>
     */
    property: 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.minConfidence
     *
     * @description
     * `string`
     *
     * Min confidence
     *
     * Default value:
     * <pre> minConfidence: 0.65 </pre>
     */
    minConfidence: 0.65,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.partialSelection
     *
     * @description
     * `boolean`
     *
     * Active/Disactive partial selection
     *
     * Default value:
     * <pre> partialSelection: false </pre>
     */
    partialSelection: false,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.targetsToSkip
     *
     * @description
     * `array`
     *
     * Targets to skip in area selection
     *
     * Default value:
     * <pre> targetsToSkip: [] </pre>
     */
    targetsToSkip: ['a', 'b', 'i', 'strong', 'td', 'tr'],

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Annomatic.skipTrim
     *
     * @description
     * `boolean`
     *
     * Skip trip for text sended to DataTXT
     *
     * Default value:
     * <pre> skipTrim: false </pre>
     */
    skipTrim: false
})

/**
 * @ngdoc service
 * @name Annomatic
 * @module Pundit2.Annomatic
 * @description
 *
 * For the configuration of this module, see {@link #!/api/punditConfig/object/modules#Annomatic here}
 */
.service('Annomatic', function(ANNOMATICDEFAULTS, BaseComponent, EventDispatcher, NameSpace,
    DataTXTResource, XpointersHelper, ItemsExchange, TextFragmentHandler, ImageHandler, TypesHelper,
    Toolbar, DBPediaSpotlightResource, Item, AnnotationsCommunication, NameEntityRecognitionResource,
    $rootScope, $timeout, $document, $window, $q, Consolidation, ContextualMenu, TextFragmentAnnotator,
    AnnotationsExchange, ModelHelper, MyPundit, $compile) {

    var annomatic = new BaseComponent('Annomatic', ANNOMATICDEFAULTS);

    var state = {
        isRunning: false
    };

    var scanBtn = null,
        lastUsedTarget = null;

    EventDispatcher.sendEvent('Annomatic.isRunning', state.isRunning);

    annomatic.ann = {
        // The annotations, by Item uri
        byUri: {},
        // The annotations, by number: we need it to go the next/prev
        byNum: [],

        // Maps to go back and forth from annotation number to URI.
        // numToUri has num as index, uri as value
        numToUriMap: {},
        uriToNumMap: {},

        // list of numbers for the given id (same entity for multiple fragments)
        byId: {},
        // scopes for the popovers, indexed by num
        autoAnnScopes: [],
        // list of numbers for the given state
        byState: {},
        // list of numbers for the given type
        byType: {},
        // Key-value pair for the types
        typesOptions: [],
        savedById: [],
        savedByNum: []
    };

    annomatic.area = null;
    annomatic.annotationNumber = 0;
    annomatic.userAnnotations = [];
    annomatic.scanBtnStyle = {};

    if (annomatic.options.partialSelection) {
        ContextualMenu.addAction({
            type: [
                annomatic.options.cMenuType
            ],
            name: 'showAllItems',
            label: 'Search items in this area',
            showIf: function() {
                return true;
            },
            priority: 10,
            action: function() {
                MyPundit.login().then(function(logged) {
                    if (logged) {
                        Consolidation.wipe();
                        annomatic.getAnnotationByArea();
                        mouseCheck = false;
                    }
                });
            }
        });
    }

    var addButton = function() {
        var button = angular.element('<scan-btn></scan-btn>');
        angular.element('.pnd-wrp').append(button);
        $compile(button)($rootScope);
    };

    // Tries to find the given array of DataTXT annotations in the child nodes of the
    // given node. Finding them might be a very delicate and fun dance!
    // Returns an array of objects with range and annotation in them
    var findAnnotations = function(el, annotations) {
        var node = el[0];
        // var text = el.html();

        annomatic.log('##### Wrapping annotations ', annotations.length, annotations);

        var stack = [node],
            currentOffset = 0,
            currentAnnotationNum = 0,
            currentAnnotation = annotations[currentAnnotationNum],
            sub, start, end, addedSpaces, currentNode, found,
            foundAnnotations = [],
            correctedEmtpyNode = false;

        // Cycle over the nodes in the stack: depth first. We start from the given node
        while ((currentNode = stack.pop()) && currentAnnotationNum < annotations.length) {

            annomatic.log('Popped node ', currentNode, ' current offset = ' + currentOffset);

            // Spaces added to the current offsets to match the real content, it will
            // be used to create valid ranges
            addedSpaces = 0;

            // Not a text node, push every child in the stack starting from the last, so
            // the first popped will be the first child: depth first visit
            if (!XpointersHelper.isTextNode(currentNode)) {
                if (currentNode.hasChildNodes()) {
                    var childNodes = currentNode.childNodes;
                    for (var len = childNodes.length; len--;) {
                        stack.push(childNodes[len]);
                        annomatic.log('Pushing node ', childNodes[len]);
                    }
                }

                // If it's a text node.. let the dance begin!
            } else {

                // Trimmed content: DataTXT strips multiple spaces (more than allowed in HTML)
                // to return a nice looking text only string. We strip the content of the
                // current text node, hopefully to get the very same result as DataTXT
                var trimmedContent = trim(currentNode.textContent);

                // Empty text nodes: they just contain spaces and/or \r\n
                if (trimmedContent.length === 0) {

                    // All of the first multiple spaces will get fully trimmed, ignore them
                    if (currentOffset === 0) {
                        annomatic.log('Skipping FIRST empty text node.');
                    } else if (correctedEmtpyNode) {
                        annomatic.log('Skipping Consecutive empty text node, without correcting again.');
                    } else {
                        // If it's not the first text node, trim() will just collapse double spaces
                        // and \n into a single space. In that case we need to correct the
                        // currentOffset by 1
                        if (trimDoubleSpaces(currentNode.textContent).length === 1) {
                            annomatic.log('Skipping intermediate empty text node, correcting offset by 1');
                            currentOffset += 1;
                            correctedEmtpyNode = true;
                        } else {
                            annomatic.log('OUCH! trimDoubleSpaces fail?!!? --' + trimDoubleSpaces(currentNode.textContent) + '--');
                        }
                    }

                } else {

                    // Cycle over annotations, until the current annotation .end
                    // is out of this node's content length. In that case we found the first
                    // annotation belonging to the next node. We let the outer while pop the
                    // next node and cycle over and over and over again.
                    while (currentAnnotation.end <= currentOffset + trimmedContent.length + 1) {

                        // True if we found an annotation on this node
                        found = false;

                        // HTML allows multiple spaces pretty much everywhere, rendering them
                        // as a single one. New lines as well.
                        // Gather every multiple space in this node: DataTXT strips them
                        // off replacing them with single spaces, new lines included. We need
                        // to know how many spaces got skipped so to being able to match
                        // the annotated words even if after multiple spaces.
                        var spacesLen = multipleSpacesLengthInContent(currentNode.textContent);

                        // There might be no spaces at all .. check it out!
                        spacesLen.push(0);

                        // For each number of spaces found, try to match the content
                        for (var l = spacesLen.length; l--;) {

                            start = spacesLen[l] + currentAnnotation.start - currentOffset + addedSpaces;
                            end = spacesLen[l] + currentAnnotation.end - currentOffset + addedSpaces;
                            sub = currentNode.textContent.substring(start, end);

                            annomatic.log('Trying to add ' + spacesLen[l] + ' spaces: --' +
                                sub + '-- vs --' + currentAnnotation.spot + '-- (' +
                                start + ' to ' + end + ')');

                            // TODO: we are losing all those annotations which are multiple words AND
                            // in the DOM are splitted by spaces like 'aa     bb' or "aa\n    bb".
                            // It might be possible to catch this by checking if sub contains a
                            // good number of spaces (with the regexp), add that number to the end
                            // offset et voilà... should work.

                            // Found the annotated fragment!
                            if (currentAnnotation.spot === sub) {
                                addedSpaces += spacesLen[l];
                                found = true;
                                annomatic.log('@@ Found annotation ' + currentAnnotation.spot);

                                var range = $document[0].createRange();
                                range.setStart(currentNode, start);
                                range.setEnd(currentNode, end);

                                if (range.toString() !== currentAnnotation.spot) {
                                    annomatic.err('Annotation and range content do not match!! :((');
                                } else {
                                    foundAnnotations.push({
                                        range: range,
                                        annotation: currentAnnotation
                                    });
                                }
                                break;
                            }
                        } // for l = spacesLen.length

                        if (!found) {
                            annomatic.log('Annotation NOT FOUND: ', currentAnnotation);
                        }

                        currentAnnotationNum++;
                        currentAnnotation = annotations[currentAnnotationNum];

                        if (currentAnnotationNum >= annotations.length) {
                            annomatic.log('Annotations are over!!! We are done!!');
                            break;
                        }

                    } // while currentAnnotation.end .. annotation should be in this text node


                    // Let's move on to the next node, update current offset with the length of
                    // the node we just finished with.
                    // If the current offset is still 0, we need to pay attention to any leading
                    // spaces and trim them off. They got trimmed by trim(), not by
                    // trimDoubleSpaces()
                    var doubleSpaceTrimmed = trimDoubleSpaces(currentNode.textContent);

                    if (doubleSpaceTrimmed.match(/^\s\s*/) && (correctedEmtpyNode || currentOffset === 0)) {
                        currentOffset += doubleSpaceTrimmed.length - 1;
                        annomatic.log('Moving to next node (corrected by leading space) with current offset = ' + currentOffset);
                    } else {
                        currentOffset += doubleSpaceTrimmed.length;
                        annomatic.log('Moving to next node with current offset = ' + currentOffset);
                    }
                    correctedEmtpyNode = false;

                } // if trimmedContentLength
            } // if isTextNode()

        } // while currentNode

        annomatic.log('Dance finished, found ' + foundAnnotations.length + ' annotations: ', foundAnnotations);
        return foundAnnotations;
    }; // findAnnotations()

    // Trims initial spaces, ending spaces, double spaces
    var trim = function(string) {
        return string
            .replace(/[\r\n]/g, " ")
            .replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '')
            .replace(/\s+/g, ' ');
    };

    var trimDoubleSpaces = function(string) {
        return string
            .replace(/[\r\n]/g, " ")
            .replace(/\s+/g, ' ');
    };

    // Returns an array of every multiple space found in the string, like ["  ", "    "]
    var multipleSpacesInContent = function(string) {
        var ret = string.match(/(\s\s+)/g);

        if (ret === null) {
            return [];
        }

        // New lines? Replace them with a space ...
        for (var len = ret.length; len--;) {
            if (ret[len].match(/\n/)) {
                ret[len] = ret[len].replace(/[\r\n]/g, " ");
            }
        }

        return ret;
    };

    // Given a string, returns an array of numbers of multiple spaces found, with no
    // repetitions, sorted. From ["   ", "  ", "     "] to [2, 3, 5]
    var multipleSpacesLengthInContent = function(string) {
        var doubleSpaces = multipleSpacesInContent(string),
            len = doubleSpaces.length;

        if (len === 0) {
            return [];
        }

        var ret = [],
            seen = {};
        for (var i = 0; i < len; i++) {
            var current = doubleSpaces[i].length - 1;
            if (typeof(seen[current]) === "undefined") {
                seen[current] = true;
                ret.push(current);
            }
        }

        // Return them sorted numerically
        return ret.sort(function(a, b) {
            return a - b;
        });
    };


    // TODO: move this to some kind of configured CONSTANTS,
    // and use them instead of magic 'strings'
    annomatic.stateClassMap = {
        'waiting': 'ann-waiting',
        'active': 'ann-active',
        'accepted': 'ann-ok',
        'removed': 'ann-removed',
        'hidden': 'ann-hidden'
    };


    /**
     * @ngdoc method
     * @name Annomatic#reset
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Reset all annomatic states
     *
     */
    // TODO: do we need to do more stuff to reset everything and start from scratch?
    annomatic.reset = function() {
        annomatic.ann.typesOptions = [];

        for (var s in annomatic.stateClassMap) {
            annomatic.ann.byState[s] = [];
        }
    };
    annomatic.reset();

    // Creates various utility indexes and counts stuff around to
    // show various information to the user
    var analyze = function(from, to) {

        var byId = annomatic.ann.byId,
            byType = annomatic.ann.byType;

        annomatic.log('Analyzing from ' + from + ' to ' + to);

        for (var l = from; l < to; l++) {
            var ann = annomatic.ann.byNum[l],
                id = ann.id,
                types = ann.types || [];

            // index by id
            if (id in byId) {
                byId[id].push(l);
            } else {
                byId[id] = [l];
            }

            // index by type
            for (var typeLen = types.length; typeLen--;) {
                var t = types[typeLen];
                if (t in byType) {
                    byType[t].push(l);
                } else {
                    annomatic.ann.typesOptions.push({
                        value: t
                    });
                    byType[t] = [l];
                }
            }

            // Init all annotations to waiting
            ann.state = "waiting";
            ann.lastState = "waiting";

            annomatic.ann.byState[ann.state].push(l);
        } // for l

        // Recalculate the number of annotations for each type and update the labels
        // for the select
        for (l = annomatic.ann.typesOptions.length; l--;) {
            var op = annomatic.ann.typesOptions[l],
                uri = op.value;

            op.label = TypesHelper.getLabel(uri) + " (" + byType[uri].length + ")";
        }

        // Sort them from most used to least used
        annomatic.ann.typesOptions = annomatic.ann.typesOptions.sort(function(a, b) {
            return byType[b.value].length - byType[a.value].length;
        });

    }; // analyze()

    var updateStates = function(num, from, to) {
        var byState = annomatic.ann.byState,
            idx = byState[from].indexOf(num);
        byState[to].push(num);
        byState[from].splice(idx, 1);
    };

    /**
     * @ngdoc method
     * @name Annomatic#setState
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Set annotations state of annomatic
     *
     *
     * @param {number} number of the annotation
     * @param {boolean} value of the new state
     *
     */
    annomatic.setState = function(num, state) {
        var ann = annomatic.ann.byNum[num],
            scope = annomatic.ann.autoAnnScopes[num];

        // Update counters and indexes for states
        updateStates(num, ann.state, state);

        // Save the lastState for hover effects
        ann.lastState = ann.state;

        ann.state = state;

        var stateClass = annomatic.stateClassMap[state];
        if (ann.hidden) {
            stateClass += ' ' + annomatic.stateClassMap.hidden;
        }

        scope.setStateClass(annomatic.stateClassMap[ann.lastState], stateClass);

    };

    /**
     * @ngdoc method
     * @name Annomatic#setLastState
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Set last state of an annotation
     *
     * @param {number} number of the annotation
     *
     */
    annomatic.setLastState = function(num) {
        var ann = annomatic.ann.byNum[num],
            scope = annomatic.ann.autoAnnScopes[num];

        updateStates(num, ann.state, ann.lastState);
        ann.state = ann.lastState;

        var stateClass = annomatic.stateClassMap[ann.state];
        if (ann.hidden) {
            stateClass += ' ' + annomatic.stateClassMap.hidden;
        }

        scope.setStateClass(annomatic.stateClassMap[ann.lastState], stateClass);
    };

    /**
     * @ngdoc method
     * @name Annomatic#getDataTXTAnnotations
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Given an HTML node, will query DataTXT for annotations on the contents of that node
     * solving the promise when done.
     *
     * @param {DOMElement} current node to be processed
     * @return {Promise} promise will be resolved when the data is returned from datatxt
     *
     */
    annomatic.getDataTXTAnnotations = function(node) {
        var promise = $q.defer(),
            element = angular.element(node),
            content = element.text();

        // It is possible to pass to DataTXT the HTML form of the content, findAnnotations()
        // will to the magic rest ;)
        // content = element.html();

        if (annomatic.options.skipTrim === false) {
            // If we're not passing the HTML but just the text, we strip out extra spaces at beginning
            // and end, and multiple spaces in the middle of the text
            content = trim(content);
        }

        annomatic.log('Querying DataTXT for annotations on content: ', content);


        annomatic.annotations = DataTXTResource.getAnnotations({
                "$app_id": "cc85cdd8",
                "$app_key": "668e4ac4f00f64c43ab4fefd5c8899fa",
                text: content
                    // html: content
            },
            function(data) {

                annomatic.log('Received ' + data.annotations.length + ' annotations from DataTXT');
                var item,
                    allValidAnnotations = findAnnotations(element, data.annotations),
                    validAnnotations = [],
                    oldAnnotationNumber = annomatic.annotationNumber,
                    skippedNum = 0;

                // validAnnotations = allValidAnnotations;
                // TODO: improve confidence management
                for (var a in allValidAnnotations) {
                    if (allValidAnnotations[a].annotation.confidence > annomatic.options.minConfidence) {
                        validAnnotations.push(allValidAnnotations[a]);
                    }
                }

                annomatic.annotationNumber += validAnnotations.length;
                annomatic.currAnn = 0;

                for (var l = validAnnotations.length, i = 0; i < l; i++) {
                    var currentIndex = oldAnnotationNumber + i - skippedNum,
                        stillAccepted = false;

                    item = TextFragmentHandler.createItemFromRange(validAnnotations[i].range);

                    // TODO: optimize it with a graph map
                    for (a in annomatic.userAnnotations) {
                        var currentAnnotation = annomatic.userAnnotations[a],
                            currentGraph = currentAnnotation.graph[item.uri],
                            annotationObjectUri = validAnnotations[i].annotation.uri;

                        if (typeof currentGraph !== 'undefined') {
                            if (typeof currentGraph[annomatic.options.property] !== 'undefined') {
                                if (typeof currentGraph[annomatic.options.property][0] !== 'undefined') {
                                    if (currentGraph[annomatic.options.property][0].value === annotationObjectUri)  {
                                        stillAccepted = true;
                                        annomatic.log('User annotation still present');
                                    }
                                }
                            }
                        }
                    }

                    if (stillAccepted) {
                        annomatic.annotationNumber--;
                        skippedNum++;
                        continue;
                    }

                    annomatic.ann.byNum[currentIndex] = validAnnotations[i].annotation;
                    annomatic.ann.numToUriMap[currentIndex] = item.uri;
                    annomatic.ann.uriToNumMap[item.uri] = currentIndex;
                    annomatic.ann.byUri[item.uri] = validAnnotations[i].annotation;
                    ItemsExchange.addItemToContainer(item, annomatic.options.container);

                    item = createItemFromDataTXTAnnotation(validAnnotations[i].annotation);
                    ItemsExchange.addItemToContainer(item, annomatic.options.container);
                }

                analyze(oldAnnotationNumber, annomatic.annotationNumber);
                promise.resolve();

            },
            function(msg) {
                annomatic.err('Error loading annotations from DataTXT');
                promise.resolve(msg);
            }
        );

        return promise.promise;
    };

    var createItemFromDataTXTAnnotation = function(ann) {
        var values = {};

        values.uri = ann.uri;

        if (typeof ann.types === 'undefined') {
            values.type = ['http://dbpedia.org/ontology/Thing'];
        } else if (ann.types.length === 0) {
            values.type = ['http://dbpedia.org/ontology/Thing'];
        } else {
            values.type = angular.copy(ann.types);
        }

        values.description = ann.abstract;
        values.label = ann.label;

        if (values.label.length > TextFragmentHandler.options.labelMaxLength) {
            values.label = values.label.substr(0, TextFragmentHandler.options.labelMaxLength) + ' ..';
        }

        if ('thumbnail' in ann.image) {
            values.image = ann.image.thumbnail;
        }

        return new Item(values.uri, values);
    };

    /**
     * @ngdoc method
     * @name Annomatic#hideAnn
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Hide an annotation
     *
     * @param {number} number of the annotation
     *
     */
    annomatic.hideAnn = function(num) {
        var ann = annomatic.ann.byNum[num],
            scope = annomatic.ann.autoAnnScopes[num];

        ann.hidden = true;
        scope.setStateClass(annomatic.stateClassMap[ann.state], annomatic.stateClassMap.hidden);
    };

    /**
     * @ngdoc method
     * @name Annomatic#showAnn
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Show an annotation
     *
     * @param {number} number of the annotation
     *
     */
    annomatic.showAnn = function(num) {
        var ann = annomatic.ann.byNum[num],
            scope = annomatic.ann.autoAnnScopes[num];

        ann.hidden = false;
        scope.setStateClass(annomatic.stateClassMap.hidden, annomatic.stateClassMap[ann.state]);
    };



    /**
     * @ngdoc method
     * @name Annomatic#getDataTXTAnnotations
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Given an array of types, shows only the annotations with that
     * type.
     *
     * @param {array} list of types
     *
     */
    annomatic.setTypeFilter = function(types) {

        var byType = annomatic.ann.byType,
            byNum = annomatic.ann.byNum,
            toShow = {};

        annomatic.log('Setting type filter to ', types);

        // No filters: just show all
        if (types.length === 0) {
            for (var i = byNum.length; i--;) {
                annomatic.showAnn(i);
            }
        } else {
            // Get a unique list of ids to show
            for (var t in types) {
                var type = types[t];
                for (var j = byType[type].length; j--;) {
                    toShow[byType[type][j]] = true;
                }
            }

            // Cycle over all annotations and show/hide when needed
            for (var k = byNum.length; k--;) {
                if (k in toShow) {
                    annomatic.showAnn(k);
                } else {
                    annomatic.hideAnn(k);
                }
            }
        }

        // Force an apply after modifying the classes
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            $timeout(function() {
                $rootScope.$apply();
            }, 1);
        } else {
            $rootScope.$apply();
        }

    };

    /**
     * @ngdoc method
     * @name Annomatic#closeAll
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Close all popover of the annotations
     *
     *
     */
    annomatic.closeAll = function() {
        for (var l = annomatic.ann.byState.active.length; l--;) {
            var num = annomatic.ann.byState.active[l];
            annomatic.ann.autoAnnScopes[num].hide();
        }
    };

    // If called with no parameter continues from last annotation
    annomatic.currAnn = 0;

    /**
     * @ngdoc method
     * @name Annomatic#reviewNext
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * If called with no parameter continues from last annotation
     *
     * @param {number} number of the started annotation
     *
     */
    annomatic.reviewNext = function(from) {

        if (annomatic.annotationNumber === 0) {
            annomatic.log('No annotation to review....');
            return;
        }

        if (annomatic.ann.byState.waiting.length === 0) {
            annomatic.log('All reviewed!');
            return;
        }

        annomatic.closeAll();

        // No from, start from last currentAnn
        if (typeof(from) === "undefined") {
            from = annomatic.currAnn;
        } else {
            from = parseInt(from, 10);
        }

        // Start from 0 if we reach the ends
        if (from >= annomatic.annotationNumber || from < 0) {
            annomatic.currAnn = 0;
        } else {
            annomatic.currAnn = from;
        }

        // Look for the next 'waiting' state starting from the current one
        while (annomatic.ann.byNum[annomatic.currAnn].hidden === true || annomatic.ann.byNum[annomatic.currAnn].state !== "waiting") {
            annomatic.currAnn++;
            if (annomatic.currAnn === annomatic.annotationNumber) {
                break;
            }
        }

        if (annomatic.currAnn < annomatic.annotationNumber) {

            annomatic.ann.autoAnnScopes[annomatic.currAnn].show();
        } else {
            // TODO: notify review is done for the current filters?
            // console.log('All reviewed, for the current filters!');
        }

    };

    annomatic.log('Component up and running');


    // TODO: new code to be integrated

    /**
     * @ngdoc method
     * @name Annomatic#hardReset
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Reset the states and all annotations in annomatic
     *
     *
     */
    annomatic.hardReset = function() {
        ItemsExchange.wipeContainer(annomatic.options.container);
        annomatic.ann = {
            byUri: {},
            byNum: [],
            numToUriMap: {},
            uriToNumMap: {},
            byId: {},
            autoAnnScopes: [],
            byState: {},
            byType: {},
            typesOptions: [],
            savedByNum: [],
            savedById: []
        };
        annomatic.annotationNumber = 0;
        annomatic.area = null;
        annomatic.reset();
    };

    /**
     * @ngdoc method
     * @name Annomatic#run
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Start annomatic
     *
     */
    annomatic.run = function(userAnnotations) {
        state.isRunning = true;
        TextFragmentHandler.turnOff();
        ImageHandler.turnOff();

        if (Toolbar.isActiveTemplateMode()) {
            Toolbar.toggleTemplateMode();
        }

        if (annomatic.options.partialSelection) {
            angular.element('body').on('mousedown', mouseDownHandler);
        }

        if (typeof userAnnotations !== 'undefined') {
            annomatic.userAnnotations = userAnnotations;
        }

        angular.element('*').on('mouseenter', mouseEnterHandler);

        addButton();

        EventDispatcher.sendEvent('Annomatic.isRunning', state.isRunning);
        $rootScope.$emit('annomatic-run');
    };

    /**
     * @ngdoc method
     * @name Annomatic#stop
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Stop annomatic
     *
     */
    annomatic.stop = function() {
        annomatic.closeAll();
        annomatic.hardReset();
        annomatic.userAnnotations = [];

        state.isRunning = false;
        TextFragmentHandler.turnOn();
        ImageHandler.turnOn();

        if (annomatic.options.partialSelection) {
            angular.element('body').off('mousedown', mouseDownHandler);
            angular.element('body').off('mouseup', mouseUpHandler);
        }

        angular.element('*').off('mouseenter', mouseEnterHandler);
        angular.element('.selecting-ancestor').off('click', areaClick);
        angular.element('.pnd-annomatic-scan-btn').remove();

        angular.element('.selected-area-results')
            .removeClass('selected-area-results');

        scanBtn = null;
        lastUsedTarget = null;

        EventDispatcher.sendEvent('Annomatic.isRunning', state.isRunning);
        $rootScope.$emit('annomatic-stop');
    };

    /**
     * @ngdoc method
     * @name Annomatic#save
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Create a triple and save the annotation in annotation server
     *
     * @param {number} number of the annotation to be saved
     *
     */
    annomatic.save = function(num, entNum) {
        var uri = annomatic.ann.numToUriMap[num];
        var ann = annomatic.ann.byUri[uri];
        var objUri = ann.uri;

        if (typeof(entNum) !== 'undefined')  {
            objUri = ann.entities[entNum].uri;
        }

        // var items = buildRDFItems(uri, annomatic.options.property, objUri);
        // var graph = buildGraph(uri, annomatic.options.property, objUri);
        // var targets = buildTargets(uri, annomatic.options.property, objUri);

        var currentStatement = {
            scope: {
                get: function() {
                    return {
                        subject: ItemsExchange.getItemByUri(uri),
                        predicate: ItemsExchange.getItemByUri(annomatic.options.property),
                        object: ItemsExchange.getItemByUri(objUri)
                    };
                }
            }
        };

        var modelData = ModelHelper.buildAllData([currentStatement]);

        AnnotationsCommunication.saveAnnotation(
            modelData.graph,
            modelData.items,
            modelData.flatTargets,
            undefined, // templateID
            undefined, // skipConsolidation
            modelData.target, // Can be undefined if ModelHelper is acting in mode1
            modelData.type
        ).then(function(annId) {
            annomatic.ann.savedById.push(annId);
            annomatic.ann.savedByNum.push(num);
            annomatic.setState(num, 'accepted');
            annomatic.reviewNext(num + 1);

            annomatic.userAnnotations[annId] = AnnotationsExchange.getAnnotationById(annId);
        });
    };

    // annomatic.saveAll = function(){
    //     // save all accepted annotation
    //     for (var i=0; i<annomatic.ann.byState.accepted.length; i++) {
    //         var index = annomatic.ann.byState.accepted[i];
    //         annomatic.save(index);
    //     }
    // };

    /**
     * @ngdoc method
     * @name Annomatic#isRunning
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Return the current state of annomatic: running or not runnging
     *
     * @return {boolean} current state of annomatic
     *
     */
    annomatic.isRunning = function() {
        return state.isRunning;
    };


    // TODO: remove it
    var NERMock = {
        "timestamp": "1234455",
        "time": "234",
        "annotations": [{
            "uri": "http://purl.org/gramscisource/dictionary/entry/Risorgimento",
            "endOffset": "38",
            "endXpath": "/html[1]/body[1]/div[@about='http://89.31.77.216/quaderno/2/nota/2']/div[1]/text[1]/p[1]/emph[1]/text()[1]",
            "label": "Risorgimento",
            "spot": "Risorgimento",
            "startOffset": "26",
            "startXpath": "/html[1]/body[1]/div[@about='http://89.31.77.216/quaderno/2/nota/2']/div[1]/text[1]/p[1]/emph[1]/text()[1]",
            "entities": [{
                "label": "Risorgimento mento",
                "uri": "http://purl.org/my_sample_uri",
                "types": ["type city", "type capital "],
                "abstract": "Risorgimento is the blabla...",
                "depiction": "Thumbnail URL"
            }, {
                "label": "Risorgimento non mento",
                "uri": "http://purl.org/my_sample_uri_2",
                "types": ["type city", "type region "],
                "abstract": "Risorgimento is a bloblo",
                "depiction": "Thumbnail URL"
            }]
        }]
    };

    /**
     * @ngdoc method
     * @name Annomatic#getNERAnnotations
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Given an HTML node, will query NER service for annotations on the contents of that node
     * solving the promise when done.
     *
     * @param {DOMElement} current node to be processed
     * @return {Promise} promise will be resolved when the data is returned from NER service
     *
     */
    annomatic.getNERAnnotations = function(node) {
        var promise = $q.defer();

        if (typeof(node) === 'undefined') {
            promise.resolve();
            return;
        }

        var element = angular.element(node);
        var about = element.attr('about');
        var content = element.parent().html();

        NameEntityRecognitionResource.getAnnotations({
                doc_id: about, // jshint ignore:line
                html_fragment: content // jshint ignore:line
            },
            function(data) {

                // TODO: temp if
                if (annomatic.options.source === 'gramsci') {
                    consolidateNERSpots(data);
                } else {
                    consolidateNERSpots(NERMock);
                }
                promise.resolve();
            },
            function(msg) {
                annomatic.log('Error msg: ', msg);
                promise.resolve();
            }
        );

        return promise.promise;
    };

    /**
     * @ngdoc method
     * @name Annomatic#getAnnotations
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Call service set in the configuration
     *
     * @param {DOMElement} current node to be processed
     * @return {Promise} promise will be resolved when the data is returned from the current service
     *
     */
    annomatic.getAnnotations = function(node) {
        if (annomatic.options.source === 'DataTXT') {
            return annomatic.getDataTXTAnnotations(node);
        } else if (annomatic.options.source === 'gramsci' || annomatic.options.source === 'NER') {
            return annomatic.getNERAnnotations(node);
        }
    };

    var createItemFromNERAnnotation = function(ann) {
        var values = {};

        values.uri = ann.uri;

        values.label = ann.label;
        if (values.label.length > TextFragmentHandler.options.labelMaxLength) {
            values.label = values.label.substr(0, TextFragmentHandler.options.labelMaxLength) + ' ..';
        }

        // TODO what types ?
        if (typeof(ann.types) === "undefined") {
            values.type = ['http://dbpedia.org/ontology/Thing'];
        } else {
            values.type = angular.copy(ann.types);
        }
        if (typeof(ann.abstract) === "undefined") {
            values.description = ann.label + " imported from NER Dictionary";
        } else {
            values.description = ann.abstract;
        }

        return new Item(values.uri, values);
    };


    // consolidate all spots (wrap text inside span and add popover toggle icon)
    var consolidateNERSpots = function(data) {

        var annotations = data.annotations;
        var validAnnotations = [];
        var i, ann;

        // cycle on all annotations received from NER service
        for (i = 0; i < annotations.length; i++) {

            ann = annotations[i];
            // get the current node from xpath
            var startCurrentNode = XpointersHelper.getNodeFromXpath(ann.startXpath.replace('/html[1]/body[1]', '/'));
            var endCurrentNode = XpointersHelper.getNodeFromXpath(ann.endXpath.replace('/html[1]/body[1]', '/'));

            annomatic.log('get node from xpath', startCurrentNode, endCurrentNode);

            if (!XpointersHelper.isTextNode(startCurrentNode) || !XpointersHelper.isTextNode(endCurrentNode)) {
                // TODO
                // we must continue the search in the next node ???
                // do somethings with child nodes (complex case)
                annomatic.err('node is not text', startCurrentNode, endCurrentNode);
            } else {
                // If it's a text node (simple case)

                var range = $document[0].createRange();
                range.setStart(startCurrentNode, ann.startOffset);
                range.setEnd(endCurrentNode, ann.endOffset);

                if (range.toString() !== ann.spot) {
                    annomatic.err('Annotation spot and range do not match!! :((');
                } else {
                    annomatic.log('Annotation spot and range match!! :))');

                    // create item from spot (text fragment)
                    var item = TextFragmentHandler.createItemFromRange(range);
                    ItemsExchange.addItemToContainer(item, annomatic.options.container);

                    validAnnotations.push({
                        ann: ann,
                        frUri: item.uri
                    });

                    if (typeof(ann.entities) === 'undefined') {
                        // create item from resource
                        ItemsExchange.addItemToContainer(createItemFromNERAnnotation(ann), annomatic.options.container);
                    } else {
                        for (var ent in ann.entities) {
                            ItemsExchange.addItemToContainer(createItemFromNERAnnotation(ann.entities[ent]), annomatic.options.container);
                        }
                    }

                }

            }

        } // end for annotations

        var oldAnnotationNumber = annomatic.annotationNumber;
        annomatic.annotationNumber += validAnnotations.length;
        annomatic.currAnn = 0;

        // cycle over the valid annotations (range and spot match)
        // and update the state
        for (i = 0; i < validAnnotations.length; i++) {

            var currentIndex = i + oldAnnotationNumber;
            ann = validAnnotations[i].ann;

            annomatic.ann.byNum[currentIndex] = ann;
            annomatic.ann.numToUriMap[currentIndex] = validAnnotations[i].frUri;
            annomatic.ann.uriToNumMap[validAnnotations[i].frUri] = currentIndex;
            annomatic.ann.byUri[validAnnotations[i].frUri] = ann;
        }

        analyze(oldAnnotationNumber, annomatic.annotationNumber);

    };

    var getSelectedRange = function() {
        var range;

        if ($window.getSelection().rangeCount === 0) {
            // console.log('Range count 0!');
            return null;
        }

        range = $window.getSelection().getRangeAt(0);

        // If the selected range is empty (this happens when the user clicks on something)...
        if (range !== null && (range.startContainer === range.endContainer) && (range.startOffset === range.endOffset)) {
            // console.log("Range is not null, but start/end containers and offsets match: no selected range.");
            return null;
        }

        return range;

    }; // getSelectedRange()

    var ancestor;
    var mouseCheck = false;

    function mouseDownHandler() {
        angular.element('body').on('mousemove', function() {
            var r = getSelectedRange();

            if (r && r.commonAncestorContainer !== ancestor) {
                if (ancestor) {
                    angular.element(ancestor).removeClass('selecting-ancestor');
                }
                ancestor = r.commonAncestorContainer;

                if (ancestor.nodeType === Node.TEXT_NODE) {
                    ancestor = ancestor.parentNode;
                }
                angular.element(ancestor).addClass('selecting-ancestor');
            }
            mouseCheck = false;
        });
        angular.element('body').on('mouseup', mouseUpHandler);
    }

    function mouseUpHandler(upEvt) {
        angular.element('body').off('mouseup', mouseUpHandler);
        angular.element('body').off('mousemove');

        var range = getSelectedRange();
        if (range === null || mouseCheck) {
            return;
        }

        // AnnotationSidebar.toggleLoading();
        var annotationsRootNode;
        if (ancestor) {
            angular.element(ancestor).removeClass('selecting-ancestor');
            annotationsRootNode = angular.element(ancestor);
            annomatic.area = annotationsRootNode;
            mouseCheck = true;
            $document[0].getSelection().removeAllRanges();
            ContextualMenu.show(upEvt.pageX, upEvt.pageY, annotationsRootNode, annomatic.options.cMenuType);
            // $rootScope.$apply();
        }
    }

    function mouseEnterHandler(event) {
        var currentTarget = event.currentTarget,
            targetsToSkip = annomatic.options.targetsToSkip,
            rects = {},
            currentHeight, currentWidth, currentTop, currentLeft;

        var stopHandler = function() {
            lastUsedTarget = null;

            scanBtn.scanBtnStyle = {};
            $rootScope.$$phase || $rootScope.$digest();
            event.stopImmediatePropagation();
        };

        angular.element('.selecting-ancestor')
            .off('click', areaClick)
            .removeClass('selecting-ancestor');

        if (TextFragmentHandler.isToBeIgnored(currentTarget) ||
            currentTarget.nodeName === 'IMG') {
            stopHandler();
            return;
        }

        if (currentTarget.className.indexOf('pnd-wrp') !== -1 &&
            lastUsedTarget !== null) {
            currentTarget = lastUsedTarget;
        }

        while (targetsToSkip.indexOf(currentTarget.nodeName.toLowerCase()) !== -1 ||
            angular.element(currentTarget).text().replace(' ', '').length < 90 &&
            currentTarget.parentNode.nodeName.toLowerCase() !== 'body') {
            currentTarget = currentTarget.parentNode;
        }

        if (currentTarget.className.indexOf('selected-area-results') !== -1 ||
            angular.element(currentTarget).text().replace(' ', '').length > 3200) {
            stopHandler();
            return;
        }

        if (angular.element('.pnd-annomatic-scan-btn').length === 0) {
            addButton();
        }

        if (scanBtn !== null && lastUsedTarget !== currentTarget) {
            rects = currentTarget.getBoundingClientRect();

            currentHeight = Math.max(0, rects.top > 0 ?
                Math.min(rects.height, window.innerHeight - rects.top) :
                (rects.bottom < window.innerHeight ? rects.bottom : window.innerHeight));

            currentWidth = rects.width < window.innerWidth ?
                rects.width : window.innerWidth;
                
            currentTop = rects.top > 0 ? rects.top : 0;
            currentLeft = rects.left > 0 ? rects.left : 0;

            scanBtn.scanBtnStyle = {
                top: currentTop + (currentHeight / 2) + window.scrollY - 16,
                left: currentLeft + (currentWidth / 2) + window.scrollX - 29
            };

            $rootScope.$$phase || $rootScope.$digest();
        }

        lastUsedTarget = currentTarget;

        angular.element(currentTarget)
            .addClass('selecting-ancestor')
            .on('click', areaClick);
        event.stopImmediatePropagation();
    }

    function areaClick() {
        if (lastUsedTarget === null) {
            return;
        }

        var annotationsRootNode = angular.element(lastUsedTarget);

        var isToBeSkipped = function(node) {
            var classToSkip = 'selected-area-results';

            while (node.nodeName.toLowerCase() !== 'body') {
                if (angular.element(node).hasClass(classToSkip)) {
                    return true;
                }

                if (node.parentNode === null) {
                    return false;
                }
                node = node.parentNode;
            }
            return false;
        };

        if (isToBeSkipped(lastUsedTarget)) {
            return;
        }

        if (lastUsedTarget !== null) {
            annotationsRootNode
                .removeClass('selecting-ancestor');
            angular.element('.pnd-annomatic-scan-btn')
                .remove();
            angular.element('.selected-area-results')
                .removeClass('selected-area-results');

            annomatic.area = annotationsRootNode;
            annomatic.getAnnotationByArea();
        }
    }

    annomatic.addScanBtnRef = function(scope) {
        scanBtn = scope;
        scanBtn.scanCurrentArea = areaClick;
    };

    /**
     * @ngdoc method
     * @name Annomatic#getAnnotationByArea
     * @module Pundit2.Annomatic
     * @function
     *
     * @description
     * Given an HTML node, will query the current service for annotations of the selected area
     *
     */
    annomatic.getAnnotationByArea = function() {
        var annotationsRootNode = annomatic.area;
        if (annotationsRootNode === null) {
            return;
        }

        annomatic.hardReset();
        EventDispatcher.sendEvent('Annomatic.loading', true);
        annomatic.getAnnotations(annotationsRootNode).then(function() {
            // AnnotationSidebar.toggleLoading();
            EventDispatcher.sendEvent('Annomatic.loading', false);
            angular.element(annotationsRootNode)
                .addClass('selected-area-results');
            Consolidation.consolidate(ItemsExchange.getItemsByContainer(annomatic.options.container));
            setTimeout(function() {
                TextFragmentAnnotator.showAll();
            }, 10);
        });
    };

    return annomatic;
});