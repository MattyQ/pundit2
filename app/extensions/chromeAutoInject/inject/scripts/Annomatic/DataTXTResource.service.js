angular.module('Pundit2.Annomatic')

.service('DataTXTResource', function($resource, Config) {

    var baseURL = 'https://api.dandelion.eu/datatxt/nex/v1',
        params = {
            'min_confidence': 0.0, // 0.0 (A LOT) - 1.0 (very precise)
            'min_length': 3, // lenght of the words to analyze
            'include_types': true,
            'include_categories': true,
            'include_abstract': true,
            'include_lod': true,
            'include_image': true
        };

    if (typeof Config.modules.Annomatic.sourceLang !== 'undefined') {
        params.lang = Config.modules.Annomatic.sourceLang;
    }

    return $resource(baseURL, {}, {
        getAnnotations: {
            params: params,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj) {
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
                return str.join('&');
            }
        }
    });

});