describe('KorboBasketSelector service', function() {

    var KorboBasketSelector,
    $httpBackend,
    SelectorsManager,
    KORBOBASKETSELECTORDEFAULTS,
    ItemsExchange;

    beforeEach(module('Pundit2'));

    beforeEach(inject(function(_SelectorsManager_, _KORBOBASKETSELECTORDEFAULTS_, _KorboBasketSelector_, _$httpBackend_, _ItemsExchange_){
        SelectorsManager = _SelectorsManager_;
        KORBOBASKETSELECTORDEFAULTS = _KORBOBASKETSELECTORDEFAULTS_;
        KorboBasketSelector = _KorboBasketSelector_;
        $httpBackend = _$httpBackend_;
        ItemsExchange = _ItemsExchange_;
    }));

    // TODO need to find a work around to skip query param
    // and use only the url contained inside defaults
    // in case of error inside http use whenJSONP('')
    // with empty string all httpBackend respond to all jsonp calls
    var url = "http://manager.korbo.org/api.php/basket/reconcile/16?jsonp=JSON_CALLBACK&query=%7B%22query%22:%22term%22,%22limit%22:5%7D",
        detailsUrl = "http://manager.korbo.org/16?jsonp=JSON_CALLBACK&url=http:%2F%2Fpurl.org%2Fnet7%2Fkorbo%2Fitem%2F76108";

    var emptyResult = {
        result: []
    };

    var itemsResult = {
        result: [
            {
                name: "MakesAReferenceTo",
                resource_url: "http://purl.org/net7/korbo/item/76108"
            }
        ]
    };

    var item1Details = {
        result: {
            description: "«The source text makes a reference to the targeted text»",
            image: "",
            rdftype: ["http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"]
        }
    };

    it('should be added to the selectorsManager when injected', function(){
        SelectorsManager.init();
        expect(SelectorsManager.getActiveSelectors().length).toBe(1);
    });

    it('should correctly initialize a selector instance', function(){
        var conf = KORBOBASKETSELECTORDEFAULTS.instances[0],
            sel = new KorboBasketSelector(conf);

        expect(sel.config.active).toBe(conf.active);
        expect(sel.config.container).toBe(conf.container);
        expect(sel.config.label).toBe(conf.label);
    });

    it('should resolve promise when get empty result', function(){
        var conf = KORBOBASKETSELECTORDEFAULTS.instances[0],
            sel = new KorboBasketSelector(conf),
            called = false;

        $httpBackend.whenJSONP(url).respond(emptyResult);
        sel.getItems('term').then(function(){
            called = true;
        });
        
        $httpBackend.flush();

        var all = ItemsExchange.getAll(),
            container = conf.container;

        expect(all.itemListByContainer[container]).toBeUndefined();
        expect(called).toBe(true);
        
    });

    it('should correctly launch all items details http request when get not empty result', function(){
        var conf = KORBOBASKETSELECTORDEFAULTS.instances[0],
            sel = new KorboBasketSelector(conf),
            called = false;
 
        $httpBackend.whenJSONP(url).respond(itemsResult);
        $httpBackend.whenJSONP(detailsUrl).respond(item1Details);

        sel.getItems('term').then(function(){
            called = true;
        });
        
        // items http
        $httpBackend.flush(1);
        expect(called).toBe(false);
        expect(sel.pendingRequest).toBe(1);

        // all details http calls
        $httpBackend.whenJSONP(url).respond(item1Details);
        $httpBackend.flush();        

        expect(called).toBe(true);
        expect(sel.pendingRequest).toBe(0);

        var all = ItemsExchange.getAll(),
            container = conf.container;

        expect(all.itemListByContainer[container]).toBeDefined();
        expect(all.itemListByContainer[container].length).toBe(1);

        var item = all.itemListByContainer[container][0];

        expect(item.uri).toBe(itemsResult.result[0].resource_url);
        expect(item.label).toBe(itemsResult.result[0].name);
        expect(item.description).toBe(item1Details.result.description);
        expect(item.type.length).toBe(item1Details.result.rdftype.length);
        
    });

});