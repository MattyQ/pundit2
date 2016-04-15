angular.module('Pundit2.Item')

.directive('item', function() {
    return {
        restrict: 'E',
        scope: {
            uri: '@',
            nid: '@',
            menuType: '@',
            itemType: "@",
            isSelected: '=isSelected',
            forceSticky: '=forceSticky',
            hideOptions: '@',
            hideStickyButton: '@',
            useInKorbo: '@'
        },
        templateUrl: function(el, attr) {
            if (attr.useInKorbo) {
                return "src/Item/KorboItem.dir.tmpl.html";
            } else {
                return "src/Item/Item.dir.tmpl.html";
            }
        },
        controller: "ItemCtrl"
    };
});