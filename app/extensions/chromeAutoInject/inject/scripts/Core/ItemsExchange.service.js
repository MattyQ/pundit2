angular.module('Pundit2.Core')

.constant('ITEMSEXCHANGE', {

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#ItemsExchange.defaultRelationsContainer
     *
     * @description
     * `string`
     *
     * Name of the container used to store all of the pundit client usable relations.
     *
     * Default value:
     * <pre> defaultRelationsContainer: "usableRelations" </pre>
     */
    defaultRelationsContainer: "usableRelations"
})

.service('ItemsExchange', function(BaseComponent) {

    // TODO: inherit from a Store or something()? Annotations, items, ...
    var itemsExchange = new BaseComponent("ItemsExchange"),

        // all properties are stored here
        defaultRelationsContainer = 'properties',

        // container: [ array of ItemFactory objects belonging to that container ]
        itemListByContainer = {},
        // container: total number of remote ItemFactory objects belonging to that container
        remoteItemCountByContainer = {},
        // item uri : [ array of containers which contains the ItemFactory with that uri ]
        itemContainers = {},
        // [ array of ItemFactory objects ]
        itemList = [],
        // item uri : { ItemFactory object }
        itemListByURI = {},

        temporaryItems = {};

    itemsExchange.wipe = function() {
        itemListByContainer = {};
        remoteItemCountByContainer = {};
        itemContainers = {};
        itemList = [];
        itemListByURI = {};
        temporaryItems = {};
        itemsExchange.log('Wiped every loaded item and every container.');
    };

    itemsExchange.isTemporary = function(uri) {
        return typeof temporaryItems[uri] !== 'undefined';
    };

    itemsExchange.setItemAsTemporary = function(mixed, isTemporary) {
        var item = mixed;
        if (typeof item === 'string') {
            item = itemsExchange.getItemByUri(mixed);
        }
        if (typeof item === 'undefined') {
            return;
        }

        if (isTemporary) {
            temporaryItems[item.uri] = item;
        } else {
            delete temporaryItems[item.uri];
        }
    };

    itemsExchange.wipeTemporaryItems = function() {
        temporaryItems = {};
    };

    itemsExchange.getTemporaryItems = function() {
        return temporaryItems;
    };

    itemsExchange.isItemInContainer = function(item, container) {
        if (typeof(container) === "undefined") {
            return false;
        }

        if (typeof(item) === "undefined") {
            itemsExchange.log('itemsExchange.isItemInContainer has been called with undefined item, that shouldn\'t happen');
            return false;
        }

        var list = itemContainers[item.uri];

        // Item not found .. !!?!
        if (typeof(list) === "undefined") {
            return false;
        }

        if (list.indexOf(container) === -1) {
            return false;
        }

        return true;
    };

    itemsExchange.wipeContainer = function(container) {
        if (typeof(itemListByContainer[container]) === 'undefined') {
            itemsExchange.log('Cannot wipe undefined container ' + container);
            return;
        }

        // for each item inside specified container list
        itemListByContainer[container].forEach(function(item) {
            // remove container from itemContainers object array
            itemContainers[item.uri].splice(itemContainers[item.uri].indexOf(container), 1);
            // if we have zero container must remove item everywhere
            // TODO: is the right choice check if it is equal to zero?
            if (itemContainers[item.uri].length === 0) {
                delete itemContainers[item.uri];
                delete itemListByURI[item.uri];
                var itemIndex = itemList.indexOf(item);
                if (itemIndex !== -1) {
                    itemList.splice(itemIndex, 1);
                }
            }
        });
        // empty container list
        delete itemListByContainer[container];
        //empty total remote count
        if (typeof(remoteItemCountByContainer[container]) !== 'undefined') {
            delete remoteItemCountByContainer[container];
        }


        itemsExchange.log('Wiped ' + container + ' container.');
    };

    itemsExchange.getItems = function() {
        return itemList;
    };

    itemsExchange.getItemsHash = function() {
        return itemListByURI;
    };

    itemsExchange.getItemByUri = function(uri) {
        if (uri in itemListByURI) {
            return itemListByURI[uri];
        }
        // If the item is not found, it will return undefined
    };

    itemsExchange.getAll = function() {
        return {
            itemListByURI: itemListByURI,
            itemListByContainer: itemListByContainer,
            itemContainers: itemContainers,
            remoteItemTotalCountByContainer: remoteItemCountByContainer
        };
    };

    itemsExchange.getItemsBy = function(filter) {
        if (typeof(filter) !== "function") {
            return;
        }

        var ret = [];
        for (var uri in itemListByURI) {
            var item = itemListByURI[uri];
            if (filter(item)) {
                ret.push(item);
            }
        }
        return ret;
    };

    itemsExchange.getItemsFromContainerByFilter = function(container, filter) {
        if (typeof(filter) !== "function") {
            return;
        }

        if (typeof(itemListByContainer[container]) === "undefined") {
            return;
        }

        var ret = [];
        var itemList = itemListByContainer[container];
        for (var uri in itemList) {
            var item = itemList[uri];
            if (filter(item)) {
                ret.push(item);
            }
        }
        return ret;
    };

    itemsExchange.getItemsByContainer = function(container) {
        if (typeof(itemListByContainer[container]) !== "undefined") {
            return itemListByContainer[container];
        } else {
            // TODO: name not found, signal error? .log? .err?
            return [];
        }
    };

    // TODO must be refactor, pass uri instead of new item reference
    itemsExchange.addItemToContainer = function(item, containers) {

        // console.log(containers);

        if (!angular.isArray(containers)) {
            containers = [containers];
        }

        for (var i = containers.length; i--;) {
            var container = containers[i];

            if (item.uri in itemContainers && itemContainers[item.uri].indexOf(container) !== -1) {
                itemsExchange.log('Item ' + item.label + ' already belongs to container ' + container);
                return;
            }

            if (container in itemListByContainer) {
                itemListByContainer[container].push(item);
            } else {
                itemListByContainer[container] = [item];
            }

            if (item.uri in itemContainers) {
                itemContainers[item.uri].push(container);
            } else {
                itemContainers[item.uri] = [container];
            }
        }

    };

    itemsExchange.setRemoteItemCount = function(counts, containers) {

        if (!angular.isArray(counts)) {
            counts = [counts];
        }
        if (!angular.isArray(containers)) {
            containers = [containers];
        }

        for (var i = containers.length; i--;) {
            var container = containers[i];
            remoteItemCountByContainer[container] = counts[i];
        }

    };

    itemsExchange.getRemoteItemCount = function(container) {

        if (typeof(remoteItemCountByContainer) === 'undefined') {
            return null;
        }
        return remoteItemCountByContainer[container];
    };

    // TODO must be refactor, pass uri instead of new item reference
    itemsExchange.removeItemFromContainer = function(item, container) {

        var containerItems = itemListByContainer[container];

        if (typeof(containerItems) === 'undefined') {
            itemsExchange.err("Cannot remove item " + item.label + " from container " + container + ": container not found.");
            return;
        }

        var index = containerItems.indexOf(item);
        if (index === -1) {
            itemsExchange.err("Cannot remove item " + item.label + " from container " + container + ": item not in container.");
            return;
        }
        // remove item from itemListByContainer
        containerItems.splice(index, 1);

        // remove container from itemContainers
        var containerIndex = itemContainers[item.uri].indexOf(container);
        itemContainers[item.uri].splice(containerIndex, 1);
        // if we have zero container must remove item everywhere
        // TODO: is the right choice check if it is equal to zero?
        if (itemContainers[item.uri].length === 0) {
            delete itemContainers[item.uri];
            delete itemListByURI[item.uri];
            var itemIndex = itemList.indexOf(item);
            if (itemIndex !== -1) {
                itemList.splice(itemIndex, 1);
            }
        }

        itemsExchange.log("Item " + item.label + " removed from container " + container);
    };

    itemsExchange.addItems = function(items) {
        // TODO: sanity checks
        for (var l = items.length; l--;) {
            itemsExchange.addItem(items[l]);
        }
    };

    var extendSuggestions = function(uri, subjectTypes, objectTypes) {
        var p = itemListByURI[uri];

        subjectTypes = typeof subjectTypes !== 'undefined' ? subjectTypes : [];
        objectTypes = typeof objectTypes !== 'undefined' ? objectTypes : [];

        if (typeof p.objectTypes === 'undefined' ||
            typeof p.subjectTypes === 'undefined') {
            return;
        }

        var i;
        // empty array coding a free objectTypes
        if (objectTypes.length === 0) {
            p.suggestedObjectTypes = [];
        } else if (p.suggestedObjectTypes.length > 0) {
            for (i in objectTypes) {
                // if the objectTypes is not already present
                if (p.suggestedObjectTypes.indexOf(objectTypes[i]) === -1) {
                    p.suggestedObjectTypes.push(objectTypes[i]);
                }
            }
        }
        // empty array coding a free subjectTypes
        if (subjectTypes.length === 0) {
            p.suggestedSubjectTypes = [];
        } else if (p.suggestedSubjectTypes.length > 0) {
            for (i in subjectTypes) {
                // if the subjectTypes is not already present
                if (p.suggestedSubjectTypes.indexOf(subjectTypes[i]) === -1) {
                    p.suggestedSubjectTypes.push(subjectTypes[i]);
                }
            }
        }

    };

    var addLabel = function(uri, label) {
        var p = itemListByURI[uri];

        if (typeof(p.mergedLabel) === 'undefined') {
            if (p.label !== label) {
                p.mergedLabel = p.label + '_' + label;
            }
        } else if (p.mergedLabel.indexOf(label) === -1) {
            p.mergedLabel += '_' + label;
        }
    };

    var addVocab = function(uri, vocab) {
        var p = itemListByURI[uri];

        if (typeof(p.mergedVocabulary) === 'undefined') {
            p.mergedVocabulary = [p.vocabulary, vocab];
        } else if (p.mergedVocabulary.indexOf(vocab) === -1) {
            p.mergedVocabulary.push(vocab);
        }
    };

    itemsExchange.addItem = function(item, container) {

        var insertItem = function() {
            itemListByURI[item.uri] = item;
            itemList.push(item);
            itemsExchange.addItemToContainer(item, container);

            if (typeof itemListByURI[item.uri].suggestedSubjectTypes === 'undefined') {
                itemListByURI[item.uri].suggestedSubjectTypes = [];
            }
            if (typeof itemListByURI[item.uri].suggestedObjectTypes === 'undefined') {
                itemListByURI[item.uri].suggestedObjectTypes = [];
            }
        };

        if (typeof(container) === "undefined") {
            container = "default";
        }

        // An item to be good must have an array of types and at least a uri
        if (typeof(item.uri) === "undefined" || !angular.isArray(item.type)) {
            itemsExchange.err("Ouch, cannot add this item ... ", item);
            return;
        } else if (item.uri in itemListByURI) {
            // the item that we try to add already exist
            itemsExchange.log("Item already present: " + item.uri);

            // skip if come from an annotation
            if (item.isProperty() && !item.isAnnotationProperty) {

                // if the item that already exist is an annotation item
                // we need to replace it every time
                // otherwise we update the item
                if (itemListByURI[item.uri].isAnnotationProperty) {
                    // remove old item                        
                    var index = itemListByContainer[defaultRelationsContainer].indexOf(itemListByURI[item.uri]);
                    if (index > -1) {
                        itemListByContainer[defaultRelationsContainer].splice(index, 1);
                    }
                    var itemIndex = itemList.indexOf(itemListByURI[item.uri]);
                    if (itemIndex > -1) {
                        itemList.splice(itemIndex, 1);
                    }

                    delete itemContainers[item.uri];
                    delete itemListByURI[item.uri];
                    // add the new property to the default container 
                    container = defaultRelationsContainer;

                    insertItem();
                } else {
                    // update the old item (merge of suggestedObjectTypes, suggestedSubjectTypes and vocabs)
                    extendSuggestions(item.uri, item.suggestedSubjectTypes, item.suggestedObjectTypes);
                    addLabel(item.uri, item.label);
                    addVocab(item.uri, item.vocabulary);
                }
            }

            return;
        } else if (item.isProperty()) {
            // default propeties container
            // the first time that a propeties is loaded it is added to this container
            container = defaultRelationsContainer;
        }

        insertItem();
        itemsExchange.log("Added item: " + item.uri);
    };

    itemsExchange.log('Component up and running');
    return itemsExchange;
});