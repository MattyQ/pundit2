/*jshint camelcase: false*/

angular.module('KorboEE')
.service('KorboCommunicationService', function($q, $http, BaseComponent, ItemsExchange, Item, $rootScope, $modal, korboConf, KorboCommunicationFactory, APIService, EventDispatcher, MyPundit){

    var korboCommunication = new BaseComponent("KorboCommunication");

    var isAutocompleteLoading = false;

    korboCommunication.checkUserLoggedIn = function() {
        return MyPundit.checkLoggedIn();
    };

    // set autocomplete loading status
    korboCommunication.setAutocompleteLoading = function(val){
        isAutocompleteLoading = val;
    };

    // get autocomplete loading status
    korboCommunication.isAutocompleteLoading = function(){
        return isAutocompleteLoading;
    };

    // create a new scope for korbo modal
    var KeeModalScope = $rootScope.$new();
    KeeModalScope.searchType = 'tab';

    var tripleComposerStateChange = function(evt) {
        if (!korboConf.getIsOpenModal()) {
            return;
        }
        if (typeof korboCommunication.tripleComposerStateChangeCallback === 'function') {
            korboCommunication.tripleComposerStateChangeCallback.call(undefined, evt);
        }
    };

    EventDispatcher.addListener('TripleComposer.statementChange', tripleComposerStateChange);

    // initializa korbo modal
    var KeeModal = $modal({
        container: "[data-ng-app='Pundit2']",
        templateUrl: 'src/KorboEE/Modal/KorboEE.modal.tmpl.html',
        show: false,
        //backdrop: 'static',
        backdropAnimation: 'static',
        scope: KeeModalScope,
        keyboard: false
    });

    // CONFIRM MODAL
    var confirmModalScope = $rootScope.$new();
    confirmModalScope.titleMessage = "Are you sure?";
    confirmModalScope.notifyMessage = "Are you sure you want to close the editor? You will lose any unsaved changes";

    confirmModalScope.cancel = function() {
        confirmModal.hide();
    };

    confirmModalScope.confirm = function() {
        var api = APIService.get(this.globalObjectName);
        confirmModal.hide();
        korboConf.setIsOpenModal(false);
        KeeModal.hide();
        korboConf.setIsOpenModal(false);
        api.fireOnCancel();
        entityToCopy = null;
        entity = null;
    };

    var confirmModal = $modal({
        container: "[data-ng-app='Pundit2']",
        templateUrl: 'src/KorboEE/Modal/KorboEE.confirm.modal.tmpl.html',
        show: false,
        backdrop: 'static',
        scope: confirmModalScope
    });

    korboCommunication.showConfirmModal = function(globalObjectName){
        confirmModalScope.globalObjectName = globalObjectName;
        confirmModal.$promise.then(confirmModal.show);

    };

    // open korbo modal on New tab
    // if an entity is defined, the form in New tab will be fill with entity passed values
    korboCommunication.openModalOnNew = function(conf, entity, directiveScope){
        // open only if modal is not open yet

        if(korboConf.getIsOpenModal() === false){
            korboConf.setIsOpenModal(true);
            // if an entity is passed, set in the scope
            if(typeof(entity) !== 'undefined' || entity !== ''){
                KeeModalScope.entityToCreate = entity;
            } else {
                KeeModalScope.entityToCreate = null;
            }

            KeeModalScope.labelToSearch = null;
            KeeModalScope.idEntityToEdit = null;
            // set operation code
            KeeModalScope.op = "new";
            // set configuration object in scope
            KeeModalScope.conf = conf;
            // set directive scope in modal scope
            KeeModalScope.directiveScope = directiveScope;
            // show the modal
            KeeModal.$promise.then(KeeModal.show);
        }

    };

    // open modal in Search tab
    // if a label is defined, when modal is open start searching the label
    korboCommunication.openModalOnSearch = function(conf, val, directiveScope){
        if(korboConf.getIsOpenModal() === false){
            korboConf.setIsOpenModal(true);
            // if label is defined, set it in the modal scope
            if(typeof(val) !== 'undefined' || val !== ''){
                KeeModalScope.labelToSearch = val;
            } else {
                KeeModalScope.labelToSearch = null;
            }

            KeeModalScope.entityToCreate = null;
            KeeModalScope.idEntityToEdit = null;
            // set operation code
            KeeModalScope.op = "search";
            // set configuration object in scope
            KeeModalScope.conf = conf;
            // set directive scope in modal scope
            KeeModalScope.directiveScope = directiveScope;
            // show modal
            KeeModal.$promise.then(KeeModal.show);
        }
    };

    // open modal in Edit mode
    // it need the id of entity to edit
    korboCommunication.openModalOnEdit = function(conf, id, directiveScope){
        if(korboConf.getIsOpenModal() === false){
            korboConf.setIsOpenModal(true);
            if(typeof(id) !== 'undefined' || id !== ''){
                KeeModalScope.idEntityToEdit = id;
            } else {
                KeeModalScope.idEntityToEdit = null;
            }

            KeeModalScope.entityToCreate = null;
            KeeModalScope.labelToSearch = null;
            KeeModalScope.op = "edit";
            // set configuration object in scope
            KeeModalScope.conf = conf;
            // set directive scope in modal scope
            KeeModalScope.directiveScope = directiveScope;
            KeeModal.$promise.then(KeeModal.show);
        }
    };

    // close an open modal
    korboCommunication.closeModal = function(){
        if(korboConf.getIsOpenModal() === true){
            korboConf.setIsOpenModal(false);
            KeeModal.hide();
        }

    };

    // get a searching of a given label
    korboCommunication.autocompleteSearch = function(val, endpoint, prov, limit, offset, lang, basketID, useCredentialInHttpCalls) {
        isAutocompleteLoading = true;
        if (typeof useCredentialInHttpCalls !== 'boolean') {
            useCredentialInHttpCalls = false;
        }
        // return an http Promise
        return $http({
            //headers: { 'Content-Type': 'application/json' },
            method: 'GET',
            url: endpoint + "/search/items",
            cache: false,
            withCredentials: useCredentialInHttpCalls,
            params: {
                q: val,
                p: prov,
                limit: limit,
                offset: offset,
                lang: lang,
                basketId: basketID
            }
            // if no server error occures
        }).then(function(res) {
                //if empty results is found, return an object with no found label
            if(res.data.metadata.totalCount === "0"){
                var noFound = [{label:"no found", noResult:true}];
                isAutocompleteLoading = false;
                // on return http Promise will be resolved
                return noFound;
            } else {
                // if no empty results is found
                // wipe container
                ItemsExchange.wipeContainer("kee-"+prov);

                // for each results, create an item...
                for(var i=0; i<res.data.data.length; i++){

                    var item = {
                        uri: res.data.data[i].uri,
                        label: res.data.data[i].label,
                        description: res.data.data[i].abstract,
                        depiction: res.data.data[i].depiction,
                        type: []
                    };

                    for(var j=0; j<res.data.data[i].type.length; j++){
                        item.type.push(res.data.data[i].type[j]);
                    }
                    var itemToAdd = new Item(item.uri, item);

                    //... and add to container
                    ItemsExchange.addItemToContainer(itemToAdd, "kee-"+prov);
                }
                isAutocompleteLoading = false;
                return res.data.data;
            }

        },
            // if server error is occurred, return error
        function(){
            isAutocompleteLoading = false;
            var errorServer = [{label:"error", errorServer:true}];
            return errorServer;
        });


    };

    // param: itemUri, provider, endpoint, basketID, language
    korboCommunication.buildLanguagesObject = function(param, langConf, useCredentialInHttpCalls){
        var promise = $q.defer();
        var settled = 0;
        var results = {};
        // var defaultLanguage = param.language;
        var korboComm = new KorboCommunicationFactory();

        var tooltipMessageTitle = "Insert title of the entity in ";
        var tooltipMessageDescription = "Insert description of the entity in ";
        //var loadedItem = null;

        results.languages = [];

        if (typeof useCredentialInHttpCalls !== 'boolean') {
            useCredentialInHttpCalls = false;
        }

        korboComm.getItem(param, false, useCredentialInHttpCalls).then(function(res){
            results.imageUrl = typeof res.depiction === 'undefined' || res.depiction === null ? '' :  res.depiction;
            results.originalUrl = typeof res.resource === 'undefined' || res.resource === null ? '' :  res.resource;

            results.types = res.type;
            results.basketId = res.basket_id;
            results.loadedItem = res;
            if(res.available_languages.length >= 0){
                for(var i = 0; i < res.available_languages.length; i++){
                    (function(index){
                        var p;
                        param.language = res.available_languages[index];
                        p = korboComm.getItem(param, false, useCredentialInHttpCalls);
                        p.then(function(res){
                            var indexFind = langConf.map(function(e){ return angular.lowercase(e.value); }).indexOf(angular.lowercase(res.reqLanguage));
                            if(indexFind !== -1){
                                var title = angular.uppercase(res.reqLanguage);
                                var name = angular.lowercase(langConf[indexFind].name);
                                var lang = {
                                    'title': title,
                                    'name' : name,
                                    'description': res.abstract,
                                    'label': res.label,
                                    'mandatory': true,
                                    'hasError': false,
                                    'tooltipMessageTitle': tooltipMessageTitle + name,
                                    'tooltipMessageDescription': tooltipMessageDescription + name,
                                    'tooltipMessageError': "message",
                                    'tooltipMessageErrorTab': "There are some errors in the "+name+" languages fields"
                                };
                                results.languages.push(lang);
                            }
                        }).finally(function() {
                            // TODO: fix api korbo and use q.all again
                            settled++;
                            if (settled === res.available_languages.length) {
                                promise.resolve(results);
                            }
                        });
                    })(i);
                }
            } else{
                promise.resolve(results);
            }
        },
        function(){
            results = null;
            promise.reject();
        });

        return promise.promise;
    };

    var entity = null;
    // set selected entity
    korboCommunication.setSelectedEntity = function(e){
        entity = e;
    };

    // get selected entity
    korboCommunication.getSelectedEntity = function(){
        return entity;
    };

    var entityToCopy = null;

    // set entity to copy
    korboCommunication.setEntityToCopy = function(e){
        entityToCopy = e;
    };

    // get selected entity
    korboCommunication.getEntityToCopy = function(){
        return entityToCopy;
    };

    korboCommunication.setSearchConf = function(searchType, conf) {
        if (typeof conf !== 'undefined') {
            KeeModalScope.searchConf = conf;
        }
        KeeModalScope.searchType = searchType;
    };

    korboCommunication.tripleComposerStateChangeCallback = undefined;

    return korboCommunication;
});