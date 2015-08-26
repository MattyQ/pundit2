angular.module('Pundit2.Communication')

.constant('ANNOTATIONSCOMMUNICATIONDEFAULTS', {
    preventDownload: false,
    loadMultipleAnnotations: false
        //loadMultipleAnnotationsRequireCredentials: false
})

.service('AnnotationsCommunication', function(BaseComponent, EventDispatcher, NameSpace, Consolidation, MyPundit, ModelHelper,
    AnnotationsExchange, Annotation, NotebookExchange, Notebook, ItemsExchange, Config, XpointersHelper, ModelHandler,
    $http, $q, $rootScope, ANNOTATIONSCOMMUNICATIONDEFAULTS) {

    var annotationsCommunication = new BaseComponent("AnnotationsCommunication", ANNOTATIONSCOMMUNICATIONDEFAULTS);

    var annotationServerVersion = Config.annotationServerVersion;
    var setLoading = function(state) {
        EventDispatcher.sendEvent('AnnotationsCommunication.loading', state);
    };

    var makeTargetsAndItems = function(data, forceAddToContainer) {
        if (annotationServerVersion === 'v2')  {
            ModelHandler.makeTargetsAndItems(data, forceAddToContainer);
        }
    };

    var updateAnnotationV1 = function(promise, annID, graph, items, targets) {
        var completed = 0;

        $http({
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            url: NameSpace.get('asAnnContent', {
                id: annID
            }),
            params: {
                context: angular.toJson({
                    targets: targets,
                    pageContext: XpointersHelper.getSafePageContext()
                })
            },
            withCredentials: true,
            data: {
                "graph": graph
            }
        }).success(function() {
            if (completed > 0) {
                AnnotationsExchange.getAnnotationById(annID).update().then(function() {
                    EventDispatcher.sendEvent('AnnotationsCommunication.editAnnotation', annID);
                    Consolidation.consolidateAll();
                    setLoading(false);
                    promise.resolve();
                });
            }
            completed++;
            annotationsCommunication.log("Graph correctly updated: " + annID);
        }).error(function() {
            setLoading(false);
            promise.reject();
            annotationsCommunication.log("Error during graph editing of " + annID);
        });

        $http({
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            url: NameSpace.get('asAnnItems', {
                id: annID
            }),
            withCredentials: true,
            data: items
        }).success(function() {
            if (completed > 0) {
                AnnotationsExchange.getAnnotationById(annID).update().then(function() {
                    Consolidation.consolidateAll();
                    EventDispatcher.sendEvent('AnnotationsCommunication.editAnnotation', annID);
                    setLoading(false);
                    promise.resolve();
                });
            }
            completed++;
            annotationsCommunication.log("Items correctly updated: " + annID);
        }).error(function() {
            setLoading(false);
            promise.reject();
            annotationsCommunication.log("Error during items editing of " + annID);
        });
    };

    var updateAnnotationV2 = function(promise, annID, graph, items, flatTargets, targets, types) {
        setLoading(true);

        var postData = {
            graph: graph,
            items: items,
            type: types,
            target: targets
        };

        $http({
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PUT',
            url: NameSpace.get('asAnn', {
                id: annID
            }),
            params: {
                context: angular.toJson({
                    targets: flatTargets,
                    pageContext: XpointersHelper.getSafePageContext()
                })
            },
            withCredentials: true,
            data: postData
        }).success(function() {
            // TODO if is rejected ???
            AnnotationsExchange.getAnnotationById(annID).update().then(function() {
                Consolidation.consolidateAll();
                EventDispatcher.sendEvent('AnnotationsCommunication.editAnnotation', annID);
                setLoading(false);
                promise.resolve();
            });
            annotationsCommunication.log("Items correctly updated: " + annID);

        }).error(function(msg) {
            // TODO
            annotationsCommunication.log("Error: impossible to update annotation", msg);
            setLoading(false);
            promise.reject();
        });
    };

    // get all annotations of the page from the server
    // add annotation inside annotationExchange
    // add items to page items inside itemsExchange
    // add notebooks to notebooksExchange
    // than consilidate all items
    //
    // forceAddToContainer - annotation items and target might be already present
    // in ItemsExchange but "pageItems" container has been already removed, so
    // it's necessary to add again items to container.
    annotationsCommunication.getAnnotations = function(forceAddToContainer) {
        var promise = $q.defer();
        var preventDelay = forceAddToContainer ? true : false;

        if (annotationsCommunication.options.preventDownload) {
            promise.reject('Prevent download forced by conf');
            return;
        }

        EventDispatcher.sendEvent('AnnotationsCommunication.PreventDelay', preventDelay);

        setLoading(true);

        var uris = Consolidation.getAvailableTargets(),
            annPromise = AnnotationsExchange.searchByUri(uris);

        annotationsCommunication.log('Getting annotations for available targets', uris);
        annPromise.then(function(ids) {
            annotationsCommunication.log('Found ' + ids.length + ' annotations on the current page.');
            EventDispatcher.sendEvent('Client.dispatchDocumentEvent', {
                event: 'Pundit2.updateAnnotationsNumber',
                data: ids.length
            });
            if (ids.length === 0) {
                // TODO: use wipe (not consolidateAll) and specific event in other component (like sidebar)
                Consolidation.consolidateAll();
                setLoading(false);
                return;
            }

            var settled = 0;

            if (!annotationsCommunication.options.loadMultipleAnnotations) {
                annotationsCommunication.log("Loading annotations one by one");
                var annPromises = [];
                for (var i = 0; i < ids.length; i++) {
                    var a = new Annotation(ids[i]);
                    a.then(function(ann) {
                        // The annotation got loaded, it is already available
                        // in the AnnotationsExchange
                        var notebookID = ann.isIncludedIn;
                        if (typeof(NotebookExchange.getNotebookById(notebookID)) === 'undefined') {
                            // if the notebook is not loaded download it and add to notebooksExchange
                            new Notebook(notebookID);
                        }
                    }, function(error) {
                        annotationsCommunication.log("Could not retrieve annotation: " + error);
                        // TODO: can we try again? Let the user try again with an error on
                        // the toolbar?
                    }).finally().then(function() {
                        settled++;
                        annotationsCommunication.log('Received annotation ' + settled + '/' + annPromises.length);

                        if (settled === annPromises.length) {
                            annotationsCommunication.log('All promises settled, consolidating');
                            Consolidation.consolidateAll();
                            setLoading(false);
                            promise.resolve(settled);
                        }
                    });
                    annPromises.push(a);
                }
            } // if (!annotationsCommunication.options.loadMultipleAnnotations)
            else {
                // Load all annotations with one call.
                annotationsCommunication.log("Loading all annotations with one call");
                var nsKey = (MyPundit.isUserLogged()) ? 'asAnnMult' : 'asOpenAnnMult';
                var postData = ids.join(';');
                var httpObject = {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'text/plain'
                    },
                    method: 'POST',
                    url: NameSpace.get(nsKey),
                    withCredentials: true,
                    data: postData
                };
                //if (annotationsCommunication.options.loadMultipleAnnotationsRequireCredentials) {
                //    httpObject.withCredentials = true;
                //    httpObject.url =  NameSpace.get('asAnnMult');
                //}
                $http(httpObject).success(function(data) {
                    var parsedData = ModelHelper.parseAnnotations(data);
                    var num = Object.keys(parsedData).length;

                    makeTargetsAndItems(data, forceAddToContainer);

                    var creatingNotebooks = {};

                    for (var annId in parsedData) {
                        var a = new Annotation(annId, false, parsedData[annId]);
                        a.then(function(ann) {
                            var notebookID = ann.isIncludedIn;
                            if (typeof(NotebookExchange.getNotebookById(notebookID)) === 'undefined' && typeof creatingNotebooks[notebookID] === 'undefined') {
                                // if the notebook is not loaded download it and add to notebooksExchange
                                creatingNotebooks[notebookID] = true;
                                new Notebook(notebookID);
                            }
                        }, function(error) {
                            annotationsCommunication.log("Could not retrieve annotation: " + error);
                        }).finally().then(function() {
                            settled++;
                            annotationsCommunication.log('Created annotation ' + settled + ' [id:' + annId + ']');

                            if (settled === num) {
                                annotationsCommunication.log('All annotations created, consolidating');
                                Consolidation.consolidateAll();
                                setLoading(false);
                                promise.resolve(settled);
                            }
                        });
                    }
                }).error(function( /*data, statusCode*/ ) {
                    setLoading(false);
                });
            }
        }, function(msg) {
            annotationsCommunication.err("Could not search for annotations, error from the server: " + msg);
            EventDispatcher.sendEvent('Pundit.error', 'Could not search for annotations, error from the server!');
            EventDispatcher.sendEvent('Pundit.alert', {id: "ERROR", timeout: 3000, message: 'Could not search for annotations, error from the server!'});
            promise.reject(msg);
        });

        return promise.promise;

    };

    // delete specified annotation from server
    // TODO optimize (we must reload all annotation from server? i think that is not necessary)
    annotationsCommunication.deleteAnnotation = function(annID) {

        var promise = $q.defer();

        EventDispatcher.sendEvent('AnnotationsCommunication.PreventDelay', true);

        if (MyPundit.isUserLogged()) {
            setLoading(true);
            $http({
                method: 'DELETE',
                url: NameSpace.get('asAnn', {
                    id: annID
                }),
                withCredentials: true
            }).success(function() {
                setLoading(false);
                annotationsCommunication.log("Success annotation: " + annID + " correctly deleted");
                // remove annotation from relative notebook
                var notebookID = AnnotationsExchange.getAnnotationById(annID).isIncludedIn;
                var nt = NotebookExchange.getNotebookById(notebookID);
                if (typeof(nt) !== 'undefined') {
                    nt.removeAnnotation(annID);
                }
                // wipe page items
                ItemsExchange.wipeContainer(Config.modules.PageItemsContainer.container);
                // wipe all annotations (are in cache)
                AnnotationsExchange.wipe();

                // Dispatch event
                EventDispatcher.sendEvent('AnnotationsCommunication.annotationDeleted', annID);

                // reload all annotation
                annotationsCommunication.getAnnotations(true).then(function() {
                    promise.resolve(annID);
                }, function() {
                    promise.reject("Error during getAnnotations after a delete of: " + annID);
                });

            }).error(function() {
                setLoading(false);
                annotationsCommunication.log("Error impossible to delete annotation: " + annID + " please retry.");
                EventDispatcher.sendEvent('Pundit.alert', {id: "ERROR", timeout: 3000, message: "Error impossible to delete annotation: " + annID + " please retry."});
                promise.reject("Error impossible to delete annotation: " + annID);
            });
        } else {
            annotationsCommunication.log("Error impossible to delete annotation: " + annID + " you are not logged");
            promise.reject("Error impossible to delete annotation: " + annID + " you are not logged");
        }

        return promise.promise;
    };

    annotationsCommunication.saveAnnotation = function(graph, items, flatTargets, templateID, skipConsolidation, postDataTargets, types) {
        // var completed = 0;
        var promise = $q.defer();

        EventDispatcher.sendEvent('AnnotationsCommunication.PreventDelay', true);

        var postSaveSend = function(url, annotationId) {
            $http({
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                url: url,
                params: {},
                data: {
                    annotationID: annotationId
                }
            }).success(function() {
                annotationsCommunication.log('Post save success');
            }).error(function(error) {
                annotationsCommunication.log('Post save error ', error);
            });
        };

        if (MyPundit.isUserLogged()) {

            setLoading(true);

            var postData = {
                graph: graph,
                items: items
            };
            if (typeof postDataTargets !== 'undefined') {
                postData.target = postDataTargets;
            }
            if (annotationServerVersion === 'v2') {
                postData.type = types;
            }
            if (typeof(templateID) !== 'undefined') {
                postData.metadata = {
                    template: templateID
                };
            }

            $http({
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                url: NameSpace.get('asNBCurrent'),
                params: {
                    context: angular.toJson({
                        targets: flatTargets,
                        pageContext: XpointersHelper.getSafePageContext()
                    })
                },
                withCredentials: true,
                data: postData
            }).success(function(data) {
                EventDispatcher.sendEvent('AnnotationsCommunication.annotationSaved', data.AnnotationID);
                // TODO if is rejected ???
                new Annotation(data.AnnotationID).then(function() {

                    var ann = AnnotationsExchange.getAnnotationById(data.AnnotationID);

                    // get notebook that include the new annotation
                    var nb = NotebookExchange.getNotebookById(ann.isIncludedIn);

                    // if no notebook is defined, it means that user is logged in a new user in Pundit and has not any notebooks
                    // so create a new notebook and add annotation in new notebook in NotebookExchange
                    if (typeof(nb) === 'undefined') {
                        new Notebook(ann.isIncludedIn, true).then(function(id) {
                            NotebookExchange.getNotebookById(id).addAnnotation(data.AnnotationID);
                        });
                    } else {
                        // otherwise if user has a notebook yet, use it to add new annotation in that notebook in NotebookExchange
                        NotebookExchange.getNotebookById(ann.isIncludedIn).addAnnotation(data.AnnotationID);
                    }

                    if (typeof(skipConsolidation) === 'undefined' || !skipConsolidation) {
                        EventDispatcher.sendEvent('AnnotationsCommunication.saveAnnotation', data.AnnotationID);
                        Consolidation.consolidateAll();
                    }

                    EventDispatcher.sendEvent('Client.dispatchDocumentEvent', {
                        event: 'Pundit2.updateAnnotationsNumber',
                        data: AnnotationsExchange.getAnnotations().length
                    });

                    // TODO move inside notebook then?
                    setLoading(false);
                    promise.resolve(ann.id);
                }, function() {
                    // rejected, impossible to download annotation from server
                    annotationsCommunication.log("Error: impossible to get annotation from server after save");
                    setLoading(false);
                    promise.reject();
                });

                // Call post save
                if (typeof(Config.postSave) !== 'undefined' && Config.postSave.active) {
                    var callbacks = Config.postSave.callbacks;
                    angular.isArray(callbacks) && angular.forEach(callbacks, function(callback) {
                        postSaveSend(callback, data.AnnotationID);
                    });
                }
            }).error(function(msg) {
                setLoading(false);
                annotationsCommunication.log("Error: impossible to save annotation", msg);
                EventDispatcher.sendEvent('Pundit.alert', {id: "ERROR", timeout: 3000, message: "Error: impossible to save annotation, " + msg});
                promise.reject();
            });

        } else {
            annotationsCommunication.log("Error impossible to save annotation you are not logged");
            promise.reject("Error impossible to save annotation you are not logged");
        }

        return promise.promise;

    };


    // this API not work correctly sometimese save correctly the items sometimes not save correctly
    // TODO : safety check if we get an error in one of the two http calls
    annotationsCommunication.editAnnotation = function(annID, graph, items, flatTargets, targets, types) {

        var promise = $q.defer();

        EventDispatcher.sendEvent('AnnotationsCommunication.PreventDelay', true);

        if (MyPundit.isUserLogged()) {

            if (Config.annotationServerVersion === 'v1') {
                updateAnnotationV1(promise, annID, graph, items, flatTargets);
            } else {
                updateAnnotationV2(promise, annID, graph, items, flatTargets, targets, types);
            }

        } else {
            annotationsCommunication.log("Error impossible to edit annotation: " + annID + " you are not logged");
            EventDispatcher.sendEvent('Pundit.alert', {id: "ERROR", timeout: 3000, message: "Error impossible to edit annotation: " + annID + " you are not logged"});
            promise.reject("Error impossible to edit annotation: " + annID + " you are not logged");
        }

        return promise.promise;

    };

    annotationsCommunication.setAnnotationsBroken = function(annotationsId, broken, promise) {
        if (MyPundit.isUserLogged() === false) {
            return;
        }

        var nsKey = 'asAnnBroken';
        var listId = annotationsId.join(';');
        var addValue = '?add=' + broken;
        var httpObject = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            },
            method: 'PUT',
            url: NameSpace.get(nsKey) + addValue,
            withCredentials: true,
            data: listId
        };

        $http(httpObject).success(function() {
            if (typeof promise !== 'undefined') {
                promise.resolve();
            }
            annotationsCommunication.log("Annotations " + listId + " set broken: " + broken);
        }).error(function() {
            if (typeof promise !== 'undefined') {
                promise.reject();
            }
            annotationsCommunication.log("Error during setting annotations broken");
        });
    };

    EventDispatcher.addListener('BrokenHelper.sendBroken', function(e) {
        annotationsCommunication.setAnnotationsBroken(e.args, true, e.promise);
    });

    EventDispatcher.addListener('BrokenHelper.sendFixed', function(e) {
        annotationsCommunication.setAnnotationsBroken(e.args, false, e.promise);
    });

    EventDispatcher.addListener('Client.requestAnnotationsNumber', function() {
        EventDispatcher.sendEvent('Client.dispatchDocumentEvent', {
            event: 'Pundit2.updateAnnotationsNumber',
            data: AnnotationsExchange.getAnnotations().length
        });
    });

    return annotationsCommunication;
});