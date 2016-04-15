/**
 *
 * @ngdoc object
 * @name KORBODEFAULTCONF
 *
 * @module KorboEE
 *
 * @description
 * This is the object configuration in which is possible to set
 * values of its properties.
 *
 * Each properties has a default value.
 * You can see an example of configuration object here {@link #!/example Example}
 * It is possible to make a different configuration, depending on the usage you want.
 * To see possible usage and its configuration, see {@link #!/tafony-compatibility Tafony Compatibility} and {@link #!/only-callback Use Only Callback}
 */
var KORBODEFAULTCONF;
KORBODEFAULTCONF = {

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#endpoint
     *
     * @description
     * `string`
     *
     * URL where Korbo server is installed
     *
     * Default value:
     * <pre> endpoint: "http://demo-cloud.api.korbo.org/v1/" </pre>
     */

    //endpoint: "http://demo-cloud.api.korbo.org/v1",
    endpoint: 'http://dev.korbo2.org/v1',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#resourceProxy
     *
     * @description
     * `string`
     *
     * URL used to load 3rd party resources.
     *
     * Default value:
     * <pre> resourceProxy: undefined </pre>
     */
    resourceProxy: undefined,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#korboHelpURL
     *
     * @description
     * `string`
     *
     * Korbo Help URL.
     *
     * Default value:
     * <pre> korboHelpURL: undefined </pre>
     */
    korboHelpURL: undefined,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#basketID
     *
     * @description
     * `integer`
     *
     * Korbo basket ID where a new entity is saved
     *
     * Default value:
     * <pre> basketID: 1 </pre>
     */
    basketID: 1,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#updateTime
     *
     * @description
     * `integer`
     *
     * Minimal wait time after last character typed before search starting
     *
     * Default value:
     * <pre> updateTime: 1000 </pre>
     */
    updateTime: 1000,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#labelMinLength
     *
     * @description
     * `integer`
     *
     * Minimal number of characters that needs to be entered before search starting
     *
     * Minimal length of label of new entity: to create a new entity, the label must have labelMinLength
     *
     * Default value:
     * <pre> labelMinLength: 3 </pre>
     */
    labelMinLength: 3,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#copyToKorboBeforeUse
     *
     * @description
     * `boolean`
     *
     * Set to true if want to copy an entity in Korbo and use it. False otherwise.
     *
     * Default value:
     * <pre> copyToKorboBeforeUse: false </pre>
     */
    copyToKorboBeforeUse: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#tafonyId
     *
     * @description
     * `string`
     *
     * Id of the HTML input text
     * Must be set only to use widget in Tafony Compatibility
     * For more details see {@link #!/tafony-compatibility Tafony Compatibility}
     *
     * Default value:
     * <pre> tafonyId: 'default_tafony_id' </pre>
     */
    tafonyId: 'default_tafony_id',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#tafonyName
     *
     * @description
     * `string`
     *
     * Name of the HTML input text
     *
     *
     * Must be set only to use widget in Tafony Compatibility
     * For more details see {@link #!/tafony-compatibility Tafony Compatibility}
     *
     * Default value:
     * <pre> tafonyName: 'default_tafony_name' </pre>
     */
    tafonyName: 'default_tafony_name',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#nameInputHiddenUri
     *
     * @description
     * `string`
     *
     * Hidden input name containing entity location
     *
     * For more details see {@link #!/tafony-compatibility Tafony Compatibility}
     *
     * Default value:
     * <pre> nameInputHiddenUri: 'default_korbo_uri' </pre>
     */
    nameInputHiddenUri: 'default_korbo_uri',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#nameInputHiddenLabel
     *
     * @description
     * `string`
     *
     * Hidden input name containing entity label
     *
     * For more details see {@link #!/tafony-compatibility Tafony Compatibility}
     *
     * Default value:
     * <pre> nameInputHiddenLabel: 'default_korbo_label' </pre>
     */
    nameInputHiddenLabel: 'default_korbo_label',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#useTafonyCompatibility
     *
     * @description
     * `boolean`
     *
     * Set to true to use widget in Tafony Compatibility
     *
     * For more details see {@link #!/tafony-compatibility Tafony Compatibility}
     *
     * Default value:
     * <pre> useTafonyCompatibility: false </pre>
     */
    useTafonyCompatibility: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#useOnlyCallback
     *
     * @description
     * `boolean`
     *
     * Set to true to use widget only with callback
     *
     * See {@link #!/only-callback Use Only Callback} for details
     *
     * Default value:
     * <pre> useOnlyCallback: false </pre>
     */
    useOnlyCallback: false, // default

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#globalObjectName
     *
     * @description
     * `string`
     *
     * Name for exposed global object. This object is used to call API callback and to register
     * callbacks to get called when some events are fired.
     *
     * For details about API Callbacks and events see {@link #!/api/KorboEE/object/EE EE}
     *
     * Default value:
     * <pre> globalObjectName: 'EE' </pre>
     */
    globalObjectName: 'EE',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#onLoad
     *
     * @description
     * `function`
     *
     * This function has to be defined when mode to use the widget is useOnlyCallback.
     *
     * The function will be get called when widget is ready to use.
     *
     * For details about useOnlyCallback usage see {@link #!/only-callback Use Only Callback}
     *
     * Default value:
     * <pre> onLoad: null </pre>
     */
    onLoad: null,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#searchTypes
     *
     * @description
     * `array`
     *
     * The array has to contain URI of types to use for searching an entity
     *
     * Default value:
     * <pre> searchTypes: ['http://person.uri', 'http://philosopher.uri', 'http://place.uri'] </pre>
     */
    searchTypes: ['http://person.uri', 'http://philosopher.uri', 'http://place.uri'],

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#limitSearchResult
     *
     * @description
     * `integer`
     *
     * Number or result per page
     *
     * Default value:
     * <pre> limitSearchResult: 10 </pre>
     */
    limitSearchResult: 10,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#providers
     *
     * @description
     * `object` {`provider_name`: `true/false`}
     *
     * List of available provider where to search in. Object must contain the name of provider and a state for each one: true if you want to use
     * that provider to searchin, false otherwise
     *
     * Default value:
     * <pre>providers: {
     *     freebase: false,
     *     dbpedia: false
     * }</pre>
     */
    providers: {
        freebase: false,
        dbpedia: false
    },

    // TODO rimuovere? non viene più utilizzato
    buttonLabel: "Default Search",

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#type
     *
     * @description
     * `array of object`
     *
     * Types available to select when you want create a new entity
     *
     * Each object should represent a type and has to contain
     ** `label`: label shown in widget
     ** `state`: true if you want to show type selected yet, false otherwise
     ** `URI`: URI of the type
     *
     *
     * Default value:
     * <pre> type: [
     *    {
     *     label: 'Schema.org place',
     *     state: true,
     *     URI:'http://schema.org/Place'
     *    },
     *    {
     *     label: 'FOAF person',
     *     state: false,
     *     URI:'http://xmlns.com/foaf/0.1/Person'
     *    },
     *    {
     *     label: 'W3 Spatial thing',
     *     state: true,
     *     URI:'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing'
     *    }
     *  ]
     * </pre>
     */
    type: [
        {
            label: 'Schema.org place',
            state: true,
            URI:'http://schema.org/Place'
        },
        {
            label: 'FOAF person',
            state: false,
            URI:'http://xmlns.com/foaf/0.1/Person'
        },
        {
            label: 'W3 Spatial thing',
            state: true,
            URI:'http://www.w3.org/2003/01/geo/wgs84_pos#SpatialThing'
        }
    ],

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#languages
     *
     * @description
     * `array of object`
     *
     * Language available to select when you want create a new entity
     *
     * Each object should represent a type and has to contain
     ** `name`: language name, show in select input
     ** `value`: value to send in the http request
     ** `state`: true to set this language as default, false otherwise
     *
     *
     * Default value:
     * <pre> languages: [
     *    {
     *     name:'Italian',
     *     value:'it',
     *     state: false
     *    },
     *    {
     *     name:'English',
     *     value:'en',
     *     state: true
     *    },
     *    {
     *     name:'German',
     *     value:'de',
     *     state: false
     *    }
     *  ]
     * </pre>
     */
    languages: [
        {
            name:'Italian',
            value:'it',
            state: false
        },
        {
            name:'English',
            value:'en',
            state: true
        },
        {
            name:'German',
            value:'de',
            state: false
        }
    ],

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#defaultLanguage
     *
     * @description
     * Default language value.
     *
     */
    defaultLanguage: 'en',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#languagesSaveMethod
     *
     * @description
     * `string`
     *
     * Determines how label and descriptions of item will be saved
     *
     * Allowed values:
     *   - multipleCall: a call for each language
     *   - singleCall: a call for all languages
     *
     * Default value:
     * <pre>
     *     languagesSaveMethod: 'multipleCall'
     * </pre>
     */
    languagesSaveMethod: 'multipleCall',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#useCredentialInHttpCalls
     *
     * @description
     * `boolean`
     *
     * Determines whether to use credentials in each http call or not.
     *
     * <pre>
     *     useCredentialInHttpCalls: false
     * </pre>
     */
    useCredentialInHttpCalls: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#confirmModalOnClose
     *
     * @description
     * `boolean`
     *
     * Shows confirm modal on close.
     *
     * <pre>
     *     confirmModalOnClose: true
     * </pre>
     */
    confirmModalOnClose: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#visualizeCopyButton
     *
     * @description
     * `array of string`
     *
     * Language available to select when you want create a new entity
     * List of providers from which copy and modify an entity, to create a new one in korbo.
     *
     * Each object should represent a type and has to contain
     ** `name`: language name, show in select input
     ** `value`: value to send in the http request
     ** `state`: true to set this language as default, false otherwise
     *
     *
     * Default value:
     * <pre>
     *     visualizeCopyButton: ['freebase']
     * </pre>
     */
    visualizeCopyButton: ['freebase'],

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#onReady
     *
     * @description
     * `function`
     *
     * The function will be get called when widget is ready to use.
     *
     * Default value:
     * <pre> onReady: null </pre>
     */
    onReady: null,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#autoCompleteMode
     *
     * @description
     * `string`
     *
     * Define wich mode of autocomplete use. Each mode differs on how the results are shown.
     *
     * * `simple` mode visualize only label of found entities
     * * `full` mode visualize the label, the depiction and the first type of found entities
     *
     * Default value:
     * <pre> autoCompleteMode: 'simple' </pre>
     */
    autoCompleteMode: 'simple', // full | simple

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#autoCompleteOptions
     *
     * @description
     * `string`
     *
     * Define which buttons to show in autocomplete visualization.
     *
     * * `none` no buttons are shown
     * * `search` will be show a Search on LOD button, that will open widget in Search window to find entity in other LOD providers
     * * `new` will be show a Create New button, that will open widget in New window,  where is possible to create a new entity in Korbo
     * * `all` display both buttons, the 'Create New' and the 'Search on LOD'
     *
     * Default value:
     * <pre> autoCompleteOptions: 'none' </pre>
     */
    autoCompleteOptions: 'none', // search | new | all | none

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#showHeaderTabs
     *
     * @description
     * `boolean`
     *
     * Set to true to show header tabs
     *
     * Default value:
     * <pre> showHeaderTabs: true </pre>
     */
    showHeaderTabs: true,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#showHeaderTabs
     *
     * @description
     * `boolean`
     *
     * Set to true to show breadcrumbs when edit or create new entity.
     *
     * Default value:
     * <pre> showBreadcrumbs: true </pre>
     */
    showBreadcrumbs: true,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#breadcrumbName
     *
     * @description
     * `string`
     *
     * Name of breadcrumb.
     *
     * Default value:
     * <pre> breadcrumbName: keebreadcrumb </pre>
     */
    breadcrumbName: 'keebreadcrumb',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#tripleComposerEnabled
     *
     * @description
     * `boolean`
     *
     * Enable internal triple composer.
     *
     * Default value:
     * <pre> tripleComposerEnabled: false </pre>
     */
    tripleComposerEnabled: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#tripleComposerForCustomFields
     *
     * @description
     * `boolean`
     *
     * Determines whether to use triple composer for classic annotation
     * or for entity custom field.
     *
     * Default value:
     * <pre> tripleComposerForCustomFields: false </pre>
     */
    tripleComposerForCustomFields: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#tripleComposerName
     *
     * @description
     * `string`
     *
     * The triple composer instance name.
     *
     * Default value:
     * <pre> tripleComposerName: 'korboeetriplecomposer' </pre>
     */
    tripleComposerName: 'korboeetriplecomposer',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#contextMenuActiveItems
     *
     * @description
     * `object`
     *
     * Defines which items are active and visible in contextual menu.
     *
     * Default value:
     * <pre>
     *   contextMenuActiveItems: {
     *       'advancedOptions': false,
     *       'editOriginalUrl': true,
     *       'removeLanguages': true,
     *       'tripleComposer': false,
     *       'updateAllData': false,
     *       'searchAndCopyFromLOD': false,
     *       'korboHelp': false
     *   }
     * </pre>
     */
    contextMenuActiveItems: {
        'editOriginalUrl': true,
        'removeLanguages': true,
        'updateAllData': false,
        'korboHelp': false
    },

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#fromLODTools
     *
     * @description
     * `boolean`
     *
     * If true, the panel "Advanced options" will show Original URL textfield and
     * buttons to copy from LOD.
     *
     * Default value:
     * <pre>
     *   fromLODTools: false
     * </pre>
     */
    fromLODTools: false,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#LODToolSearchURL
     *
     * @description
     * `boolean`
     *
     * Shows LOD Tool Search URL button.
     * Note: enable fromLODTools first.
     *
     * Default value:
     * <pre>
     *   LODToolSearchURL: false
     * </pre>
     */
    LODToolSearchURL: true,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#LODToolSearchAndCopy
     *
     * @description
     * `boolean`
     *
     * Shows LOD Tool Search And Copy button.
     * Note: enable fromLODTools first.
     *
     * Default value:
     * <pre>
     *   LODToolSearchAndCopy: false
     * </pre>
     */
    LODToolSearchAndCopy: true,

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#typeThing
     *
     * @description
     * `string`
     *
     * Defines uri of type "Thing".
     *
     * Default value:
     * <pre>
     *   typeThing: 'http://www.w3.org/2002/07/owl#Thing'
     * </pre>
     */
    typeThing: 'http://www.w3.org/2002/07/owl#Thing',

    /**
     * @ngdoc property
     * @name KORBODEFAULTCONF#typeLiteral
     *
     * @description
     * `string`
     *
     * Defines uri of type "Literal".
     *
     * Default value:
     * <pre>
     *   typeThing: 'http://purl.org/pundit/literal'
     * </pre>
     */
    typeLiteral: 'http://purl.org/pundit/literal'

};