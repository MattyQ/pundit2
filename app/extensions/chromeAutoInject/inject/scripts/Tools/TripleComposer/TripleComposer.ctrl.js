angular.module('Pundit2.TripleComposer')

.controller('TripleComposerCtrl', function($rootScope, $scope, $http, $q, $timeout, NameSpace, EventDispatcher,
    MyPundit, Toolbar, TripleComposer, AnnotationsCommunication, AnnotationsExchange, TemplatesExchange, Analytics, ModelHelper) {

    if (typeof $scope.name === 'undefined') {
        $scope.name = "triplecomposer-" + Math.floor((new Date()).getTime() / 100 * (Math.random() * 100) + 1);
    }

    TripleComposer.initInstance($scope.name);

    // statements objects are extend by this.addStatementScope()
    // the function is called in the statement directive link function
    $scope.statements = TripleComposer.getStatements($scope.name);

    $scope.showHeader = function() {
        return TripleComposer.showHeader(undefined, $scope.name);
    };

    $scope.showFooter = function() {
        return TripleComposer.showFooter(undefined, $scope.name);
    };

    $scope.saving = false;
    TripleComposer.setSaving(false, $scope.name);
    $scope.textMessage = TripleComposer.options.savingMsg;

    $scope.headerMessage = "Create new annotation";

    // TODO find a better way to change this state
    $scope.editMode = false;
    $scope.$watch(function() {
        return TripleComposer.isEditMode($scope.name);
    }, function(editMode) {
        if (editMode) {
            $scope.headerMessage = "Edit and update your annotation";
        } else {
            $scope.headerMessage = "Create new annotation";
        }
        $scope.editMode = editMode;
    });

    $scope.templateMode;
    var lastHeader;
    $scope.$watch(function() {
        return Toolbar.isActiveTemplateMode();
    }, function(newVal, oldVal) {
        $scope.templateMode = newVal;
        if (newVal) {
            lastHeader = $scope.headerMessage;
            $scope.headerMessage = "Complete your annotation and save!";
        } else if (newVal !== oldVal) {
            $scope.headerMessage = lastHeader;
        }
    });

    var loadShortMsg = "Loading",
        successShortMsg = "Saved",
        warnShortMsg = "Warning!";

    var loadIcon = "pnd-icon-refresh pnd-icon-spin",
        successIcon = "pnd-icon-check",
        warnIcon = "pnd-icon-exclamation";

    var loadMessageClass = "pnd-message",
        successMessageClass = "pnd-message-success",
        warnMessageClass = "pnd-message-warning";

    $scope.shortMessagge = loadShortMsg;
    $scope.savingIcon = loadIcon;
    $scope.shortMessageClass = loadMessageClass;

    this.removeStatement = function(id) {
        id = parseInt(id, 10);
        TripleComposer.removeStatement(id, $scope.name);
        if (TripleComposer.isAnnotationComplete($scope.name)) {
            angular.element('.pnd-triplecomposer-save').removeClass('disabled');
        }
    };

    this.addStatementScope = function(id, scope) {
        id = parseInt(id, 10);
        TripleComposer.addStatementScope(id, scope, $scope.name);
    };

    this.duplicateStatement = function(id) {
        id = parseInt(id, 10);
        TripleComposer.duplicateStatement(id, $scope.name);
    };

    this.isAnnotationComplete = function() {
        if (TripleComposer.isAnnotationComplete($scope.name)) {
            angular.element('.pnd-triplecomposer-save').removeClass('disabled');
        }
    };

    this.isTripleErasable = function() {
        TripleComposer.isTripleErasable($scope.name);
    };

    this.getName = function() {
        return $scope.name;
    };

    $scope.isAnnotationErasable = function() {
        return !TripleComposer.isTripleEmpty($scope.name);
    };

    $scope.onClickAddStatement = function() {
        angular.element('.pnd-triplecomposer-save').addClass('disabled');
        TripleComposer.addStatement($scope.name);
    };

    $scope.cancel = function() {
        if ($scope.editMode) {
            angular.element('.pnd-triplecomposer-save').addClass('disabled');
            TripleComposer.reset($scope.name);
            TripleComposer.setEditMode(false, $scope.name);
            TripleComposer.updateVisibility($scope.name);
        }

        EventDispatcher.sendEvent('Pundit.changeSelection');
    };

    $scope.resetComposer = function() {
        angular.element('.pnd-triplecomposer-save').addClass('disabled');
        if ($scope.templateMode) {
            TripleComposer.wipeNotFixedItems($scope.name);
            return;
        }
        TripleComposer.reset($scope.name);
        EventDispatcher.sendEvent('Pundit.changeSelection');

        var eventLabel = getHierarchyString();
        eventLabel += "--resetComposer";
        Analytics.track('buttons', 'click', eventLabel);
    };

    $scope.editAnnotation = function() {
        var annID = TripleComposer.getEditAnnID($scope.name);

        if (typeof(annID) !== 'undefined') {

            var savePromise = initSavingProcess();
            angular.element('.pnd-triplecomposer-cancel').addClass('disabled');

            var statements = TripleComposer.getStatements($scope.name);
            var modelData = ModelHelper.buildAllData(statements);

            AnnotationsCommunication.editAnnotation(
                annID,
                modelData.graph,
                modelData.items,
                modelData.flatTargets,
                modelData.target,
                modelData.type
            ).then(function() {
                stopSavingProcess(
                    savePromise,
                    TripleComposer.options.notificationSuccessMsg,
                    TripleComposer.options.notificationMsgTime,
                    false
                );
            }, function() {
                stopSavingProcess(
                    savePromise,
                    TripleComposer.options.notificationErrorMsg,
                    TripleComposer.options.notificationMsgTime,
                    true
                );
            });
        }
    };

    // getter function used to build hierarchystring.
    // hierarchystring is used for tracking events with analytics.
    var getHierarchyString = function() {
        // Temporary solution to find hierarchystring.
        var eventLabel = "";
        var myScope = $scope;
        do {
            if (typeof(myScope) === 'undefined' || myScope === null) {
                break;
            }
            if (myScope.hasOwnProperty('pane')) {
                if (myScope.pane.hasOwnProperty('hierarchystring')) {
                    eventLabel = myScope.pane.hierarchystring;
                }
                break;
            }
            myScope = myScope.$parent;
        }
        while (typeof(myScope) !== 'undefined' && myScope !== null);

        return eventLabel;
    };

    // update triple composer messagge then after "time" (ms)
    // restore default template content
    var updateMessagge = function(msg, time, err) {
        $scope.textMessage = msg;

        if (err) {
            $scope.shortMessagge = warnShortMsg;
            $scope.savingIcon = warnIcon;
            $scope.shortMessageClass = warnMessageClass;
        } else {
            $scope.shortMessagge = successShortMsg;
            $scope.savingIcon = successIcon;
            $scope.shortMessageClass = successMessageClass;
        }

        $timeout(function() {
            TripleComposer.setEditMode(false, $scope.name);
            angular.element('.pnd-triplecomposer-cancel').removeClass('disabled');
            $scope.saving = false;
            TripleComposer.setSaving(false, $scope.name);
            TripleComposer.updateVisibility($scope.name);
        }, time);
    };

    var promiseResolved;
    var initSavingProcess = function() {
        // disable save button
        angular.element('.pnd-triplecomposer-save').addClass('disabled');

        // init save process showing saving message
        $scope.textMessage = TripleComposer.options.savingMsg;
        $scope.shortMessagge = loadShortMsg;
        $scope.savingIcon = loadIcon;
        $scope.shortMessageClass = loadMessageClass;

        promiseResolved = false;
        //savePromise = $timeout(function(){ promiseResolved = true; }, TripleComposer.options.savingMsgTime);
        $scope.saving = true;
        TripleComposer.setSaving(true, $scope.name);
        return $timeout(function() {
            promiseResolved = true;
        }, TripleComposer.options.savingMsgTime);
    };

    var stopSavingProcess = function(promise, msg, msgTime, err) {

        // if you have gone at least 500ms
        if (promiseResolved) {
            updateMessagge(msg, msgTime, err);
        } else {
            promise.then(function() {
                updateMessagge(msg, msgTime, err);
            });
        }

        if ($scope.templateMode) {
            TripleComposer.wipeNotFixedItems($scope.name);
            return;
        }

        TripleComposer.reset($scope.name);
    };

    $scope.saveAnnotation = function() {

        var promise = $q.defer(),
            forceConsolidation = MyPundit.isUserLogged() === false;

        MyPundit.login().then(function(logged) {

            if (logged) {
                var abort = $scope.statements.some(function(el) {
                    var t = el.scope.get();
                    // if the triple is mandatory it must be completed before saving annotation
                    // if the triple is not mandatory it can be saved with incomplete triples (this triples is skipped)
                    if (el.scope.isMandatory && (t.subject === null || t.predicate === null || t.object === null)) {
                        return true;
                    }
                });

                if (abort) {
                    // try to save incomplete annotation
                    promise.reject();
                    return;
                }

                var savePromise = initSavingProcess();

                var statements = TripleComposer.getStatements($scope.name);
                var modelData = ModelHelper.buildAllData(statements);

                var httpPromise;
                if ($scope.templateMode) {
                    httpPromise = AnnotationsCommunication.saveAnnotation(
                        modelData.graph,
                        modelData.items,
                        modelData.flatTargets,
                        TemplatesExchange.getCurrent().id,
                        forceConsolidation, // forceConsolidation
                        modelData.target, // Can be undefined if ModelHelper is acting in mode1
                        modelData.type
                    );
                } else {
                    httpPromise = AnnotationsCommunication.saveAnnotation(
                        modelData.graph,
                        modelData.items,
                        modelData.flatTargets,
                        undefined, // templateID
                        forceConsolidation, // forceConsolidation
                        modelData.target, // Can be undefined if ModelHelper is acting in mode1
                        modelData.type
                    );
                }

                httpPromise.then(function() {
                    // resolved
                    stopSavingProcess(
                        savePromise,
                        TripleComposer.options.notificationSuccessMsg,
                        TripleComposer.options.notificationMsgTime,
                        false
                    );
                    promise.resolve();
                }, function() {
                    // rejected
                    TripleComposer.closeAfterOpOff($scope.name);
                    stopSavingProcess(
                        savePromise,
                        TripleComposer.options.notificationErrorMsg,
                        TripleComposer.options.notificationMsgTime,
                        true
                    );
                    promise.resolve();
                });

            } //end if logged
        }); // end my pundit login

        EventDispatcher.sendEvent('Pundit.changeSelection');

        var eventLabel = getHierarchyString();
        eventLabel += "--saveAnnotation";
        Analytics.track('buttons', 'click', eventLabel);

        return promise.promise;

    }; // end save function

    var evtHandlers = [];

    evtHandlers.push(EventDispatcher.addListener('ResourcePanel.toggle', function(e) {
        var isResourcePanelOpend = e.args;
        if (isResourcePanelOpend) {
            angular.element('.pnd-triplecomposer-statements-container').addClass('pnd-triplecomposer-statement-not-scroll');
        } else {
            angular.element('.pnd-triplecomposer-statements-container').removeClass('pnd-triplecomposer-statement-not-scroll');
        }
    }));

    evtHandlers.push(EventDispatcher.addListener('Annotators.saveAnnotation', function() {
        var uncomplete = $scope.statements.some(function(el) {
            var t = el.scope.get();
            if (t.subject === null || t.predicate === null || t.object === null) {
                return true;
            }
        });
        if (uncomplete) {
            TripleComposer.openTripleComposer();
        } else {
            $scope.saveAnnotation().catch(function() {
                // incomplete annotation
                // open triple composer to tell user to complete the annotation
                TripleComposer.openTripleComposer();
            });
        }
    }));

    evtHandlers.push(EventDispatcher.addListener('MyPundit.isUserLogged', function(e) {
        if (!e.args) {
            TripleComposer.reset($scope.name);
        }
    }));

    evtHandlers.push(EventDispatcher.addListener('AnnotationsCommunication.deleteAnnotation', function(e) {
        var currentAnnId = TripleComposer.getEditAnnID($scope.name);
        if (e.args === currentAnnId) {
            TripleComposer.reset($scope.name);
            angular.element('.pnd-triplecomposer-save').addClass('disabled');
            EventDispatcher.sendEvent('Dashboard.close');
        }
    }));

    $scope.removeEventListeners = function() {
        for (var i in evtHandlers) {
            EventDispatcher.removeListener(evtHandlers[i]);
        }
    };

});