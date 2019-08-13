const moduleName = "modelSelection";
const componentName = "modelSelection";
module.exports.name = moduleName;

const dataJson = require('./model/model.js');

var app = angular.module(moduleName, ['wiDropdownList','editable']);

app.component(componentName,{
	template: require('./newtemplate.html'),
    controller: ModelSelectionController,
    style: require('./newstyle.less'),
    controllerAs: 'self',
    bindings: {
    	// datas: '=',
    	// selectedItemProps: '=',
    	layerChange: '<',
    	nnConfig: '<',
    	nnConfigNLayerChanged: '<',
    	setDataModels: '<',
    	setItemSelected: '<'
    }
});

function ModelSelectionController($scope, $compile){
	let self = 	this;
	self.hideDeleteButton = false;	
	this.$onInit = function() {
		self.datas = [];
		self.selectedItemProps = {};
		// self.data = self.handleData(dataJson);
		for(let i in dataJson) {
			self.datas.push(self.handleData(dataJson[i],i));
		}
		// console.log(dataJson);
		self.setDataModels(self.datas)
		console.log('config', self.nnConfig);
	}
	//--------------
	$scope.tab = 2;
	self.selectionTab = self.selectionTab || 'Train';

	$scope.setTab = function(newTab){
		$scope.tab = newTab;
	};

	$scope.isSet = function(tabNum){
		return $scope.tab === tabNum;
	};
	//--------------
	this.clickMe = function () {
		console.log("okokok")
		let element = document.getElementById("tab-layer");
  		element.classList.toggle("hide");
	}

	this.handleData = function(dataJson,key) {
		var definitions = dataJson.definitions;
		var keysPath = Object.keys(dataJson.paths);
		console.log(keysPath[4]);
		var item = {};
		item.create = keysPath[4];
		item.name = key;
		item.data = {};
		item.data.label = key;
		// item.properties = {name: key};	
		item.properties = {};	
		item.properties['bucket_id'] = {};
		item.properties['bucket_id'].name = 'bucket_id';
		item.properties['bucket_id'].type = 'string';
		item.properties['bucket_id'].default= 'bucket_id_01';
		item.properties['bucket_id'].value = item.properties['bucket_id'].default;
		for (let i in definitions[key].properties){
			// item.properties[i] = definitions[key].properties[i].type;
			item.properties[i] = {};
			item.properties[i].name = i;
			item.properties[i].type = definitions[key].properties[i].type;
			item.properties[i].default= definitions[key].properties[i].example || 0;
			item.properties[i].value = item.properties[i].default;
		}
		return item;
	}
	this.onItemChanged = function(selectedItemProps){
		self.selectedItemProps = selectedItemProps;
		// console.log(this,this.selectedItem);
		let props = Object.assign({}, {params: this.selectedItem.properties}, {name: this.selectedItem.name}, {create: this.selectedItem.create});
		// console.log(props);
		self.setItemSelected(props);
	}
	this.setValue = function(param,value) {
		// console.log(self.selectedItemProps[this.itemLabel].type);
		value = validate(self.selectedItemProps[this.itemLabel].type,value);
		if(value === '') value = param;
		this.itemValue = value;
		self.selectedItemProps[this.itemLabel].value = value;
		return
	}
	var validate = function(type,value) {
		// console.log(value,Number.isInteger(value),typeof value);
		switch(type){
			case 'string' : return value; 

			case 'integer': 
				value = Number(value);
				if(Number.isInteger(value)) {
					return value;
				}
				return '';
			case 'number':
				value = Number(value);
				if (!isNaN(value)) {
					return value;
				}
				return '';
			case 'boolean':
				if(value.toString().toLowerCase() == 'true') {
					// return 'true';
					return true;
				}
				if(value.toString().toLowerCase() == 'false') {
					// return 'false';
					return false;
				}
				return '';
			default: return '';
		}
	}
	function getContentSize(ratio = 3 / 4) {
        let body = $(`#id1`);
        let width = body.width() * ratio;
        let height = body.height() * ratio;
        return `${width} ${height}`;
    }
}