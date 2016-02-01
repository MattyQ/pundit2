/*global Range*/

angular.module('Pundit2.Annotators')

.constant('XPOINTERSHELPERDEFAULTS', {
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper
     *
     * @description
     * `object`
     *
     * Configuration for XpointersHelper service
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.wrapNodeName
     *
     * @description
     * `string`
     *
     * The helper will use these node name and node classes to
     * wrap the consolidated DOM fragments. TextFragmentAnnotator and Handler
     * use these values too.
     *
     * Default value:
     * <pre> wrapNodeName: 'span' </pre>
     */
    wrapNodeName: 'span',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.wrapNodeClass
     *
     * @description
     * `string`
     *
     * The helper will use these node name and node classes to
     * wrap the consolidated DOM fragments. TextFragmentAnnotator and Handler
     * use these values too.
     *
     * Default value:
     * <pre> wrapNodeClass: 'span' </pre>
     */
    wrapNodeClass: 'pnd-cons',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.tempWrapNodeClass
     *
     * @description
     * `string`
     *
     * The helper will use these node name and node classes to
     * wrap the consolidated DOM fragments. TextFragmentAnnotator and Handler
     * use these values too.
     *
     * Default value:
     * <pre> tempWrapNodeClass: 'pnd-cons-temp' </pre>
     */
    tempWrapNodeClass: 'pnd-cons-temp',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.textFragmentIconClass
     *
     * @description
     * `string`
     *
     * Added by TextFragmentIcon directive, ignored when building xpointers
     *
     * Default value:
     * <pre> textFragmentIconClass: "pnd-text-fragment-icon" </pre>
     */
    textFragmentIconClass: 'pnd-text-fragment-icon',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.textFragmentHiddenClass
     *
     * @description
     * `string`
     *
     * Hidden fragment class
     *
     * Default value:
     * <pre> textFragmentHiddenClass: 'pnd-textfragment-hidden' </pre>
     */
    textFragmentHiddenClass: 'pnd-textfragment-hidden',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.consolidationClasses
     *
     * @description
     * `array of string`
     *
     * Nodes with these classes will be ignored when building xpointers
     * and consolidating annotations. Add here any other UI element class which
     * is not considered in the isConsolidationNode() method. wrapNodeClass and
     * textFragmentIconClass are already considered.
     *
     * Default value:
     * <pre> consolidationClasses: ['pnd-cons-svg'] </pre>
     */
    consolidationClasses: ['pnd-cons-svg'],

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.consolidationClasses
     *
     * @description
     * `array of string`
     *
     * Nodes that represent the icons used by pundits after consolidation.
     * Node with these classes will be ignored when building xpointers
     *
     * Default value:
     * <pre> consolidationIconClasses: ['pnd-icon-tag'] </pre>
     */
    consolidationIconClasses: ['pnd-icon-tag'],

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.consolidationClasses
     *
     * @description
     * `array of string`
     *
     * Classes to assign to named content elements to have them recognized by Pundit
     *
     * Default value:
     * <pre> namedContentClasses: ['pundit-content'] </pre>
     */
    namedContentClasses: ['pundit-content','pnd-resource'],

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.maxHits
     *
     * @description
     * `number`
     *
     * Number of node wrapping for time
     *
     * Default value:
     * <pre> maxHits: 8 </pre>
     */
    maxHits: 8,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.bufferDelay
     *
     * @description
     * `number`
     *
     * Delay in ms for the refresh of the buffer
     *
     * Default value:
     * <pre> bufferDelay: 60 </pre>
     */
    bufferDelay: 60,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.bufferDelay
     *
     * @description
     * `boolean`
     *
     * undefined / true / false
     *
     * Default value:
     * <pre> bufferDelay: undefined </pre>
     */
    preventDelay: undefined,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#XpointersHelper.avoidInitialHide
     *
     * @description
     * `boolean`
     *
     * Avoid inizial node hide
     *
     * Default value:
     * <pre> avoidInitialHide: false </pre>
     */
    avoidInitialHide: false
})

