angular.module('Pundit2.AlertSystem')

.constant('ALERTSYSTEMDEFAULTS', {

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#AlertSystem
     *
     * @description
     * `object`
     *
     * Configuration object for AlertSystem module.
     */

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#AlertSystem.annotationsRefresh
     *
     * @description
     * `number`
     *
     * Delay in ms for the dismiss of the notifications
     *
     * Default value:
     * <pre> defaultDismissTime: 5000 </pre>
     */
    defaultDismissTime: 5000,

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#AlertSystem.clientDomTemplate
     *
     * @description
     * `string`
     *
     * The Client will append the content of this template to the DOM to bootstrap this component
     *
     * Default value:
     * <pre> clientDomTemplate: 'src/AlertSystem/ClientAlertSystem.tmpl.html' </pre>
     */
    clientDomTemplate: 'src/AlertSystem/ClientAlertSystem.tmpl.html',

    /**
     * @module punditConfig
     * @ngdoc property
     * @name modules#AlertSystem.debug
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

// TODO Add method documentation in JSDoc

.service('AlertSystem', function(BaseComponent, $timeout, ALERTSYSTEMDEFAULTS, EventDispatcher) {

    var alertSystem = new BaseComponent('AlertSystem', ALERTSYSTEMDEFAULTS);

    var alerts = [];
    var id = 0;
    var timeouts = {};

    /**
     * Enumeration of alert type with relatives default values
     * @type {{OK: {id: string, alertClass: string, timeout: number, top: boolean, dismissible: boolean}, ERROR: {id: string, alertClass: string, timeout: null, top: boolean, dismissible: boolean}, ALERT: {id: string, alertClass: string, timeout: null, top: boolean, dismissible: boolean}, CUSTOM: {id: string, alertClass: string, timeout: null, top: boolean, dismissible: boolean}}}
     */
    alertSystem.AlertType = {
        OK: {
            id: 'SUCCESS',
            alertClass: 'alert-success',
            timeout: alertSystem.options.defaultDismissTime,
            top: true,
            dismissible: true
        },
        ERROR: {
            id: 'ERROR',
            alertClass: 'alert-danger',
            timeout: null,
            top: true,
            dismissible: true
        },
        ALERT: {
            id: 'ALERT',
            alertClass: 'alert-info',
            timeout: null,
            top: true,
            dismissible: true
        },
        CUSTOM: {
            id: 'CUSTOM',
            alertClass: 'alert-warning',
            timeout: null,
            top: true,
            dismissible: true
        }
    };

    alertSystem.alerts = alerts;

    /**
     * Private function that return the key associated to a timeout promise
     * @param id
     */
    var getTimeoutKey = function(id) {
        return 'timeout' + id;
    };

    var setTimeout = function(alert) {
        var key = getTimeoutKey(alert.id);
        var promise = $timeout(function() {
            alertSystem.clearAlert(alert.id);
        }, alert.timeout);
        timeouts[key] = promise;
    };

    var getAlert = function(id) {
        for (var i = 0; i < alerts.length; i++) {
            var alert = alerts[i];
            if (alert.id === id) {
                return alert;
            }
        }
        return null;
    };

    /**
     * @ngdoc method
     * @name AlertSystem#addAlert
     * @module Pundit2.AlertSystem
     * @function
     *
     * @description
     * Add an alert
     *
     * @param {type}
     * @param {message}
     * @param {timeout}
     * @param {top}
     * @param {dismissible}
     * @param {alertClass}
     *
     */
    alertSystem.addAlert = function(type, message, timeout, top, dismissible, alertClass) {
        var newId,
            alert;

        alerts = alerts || [];
        id = (id || 0) + 1;

        newId = id;

        timeout = typeof(timeout) !== 'undefined' ? timeout : type.timeout;
        top = typeof(top) !== 'undefined' ? top : type.top;
        dismissible = typeof(dismissible) !== 'undefined' ? dismissible : type.dismissible;
        alertClass = alertClass || type.alertClass;

        alert = {
            id: newId,
            type: type.id,
            alertClass: alertClass,
            message: message,
            timeout: timeout,
            dismissible: dismissible
        };

        if (top) {
            alerts.unshift(alert);
            alertSystem.log('Pushed alert on top');
        } else {
            alerts.push(alert);
            alertSystem.log('Pushed alert on bottom');
        }
        if (timeout) {
            setTimeout(alert);
        }
    };

    /**
     * @ngdoc method
     * @name AlertSystem#clearAlerts
     * @module Pundit2.AlertSystem
     * @function
     *
     * @description
     * Clear all alerts
     *
     */
    alertSystem.clearAlerts = function() {
        for (var i = 0; i < alerts.length; i++) {
            var alert = alerts[i];
            alertSystem.removeTimeout(alert.id);
        }
        alerts.splice(0, alerts.length);
    };

    /**
     * @ngdoc method
     * @name AlertSystem#clearAlert
     * @module Pundit2.AlertSystem
     * @function
     *
     * @description
     * Clear an alert by id
     *
     * @param {id} id of the alert
     *
     */
    alertSystem.clearAlert = function(id) {
        alertSystem.removeTimeout(id);
        var alertToRemove = -1;
        for (var i = 0; i < alerts.length; i++) {
            var alert = alerts[i];
            if (alert.id === id) {
                alertToRemove = i;
                break;
            }
        }
        if (alertToRemove !== -1) {
            alerts.splice(alertToRemove, 1);
        }
    };

    /**
     * @ngdoc method
     * @name AlertSystem#removeTimeout
     * @module Pundit2.AlertSystem
     * @function
     *
     * @description
     * Remove the timeout associated to the alert
     *
     * @param {id}
     *
     */
    alertSystem.removeTimeout = function(id) {
        var key = getTimeoutKey(id);
        if (timeouts[key]) {
            $timeout.cancel(timeouts[key]);
            delete timeouts[key];
        }
    };

    /**
     * @ngdoc method
     * @name AlertSystem#resetTimeout
     * @module Pundit2.AlertSystem
     * @function
     *
     * @description
     * Reset the timeout associated to the alert
     *
     * @param {id}
     *
     */
    alertSystem.resetTimeout = function(id) {
        alertSystem.removeTimeout(id);
        var alert = getAlert(id);
        setTimeout(alert);
    };

    EventDispatcher.addListener('Pundit.alert', function(evt) {
        var alertConfig = angular.copy(alertSystem.AlertType.ALERT);
        var message = evt.args;
        if (typeof evt.args !== 'string') {
            if (typeof evt.args.id !== 'undefined' && typeof alertSystem.AlertType[evt.args.id] !== 'undefined') {
                alertConfig = alertSystem.AlertType[evt.args.id];
            }
            angular.merge(alertConfig, evt.args);
            message = evt.args.message || '--no-message--';
        }
        //alertSystem.addAlert = function(type, message, timeout, top, dismissible, alertClass)
        alertSystem.addAlert(alertConfig, message, alertConfig.timeout, alertConfig.top, alertConfig.dismissible, alertConfig.alertClass);
    });

    return alertSystem;
});