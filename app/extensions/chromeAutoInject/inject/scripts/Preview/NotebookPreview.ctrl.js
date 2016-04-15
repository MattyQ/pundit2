angular.module('Pundit2.Preview')

.controller('NotebookPreviewCtrl', function($scope, NotebookExchange) {

    $scope.$watch('id', function() {
        // TODO: special initialization for certain kind of items, like image fragments?
        $scope.notebook = NotebookExchange.getNotebookById($scope.id);
        if (NotebookExchange.getCurrentNotebooks().id === $scope.notebook.id) {
            $scope.isCurrent = true;
        } else {
            $scope.isCurrent = false;
        }


    });

});