angular.module('Pundit2.MyNotebooksContainer')

.constant('MYNOTEBOOKSCONTAINERDEFAULTS', {

    clientDashboardTemplate: "src/Lists/MyNotebooksContainer/ClientMyNotebooksContainer.tmpl.html",

    clientDashboardPanel: "lists",

    clientDashboardTabTitle: "Notebooks",

    cMenuType: 'myNotebooks',

    container: 'myNotebooks',

    inputIconSearch: 'pnd-icon-search',

    inputIconClear: 'pnd-icon-close',

    order: 'label',

    reverse: false

})

.service('MyNotebooksContainer', function($rootScope, MYNOTEBOOKSCONTAINERDEFAULTS, BaseComponent, EventDispatcher,
    NotebookExchange, ItemsExchange, PageItemsContainer, AnnotationsExchange, NotebookCommunication, Consolidation,
    ContextualMenu, Config, Dashboard, NotebookComposer, AnnotationsCommunication, NameSpace, Analytics,
    $modal, $timeout, $window) {

    var myNotebooksContainer = new BaseComponent('MyNotebooksContainer', MYNOTEBOOKSCONTAINERDEFAULTS);

    // this service is injected inside client and controller
    // to read the passed configuration and initialize notebooks contextual menu actions

    var initContextualMenu = function() {

        // TODO: sanity checks on Config.modules.* ? Are they active? Think so??
        var cMenuTypes = [myNotebooksContainer.options.cMenuType];

        var lodLive = false;
        if (typeof(Config.lodLive) !== 'undefined' && Config.lodLive.active) {
            lodLive = true;
        }
        var timeline = false;
        if (typeof(Config.timeline) !== 'undefined' && Config.timeline.active) {
            timeline = true;
        }

        ContextualMenu.addAction({
            name: 'openNTlod',
            type: cMenuTypes,
            label: "Open graph",
            priority: 102,
            showIf: function() {
                return lodLive;
            },
            action: function(nt) {
                $window.open(Config.lodLive.baseUrl + Config.pndPurl + 'notebook/' + nt.id, '_blank');
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--openGraph');
            }
        });

        ContextualMenu.addAction({
            name: 'openTM',
            type: cMenuTypes,
            label: "Open Timeline",
            priority: 102,
            showIf: function() {
                return timeline;
            },
            action: function(nt) {
                $window.open(Config.timeline.baseUrl + 'notebook-ids=' + nt.id + '&namespace=' + Config.pndPurl + 'notebook/' + '&api=' + NameSpace.asOpen, '_blank');
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--openTimeline');
            }
        });

        ContextualMenu.addAction({
            name: 'setAsPrivate',
            type: cMenuTypes,
            label: "Set notebook as private",
            priority: 100,
            showIf: function(nt) {
                return nt.visibility === "public";
            },
            action: function(nt) {
                NotebookCommunication.setPrivate(nt.id);
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--setPrivate');
            }
        });

        ContextualMenu.addAction({
            name: 'setAsPublic',
            type: cMenuTypes,
            label: "Set notebook as public",
            priority: 100,
            showIf: function(nt) {
                return nt.visibility === "private";
            },
            action: function(nt) {
                NotebookCommunication.setPublic(nt.id);
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--setPublic');
            }
        });

        ContextualMenu.addAction({
            name: 'setAsCurrent',
            type: cMenuTypes,
            label: "Set notebook as current",
            priority: 100,
            showIf: function(nt) {
                return !nt.isCurrent();
            },
            action: function(nt) {
                NotebookCommunication.setCurrent(nt.id);
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--setCurrent');
            }
        });

        ContextualMenu.addAction({
            name: 'deleteNotebook',
            type: cMenuTypes,
            label: "Delete notebook",
            priority: 100,
            showIf: function(nt) {
                return !nt.isCurrent();
            },
            action: function(nt) {
                // delete notebook is a dangerous action
                // it also remove all contained annotation
                openConfirmModal(nt);
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--delete');
            }
        });

        ContextualMenu.addAction({
            name: 'editNotebook',
            type: cMenuTypes,
            label: "Edit notebook",
            priority: 101,
            showIf: function() {
                return true;
            },
            action: function(nt) {
                // open dashobard
                if (!Dashboard.isDashboardVisible()) {
                    Dashboard.toggle();
                }
                // then swicth to notebook composer tab

                //EventDispatcher.sendEvent('Dashboard.showTab', NotebookComposer.options.clientDashboardTabTitle);
                EventDispatcher.sendEvent('MyNotebooksContainer.editNotebook', NotebookComposer.options.clientDashboardTabTitle);
                NotebookComposer.setNotebookToEdit(nt);
                Analytics.track('buttons', 'click', 'contextualMenu--notebook--edit');
                // TODO open if the panel is collapsed
            }
        });

    }; // initContextualMenu()

    // When all modules have been initialized, services are up, Config are setup etc..
    EventDispatcher.addListener('Client.boot', function() {
        initContextualMenu();
    });

    // confirm modal
    var modalScope = $rootScope.$new();

    modalScope.titleMessage = "Delete notebook";

    // confirm btn click
    modalScope.confirm = function() {
        var notebookAnnotations = modalScope.notebook.includes;

        // remove notebook and all annotation contained in it
        NotebookCommunication.deleteNotebook(modalScope.notebook.id).then(function() {
            var annotations = AnnotationsExchange.getAnnotations();
            var itemsToKeep = {},
                itemsToDelete = [];

            // success
            modalScope.notifyMessage = "Notebook " + modalScope.notebook.label + " correctly deleted.";

            angular.forEach(notebookAnnotations, function(annID) {
                var annotation = AnnotationsExchange.getAnnotationById(annID);

                // Check and remove annotation items from ItemsExchange.
                for (var a in annotations) {
                    if (annotation.id === annotations[a].id) {
                        continue;
                    }
                    for (var i in annotations[a].items) {
                        var uri = annotations[a].items[i].uri;
                        itemsToKeep[uri] = annotations[a].items[i];
                    }
                }

                for (var j in annotation.items) {
                    if (typeof itemsToKeep[annotation.items[j].uri] === 'undefined') {
                        if (ItemsExchange.isItemInContainer(annotation.items[j], Config.modules.PageItemsContainer.container)) {
                            ItemsExchange.removeItemFromContainer(annotation.items[j], Config.modules.PageItemsContainer.container);
                            itemsToDelete.push(annotation.items[j]);
                        }
                    }
                }

                AnnotationsExchange.removeAnnotation(annotation.id);
                Consolidation.wipeItems(itemsToDelete);
            });

            // TODO: update positions in sidebar (?)

            $timeout(function() {
                confirmModal.hide();
            }, 1000);
        }, function() {
            // error
            modalScope.notifyMessage = "Error impossible to delete this notebook, please retry.";
            $timeout(function() {
                confirmModal.hide();
            }, 1000);
        });

        Analytics.track('buttons', 'click', 'contextualMenu--notebook--delete--confirm');

    };

    // cancel btn click
    modalScope.cancel = function() {
        confirmModal.hide();
        Analytics.track('buttons', 'click', 'contextualMenu--notebook--delete--cancel');
    };

    var confirmModal = $modal({
        container: "[data-ng-app='Pundit2']",
        templateUrl: 'src/Core/Templates/confirm.modal.tmpl.html',
        show: false,
        backdrop: 'static',
        scope: modalScope
    });

    // open modal
    var openConfirmModal = function(nt) {
        // promise is needed to open modal when template is ready
        modalScope.notifyMessage = "Are you sure you want to delete this notebook? will also remove all the annotation contained in it.";
        modalScope.notebook = nt;
        confirmModal.$promise.then(confirmModal.show);
    };

    return myNotebooksContainer;

});