.service('XpointersHelper', function(XPOINTERSHELPERDEFAULTS, NameSpace, BaseComponent, EventDispatcher,
    $document, $location, $window, $q, $timeout, Status, Utils) {

    var xpointersHelper = new BaseComponent('XpointersHelper', XPOINTERSHELPERDEFAULTS);
    var preventDelay = xpointersHelper.options.preventDelay ? true : false,
        updateTimer;

    var nodesQueque = [];

    var addToArray = function(arr, add) {
        return arr.concat(add);
    };

    // Removes the rem[] elements from arr[]
    var removeFromArray = function(arr, rem) {
        var ret = [];
        for (var i = arr.length - 1; i >= 0; i--) {
            if (rem.indexOf(arr[i]) === -1) {
                ret.push(arr[i]);
            }
        }
        return ret;
    };

    xpointersHelper.getXPathsFromXPointers = function(xpArray, temporaryXpointers) {
        var xpointers = [],
            xpaths = {};

        for (var i = xpArray.length - 1; i >= 0; i--) {
            var xpointer = xpArray[i],
                obj = xpointersHelper.xPointerToXPath(xpointer);
            obj.isTemporary = false;
            if (typeof temporaryXpointers !== 'undefined' && typeof temporaryXpointers[xpointer] !== 'undefined') {
                obj.isTemporary = true;
            }

            if (xpointersHelper.isValidXpointer(xpointer)) {
                xpaths[xpointer] = obj;
                xpointers.push(xpointer);
            } else {
                // TODO: here we could pass back the list of invalid xpointers, but they
                // should have been checked already by consolidation .. BEFORE the consolidation
                // process actually starts .... !
                xpointersHelper.err('Invalid xpointer passed to getXPathsFromXPointers: THIS SHOULD NOT HAPPEN!', xpointer);
            }
        } // for i

        return xpaths;

    }; // getXPathsFromXPointers()

    xpointersHelper.isValidXpointerURI = function(xpointer) {
        // TODO: perché in client.html si verifica xpointer undefined?! 
        if (typeof(xpointer) === 'undefined') {
            xpointersHelper.err('Xpointer is undefined: this should not happend!');
            return false;
        }
        if (xpointer.match(/#xpointer\(start-point\(string-range\(/) === null || xpointer.match(/range-to\(string-range\(/) === null) {
            return false;
        }
        // TODO: a better regexp? :)
        return true;
    };

    // Returns true if the xpointer is consolidable on the document, now
    xpointersHelper.isValidXpointer = function(xpointer) {
        if (!xpointersHelper.isValidXpointerURI(xpointer)) {
            return false;
        }

        var xpaths = xpointersHelper.xPointerToXPath(xpointer);
        return xpointersHelper.isValidRange(xpaths.startNode, xpaths.startOffset, xpaths.endNode, xpaths.endOffset);
    };

    xpointersHelper.xPointerToXPath = function(xpointer) {
        var splittedString,
            ret = {},
            foo;

        if (!xpointersHelper.isValidXpointerURI(xpointer)) {
            xpointersHelper.log('xPointerToXPath() Invalid xpointer! ', xpointer);
            return {
                startNode: null,
                startOffset: null,
                endNode: null,
                endOffset: null,
                valid: false
            };
        }

        // Split the xpointer two times, to extract a string
        // like //xpath1[n1],'',o1,//xpath2[n2],'',o2
        // where o1 and o2 are the offsets
        splittedString = xpointer.split('#xpointer(start-point(string-range(')[1].split('))/range-to(string-range(');

        // Then extract xpath and offset of the starting point
        foo = splittedString[0].split(",'',"); // jshint ignore:line
        ret.startXpath = foo[0];
        ret.startOffset = foo[1];

        // .. and of the ending point of the xpointer
        foo = splittedString[1].substr(0, splittedString[1].length - 3).split(",'',"); // jshint ignore:line
        ret.endXpath = foo[0];
        ret.endOffset = foo[1];

        ret.startNode = xpointersHelper.getNodeFromXpath(ret.startXpath);
        ret.endNode = xpointersHelper.getNodeFromXpath(ret.endXpath);

        return ret;
    };


    // Returns the DOM Node pointed by the xpath. Quite confident we can always get the
    // first result of this iteration, the second should give null since we dont use general
    // purpose xpaths
    xpointersHelper.getNodeFromXpath = function(xpath) {
        // var self = this;
        var iterator = $document[0].evaluate(xpath, $document[0], null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        return iterator.singleNodeValue;
    };

    // TODO: Works only on non-consolidated dom .. ?
    xpointersHelper.isValidRange = function(startNode, startOffset, endNode, endOffset) {
        try {
            var r = $document[0].createRange();
            r.setStart(startNode, startOffset);
            r.setEnd(endNode, endOffset);
            return true;
        } catch (e) {
            return false;
        }
    };


    // Will return an array of sorted and unique xpaths, using objects with
    // properties: xpointer, xpath, offset, range
    xpointersHelper.splitAndSortXPaths = function(xpaths) {
        // We just need a starting point to sort the xpaths, taking the first node and use
        // an end_by_end comparison will do the job
        var startNode = xpointersHelper.getNodeFromXpath('//body'),
            x = [],
            ret = [];

        // For every xpointer we create 2 entries in the array: one for starting xpath
        // and one for the ending one
        for (var xpointer in xpaths) {

            // Push an element for the starting xpath+offset
            var rangeStart = $document[0].createRange(),
                node = xpointersHelper.getNodeFromXpath(xpaths[xpointer].startXpath);
            rangeStart.setStart(startNode, 0);
            rangeStart.setEnd(node, xpaths[xpointer].startOffset);

            x.push({
                xpointer: xpointer,
                xpath: xpaths[xpointer].startXpath,
                offset: xpaths[xpointer].startOffset,
                range: rangeStart,
                isTemporary: xpaths[xpointer].isTemporary
            });

            // Another time for the ending xpath+offset
            var rangeEnd = $document[0].createRange();
            node = xpointersHelper.getNodeFromXpath(xpaths[xpointer].endXpath);
            rangeEnd.setStart(startNode, 0);
            rangeEnd.setEnd(node, xpaths[xpointer].endOffset);

            x.push({
                xpointer: xpointer,
                xpath: xpaths[xpointer].endXpath,
                offset: xpaths[xpointer].endOffset,
                range: rangeEnd,
                isTemporary: xpaths[xpointer].isTemporary
            });

        } // for xpointer in self.xpaths

        // Sort this array, using a custom function which compares the end
        // points of the ranges in the passed object
        x.sort(function(a, b) {
            return a.range.compareBoundaryPoints(Range.END_TO_END, b.range);
        });

        // Erase doubled entries: they are sorted, just avoid copying the next
        // element if it's equal to the current one
        ret[0] = x[0];
        for (var i = 1, j = 0, len = x.length; i < len; i++) {
            if (x[i].xpath !== ret[j].xpath || x[i].offset !== ret[j].offset) {
                ret[++j] = x[i];
            }
        }

        return ret;
    }; // splitAndSortXPaths()


    xpointersHelper.getClassesForXpaths = function(xpointers, sortedXpaths, xpaths, xpointersClasses) {
        var realXps = [],
            htmlClasses = [];

        // Iterate through the sortedXpaths from 1st to Nth and accumulate
        // the active classes, looking at what xpointers are starting and
        // ending in the current xpath position
        for (var i = 0; i < sortedXpaths.length - 1; i++) {

            // var end = sortedXpaths[i+1];
            var start = sortedXpaths[i],
                addXps = xpointersHelper.getStartingXPs(xpointers, xpaths, start.xpath, start.offset),
                remXps = xpointersHelper.getEndingXPs(xpointers, xpaths, start.xpath, start.offset);

            realXps = addToArray(realXps, addXps);
            realXps = removeFromArray(realXps, remXps);

            var classes = [];
            for (var j = realXps.length - 1; j >= 0; j--) {
                var x = realXps[j];
                for (var k = xpointersClasses[x].length - 1; k >= 0; k--) {
                    classes.push(xpointersClasses[x][k]);
                }
            }
            htmlClasses[i + 1] = classes;

        } // for i

        return htmlClasses;
    }; // getClassesForNewXpointers()

    // Given an xpath/offset couple, returns all of the xpointers
    // which starts there
    xpointersHelper.getStartingXPs = function(xpointers, xpaths, xpath, offset) {
        var ret = [];

        for (var i = xpointers.length - 1; i >= 0; i--) {
            var x = xpointers[i];
            if (xpaths[x].startXpath === xpath && xpaths[x].startOffset === offset) {
                ret.push(x);
            }
        }
        return ret;
    };

    // Given an xpath/offset couple, returns all of the xpointers
    // which ends there
    xpointersHelper.getEndingXPs = function(xpointers, xpaths, xpath, offset) {
        var ret = [];

        for (var i = xpointers.length - 1; i >= 0; i--) {
            var x = xpointers[i];
            if (xpaths[x].endXpath === xpath && xpaths[x].endOffset === offset) {
                ret.push(x);
            }
        }
        return ret;
    };

    // Wraps all of the calculated xpaths with some htmltag and the computed
    // classes
    xpointersHelper.updateDOM = function(sortedXpaths, htmlClass, xpathsFragmentIds) {
        var xpathsCache = sortedXpaths,
            i = sortedXpaths.length - 1,
            deferred = $q.defer(),
            startLength = sortedXpaths.length;


        var deferredUpdate = function(promise) {
            $timeout.cancel(updateTimer);

            if (xpathsCache.length <= 1) {
                xpointersHelper.log('Dom successfully updated!');
                EventDispatcher.sendEvent('XpointersHelper.DOMUpdated');
                promise.resolve();
                return;
            }

            var currentHits = 0,
                maxHits = preventDelay ? 1000 : xpointersHelper.options.maxHits,
                delay = preventDelay ? 0 : xpointersHelper.options.bufferDelay;

            var doUpdate = function() {
                while (currentHits < maxHits && xpathsCache.length > 1) {
                    var end = xpathsCache.pop(),
                        start = xpathsCache[xpathsCache.length - 1];

                    if (xpathsFragmentIds[i].length > 0) {
                        xpointersHelper.log('## Updating DOM, xpath ' + i + ': ' + xpathsFragmentIds[i].join(' '));
                        xpointersHelper.wrapXPaths(start, end, xpointersHelper.options.wrapNodeName, htmlClass, xpathsFragmentIds[i]);
                    }

                    currentHits++;
                    i--;
                }

                if (!preventDelay) {
                    var currentLength = xpathsCache.length === 1 ? 0 : xpathsCache.length;
                    var percVal = 100 * (startLength - currentLength) / startLength;
                    Status.hitProgress(2, percVal);
                }

                deferredUpdate(promise);
            };

            if (preventDelay) {
                doUpdate();
            } else {
                updateTimer = $timeout(function() {
                    doUpdate();
                }, delay);
            }
        };

        deferredUpdate(deferred);

        return deferred.promise;
    }; // updateDOM()


    // Wrap the range from startXp to endXp (two xpaths custom objects) with
    // the given tag _tag and html class _class. Will build a range for those
    // 2 xpaths, and starting from the range's commonAncestorContainer, will
    // wrap all of the contained elements
    xpointersHelper.wrapXPaths = function(startXp, endXp, _tag, _class, _parents) {
        var htmlTag = _tag || xpointersHelper.options.wrapNodeName,
            htmlClass = _class || xpointersHelper.options.wrapNodeClass,
            parents = _parents || [],
            range = $document[0].createRange(),
            startNode = xpointersHelper.getNodeFromXpath(startXp.xpath),
            endNode = xpointersHelper.getNodeFromXpath(endXp.xpath);

        // If start and end xpaths dont have a node number [N], we
        // are wrapping the Mth=offset child of the given node
        if (!startXp.xpath.match(/\[[0-9]+\]$/) && !endXp.xpath.match(/\[[0-9]+\]$/)) {
            range.selectNode(startNode.childNodes[startXp.offset]);
        } else {

            // If it's not a textnode, set the start (or end) before (or after) it
            if (!xpointersHelper.isElementNode(startNode)) {
                range.setStart(startNode, startXp.offset);
            } else {
                range.setStart(startNode, startXp.offset);
            }

            if (!xpointersHelper.isElementNode(endNode)) {
                range.setEnd(endNode, endXp.offset);
            } else {
                range.setEndAfter(endNode);
            }
        }

        // Wrap the nearest element which contains the entire range
        xpointersHelper.wrapElement(range.commonAncestorContainer, range, htmlTag, htmlClass, parents);

    }; // wrapXPath

    // Wraps childNodes of element, only those which stay inside
    // the given range
    xpointersHelper.wrapElement = function(element, range, htmlTag, htmlClass, parents, doQueue, itemUri) {
        nodesQueque = doQueue ? [].concat(parents) : nodesQueque;

        // If there's childNodes, wrap them all
        if (element.childNodes && element.childNodes.length > 0) {
            for (var i = (element.childNodes.length - 1); i >= 0 && element.childNodes[i]; i--) {
                xpointersHelper.wrapElement(element.childNodes[i], range, htmlTag, htmlClass, parents);
            }

            // Else it's a leaf: if it's a valid text node, wrap it!
        } else if (xpointersHelper.isTextNodeInsideRange(element, range)) {
            xpointersHelper.wrapNode(element, range, htmlTag, htmlClass, parents);
            // MORE Else: it's an image node.. wrap it up
        } else if (xpointersHelper.isImageNodeInsideRange(element, range)) {
            xpointersHelper.wrapNode(element, range, htmlTag, htmlClass, parents);
        }

        if (doQueue && nodesQueque.length > 0) {
            EventDispatcher.sendEvent('XpointersHelper.temporaryWrap', {
                uri: itemUri,
                fragments: nodesQueque
            });
        }

    }; // wrapElement()

    // Triple node check: will pass if it's a text node, if it's not
    // empty and if it is inside the given range
    xpointersHelper.isTextNodeInsideRange = function(node, range) {
        var content;

        // Check: it must be a text node
        if (node.nodeType !== Node.TEXT_NODE) {
            return false;
        }

        // Check: the content must not be empty
        content = node.textContent.replace(/ /g, '').replace(/\n/, '');
        if (!node.data || content === '' || content === ' ') {
            return false;
        }

        // Finally check if it's in the range
        return xpointersHelper.isNodeInsideRange(node, range);
    };
    xpointersHelper.isImageNodeInsideRange = function(node, range) {
        // Check: it must be an element node
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        // Check: it must be an img
        if (node.tagName.toLowerCase() !== 'img') {
            return false;
        }

        return xpointersHelper.isNodeInsideRange(node, range);
    };

    // Will check if the given node interesecates the given range somehow
    xpointersHelper.isNodeInsideRange = function(node, range) {
        var nodeRange = $document[0].createRange();
        try {
            nodeRange.selectNode(node);
        } catch (e) {
            nodeRange.selectNodeContents(node);
        }
        if (range.compareBoundaryPoints(Range.END_TO_START || 3, nodeRange) !== -1 ||
            range.compareBoundaryPoints(Range.START_TO_END || 1, nodeRange) !== 1) {
            return false;
        }
        return true;
    };

    // Will wrap a node (or part of it) with the given htmlTag. Just part of it when it's
    // on the edge of the given range and the range starts (or ends) somewhere inside it
    xpointersHelper.wrapNode = function(element, range, htmlTag, htmlClass, parents) {
        var r2 = $document[0].createRange(),
            wrapNode;

        if (range.toString().length === 0) {
            return;
        }

        var modParents = parents,
            modifyWrapping = false,
            wrapWholeTextNode = false,
            elementLength = 0,
            parentElement = element.parentElement,
            jParentElement = angular.element(parentElement),
            parentFragmentIds = [],
            tempFragmentIds = [].concat(parents),
            isTemporary = htmlClass.indexOf(xpointersHelper.options.tempWrapNodeClass) !== -1;

        var updateWrappingNode = function() {
            var needOtherCheck = false,
                newWrapNode;

            for (var i in parentElement.childNodes) {
                var node = parentElement.childNodes[i];
                if (node.nodeType === 3) {
                    if (node.length > 0) {
                        // Wrap text node.
                        var r = $document[0].createRange(),
                            l = node.length;
                        r.setStart(node, 0);
                        r.setEnd(node, l);
                        newWrapNode = xpointersHelper.createWrapNode(htmlTag, xpointersHelper.options.wrapNodeClass, parentFragmentIds);
                        r.surroundContents(newWrapNode.element);

                        newWrapNode.jElement.attr('temp-fragments', newWrapNode.jElement.parent().attr('temp-fragments'));
                        if (!newWrapNode.jElement.parent().hasClass(xpointersHelper.options.textFragmentHiddenClass)) {
                            newWrapNode.jElement.removeClass(xpointersHelper.options.textFragmentHiddenClass);
                        }
                        if (newWrapNode.jElement.parent().hasClass(xpointersHelper.options.tempWrapNodeClass)) {
                            newWrapNode.jElement.addClass(xpointersHelper.options.tempWrapNodeClass);
                        }

                        needOtherCheck = true;
                        break;
                    }
                }
            }
            if (needOtherCheck) {
                updateWrappingNode();
            }
        };

        // Select correct sub-range: if the element is the start or end container of the range
        // set the boundaries accordingly: if it's startContainer use it's start offset and set
        // the end offset to element length. If it's endContainer set the start offset to 0
        // and the endOffset from the range.
        if (element === range.startContainer || element === range.endContainer) {
            r2.setStart(element, (element === range.startContainer) ? range.startOffset : 0);
            r2.setEnd(element, (element === range.endContainer) ? range.endOffset : element.length);

            if (r2.startContainer === r2.endContainer && r2.startOffset === 0 && r2.endOffset === element.length) {
                wrapWholeTextNode = true;
            }
            // Otherwise just select the entire node, and wrap it up
        } else {
            r2.selectNode(element);
            wrapWholeTextNode = true;
        }

        if (jParentElement.hasClass(xpointersHelper.options.wrapNodeClass)) {
            modifyWrapping = true;
            parentFragmentIds = jParentElement.attr('fragments').split(',');
            var temp = typeof jParentElement.attr('temp-fragments') !== 'undefined' ? jParentElement.attr('temp-fragments').split(',') : [];
            tempFragmentIds = tempFragmentIds.concat(temp);
            modParents = modParents.concat([]);
            for (var i in parentFragmentIds) {
                if (modParents.indexOf(parentFragmentIds[i]) === -1) {
                    modParents.push(parentFragmentIds[i]);
                }
                if (nodesQueque.indexOf(parentFragmentIds[i]) === -1) {
                    nodesQueque.push(parentFragmentIds[i]);
                }
            }
            elementLength = element.length;
        }

        if (wrapWholeTextNode && modifyWrapping) {
            jParentElement.attr('fragments', modParents.join(','));
            jParentElement.addClass(modParents.join(' '));
            jParentElement.addClass(htmlClass);
            jParentElement.attr('temp-fragments', tempFragmentIds.join(','));
            jParentElement.trigger('Pundit.updateFragmentBits', modParents.join(','));
        } else {
            wrapNode = xpointersHelper.createWrapNode(htmlTag, htmlClass, modParents);
            // Finally surround the range contents with an ad-hoc crafted html element
            r2.surroundContents(wrapNode.element);

            if (isTemporary) {
                wrapNode.jElement.attr('temp-fragments', tempFragmentIds.join(','));
            }
        }



        if (modifyWrapping && !wrapWholeTextNode) {
            updateWrappingNode();

            wrapNode.jElement
                .addClass(xpointersHelper.options.wrapNodeClass);
            jParentElement
                .contents().unwrap();
        } else {
            if (wrapNode && htmlClass === xpointersHelper.options.wrapNodeClass) {
                //TODO: check type nodes (images?)
                // Skipping and removing node if it's empty.
                if (wrapNode.element.childNodes.length == 0 || wrapNode.element.childNodes[0].nodeValue == null || wrapNode.element.childNodes[0].nodeValue.length == 0) {
                    wrapNode.jElement.remove();
                    return;
                }
                EventDispatcher.sendEvent('XpointersHelper.NodeAdded', {
                    fragments: parents,
                    reference: wrapNode.jElement
                });
            }
        }
    }; // wrapNode()

    // Creates an HTML element to be used to wrap (usually a span?) adding the given
    // classes to it
    xpointersHelper.createWrapNode = function(htmlTag, htmlClass, parents) {
        var element = $document[0].createElement(htmlTag),
            currentElement = angular.element(element);
        currentElement.addClass(htmlClass);
        if (xpointersHelper.options.avoidInitialHide === false) {
            currentElement.addClass(xpointersHelper.options.textFragmentHiddenClass);
        }

        // TODO: make this directive name configurable??
        currentElement.attr('text-fragment-bit', '');
        // Parent fragment ids both in fragments attribute and in classes. First used to
        // pass them back to the TextFragmentAnnotator service, the second to being able
        // to retrieve the last of them with a css selector to place the icon
        currentElement.attr('fragments', parents.join(','));
        currentElement.addClass(parents.join(' '));

        return {
            element: element,
            jElement: currentElement
        };
    };

    // Merges text nodes: when unwrapping consolidated fragments we are splitting the original
    // text nodes in multiple nodes. Merging them together should get us the very same DOM we
    // started with before the consolidation.
    xpointersHelper.mergeTextNodes = function(node) {

        if (!node) {
            return;
        }

        if ((typeof(node.childNodes) !== 'undefined') && (node.childNodes.length > 0)) {
            var i = node.childNodes.length - 1;

            var child, sibling;
            // TODO is there a better way to do this?
            while (child = node.childNodes[i--]) { // jshint ignore:line
                if (xpointersHelper.isTextNode(child) && (sibling = node.childNodes[i]) && xpointersHelper.isTextNode(sibling)) {
                    sibling.nodeValue = sibling.nodeValue + child.nodeValue;
                    node.removeChild(child);
                }
                else if (xpointersHelper.isElementNode(child)) {
                    xpointersHelper.mergeTextNodes(child);
                }
            }
        }

    }; // mergeTextNodes()


    xpointersHelper.isTextNode = function(node) {
        if (!node) {
            return false;
        }
        return node.nodeType === Node.TEXT_NODE;
    };

    xpointersHelper.isElementNode = function(node) {
        if (!node) {
            return false;
        }
        return node.nodeType === Node.ELEMENT_NODE;
    };

    // Returns true if the node is a wrap node, added by the consolidation
    xpointersHelper.isWrapNode = function(node) {

        // Not an element node.. return false
        if (!xpointersHelper.isElementNode(node)) {
            return false;
        }

        // If the node name is wrong.. return false
        if (node.nodeName.toUpperCase() !== xpointersHelper.options.wrapNodeName.toUpperCase()) {
            return false;
        }

        // It is an element, with the right name: if it has the wrap class, it is a wrap node!
        var el = angular.element(node);
        if (el.hasClass(xpointersHelper.options.wrapNodeClass)) {
            return true;
        }

        //if it is a consolidation icon, return true
        for (var i = 0; i < xpointersHelper.options.consolidationIconClasses.length; i++) {
            if (el.hasClass(xpointersHelper.options.consolidationIconClasses[i])) {
                return true;
            }
        }

        return false;
    }; // isWrapNode()

    // Returns true if the given node is a tag which should be ignored while building xpointers,
    // like an UI icon (my items? more?), or a wrapped node class
    xpointersHelper.isConsolidationNode = function(node) {

        if (!xpointersHelper.isElementNode(node)) {
            return false;
        }

        var toIgnore = [xpointersHelper.options.textFragmentIconClass, xpointersHelper.options.wrapNodeClass, xpointersHelper.options.tempWrapNodeClass, xpointersHelper.options.imgWrapNodeClass];
        toIgnore = toIgnore.concat(xpointersHelper.options.consolidationClasses);
        toIgnore = toIgnore.concat(xpointersHelper.options.consolidationIconClasses);

        for (var i = toIgnore.length; i--;) {
            if (angular.element(node).hasClass(toIgnore[i])) {
                return true;
            }
        }

        return false;
    }; // isConsolidationNode()

    xpointersHelper.isWrappedTextNode = function(node) {
        if (!xpointersHelper.isWrapNode(node)) {
            return false;
        }

        if (!xpointersHelper.isTextNode(node.firstChild)) {
            return false;
        }

        return true;
    };

    xpointersHelper.isWrappedElementNode = function(node) {

        if (!xpointersHelper.isWrapNode(node)) {
            return false;
        }

        if (!xpointersHelper.isElementNode(node.firstChild)) {
            return false;
        }

        return true;
    };

    xpointersHelper.isNamedContentNode = function(node) {

        if (!xpointersHelper.isElementNode(node)) {
            return false;
        }

        var c = xpointersHelper.options.namedContentClasses;
        for (var i = c.length; i--;) {
            if (angular.element(node).hasClass(c[i])) {
                return true;
            }
        }

        return false;
    };

    xpointersHelper.isUIButton = function(node) {

        if (!xpointersHelper.isElementNode(node)) {
            return false;
        }

        if (angular.element(node).hasClass(xpointersHelper.options.textFragmentIconClass)) {
            return true;
        }

        return false;
    };

    xpointersHelper.getSafeCanoicalUrl = function() {
        var canonical = Utils.getCanonicalUrl();
        return canonical ? encodeURI(decodeURIComponent(canonical)) : undefined;
    };

    // TODO: Maybe this belongs somewhere else .. need to refactor a bit of
    //       TextFragmentHandler service ....
    // Gets a safe page context, stripping out pundit-related query parameters
    xpointersHelper.getSafePageContext = function() {
        var uri = $window.location.href,
            // , query, queryObject;
            fragment;

        // If there's a fragment, save it and remove it from the uri
        if (uri.indexOf('#') !== -1) {
            fragment = uri.substring(uri.indexOf('#') + 1, uri.length);
            uri = uri.substring(0, uri.indexOf('#'));
        }

        // TODO: add pundit-show support in Pundit2 
        // If there's a query, decode it and remove it from the uri. Look for the
        // pundit-show parameter and strips it out
        // TODO: 'pundit-show' should be configurable ... ?
        // if (uri.indexOf('?') !== -1) {
        //     query = uri.substring(uri.indexOf('?') + 1, uri.length);
        //     uri = uri.substring(0, uri.indexOf('?'));

        //     // there is a related issue with html5 and $location.search(): https://github.com/angular/angular.js/issues/7239
        //     queryObject = $location.search();
        //     delete queryObject['pundit-show'];

        //     var queryArray = [];
        //     for (var p in queryObject) {
        //         queryArray.push(p + '=' + queryObject[p]);
        //     }
        //     query = queryArray.join('&');
        // }

        // // Build back the URI
        // if (query) {
        //     uri += '?' + query;
        // }

        if (fragment) {
            uri += '#' + fragment;
        }

        return encodeURI(decodeURIComponent(uri));
    };

    if (xpointersHelper.options.preventDelay === undefined) {
        EventDispatcher.addListener('Pundit.preventDelay', function(e) {
            preventDelay = e.args;
        });
    }

    EventDispatcher.addListener('Consolidation.newRequest', function() {
        $timeout.cancel(updateTimer);
    });

    xpointersHelper.log('Component up and running');
    return xpointersHelper;
});