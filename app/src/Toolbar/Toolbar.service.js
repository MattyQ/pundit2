angular.module('Pundit2.Toolbar')

.constant('TOOLBARDEFAULTS', {
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar
     *
     * @description
     * `object`
     *
     * Configuration for Toolbar module.
     * Toolbar is always visible and positioned at the top of the page
     * and push content of the page down by the CSS bodyClass. It is possible to configure the link to Ask Page.
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.myNotebooks
     *
     * @description
     * `boolean`
     *
     * Show/Hide ask the Pundit button
     *
     * Default value:
     * <pre> myNotebooks: true </pre>
     */
    myNotebooks: true,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.toolbarHeight
     *
     * @description
     * `number`
     *
     * Toolbar height
     *
     * Default value:
     * <pre> toolbarHeight: 30 </pre>
     */
    toolbarHeight: 30,
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.menuCustom
     *
     * @description
     * `object`
     *
     * Class added to the body element as soon as the directive is rendered. It will push down body of the current web page.
     * In this way pundit toolbar and his components are always visibile.
     *
     * Default value:
     * <pre>
     *  menuCustom: {
     *    active: false,
     *    dropdown: true,
     *    list: {label1: 'http://www.yourlink1.it', label2: 'http://www.yourlink2.it'}
     *  }
     * </pre>
     */
    menuCustom: {
        active: false,
        dropdown: true,
        list: {}
    },
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.bodyClass
     *
     * @description
     * `string`
     *
     * Class added to the body element as soon as the directive is rendered. It will push down body of the current web page.
     * In this way pundit toolbar and his components are always visibile.
     *
     * Default value:
     * <pre> bodyClass: "pnd-toolbar-active" </pre>
     */
    bodyClass: "pnd-toolbar-active",
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.clientDomTemplate
     *
     * @description
     * `string`
     *
     * Path of template containing toolbar directive
     * The Client will append the content of this template to the DOM to bootstrap this component
     *
     * Default value:
     * <pre> clientDomTemplate: "src/Toolbar/ClientToolbar.tmpl.html" </pre>
     */
    clientDomTemplate: "src/Toolbar/ClientToolbar.tmpl.html",
    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#Toolbar.debug
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

.service('Toolbar', function(BaseComponent, EventDispatcher, TOOLBARDEFAULTS, Config, MyPundit, TripleComposer) {

    var toolbar = new BaseComponent('Toolbar', TOOLBARDEFAULTS);

    var errorID = 0,
        isLoadingShown = false,
        isErrorShown = false,
        errorMessageDropdown = [],
        // tell to other components if is active the template mode
        templateMode = Config.useOnlyTemplateMode;

    toolbar.getErrorShown = function() {
        return isErrorShown;
    };

    toolbar.isLoading = function() {
        return isLoadingShown;
    };

    toolbar.setLoading = function(currentState) {
        toolbar.log('Setting loading to ' + currentState);
        isLoadingShown = currentState;
    };

    // Send error to show in the toolbar
    // @param message = Custom error message according with user action
    // @param callback = is a function user can click to resolve error
    toolbar.addError = function(message, callback) {
        var errID = errorID;

        // remove error from array and execute callback function
        var removeErrorAndGetCallback = function() {
            toolbar.removeError(errID);
            if (typeof(callback) === 'function' && callback !== '') {
                callback();
            }
        };

        var error = {
            text: message,
            click: removeErrorAndGetCallback,
            id: errID
        };
        errorID++;
        errorMessageDropdown.push(error);
        isErrorShown = true;

        // trigger toolbar error dropdown
        if (angular.element('.pnd-toolbar-error-button ul').length === 0) {
            var button = angular.element('.pnd-toolbar-error-button a');
            button.trigger('click');
        }

        return errID;
    };

    // Remove error from toolbar
    toolbar.removeError = function(errorID) {
        for (var i = 0; i < errorMessageDropdown.length; i++) {
            if (errorMessageDropdown[i].id === errorID) {
                errorMessageDropdown.splice(i, 1);
                break;
            }
        }

        if (errorMessageDropdown.length === 0) {
            isErrorShown = false;
        }
    };

    // get error messages and callbacks
    toolbar.getErrorMessageDropdown = function() {
        return errorMessageDropdown;
    };

    toolbar.isActiveTemplateMode = function() {
        return templateMode;
    };

    toolbar.toggleTemplateMode = function() {

        if (Config.useOnlyTemplateMode) {
            return;
        }

        TripleComposer.reset();
        templateMode = !templateMode;
        if (templateMode) {
            EventDispatcher.sendEvent('Pundit.templateMode', true);
            TripleComposer.showCurrentTemplate();
        } else {
            EventDispatcher.sendEvent('Pundit.templateMode', false);
            // disable save btn
            angular.element('.pnd-triplecomposer-save').addClass('disabled');
        }
    };

    EventDispatcher.addListener('Pundit.loading', function(e) {
        toolbar.setLoading(e.args);
    });

    EventDispatcher.addListener('AnnotationDetails.editAnnotation', function() {
        if (templateMode) {
            toolbar.toggleTemplateMode();
        }
    });

    EventDispatcher.addListener('Client.show', function() {
        angular.element('body')
            .addClass(toolbar.options.bodyClass);
    });

    EventDispatcher.addListener('Client.hide', function() {
        angular.element('body')
            .removeClass(toolbar.options.bodyClass);
    });

    return toolbar;

});