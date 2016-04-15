angular.module('Pundit2.MyItemsContainer')

.constant('MYITEMSCONTAINERDEFAULTS', {

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer
     *
     * @description
     * `object`
     *
     * Configuration object for MyIyemsContainer module. By default, MyIyemsContainer directive is located
     * in the first panel of the dashboard (lists) and allows you to display the list of my items,
     * remove them or filter them.
     */

    /**
     * @ngdoc property
     * @name modules#MyItemsContainer.active
     *
     * @description
     * `boolean`
     *
     * Default state of the MyItemsContainer module, if it is set to true
     * the client adds to the DOM (inside dashboard) the MyItemsContainer directive in the boot phase.
     *
     * Default value:
     * <pre> active: true </pre>
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.clientDashboardTemplate
     *
     * @description
     * `string`
     *
     * Path of template containing myItemsContainer directive, client will append the content of this template
     * to the DOM (inside dashboard directive) to bootstrap this component.
     *
     * Default value:
     * <pre> clientDashboardTemplate: "src/Lists/MyItemsContainer/ClientMyItemsContainer.tmpl.html" </pre>
     */
    clientDashboardTemplate: "src/Lists/MyItemsContainer/ClientMyItemsContainer.tmpl.html",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.clientDashboardPanel
     *
     * @description
     * `string`
     *
     * Name of the panel where append the directive (legal value to default are: 'lists', 'tools' and 'details').
     *
     * Default value:
     * <pre> clientDashboardPanel: "lists" </pre>
     */
    clientDashboardPanel: "lists",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.clientDashboardTabTitle
     *
     * @description
     * `string`
     *
     * Tab title inside panel dashboard tabs
     *
     * Default value:
     * <pre> clientDashboardTabTitle: "My Items" </pre>
     */
    clientDashboardTabTitle: "Favourites",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.initialActiveTab
     *
     * @description
     * `number`
     *
     * Default displayed tab
     *
     * Default value:
     * <pre> initialActiveTab: 0 </pre>
     */
    initialActiveTab: 0,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.cMenuType
     *
     * @description
     * `string`
     *
     * Contextual menu type showed by items contained inside directive
     *
     * Default value:
     * <pre> cMenuType: 'myItems' </pre>
     */
    cMenuType: 'myItems',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.order
     *
     * @description
     * `string`
     *
     * Default items property used to sort items list inside directive (legal value are: 'label' and 'type')
     *
     * Default value:
     * <pre> order: 'label' </pre>
     */
    order: 'label',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.reverse
     *
     * @description
     * `boolean`
     *
     * Default items ordering inside directive (true: ascending, false: descending)
     *
     * Default value:
     * <pre> reverse: false </pre>
     */
    reverse: false,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyItems.container
     *
     * @description
     * `string`
     *
     * Name of the container used to store the my items in the itemsExchange.
     *
     * Default value:
     * <pre> container: 'myItems' </pre>
     */
    container: 'myItems',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.inputIconSearch
     *
     * @description
     * `string`
     *
     * Icon shown in the search input when it's empty
     *
     * Default value:
     * <pre> inputIconSearch: 'pnd-icon-search' </pre>
     */
    inputIconSearch: 'pnd-icon-search',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.inputIconClear
     *
     * @description
     * `string`
     *
     * Icon shown in the search input when it has some content
     *
     * Default value:
     * <pre> inputIconClear: 'pnd-icon-close' </pre>
     */
    inputIconClear: 'pnd-icon-close',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#MyIyemsContainer.debug
     *
     * @description
     * `boolean`
     *
     * Active debug log
     *
     * Default value:
     * <pre> debug: false </pre>
     */
    debug: false

})

.service('MyItemsContainer', function(MYITEMSCONTAINERDEFAULTS, BaseComponent) {

    var myItemsContainer = new BaseComponent('MyItemsContainer', MYITEMSCONTAINERDEFAULTS);

    // array of items array, one foreach tab, when activeTab change the showed array change
    // contain all items array (all items array, text items array, image items array and page items array)
    var itemsArrays = [];

    myItemsContainer.buildItemsArray = function(activeTab, tabs, items) {

        // forEach tab build the relative items array
        // using the tab filter function
        for (var i = 0; i < tabs.length; i++) {
            // check if it have the filter function
            if (angular.isObject(tabs[i]) && typeof(tabs[i].filterFunction) !== 'undefined') {
                // filter all items to obtain the specific tab array
                itemsArrays[i] = items.filter(function(item) {
                    return tabs[i].filterFunction(item);
                });
            }
        }

        return itemsArrays[activeTab];
    };

    myItemsContainer.getItemsArrays = function() {
        return itemsArrays;
    };

    return myItemsContainer;

});