angular.module('Pundit2.AnnotationPopover')

// TODO: manage opening during loading
.controller('AnnotationPopoverCtrl', function($scope, PndPopover, MyPundit, NotebookExchange,
    NotebookCommunication, AnnotationsCommunication, AnnotationPopover, ModelHelper, $timeout, $q) {

    $scope.literalText = '';

    $scope.selectedNotebookId = undefined;
    $scope.savingAnnotation = false;
    $scope.errorSaving = false;
    $scope.availableNotebooks = [];
    $scope.isUserLogged = MyPundit.isUserLogged();

    $scope.currentMode = '';

    var lastSelectedNotebookId;

    var updateAvailableNotebooks = function() {
        $scope.availableNotebooks = [];
        var notebooks = NotebookExchange.getMyNotebooks();
        for (var i in notebooks) {
            $scope.availableNotebooks.push({
                value: notebooks[i].id,
                label: notebooks[i].label,
                title: notebooks[i].label
            });
        }
        return $scope.availableNotebooks;
    };

    var updateCurrentNotebook = function() {
        if (!MyPundit.isUserLogged()) {
            return;
        }
        
        if (typeof AnnotationPopover.lastUsedNotebookID === 'undefined') {
            // TODO: manage loading statuts, so with currentNotebook undefined
            AnnotationPopover.lastUsedNotebookID = NotebookExchange.getCurrentNotebooks().id;
        }
        lastSelectedNotebookId = $scope.selectedNotebookId = AnnotationPopover.lastUsedNotebookID;
    };

    $scope.setMode = function(mode) {
        $scope.currentMode = mode;
    };

    $scope.login = function() {
        MyPundit.login();
        PndPopover.hide();
    };

    $scope.cancel = function() {
        PndPopover.hide();
    };

    $scope.save = function() {
        $scope.savingAnnotation = true;

        var isComment = $scope.currentMode === 'comment',
            objectContent = isComment ? $scope.literalText : '';

        var currentTarget = PndPopover.getData().item,
            currentStatement = {
                scope: {
                    get: function() {
                        return {
                            subject: currentTarget,
                            predicate: '',
                            object: objectContent
                        };
                    }
                }
            };

        var modelData = isComment ? ModelHelper.buildCommentData(currentStatement) : ModelHelper.buildHigthLightData(currentStatement),
            motivation = isComment ? 'commenting' : 'highlighting';

        var httpPromise = AnnotationsCommunication.saveAnnotation(
            modelData.graph,
            modelData.items,
            modelData.flatTargets,
            undefined, // templateID
            undefined, // skipConsolidation
            modelData.target,
            modelData.type,
            motivation,
            $scope.selectedNotebookId
        );

        httpPromise.then(function() {
            // OK.
            AnnotationPopover.lastUsedNotebookID = lastSelectedNotebookId = $scope.selectedNotebookId;
            NotebookCommunication.setCurrent(lastSelectedNotebookId);
            PndPopover.hide();
        }, function() {
            // Epic FAIL.
        });

    };

    $scope.doCreateNewNotebook = function(notebookName) {
        var deferred = $q.defer();

        NotebookCommunication.createNotebook(notebookName).then(function(notebookID) {
            if (typeof notebookID !== 'undefined') {
                lastSelectedNotebookId = notebookID;
                updateAvailableNotebooks();
                $scope.selectedNotebookId = lastSelectedNotebookId;
                deferred.resolve({
                    label: notebookName,
                    title: notebookName,
                    value: notebookID
                });
            }
        }, function() {
            // TODO: handle errors during noteebook save, maybe Alert System is enough ?
            deferred.reject();
        });

        return deferred.promise;
    };

    $scope.focusOn = function(elementId) {
        angular.element('.pnd-annotation-popover #' + elementId)[0].focus();
    };

    updateCurrentNotebook();
    updateAvailableNotebooks();
});