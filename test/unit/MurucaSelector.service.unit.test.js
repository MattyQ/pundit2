describe('MurucaSelector service', function() {

    var MurucaSelector,
        $httpBackend,
        MURUCASELECTORDEFAULTS,
        ItemsExchange,
        url;

    beforeEach(module('Pundit2'));

    beforeEach(inject(function(_MURUCASELECTORDEFAULTS_, _MurucaSelector_, _$httpBackend_, _ItemsExchange_){
        MURUCASELECTORDEFAULTS = _MURUCASELECTORDEFAULTS_;
        MurucaSelector = _MurucaSelector_;
        $httpBackend = _$httpBackend_;
        ItemsExchange = _ItemsExchange_;

        url = new RegExp(MURUCASELECTORDEFAULTS.murucaReconURL);
    }));

    var emptyResult = {
        result: []
    };

    var realResult = {
        result: [
            {
                description: "ZOPPINO 1536, Canto VII - Scena 1 - Azione 1 - Erifilla a cavallo del lupo",
                id: "7",
                match: false,
                name: "ZOPPINO 1536, Canto VII - Scena 1 - Azione 1 - Erifilla a cavallo del lupo",
                resource_url: "http://purl.org/galassiariosto/resources/azione_illustrazione/7",
                type: ["http://purl.org/galassiariosto/types/Azione"]
            },
            {
                description: "GIOLITO 1542, Canto XIX - Scena 2 - Azione 1 - Angelica incontra un pastore a cavallo (XIX, 23, vv. 1-2)",
                id: "1149",
                match: false,
                name: "GIOLITO 1542, Canto XIX - Scena 2 - Azione 1 - Angelica incontra un pastore a cavallo (XIX, 23, vv. 1-2)",
                resource_url: "http://purl.org/galassiariosto/resources/azione_illustrazione/1149",
                type: ["http://purl.org/galassiariosto/types/Azione"]
            }
        ]
    };

    it('should correctly initialize a selector instance', function(){
        var conf = MURUCASELECTORDEFAULTS.instances[0],
            sel = new MurucaSelector(conf);

        expect(sel.config.active).toBe(conf.active);
        expect(sel.config.container).toBe(conf.container);
        expect(sel.config.label).toBe(conf.label);
        expect(sel.config.queryType).toBe(conf.queryType);
    });

    it('should resolve promise when get empty result', function(){
        var conf = MURUCASELECTORDEFAULTS.instances[0],
            sel = new MurucaSelector(conf),
            called = false;

        $httpBackend.whenJSONP(url).respond(emptyResult);
        sel.getItems('term').then(function(){
            called = true;
        });
        
        $httpBackend.flush();

        var all = ItemsExchange.getAll(),
            container = conf.container+'term';

        expect(all.itemListByContainer[container]).toBeUndefined();
        expect(called).toBe(true);
    });

    it('should resolve promise when get http error', function(){
        var conf = MURUCASELECTORDEFAULTS.instances[0],
            sel = new MurucaSelector(conf),
            called = false;

        $httpBackend.whenJSONP(url).respond(500, undefined);
        sel.getItems('term').then(function(){
            called = true;
        });
        
        $httpBackend.flush();

        var all = ItemsExchange.getAll(),
            container = conf.container+'term';

        expect(all.itemListByContainer[container]).toBeUndefined();
        expect(called).toBe(true);
    });

    it('should resolve promise when get not empty result', function(){
        var conf = MURUCASELECTORDEFAULTS.instances[0],
            sel = new MurucaSelector(conf),
            called = false;

        $httpBackend.whenJSONP(url).respond(realResult);
        sel.getItems('term').then(function(){
            called = true;
        });
        
        $httpBackend.flush();

        var all = ItemsExchange.getAll(),
            container = conf.container+'term';

        var item1 = all.itemListByContainer[container][0],
            item2 = all.itemListByContainer[container][1],
            res1 = realResult.result[0],
            res2 = realResult.result[1];

        expect(all.itemListByContainer[container]).toBeDefined();

        expect(item1.uri).toBe(res1.resource_url);
        expect(item2.uri).toBe(res2.resource_url);

        expect(item1.label).toBe(res1.name);
        expect(item2.label).toBe(res2.name);

        expect(item1.type.length).toBe(res1.type.length);
        expect(item2.type.length).toBe(res2.type.length);

        expect(called).toBe(true);
        
    });

});