angular.module('Pundit2.LiteTool')

.directive('liteTool', function() {
    return {
        restrict: 'E',
        scope: {},
        controller: 'LiteToolCtrl',
        templateUrl: "src/LiteTool/LiteTool.dir.tmpl.html",
        link: function( /*scope, el  attrs, ctrl */ ) {}
    };
});