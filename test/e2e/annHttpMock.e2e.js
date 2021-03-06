// httpBackend mock to handle all http request in e2e test
// include this object in all e2e test that make an http request

var annHttpMock;
annHttpMock = function() {
    angular.module('httpBackendMock', ['ngMockE2E'])
        .run(function($httpBackend, NameSpace) {

            // This objects are a mock of the server response
            // To test a functionality that made an http call add here the necessarry
            // server response and add an $httpBackend.whenGET('yourUrl').respond(yourResponse);

            var annResponse = {
                graph: {
                    "http://fake-url.it/release_bot/build/examples/dante-1.html": {
                      "http://purl.org/spar/cito/cites": [
                        {
                          value: "http://purl.org/pundit/ont/ao#fragment-text",
                          type: "uri"
                        }
                      ]
                    }
                },
                items: {
                    "http://purl.org/pundit/ont/ao#fragment-text": {
                        "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "Text fragment"}]
                    },
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property": {
                        "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "Property"}]
                    },
                    "http://fake-url.it/release_bot/build/examples/dante-1.html": {
                      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
                            [{type: "uri", value: "http://purl.org/pundit/ont/ao#fragment-text"}],
                      "http://purl.org/dc/elements/1.1/description":
                            [{type: "literal", value: "originally"}],
                      "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "originally"}],
                      "http://purl.org/pundit/ont/ao#hasPageContext":
                            [{type: "uri", value: "http://localhost/pundit/examples/client-TEST.html"}],
                      "http://purl.org/dc/terms/isPartOf":
                            [{type: "uri", value: "http://fake-url.it/release_bot/build/examples/dante-1.html"}],
                    },
                    "http://purl.org/spar/cito/cites": {
                        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": [{type: "uri", value: 'Property'}]

                    }
                },
                metadata: {
                    "http://purl.org/pundit/demo-cloud-server/annotation/annid123": {
                        "http://purl.org/pundit/ont/ao#hasPageContext":
                            [{type: "uri", value: "http://localhost:9000/app/examples/client-TEST.html"}],
                        "http://purl.org/pundit/ont/ao#isIncludedIn":
                            [{type: "uri", value: "http://purl.org/pundit/demo-cloud-server/notebook/ntid123"}],
                        "http://purl.org/dc/terms/creator":
                            [{type: "uri", value: "http://purl.org/pundit/demo-cloud-server/user/userid123"}],
                        "http://purl.org/dc/elements/1.1/creator":
                            [{type: "literal", value: "Creator User Name"}],
                        "http://www.openannotation.org/ns/hasTarget":
                            [{type: 'uri', value: 'http://metasound.dibet.univpm.it/exmaple'}]

                    }

                }
            };

            var annResponse2 = {
                graph: {
                    "http://fake-url.it/empty.html#xpointer(start-point(string-range(//DIV[@about='http://fake-url.it/empty.html']/DIV[1]/P[2]/B[2]/text()[1],'',0))/range-to(string-range(//DIV[@about='http://fake-url.it/empty.html']/DIV[1]/P[2]/B[2]/text()[1],'',5)))": {
                        "http://schema.org/comment": [{ value: "poeta italiano del 1300", type: "literal"}]
                    }
                },
                items: {
                    "http://fake-url.it/empty.html#xpointer(start-point(string-range(//DIV[@about='http://fake-url.it/empty.html']/DIV[1]/P[2]/B[2]/text()[1],'',0))/range-to(string-range(//DIV[@about='http://fake-url.it/empty.html']/DIV[1]/P[2]/B[2]/text()[1],'',5)))": {
                        "http://purl.org/dc/terms/isPartOf":
                            [{type: "uri", value: "http://fake-url.it/empty.html"}],
                        "http://purl.org/pundit/ont/ao#hasPageContext":
                            [{type: "uri", value: "http://localhost:9000/app/examples/client-TEST.html"}],
                        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
                            [{type: "uri", value: "http://purl.org/pundit/ont/ao#fragment-text"}],
                        "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "Dante"}],
                    },
                    "http://schema.org/comment": {
                        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": [{type: "uri", value: NameSpace.rdf.property}],
                        "http://www.w3.org/2000/01/rdf-schema#label": [{type: "literal", value: "has comment (free text)"}]

                    },
                    "http://purl.org/pundit/ont/ao#fragment-text": {
                        "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "Text fragment"}]
                    },
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property": {
                        "http://www.w3.org/2000/01/rdf-schema#label":
                            [{type: "literal", value: "Property"}]
                    }
                },
                metadata: {
                    "http://purl.org/pundit/demo-cloud-server/annotation/annid124": {
                        // TODO others property if necessary
                        "http://purl.org/pundit/ont/ao#hasPageContext":
                            [{type: "uri", value: "http://localhost:9000/app/examples/client-TEST.html"}],
                        "http://purl.org/pundit/ont/ao#isIncludedIn":
                            [{type: "uri", value: "http://purl.org/pundit/demo-cloud-server/notebook/ntid123"}],
                        "http://purl.org/dc/terms/creator":
                            [{type: "uri", value: "http://purl.org/pundit/demo-cloud-server/user/userid123"}],
                        "http://purl.org/dc/elements/1.1/creator":
                            [{type: "literal", value: "Creator User Name"}]
                    }

                }
            };

            var userLoggedIn = {
                loginStatus: 1,
                id: "userid123",
                uri: "http://purl.org/pundit/demo-cloud-server/user/userid123",
                openid: "http://myOpenId.fake",
                firstName: "Mario",
                lastName: "Rossi",
                fullName: "Mario Rossi",
                email: "mario@rossi.it",
                loginServer: "http:\/\/demo-cloud.as.thepund.it:8080\/annotationserver\/login.jsp"
            };

            // var logoutOk = { logout: 1 };

            var annMedatadaSearch = {
                "http://sever.url/annotation/annid123": {
                    // annotation medatada here if necessary
                },
                "http://sever.url/annotation/annid124": {
                    // annotation medatada here if necessary
                }
            };

            var notebookMedatada = {
                "http://sever.url/notebook/ntid123": {
                    // notebook medatada here if necessary
                    "http://open.vocab.org/terms/visibility":
                        [{type: "literal", value: "public"}],
                    "http://www.w3.org/2000/01/rdf-schema#label":
                        [{type: "literal", value: "Notebook Name"}],
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":
                        [{type: "uri", value: "http://purl.org/pundit/ont/ao#Notebook"}],
                    "http://purl.org/pundit/ont/ao#id":
                        [{type: "literal", value: "ntid123"}]
                }
            };

            var notebookCurrent = {
                NotebookID: "ntid123"
            };

            var notebooksOwned = {
                NotebookIDs: ["ntid123"]
            };

            var templates = {
                label: 'Template Name',
                triples : [
                    {
                        predicate: {
                            "label": "talks about",
                            "domain": ["http://purl.org/pundit/ont/ao#fragment-text"],
                            "range": [],
                            "uri": "http://purl.org/pundit/ont/oa#talksAbout"
                        }
                    }
                ]
            };

            // extend here if you nedd to catch an unexpected http call
            // if user is logged do this http call

            // get user status (user logged)
            $httpBackend.whenGET(NameSpace.get('asUsersCurrent')).respond(userLoggedIn);
            // get my items
            $httpBackend.whenGET(new RegExp("http://test.config.url/api/services/preferences/favorites")).respond(undefined);
            // get my notebooks
            $httpBackend.whenGET(NameSpace.get('asNBOwned')).respond(notebooksOwned);
            // get annotations on annotations API
            $httpBackend.whenGET(new RegExp("http://test.config.url/api/annotations/metadata/search")).respond(annMedatadaSearch);
            $httpBackend.whenGET(new RegExp("http://test.config.url/api/annotations/annid123")).respond(annResponse);
            $httpBackend.whenGET(new RegExp("http://test.config.url/api/annotations/annid124")).respond(annResponse2);
            // get notebooks metadata
            $httpBackend.whenGET(NameSpace.get('asNBMeta', {id: "ntid123"})).respond(notebookMedatada);
            // get current notebook
            $httpBackend.whenGET(NameSpace.get('asNBCurrent')).respond(notebookCurrent);
            // get configured templates
            $httpBackend.whenJSONP(new RegExp("http://template-test-url.com/t1")).respond(templates);

        });
};