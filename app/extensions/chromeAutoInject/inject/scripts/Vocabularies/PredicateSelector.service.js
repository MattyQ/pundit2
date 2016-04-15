/*jshint camelcase: false*/

angular.module('Pundit2.Vocabularies')

.service('PredicateSelector', function(BaseComponent, Config, $http, $q) {

    var predicateSelector = new BaseComponent("PredicateSelector");

    // get all items from urls passed with pundit configuration object
    // inside vocabularies array
    predicateSelector.getAllVocabularies = function() {
        var urls = Config.vocabularies,
            result = [],
            promise = $q.defer();

        predicateSelector.log("Loading predicates from", urls);

        var predPromises = [];
        for (var i in urls) {
            var prm = predicateSelector.getRelations(urls[i]);
            prm.then(function(res) {
                result.push.apply(result, res);
            });
            predPromises.push(prm);
        }

        $q.all(predPromises).then(function() {
            predicateSelector.log("Completed loading, get " + result.length + " predicates");
            promise.resolve(result);
        });


        return promise.promise;
    };

    // make a jsonp to get all items from url
    // remove unecessary properties
    // reneme some propeties as pundit2 conventions
    predicateSelector.getRelations = function(url) {

        var promise = $q.defer();

        // $http.jsonp(url+"?jsonp=JSON_CALLBACK")

        // if url already contain a ? use &jsonp=JSON_CALLBACK instead of ?jsonp=JSON_CALLBACK
        var appenedUrl;
        if (url.indexOf('?') > -1) {
            appenedUrl = "&jsonp=JSON_CALLBACK";
        } else {
            appenedUrl = "?jsonp=JSON_CALLBACK";
        }

        $http.jsonp(url + appenedUrl)
            .success(function(data) {

                if (typeof(data) === 'undefined' || typeof(data.result) === 'undefined') {
                    predicateSelector.log("Impossible to get predicates from: " + url);
                    promise.resolve();
                    return;
                }
                if (data.result.vocab_type !== "predicates") {
                    predicateSelector.log("Response not is a predicates vocabularie " + url);
                    promise.resolve();
                    return;
                }
                if (typeof(data.result.items) === "undefined") {
                    predicateSelector.log("Response not have items property " + url);
                    promise.resolve();
                    return;
                }

                var predicates = data.result.items,
                    result = [];
                for (var i in predicates) {
                    // remove unused properties
                    // rename propeties as pundit2 conventions
                    predicateSelector.log("Add " + predicates[i].label);

                    var p = predicates[i];
                    delete p.children;
                    delete p.is_root_node;
                    delete p.nodetype;
                    p.type = p.rdftype;
                    delete p.rdftype;
                    p.uri = p.value;
                    delete p.value;
                    p.vocabulary = url + " (External Vocabulary)";

                    result.push(p);
                }

                predicateSelector.log("Loaded " + result.length + " predicates from: " + url);
                promise.resolve(result);

            });

        return promise.promise;

    };

    return predicateSelector;

});