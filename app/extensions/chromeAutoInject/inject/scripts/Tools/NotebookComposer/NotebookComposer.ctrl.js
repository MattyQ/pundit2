angular.module('Pundit2.NotebookComposer')

.controller('NotebookComposerCtrl', function($scope, EventDispatcher, NotebookComposer, $timeout, NotebookExchange, NotebookCommunication, Analytics, $q) {

    var setLoading = function(state) {
        EventDispatcher.sendEvent('NotebookComposerCtrl.loading', state);
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

    $scope.notebook = {};
    $scope.notebook.visibility = "public";
    $scope.notebook.name = "";
    $scope.notebook.current = false;
    $scope.editMode = false;
    $scope.notebookComposerHeader = "Create your notebook";

    // watch the notebook to edit
    $scope.$watch(function() {
        return NotebookComposer.getNotebookToEdit();
    }, function(nb) {
        if (nb !== null) {
            $scope.notebookToEdit = nb;
            $scope.notebook.name = nb.label;
            $scope.notebook.visibility = nb.visibility;
            $scope.editMode = true;

            // check if notebook to edit is the current notebook
            if (NotebookExchange.getCurrentNotebooks().id === nb.id) {
                $scope.isCurrentNotebook = true;
                $scope.notebook.current = true;
            } else {
                $scope.isCurrentNotebook = false;
                $scope.notebook.current = false;
            }
            $scope.notebookComposerHeader = "Edit your notebook";
        } else {
            $scope.clear();
        }

    });


    $scope.saving = false;
    $scope.textMessage = NotebookComposer.options.savingMsg;

    var editShortMsg = "Editing",
        loadShortMsg = "Loading",
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

    // update message during saving or editing process
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
            $scope.saving = false;
            setLoading(false);
            $scope.notebookComposerHeader = "Create your notebook";
            NotebookComposer.setNotebookToEdit(null);
        }, time);

    };

    var timeoutPromise, timeoutIsDone;

    $scope.save = function() {

        setLoading(true);

        // init save process showing saving message
        $scope.textMessage = NotebookComposer.options.savingMsg;
        $scope.shortMessagge = loadShortMsg;
        $scope.savingIcon = loadIcon;
        $scope.shortMessageClass = loadMessageClass;

        timeoutIsDone = false;
        timeoutPromise = $timeout(function() {
            timeoutIsDone = true;
        }, NotebookComposer.options.savingMsgTime);
        $scope.saving = true;

        NotebookComposer.createNotebook($scope.notebook).then(function() {
                // if you have gone at least 500ms
                if (timeoutIsDone) {
                    updateMessagge(NotebookComposer.options.notificationSuccessMsg, NotebookComposer.options.notificationMsgTime, false);
                    //$scope.notebookComposerHeader = "Create your notebook";
                    $scope.clear();
                } else {
                    timeoutPromise.then(function() {
                        updateMessagge(NotebookComposer.options.notificationSuccessMsg, NotebookComposer.options.notificationMsgTime, false);
                        //$scope.notebookComposerHeader = "Create your notebook";
                        $scope.clear();
                    });
                }


            },
            function() {
                // if you have gone at least 500ms
                if (timeoutIsDone) {
                    updateMessagge(NotebookComposer.options.notificationErrorMsg, NotebookComposer.options.notificationMsgTime, true);
                } else {
                    timeoutPromise.then(function() {
                        updateMessagge(NotebookComposer.options.notificationErrorMsg, NotebookComposer.options.notificationMsgTime, true);
                    });
                }

            });

        var eventLabel = getHierarchyString();
        eventLabel += "--saveNewNotebook";
        Analytics.track('buttons', 'click', eventLabel);
    };

    // edit a notebook
    $scope.edit = function() {

        var promises = [];
        setLoading(true);

        // init save process showing saving message
        $scope.textMessage = NotebookComposer.options.editingMsg;
        $scope.shortMessagge = editShortMsg;
        $scope.savingIcon = loadIcon;
        $scope.shortMessageClass = loadMessageClass;

        timeoutIsDone = false;
        timeoutPromise = $timeout(function() {
            timeoutIsDone = true;
        }, NotebookComposer.options.savingMsgTime);
        $scope.saving = true;

        // if name of notebook is edited
        if ($scope.notebookToEdit.label !== $scope.notebook.name) {
            var promiseEdit = NotebookComposer.editNotebook($scope.notebookToEdit.id, $scope.notebook.name);
            promises.push(promiseEdit);
        }

        // if notebook is set as current
        if ($scope.notebook.current === true) {
            var promiseCurrent = NotebookCommunication.setCurrent($scope.notebookToEdit.id);
            promises.push(promiseCurrent);
        }

        // if notebook visibility is edited
        if ($scope.notebookToEdit.visibility !== $scope.notebook.visibility) {
            // case of public visibility
            if ($scope.notebook.visibility === 'public') {
                var promisePublic = NotebookCommunication.setPublic($scope.notebookToEdit.id);
                promises.push(promisePublic);
                // case of private visibility
            } else if ($scope.notebook.visibility === 'private') {
                var promisePrivate = NotebookCommunication.setPrivate($scope.notebookToEdit.id);
                promises.push(promisePrivate);
            }
        }

        $q.all(promises).then(function() {
                // if you have gone at least 500ms
                if (timeoutIsDone) {
                    updateMessagge(NotebookComposer.options.notificationSuccessMsg, NotebookComposer.options.notificationMsgTime, false);
                    //$scope.notebookComposerHeader = "Create your notebook";
                    $scope.clear();
                } else {
                    timeoutPromise.then(function() {
                        updateMessagge(NotebookComposer.options.notificationSuccessMsg, NotebookComposer.options.notificationMsgTime, false);
                        //$scope.notebookComposerHeader = "Create your notebook";
                        $scope.clear();
                    });
                }

            },
            function() {
                // if you have gone at least 500ms
                if (timeoutIsDone) {
                    updateMessagge(NotebookComposer.options.notificationErrorMsg, NotebookComposer.options.notificationMsgTime, true);
                    //$scope.notebookComposerHeader = "Create your notebook";
                    $scope.clear();

                } else {
                    timeoutPromise.then(function() {
                        updateMessagge(NotebookComposer.options.notificationErrorMsg, NotebookComposer.options.notificationMsgTime, true);
                        //$scope.notebookComposerHeader = "Create your notebook";
                        $scope.clear();
                    });
                }
            });


        var eventLabel = getHierarchyString();
        eventLabel += "--saveExistingNotebook";
        Analytics.track('buttons', 'click', eventLabel);

    };

    // reset form
    $scope.clear = function(trackEvent) {
        $scope.notebook.name = "";
        $scope.notebook.visibility = "public";
        $scope.notebook.current = "";
        $scope.editMode = false;
        $scope.notebookComposerHeader = "Create your notebook";
        NotebookComposer.setNotebookToEdit(null);

        if (trackEvent) {
            var eventLabel = getHierarchyString();
            eventLabel += "--reset";
            Analytics.track('buttons', 'click', eventLabel);
        }
    };

    EventDispatcher.addListener('MyPundit.popoverClose', function() {
        if ($scope.saving) {
            updateMessagge(NotebookComposer.options.notificationErrorMsg, NotebookComposer.options.notificationMsgTime, true);
            $scope.clear();
        }
    });    

});