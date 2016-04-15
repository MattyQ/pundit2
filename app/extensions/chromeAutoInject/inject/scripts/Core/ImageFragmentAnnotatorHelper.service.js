/*jshint unused: false*/

angular.module('Pundit2.Core')
// TODO move this service in a better place
.service('ImageFragmentAnnotatorHelper', function($rootScope, $modal, $window, BaseComponent, EventDispatcher, Config, NameSpace,
    ContextualMenu, XpointersHelper, Item, MyItems, MyPundit, Analytics) {
    
    var imageFragmentHelper = new BaseComponent("ImageFragmentAnnotatorHelper");

    // events send by image fragment annotator
    var msg = {
        close: 'ia-closed',
        addPolygon: 'ia-add-polygon'
    };

    // html node append to the DOM to load image fragment annotator page
    // before open is appended to the src a composer url (baseUrl + imgUrl)
    var template1 = '<iframe class="pnd-image-fragment-frame" width="620" height="500" src="' + Config.imageFragmentAnnotator.baseUrl,
        template2 = '" scrolling="no" frameborder="0" allowfullscreen></iframe>';

    var initContextualMenu = function() {
        ContextualMenu.addAction({
            type: [Config.modules.ImageHandler.cMenuType],
            name: 'openImageFragmentAnnotator',
            label: 'Annotate a part of this image',
            showIf: function() {
                return true;
            },
            priority: 99,
            action: function(item) {
                open(item);
                Analytics.track('buttons', 'click', 'contextualMenu--annotatePartOfImage');
            }
        });
    };

    // When all modules have been initialized, services are up, Config are setup etc..
    EventDispatcher.addListener('Client.boot', function() {
        // check configuration and add ctx menu action
        if (Config.imageFragmentAnnotator.active) {
            initContextualMenu();
        }
    });

    // listen events fired by iframe
    $window.addEventListener('message', function(e) {
        if (e.data.type === msg.close) {
            close();
        }
        if (e.data.type === msg.addPolygon) {
            var lastData = e.data;
            if(!MyPundit.isUserLogged()) {
                var der = EventDispatcher.addListener('Consolidation.consolidateAll', function() {
                    var item = imageFragmentHelper.createItemFromPolygon(lastData.poly);
                    MyItems.addItem(item).then(function(){
                        childWindow.postMessage({type:'pundit-add-to-my-items-success'},'*');
                    }, function(){
                        childWindow.postMessage({type:'pundit-add-to-my-items-err'},'*');
                    });
                    EventDispatcher.removeListener(der);
                });
                MyPundit.login();
            } else {
                var item = imageFragmentHelper.createItemFromPolygon(lastData.poly);
                MyItems.addItem(item).then(function(){
                    childWindow.postMessage({type:'pundit-add-to-my-items-success'},'*');
                }, function(){
                    childWindow.postMessage({type:'pundit-add-to-my-items-err'},'*');
                });
            }
        }
    });

    var childWindow, overflow, imgItem;
    var open = function(item) {
        var newSrc = decodeURIComponent(item.image);
        newSrc = newSrc.replace(/'/g, "\\'");

        // add iframe to the page
        if ((newSrc.substring(0, 7) === "http://") || (newSrc.substring(0, 8) === "https://")) {
            angular.element("[data-ng-app='Pundit2']").append(template1+newSrc+template2);
        } else {
            angular.element("[data-ng-app='Pundit2']").append(template1+"http://"+newSrc+template2);
        }
        // disable page scroll
        overflow = angular.element('body').css('overflow');
        angular.element('body').css('overflow', 'hidden');
        imgItem = item;

        childWindow = angular.element('.pnd-image-fragment-frame')[0].contentWindow;
    };

    var close = function() {
        // restore page scrool
        angular.element('body').css('overflow', overflow);
        // remove iframe
        angular.element('.pnd-image-fragment-frame').remove();
    };

    // create an item from the data (polygon) received from image fragment annotator
    // @param poly is a polygon made with image fragment annotator conventions
    imageFragmentHelper.createItemFromPolygon = function(poly) {
        var text = imgItem.image.substring(imgItem.image.lastIndexOf('/') + 1, imgItem.image.length);
        // TODO make a better uri generation (eg. md5(time+img.src))
        // TODO use selector format for polygon
        var item = {
            uri: NameSpace.fragmentBaseUri + 'image/' + new Date().getTime(),
            type: [NameSpace.fragments.imagePart],
            label: poly.name,
            description: 'This fragment represents a part of the image ' + text,
            isPartOf: imgItem.isPartOf,
            image: imgItem.image,
            pageContext: XpointersHelper.getSafePageContext(),
            polygon: angular.copy(poly.points),
            polygonUri: NameSpace.selectors.baseURI + 'polygon/' + (new Date().getTime()+1),
            parentItemXP: imgItem.uri
        };

        return new Item(item.uri, item);
    };

    imageFragmentHelper.drawPolygonOverImage = function(points, img) {

        if(typeof(img) === 'undefined' || typeof(points) === 'undefined' || !img.is('img, svg')){
            return false;
        }

        var w = img.width(),
            h = img.height(),
            i;
        
        // TODO padding?

        var ofx = ((img.outerWidth(true)) - w)/2,
            ofy = (img.outerHeight(true) - h)/2;

        var html = '<span class="pnd-cons-svg"></span>';
        var htmlSVG = '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.0" class="pnd-polygon-layer" width='+w+' height='+h+'></svg>';

        var container = angular.element(html).insertBefore(img).css({
            'position': 'absolute',
            'margin-left': ofx,
            'margin-top': ofy
        });

        // overlap and svg element to the image
        var svg = angular.element(htmlSVG).appendTo(container);

        var normPoints = [];
        for (i=0; i<points.length; i++) {
            normPoints.push({x: points[i].x*w, y: points[i].y*h});
        }

        var lines = [];
        for (i=0; i<normPoints.length; i++) {
            // last point is connected to the first point
            var p, np;
            if (i === normPoints.length-1) {
                p = normPoints[i];
                np = normPoints[0];
            } else {
                p = normPoints[i];
                np = normPoints[i+1];
            }
            lines.push('<line x1='+p.x+' y1='+p.y+' x2='+np.x+' y2='+np.y+' ></line>');
        }

        var filling = '<polygon points="';
        for (i=0; i<normPoints.length; i++) {
            filling += normPoints[i].x+','+normPoints[i].y+' ';
        }
        filling += '"></polygon>';
        
        // add line and filling polygon inside svg element
        svg.append(lines);
        svg.find('line').css({
            'stroke': 'red',
            'stroke-width': 2
        });
        svg.prepend(filling);
        svg.find('polygon').css({
            'fill': 'red',
            'opacity': 0.3
        });

        angular.element(container).html(container.html());
    };

    return imageFragmentHelper;
});