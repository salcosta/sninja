var sninja;

(function($) {

    sninja = {
        visible: false,
        suggestion: '',
        bloodhound: {},
        tabCount : 0,
        mode : 'default',
        search: {},
        commandArray : [],
        commandIndex : 0,
        commands: {

            "list": {
                "context": "table",
                "command": function(item, newWindow) {
                    sninja.openWindow(item + "_list.do", newWindow);
                }

            },
            "form": {
                "context": "table",
                "command": function(item, newWindow) {
                    sninja.openWindow(item + ".do", newWindow);
                }

            },

            "dict": {
                "context": "table",
                "command": function(item, newWindow) {

                    sninja.openWindow("sys_dictionary_list.do?sysparm_query=name=" + item, newWindow);
                }
            },
            "recent": {
                "context": "table",
                "command": function(item, newWindow) {

                    sninja.openWindow(item + "_list.do?sysparm_query=sys_updated_onONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)", newWindow);

                }
            },
            "do": {
                "context": "any",
                "command": function(item, newWindow) {

                    sninja.openWindow(item + ".do", newWindow);

                }
            },

            "open": {
                "context": "any",
                "command": function(item, newWindow, suggestion) {
                    var link = "";

                    if (suggestion.type == "direct") {
                        link = suggestion.args;
                    } else if (suggestion.type == "list") {
                        link = suggestion.link + "_list.do?" + ["sysparm_query=" + suggestion.filter, "sysparm_view=" + suggestion.view].join("&");
                    } else if (suggestion.type == "new") {
                        link = suggestion.link + ".do?sysparm_id=-1&" + ["sysparm_query=" + suggestion.filter, "sysparm_view=" + suggestion.view].join("&");
                    } else if (suggestion.type == "report") {
                        link = "sys_report_template.do?jvar_report_id=" + suggestion.report + "&sysparm_from_list=true";
                    } else if (suggestion.type == "detail") {
                        link = suggestion.link + ".do?sysparm_query=" + suggestion.args + "&sysparm_view=" + suggestion.view;
                    } else if (suggestion.type == "script") {
                        newWindow = true;
                        link = "sys.scripts.do?action=run_module&sys_id=" + suggestion.id;
                    }


                    if (link !== "") {
                        sninja.openWindow(link, newWindow);
                    }


                }
            },

            "br" : {
                "context" : "any",
                "command" : function(item, newWindow){
                    sninja.openWindow("sys_script_list.do?sysparm_query=table=" + item, newWindow);
                }
            },

            "cs" : {
                "context" : "any",
                "command" : function(item, newWindow){
                    sninja.openWindow("sys_client_script_list.do?sysparm_query=table=" + item, newWindow);
                }
            },

            "acl" : {
                "context" : "any",
                "command" : function(item, newWindow){
                    sninja.openWindow("sys_security_acl_list.do?sysparm_query=nameSTARTSWITH" + item, newWindow);
                }
            },

            "act" : {
                "context" : "any",
                "command" : function(item, newWindow){
                    sninja.openWindow("sys_ui_action_list.do?sysparm_query=table=" + item, newWindow);
                }
            },

            "pol" : {
                "context" : "any",
                "command" : function(item, newWindow){
                    sninja.openWindow("sys_ui_policy_list.do?sysparm_query=table=" + item, newWindow);
                }
            },      

            "search" : {
                "command" : function(item){
                    sninja.openWindow(item[0] + "_list.do?sysparm_query=123TEXTQUERY321=" + item[2], false);
                }                
            }      
        },

        openWindow : function(link, newWindow){

            if(!newWindow){
                sninja.getMainWindow().location = link;
            } else {
                window.open(link);
                
            }
        },

        getTable : function(){
            var table = sninja.getMainWindow().location.pathname.toString().split('.do')[0];
            table = table.replace("/","");
            table = table.replace("_list","");

            return table;
        },

        init: function() {

            for (var key in sninja.commands) {
                if (sninja.commands.hasOwnProperty(key)) {
                    sninja.commandArray.push(key);
                }
            }
            this.getUserPermission()
        },

        startSninja: function() {
            this.addSearch();
            this.bindKeys();
            
            var data = localStorage["searchData"];

            if(!data){
                this.getACValues();
            } else {
                sninja.search = JSON.parse(data);
                console.log("sninja - Loaded AC Values From Cache");
                sninja.initializeTypeahead();
            }

        },

        getMainWindow: function() {
            var mainWindow = getMainWindow();

            if (mainWindow === undefined) {
                return self
            } else {
                return mainWindow
            }

        },

        bindKeys: function() {

            $(document).on('keydown', this.processEvent);
            $(document).on('keyup', this.processEventUp);


        },
        processEventUp: function(event) {

            if (sninja.visible) {
                if ($("#sninja_search").is(":focus")) {
                    var command = $("#sninja_search").val().split(".");
                    if( command == "refresh"){
                        sninja.getACValues();
                        sninja.reset();
                    }
                    if (command.length == 2) {
                        if (sninja.commands[command[1]]) {
                            sninja.run_command(command);
                        }
                    }
                }
            } else if (event.which == 9 && sninja.visible == true) {


                event.preventDefault();
                event.stopPropagation();

            }

        },
        processEvent: function(event) {
            if (event.which == 192) {
                if (!sninja.visible) {
                    event.preventDefault();
                    event.stopPropagation();
                    sninja.loadSearch();

                } else {
                    sninja.closeSearch();
                }
            } else if (event.which == 27 && sninja.visible == true) {
                sninja.closeSearch();
                event.preventDefault();
                event.stopPropagation();
                sninja.reset();
            } else if (event.which == 13 && sninja.visible == true) {
                if ($("#sninja_search").is(":focus")) {

                    var textVal = $("#sninja_search").val();
                    
                    if(sninja.mode == 'search'){
                        textVal = textVal.replace("Search ","");
                        var terms = textVal.split(":");
                        command = [terms[0],'search',terms[1]];

                    } else {
                        command = textVal.split(".");
                    }

                    sninja.run_command(command);
                    sninja.reset();
                }
            } else if (event.which == 190 && sninja.visible == true) {
                var term = $("#sninja_search").val().split(".")[0];
                sninja.search_for_command(term);

            } else if (event.which == 9 && sninja.visible == true) {
                var text = $("#sninja_search").val();
                
                if( typeof sninja.suggestion == 'object' && sninja.tabCount == 1 ){
                    $("#sninja_search").val("Search " + text + ": ");
                    sninja.tabCount = 2;
                    sninja.mode = 'search';
                } else {
                    sninja.search_partial_match(text);
                    
                }

                event.preventDefault();
                event.stopPropagation();

            } else if ( (event.which == 192 || event.which == 8) && sninja.visible == true) {
                sninja.tabCount = 0;
                sninja.mode = 'default';
                sninja.suggestion = '';
            }

        },

        search_for_command: function(term) {
            sninja.bloodhound.tables.get(term, function(suggestions) {
                suggestions.each(function(suggestion) {
                    if (suggestion.value == term) {
                        sninja.suggestion = suggestion;
                    }
                });
            });

            sninja.bloodhound.modules.get(term, function(suggestions) {
                suggestions.each(function(suggestion) {
                    if (suggestion.value == term) {
                        sninja.suggestion = suggestion;
                    }
                });
            });

            return false;
        },

        search_partial_match: function(term) {
            sninja.tabCount = 1;
            sninja.bloodhound.tables.get(term, function(suggestions) {
                if (suggestions.length !== 0) {
                    $("#sninja_search").typeahead('val', suggestions[0].value);
                    sninja.suggestion = suggestions[0];
                }
            });
        },

        run_command: function(command) {

            if (command.length == 1) command.push("open");
            if( command[0] == "current" ) command[0] = sninja.getTable();


            if (sninja.suggestion == '') sninja.suggestion = {
                value: command[0],
                type: "table"
            };

            var commandName = command[1].toLowerCase();

            if(commandName == 'search'){
                sninja.commands[commandName].command(command);
            } else if (sninja.commands[commandName].context == sninja.suggestion.type || sninja.commands[commandName].context == "any") {
                sninja.commands[commandName].command(sninja.suggestion.value, command[1] === command[1].toUpperCase(), sninja.suggestion);
            }


            sninja.closeSearch();
        },

        reset: function() {

            $("#sninja_search").typeahead('val', '');
            sninja.suggestion = "";
            sninja.tabCount = 0;
            sninja.mode = 'default';
            sninja.commandIndex = 0;            
        },

        closeSearch: function() {
            sninja.reset();
            sninja.visible = false;
            $('.sninja').fadeOut(100);
        },

        loadSearch: function() {
            sninja.suggestion = ''
            $("#sninja_search").typeahead('val', '');
            sninja.visible = true;

            $('.sninja').fadeIn(50, function() {
                $("#sninja_search").focus();
            });
        },

        addSearch: function() {

            var container = $("<div></div>").addClass("sninja").addClass("sninja-search-container").appendTo("body");
            $("<input></input>").attr("id", "sninja_search").addClass("sninja-search-box").addClass("typeahead").appendTo(container);

        },

        initializeTypeahead: function() {


            sninja.bloodhound.tables = new Bloodhound({
                datumTokenizer: function(d) {
                    return Bloodhound.tokenizers.whitespace(d.tokens.join(' '));
                },
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                sorter: function(a, b) {

                    if (a.value.length < b.value.length) {
                        return -1;
                    }
                    if (a.value.length > b.value.length) {
                        return 1;
                    }

                    return 0;
                },
                local: sninja.search.tables
            });

            sninja.bloodhound.modules = new Bloodhound({
                datumTokenizer: function(d) {
                    return Bloodhound.tokenizers.whitespace(d.tokens.join(' '));
                },
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: sninja.search.modules
            });

            sninja.bloodhound.tables.initialize();
            sninja.bloodhound.modules.initialize();

            $('#sninja_search').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            }, {
                name: 'tables',
                displayKey: 'value',
                source: sninja.bloodhound.tables.ttAdapter(),
                templates: {
                    suggestion: Handlebars.compile('<p><strong>{{value}}</strong></p>')
                }
            }, {
                name: 'modules',
                displayKey: 'value',
                source: sninja.bloodhound.modules.ttAdapter(),
                templates: {
                    suggestion: Handlebars.compile('<p><strong>{{title}}</strong> ({{section}})</p>')
                }

            }).bind('typeahead:selected', function(obj, datum, name) {
                sninja.suggestion = datum
            }).bind('typeahead:autocompleted', function(obj, datum, name) {
                sninja.suggestion = datum;
            }).bind('typeahead:cursorchanged', function(obj, datum, name) {
                sninja.suggestion = datum;
            });

        },

        getACValues: function() {
            var ga = new GlideAjax("SNinja");
            ga.addParam('sysparm_name', 'getACValues');
            console.log("sninja - Loading AC Values")
            ga.getXML(function(response) {
                var data = response.responseXML.documentElement.getAttribute("answer");
                localStorage["searchData"] = data;
                sninja.search = JSON.parse(data);
                sninja.initializeTypeahead();
            });
        },

        getUserPermission: function() {
            var ga = new GlideAjax("SNinja");
            ga.addParam('sysparm_name', 'getUserPermission');

            ga.getXML(function(response) {
                var data = response.responseXML.documentElement.getAttribute("answer") == "true";
                if (data == true) {
                    sninja.startSninja();
                }


            });
        }

    };

    $(document).ready(function() {
        sninja.init();
    })

})(jQuery)