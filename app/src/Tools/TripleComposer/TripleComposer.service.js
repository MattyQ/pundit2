angular.module('Pundit2.TripleComposer')
.constant('TRIPLECOMPOSERDEFAULTS', {

    // The Client will append the content of this template to the DOM to bootstrap
    // this component
    clientDashboardTemplate: "src/Tools/TripleComposer/ClientTripleComposer.tmpl.html",
    clientDashboardPanel: "tools",
    clientDashboardTabTitle: "Statements Composer",

    // Icons shown in the search input when it's empty and when it has some content
    inputIconSearch: 'pnd-icon-search',
    inputIconClear: 'pnd-icon-times',

    debug: false
})
.service('TripleComposer', function(BaseComponent, TRIPLECOMPOSERDEFAULTS, TypesHelper) {

    var tripleComposer = new BaseComponent('TripleComposer', TRIPLECOMPOSERDEFAULTS);

    var nextId = 1;
    var statements = [{
        id: nextId
    }];

    tripleComposer.getStatements = function(){
        return statements;
    };

    tripleComposer.addStatement = function(){
        nextId = nextId + 1;
        statements.push({id: nextId});
    };

    tripleComposer.removeStatement = function(id){
        // at least one statetement must be present
        if (statements.length === 1) {
            statements[0].scope.wipe();
            return;
        }
        
        statements.some(function(s, i){
            if (s.id === id) {
                index = i;
                return true;
            }
        });        
        if (index > -1) {
            statements.splice(index, 1);
        }
    };

    // extend arr object with scope property
    tripleComposer.addStatementScope = function(id, scope){
        statements.some(function(s, i){
            if (s.id === id) {
                index = i;
                return true;
            }
        });
        
        if (index > -1) {
            statements[index].scope = scope;
        }
    };

    tripleComposer.duplicateStatement = function(id){
        statements.some(function(s, i){
            if (s.id === id) {
                index = i;
                return true;
            }
        });
        
        if (index > -1) {
            nextId = nextId + 1;
            statements.push({
                id: nextId,
                scope: {
                    duplicated: statements[index].scope.copy()
                }
            });
        }

    };

    //TODO to fix

    var localRef = null;
    tripleComposer.init = function(arr){
        localRef = arr;
    };

    tripleComposer.addToSubject = function(item) {
        if (localRef.length === 1 && localRef[0].scope.get().subject === null) {
            localRef[0].scope.get().subject = item;

            localRef[0].scope.subjectLabel = item.label;
            localRef[0].scope.subjectTypeLabel = TypesHelper.getLabel(item.type[0]);
            localRef[0].scope.subjectFound = true;
        } else {
            // add blank statement then insert subject
        }
    };

    return tripleComposer;

});