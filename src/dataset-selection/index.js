const moduleName = "datasetSelection";
const componentName = "datasetSelection";
module.exports.name = moduleName;

var app = angular.module(moduleName, ['wiTreeView','wiDroppable']);

app.component(componentName,{
	template: require('./template.html'),
    controller: DatasetSelectionController,
    style: require('./style.less'),
    controllerAs: 'self',
    bindings: {
    	idProject: '<',
        inputCurveSpecs: '<',
        targetCurveSpec: '<',
        steps: '<',
        typeSelected: '<',

        addCurveInput: '<',
        getOnItemChanged: '<',
        onTargetItemChanged: '<',
        removeDataSelectionList: '<',
        changeType: '<',
        drop: '<',
        out: '<',
        over: '<',
        deactivate: '<',
        selectionList: '<',
        mergeCurves: '<',
        makeSelectionList: '<'
        // isClick: '=',
    }
});

function DatasetSelectionController($scope,wiApi,$timeout){
	let self = 	this;
	this.treedata;
    this.isActive = 0;
    this.buttons = [{
        label: 'Curve',
        type: 'curve',
        icon: 'curve-16x16'
    },{
        label: 'Family Curve',
        type: 'family_curve',
        icon: 'family-16x16'
    },{
        label: 'Main Family',
        type: 'main_family',
        icon: 'family-group-16x16'
    }];
    // this.typeSelected = self.buttons[0].type;
    this.getLabel = function (node) {
        return (node||{}).name || 'no name';
    }	
    this.getIcon = function (node) {
    	if(!node) return;
    	if(node.idCurve) {
    		return "curve-16x16";
    	} else if(node.idDataset){
    		return "curve-data-16x16";
    	} else if(node.idWell) {
	        return "well-16x16";
 		}
    }
    this.getChildren = function (node) {
    	if (!node) return [];
        if(node.idDataset){
            return node.curves || [];           
        }
        else if (node.idWell) {
            return node.datasets || [];
        }
    }
    this.getChildrenDataset = function(node) {
        if (!node) return [];
        if (node.idWell && node.idProject) {
            return node.datasets || [];
        }
        return [];
    }
    this.clickFn = function(event,node,selectIds,rootnode) {
    	if(!node.idWell || node.datasets) return [];
    	wiApi.getWellPromise(node.idWell).then(well =>{
    		$timeout(()=>{
                well.datasets.forEach(dataset=>{
                    dataset.wellName = well.name;
                })
    			node.datasets = well.datasets;    		
    		})
    	}).catch(err =>{
    		console.error(err);
    	})
    }
    this.runMatch = function(node,filter) {
        return node.name.includes(filter);
    }
    this.$onInit = function() {
        self.typeSelected = self.buttons[0].type;
    	(async ()=>{
    		try{
    			self.treedata = await wiApi.getWellsPromise(self.idProject);
    		}catch (e){
    			console.error(e);
    		}
    	})();
    }
}