const moduleName = "datasetSelection";
const componentName = "datasetSelection";
module.exports.name = moduleName;

var app = angular.module(moduleName, ['wiTreeView','wiDroppable','angularResizable','wiTreeViewVirtual','sideBar']);

app.component(componentName,{
	template: require('./newtemplate.html'),
    controller: DatasetSelectionController,
    style: require('./newstyle.less'),
    controllerAs: 'self',
    bindings: {
        inputCurveSpecs: '<',
        targetCurveSpec: '<',

        machineLearnSteps: '<',

        // typeSelected: '<',
        typeInput: '<',

        selectionList: '<',
        // mergeCurves: '<',
        onAddInputItem: '<',

        getFnOnInputChanged: '<',

        onTargetItemChanged: '<',
        onRemoveInputItem: '<',
        onChangeType: '<',
        onRemoveDataset: '<',

        // makeSelectionList: '<',

        drop: '<',
    }
});
DatasetSelectionController.$inject = ['$scope', 'wiApi', '$timeout']

function DatasetSelectionController($scope, wiApi, $timeout){
	let self = 	this;
	this.listMlProject;
    this.buttons = [
        {
            label: 'Curve',
            type: 'curve',
            icon: 'curve-16x16'
        },
        {
            label: 'Family Curve',
            type: 'family_curve',
            icon: 'family-16x16'
        },
        {
            label: 'Main Family',
            type: 'main_family',
            icon: 'family-group-16x16'
        }
    ];
    this.getLabel = function (node) {
        return (node||{}).displayName || (node||{}).name || 'no name';
    }	
    this.getIcon = function (node) {
    	if(!node) return;
        if(node.idCurve) {
            if(node.type === "TEXT"){
                return "text-curve-16x16"
            } else if (node.type === "ARRAY") {
                return "array-curve-16x16";
            }else {
                return "curve-16x16";
            }
    	} else if(node.idDataset){
            if(node.step == "0"){
                return "dataset-new-16x16"
            } else if (node.name === "INDEX") {
                return "reference-dataset-16x16";
            }else {
                return "curve-data-16x16";
            }
    	} else if(node.idWell) {
	        return "well-16x16";
 		} else if(node.idProject) {
            return "project-normal-16x16";
        }
    }
    this.getChildren = function (node) {
    	if (!node) return [];
        if(node.idDataset){
            return node.curves || [];           
        }else if (node.idWell) {
            return node.datasets || [];
        }else if(node.idProject) {
            return node.wells || [];
        }
        return [];
    }
    this.getChildrenDataset = function(node) {
        return [];
    }
    this.clickFn = function(event,node,selectIds,rootnode) {
        // console.log(node)
        if(node.idProject && node.wells) return;
        if(node.idWell && node.datasets) return;
        if(node.idProject && !node.idDataset) {
            wiApi.getFullInfoPromise(node.idProject, node.owner, node.name).then(dataProject => {
                console.log(dataProject);
                $timeout(()=>{
                    node.wells = dataProject.wells.sort((a,b) => a.name.localeCompare(b.name));
                    node.wells = dataProject.wells;
                    for(let i of node.wells) {
                        i.datasets.sort((a,b) => a.name.localeCompare(b.name));   
                        for(let j of i.datasets) {
                            j.curves.sort((a,b) => a.name.localeCompare(b.name));   
                            j.wellName = i.name;
                            j.idProject = node.idProject;
                        }
                    }
                    sortProjectData(node);   
                })
            });
        }
    }
    this.runMatch = function(node, filter) {
        return node.displayName.toLowerCase().includes(filter.toLowerCase());
        // return node.name.includes(filter);
    }
    this.$onInit = function() {
        $scope.$watch(function () {
			return localStorage.getItem('token');
		}, function (newValue, oldValue) {
			if ((localStorage.getItem("token")) !== null) {
                wiApi.getProjectsPromise()
                .then((data) => {
                    $timeout(() => {
                        self.listMlProject = data.sort((a,b) => a.name.localeCompare(b.name));
                    })
                })
                .catch((err) => {
                    if(err.status === 401) {
                        delete window.localStorage.token;
                    }
                })
			}
		});
    }
    this.refeshProject = function() {
        self.reloadPrj = true;
        wiApi.getProjectsPromise()
        .then((data) => {
            $timeout(() => {
                self.listMlProject = data.sort((a,b) => a.name.localeCompare(b.name));
                self.reloadPrj = !self.reloadPrj;
            })
        })
    }
    function sortProjectData(projectData) {
        if (!projectData.wells) return;
        projectData.wells.sort((a, b) => {
            let nameA = a.name.toUpperCase();
            let nameB = b.name.toUpperCase();
            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "accent" });
        });
        projectData.wells.forEach(well => {
            well.datasets.sort((a, b) => {
                let nameA = a.name.toUpperCase();
                let nameB = b.name.toUpperCase();
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "accent" });
            });
            well.datasets.forEach(dataset => {
                dataset.curves.sort((a, b) => {
                    let nameA = a.name.toUpperCase();
                    let nameB = b.name.toUpperCase();
                    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "accent" });
                });
            });
            well.zonesets.sort((a, b) => {
                let nameA = a.name.toUpperCase();
                let nameB = b.name.toUpperCase();
                return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "accent" });
            });
            well.zonesets.forEach(function (zoneset) {
                zoneset.zones.sort((a, b) => {
                    let depthA = parseFloat(a.startDepth);
                    let depthB = parseFloat(b.startDepth);
                    return depthA - depthB;
                })
            })
        });
    }
}