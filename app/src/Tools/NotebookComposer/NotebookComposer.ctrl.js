angular.module('Pundit2.NotebookComposer')
    .controller('NotebookComposerCtrl', function($scope, NotebookComposer, NotebookExchange) {

        $scope.notebook = {};
        $scope.notebook.visibility = "public";
        $scope.notebook.name = "";
        $scope.notebook.current = false;

        $scope.save = function(){
            NotebookComposer.createNotebook($scope.notebook).then(function(v){
                console.log("Ho creato il notebook: ", v);
                $scope.clear();
            });
        }

        $scope.clear = function(){
            $scope.notebook.name = "";
            $scope.notebook.visibility = "public";
            $scope.notebook.current = "";
        }

        $scope.cancelAll = function(){
            var myNotebook = NotebookExchange.getMyNotebooks().then(function(nb){
                NotebookExchange.deleteNotebook(nb[0].id);
            });

        }

    });