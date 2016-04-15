angular.module('KorboEE')
.controller('KeeModalCtrl', function ($scope, $rootScope, $modal, KorboCommunicationService, APIService, korboConf, KorboCommunicationFactory, $window, ResourcePanel) {

    var api = APIService.get($scope.conf.globalObjectName);
    var korboComm = new KorboCommunicationFactory();

    $scope.showHeaderTabs = $scope.conf.showHeaderTabs;
    $scope.showBreadcrumbs = $scope.conf.showBreadcrumbs;
    $scope.editMode = false;

    // set default language
    $scope.defaultLan = $scope.conf.languages[0];
    for (var j in $scope.conf.languages) {
        if ($scope.conf.languages[j].state === true) {
            $scope.defaultLan = $scope.conf.languages[j];
            break;
        } // end if
    } // end for

    // current tab provider selected in search tab
    $scope.currentProv = {};

    // modal tabs
    $scope.korboModalTabs = [
        {
            "title": "Search",
            "template": "src/KorboEE/Search/KorboEE.search.tmpl.html",
            "totalResults": 0,
            "isStarted": false
        },
        {
            "title": "New",
            "template": "src/KorboEE/New/KorboEE.new.tmpl.html"
        }
    ];

    $scope.searchType = function() {
        return $scope.$parent.$parent.searchType || 'tab';
    };

    var lastSearchType = 'tab';
    $scope.$watch('$parent.$parent.searchType', function() {
        var currentSearchType = $scope.searchType();
        if (lastSearchType === 'tab' && currentSearchType === 'inner') {
            freezeSearchLayoutConfig();
            var searchSubType = $scope.$parent.$parent.searchConf.subType;
            switch (searchSubType) {
                case 'SearchURL':
                    $scope.showInnerCopyFromLOD.visibility = false;
                    $scope.showInnerSelectURL.visibility = true;
                    break;
                case 'SearchAndCopy':
                    $scope.showInnerCopyFromLOD.visibility = true;
                    $scope.showInnerSelectURL.visibility = false;
                    break;
            }
            $scope.showInnerDiscardSearch.visibility = true;
            $scope.searchFieldLabel = $scope.$parent.$parent.searchConf['searchFieldLabel' + searchSubType] || 'Search entity to use:';
        }
        else if (lastSearchType === 'inner' && currentSearchType === 'tab') {
            restoreLayoutConfig();
        }
        lastSearchType = currentSearchType;
    });

    var searchLayoutConfig;

    var freezeSearchLayoutConfig = function() {
        searchLayoutConfig = {};
        searchLayoutConfig.searchFieldLabel = $scope.searchFieldLabel;
    };

    var restoreLayoutConfig = function() {
        if (typeof searchLayoutConfig === 'undefined') {
            return;
        }
        $scope.searchFieldLabel = searchLayoutConfig.searchFieldLabel;
        searchLayoutConfig = undefined;
    };

    $scope.searchFieldLabel = "Search entity to use:";

    // BUTTONS STATE
    $scope.showClose = {
        "visibility": true,
        "disabled": false
    };

    $scope.showUse = {
        "visibility": false,
        "disabled": true
    };

    $scope.showUseAndCopy = {
        "visibility": false,
        "disabled": true
    };

    $scope.showCopyInEditor = {
        "visibility": false,
        "disabled": true
    };

    $scope.showMoreInfo = {
        "visibility": false,
        "disabled": true
    };

    $scope.showSaveAndAdd = {
        "visibility": false,
        "disabled": true
    };

    $scope.showInnerSelectURL = {
        "visibility": false,
        "disabled": false
    };

    $scope.showInnerCopyFromLOD = {
        "visibility": false,
        "disabled": false
    };

    $scope.showInnerDiscardSearch = {
        "visibility": false,
        "disabled": false
    };

    // set active tab in according with operation passed from callback
    $scope.$watch('op', function (val) {

        if (val === 'search') {
            $scope.korboModalTabs.activeTab = 0;
            $scope.korboModalTabs[0].labelToSearch = $scope.labelToSearch;

        }
        else {
            if (val === 'new') {
                $scope.korboModalTabs.activeTab = 1;
                $scope.korboModalTabs[1].entityToCreate = $scope.entityToCreate;

            }
            else {
                if (val === 'edit') {
                    $scope.korboModalTabs.activeTab = 1;
                    $scope.korboModalTabs[1].idEntityToEdit = $scope.idEntityToEdit;
                    $scope.editMode = true;
                }
            }
        }
    });

    // every time a tab in the modal (Search,New) is selected, update buttons visibility
    $scope.$watch('korboModalTabs.activeTab', function () {
        if ($scope.korboModalTabs.activeTab === 0) {
            KorboCommunicationService.setSearchConf('tab');
        }
        else if ($scope.korboModalTabs.activeTab === 1 && typeof $scope.$parent.$parent.searchConf !== 'undefined') {
            KorboCommunicationService.setSearchConf('inner');
        }
        handleButton();
    });

    // close modal
    $scope.closeKeeModal = function () {
        ResourcePanel.hide();
        if ($scope.conf.confirmModalOnClose) {
            KorboCommunicationService.showConfirmModal($scope.conf.globalObjectName);
        }
        else {
            KorboCommunicationService.closeModal();
        }
    };

    $scope.copyAndUse = function () {

        // build item to copy in korbo
        var itemToCopyInKorbo = {
            "label": $scope.itemSelected.label,
            "abstract": $scope.itemSelected.description,
            "type": $scope.itemSelected.type,
            "depiction": $scope.itemSelected.image,
            "resource": $scope.itemSelected.resource
        };

        // save item
        var promise = korboComm.save(itemToCopyInKorbo, $scope.defaultLan.value, $scope.conf.endpoint, $scope.conf.basketID);

        // if item is saved correctly
        promise.then(function (res) {

            // udpdate directive fields if widget is set to be used as tafony compatibility
            if ($scope.conf.useTafonyCompatibility) {
                $scope.directiveScope.label = itemToCopyInKorbo.label;
                $scope.directiveScope.elemToSearch = itemToCopyInKorbo.label;
                $scope.directiveScope.location = res;
            }

            // declare object returned onSave() call
            var obj = {};
            obj.value = res;
            obj.label = itemToCopyInKorbo.label;
            obj.type = itemToCopyInKorbo.type;
            obj.image = itemToCopyInKorbo.depiction;
            obj.description = itemToCopyInKorbo.abstract;
            obj.language = $scope.defaultLan.value;
            // fire save callback
            api.fireOnSave(obj);
            // fire cancel callback
            api.fireOnCancel();
            // close modal
            KorboCommunicationService.closeModal();
            // set modal as close in configuration
            korboConf.setIsOpenModal(false);

        },
        function () {
        });
    };

    $scope.moreInfo = function () {
        $window.open($scope.itemSelected.resource);
    };

    $scope.copyInEditor = function () {
        // memorize the entity to copy
        KorboCommunicationService.setEntityToCopy($scope.itemSelected);
        // open new tab
        $scope.korboModalTabs.activeTab = 1;
    };

    // set location, label and elemToSearch values of directive
    $scope.use = function () {

        // udpdate directive fields if widget is set to be used as tafony compatibility
        if ($scope.conf.useTafonyCompatibility) {
            // if is a korbo entity
            if ($scope.itemSelected.providerFrom === 'korbo') {
                $scope.directiveScope.location = $scope.itemSelected.location;
                $scope.directiveScope.elemToSearch = $scope.itemSelected.label;
                $scope.directiveScope.label = $scope.itemSelected.label;
                // if is a no-korbo entity
            }
            else {
                //TODO controllare la location nel caso di entità non di korbo
                $scope.directiveScope.location = $scope.itemSelected.resource;
                $scope.directiveScope.elemToSearch = $scope.itemSelected.label;
                $scope.directiveScope.label = $scope.itemSelected.label;
            }
        }

        // declare object returned onSave() call
        var obj = {};
        obj.value = $scope.directiveScope.location;
        obj.label = $scope.itemSelected.label;
        obj.type = $scope.itemSelected.type;
        obj.image = $scope.itemSelected.image;
        obj.description = $scope.itemSelected.description;
        obj.language = $scope.defaultLan.value;
        // fire onSave callback
        api.fireOnSave(obj);
        // fire onCancel callback
        api.fireOnCancel();
        // close modal
        KorboCommunicationService.closeModal();
        // set modal as close in configuration
        korboConf.setIsOpenModal(false);

    };

    $scope.itemSelected = null;
    // watching when an entity is selected
    $scope.$watch(function () {
        return KorboCommunicationService.getSelectedEntity();
    },
    function (item) {
        if (item !== null) {
            $scope.itemSelected = item;
        }
    });

    // handle button visibility
    var handleButton = function () {

        // if no item is selected, set buttons visibility
        if ($scope.itemSelected === null) {
            $scope.showUseButton();
            $scope.showUseAndCopyButton();
            $scope.showCopyInEditorButton();
            $scope.showMoreInfoButton();
            $scope.showSaveAndAddButton();
        }

    };

    // set visibility Use button and Copy and Use button
    $scope.showUseButton = function () {

        // if Search tab is active
        if ($scope.korboModalTabs.activeTab === 0) {

            // if a non-korbo provider tab is selected and in configuration copyToKorboBeforeUse is set to true
            // show only Use and Copy button
            if ($scope.currentProv.p !== 'korbo' && typeof($scope.conf.copyToKorboBeforeUse) !== 'undefined' && $scope.conf.copyToKorboBeforeUse) {
                $scope.showUse.visibility = false;
                $scope.showUseAndCopy.visibility = true;

                // if korbo provider tab is selected and in configuration copyToKorboBeforeUse is set to true
                // show only Use button
            }
            else {
                if ($scope.currentProv.p === 'korbo' && typeof($scope.conf.copyToKorboBeforeUse) !== 'undefined' && $scope.conf.copyToKorboBeforeUse) {
                    $scope.showUse.visibility = true;
                    $scope.showUseAndCopy.visibility = false;
                }

                // if in configuration copyToKorboBeforeUse is not defined or is set to false
                // show only Use button
                else {
                    if (typeof($scope.conf.copyToKorboBeforeUse) === 'undefined' || !$scope.conf.copyToKorboBeforeUse) {
                        $scope.showUse.visibility = true;
                        $scope.showUseAndCopy.visibility = false;
                    }
                }
            }
            // if New tab is active, hide Use button
        }
        else {
            $scope.showUse.visibility = false;
        }
    };

    $scope.innerSelectURL = function() {
        if (typeof $scope.$parent.$parent.searchConf !== 'undefined' && typeof $scope.$parent.$parent.searchConf.selectUrl === 'function') {
            $scope.$parent.$parent.searchConf.selectUrl.apply(undefined, [$scope.itemSelected]);
        }
    };

    $scope.innerCopyFromLOD = function() {
        if (typeof $scope.$parent.$parent.searchConf !== 'undefined' && typeof $scope.$parent.$parent.searchConf.copyFromLOD === 'function') {
            $scope.$parent.$parent.searchConf.copyFromLOD.apply(undefined, [$scope.itemSelected]);
        }
    };

    $scope.innerDiscardSearch = function() {
        if (typeof $scope.$parent.$parent.searchConf !== 'undefined' && typeof $scope.$parent.$parent.searchConf.discardSearch === 'function') {
            $scope.$parent.$parent.searchConf.discardSearch.apply(undefined);
        }
    };

    // If New Tab is selected, hide Use and Copy button
    $scope.showUseAndCopyButton = function () {
        if ($scope.korboModalTabs.activeTab === 1) {
            $scope.showUseAndCopy.visibility = false;
        }
    };

    // show Copy in Editor button only in Search tab
    $scope.showCopyInEditorButton = function () {
        $scope.showCopyInEditor.visibility = $scope.korboModalTabs.activeTab === 0;
    };

    // show More Info button only in Search tab
    $scope.showMoreInfoButton = function () {
        $scope.showMoreInfo.visibility = $scope.korboModalTabs.activeTab === 0;

    };

    // show Save and Add button only in New tab
    $scope.showSaveAndAddButton = function () {
        $scope.showSaveAndAdd.visibility = $scope.korboModalTabs.activeTab === 1;
    };

    $rootScope.$on('modal.hide',function(){
        korboConf.setIsOpenModal(false);
    });
});