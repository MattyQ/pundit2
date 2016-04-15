angular.module('Pundit2.PredicatesContainer')

.constant('PREDICATESCONTAINERDEFAULTS', {

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer
     *
     * @description
     * `object`
     *
     * Configuration object for PredicatesContainer module. By default, PredicatesContainer directive is located
     * in the first panel of the dashboard (lists) and allows you to display the list of available predicates.
     */

    /**
     * @ngdoc property
     * @name modules#PredicatesContainer.active
     *
     * @description
     * `boolean`
     *
     * Default state of the PredicatesContainer module, if it is set to true
     * the client adds to the DOM (inside dashboard) the PredicatesContainer directive in the boot phase.
     *
     * Default value:
     * <pre> active: true </pre>
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer.clientDashboardTemplate
     *
     * @description
     * `string`
     *
     * Path of template containing myItemsContainer directive, client will append the content of this template
     * to the DOM (inside dashboard directive) to bootstrap this component
     *
     * Default value:
     * <pre> clientDashboardTemplate: "src/Lists/PredicatesContainer/ClientPredicatesContainer.tmpl.html" </pre>
     */
    clientDashboardTemplate: "src/Lists/PredicatesContainer/ClientPredicatesContainer.tmpl.html",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer.clientDashboardPanel
     *
     * @description
     * `string`
     *
     * Name of the panel where append the directive (legal value to default are: 'lists', 'tools' and 'details')
     *
     * Default value:
     * <pre> clientDashboardPanel: "lists" </pre>
     */
    clientDashboardPanel: "lists",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer.clientDashboardTabTitle
     *
     * @description
     * `string`
     *
     * Tab title inside panel dashboard tabs
     *
     * Default value:
     * <pre> clientDashboardTabTitle: "Predicates" </pre>
     */
    clientDashboardTabTitle: "Predicates",

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer.cMenuType
     *
     * @description
     * `string`
     *
     * Contextual menu type showed by items contained inside directive
     *
     * Default value:
     * <pre> cMenuType: 'predicates' </pre>
     */
    cMenuType: 'predicates',


    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#PredicatesContainer.inputIconSearch
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
     * @name modules#PredicatesContainer.inputIconClear
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
     * @name modules#PredicatesContainer.order
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
     * @name modules#PredicatesContainer.reverse
     *
     * @description
     * `boolean`
     *
     * Default items ordering inside directive (true: ascending, false: descending)
     *
     * Default value:
     * <pre> reverse: false </pre>
     */
    reverse: false

})

.service('PredicatesContainer', function(PREDICATESCONTAINERDEFAULTS, BaseComponent) {

    // empty service only used inside Client.service.js to read the default configuration
    // and build the expected interface inside list panel

    return new BaseComponent('PredicatesContainer', PREDICATESCONTAINERDEFAULTS);

});