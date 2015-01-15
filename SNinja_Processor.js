gs.include("JSON");
var SNinja = Class.create();

SNinja.prototype = Object.extendsObject(AbstractAjaxProcessor, {
	getUserPermission : function(){
		return gs.getPreference("sninja.run", false);
	},

	getACValues : function(){
		var tableRec = new GlideRecord('sys_documentation');
		tableRec.addQuery('element=NULL^nameNOT LIKEts_c^language=en^nameNOT LIKE0');
		tableRec.query();
		var searches = {
			tables :[],
			modules : []
		};

		while(tableRec.next()){
			searches.tables.push({
				value : tableRec.name.toString(),
				section : 'Tables',
				type : 'table',
				tokens : [tableRec.name.toString(), tableRec.label.toString()]
			})
		}

		var moduleRec = new GlideRecord('sys_app_module');
		moduleRec.addQuery('link_typeINLIST,NEW,REPORT,SCRIPT,DETAIL,DIRECT^active=true');
		moduleRec.query();

		while(moduleRec.next()){
			searches.modules.push({
				value : moduleRec.title.getDisplayValue().toString() + " (" + moduleRec.application.getDisplayValue() + ")",
				title : moduleRec.title.getDisplayValue().toString(),
				section : moduleRec.application.getDisplayValue(),
				type : moduleRec.link_type.toString().toLowerCase(),
				tokens : [ moduleRec.title.getDisplayValue()],
				link : moduleRec.name.toString(),
				id : moduleRec.sys_id.toString(),
				parms : moduleRec.filter.toString(),
				view : moduleRec.view_name.toString(),
				report : moduleRec.report.toString(),
				args : moduleRec.query.toString()
			});

		}

		return new JSON().encode(searches);
	}

});