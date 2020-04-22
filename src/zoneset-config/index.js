const moduleName = "zonesetConfig";
const componentName = "zonesetConfig";
module.exports.name = moduleName;

const app = angular.module(moduleName, [
    'wiTreeView',
    'wiDroppable',
    'angularResizable',
    'wiTreeViewVirtual',
    'wiApi',
    'mlApi',
    'sideBar'
]);

app.component(componentName,{
    template: require('./template.html'),
    controller: ZonesetConfigController,
    style: require('./style.less'),
    controllerAs: 'self',
    bindings: {
        controller: '<'
    }
});

ZonesetConfigController.$inject = ['$scope', 'wiApi', '$timeout', 'mlApi']
function ZonesetConfigController($scope, wiApi, $timeout, mlApi){
    let self = 	this;
    const tabsName = ['training', 'verify', 'prediction'];
    function getTab() {
        return $scope.tab;
    };
    function isSet(tabNum) {
        return $scope.tab === tabNum;
    };
    function setTab(newTab) {
        $scope.tab = newTab;
    };
    this.$onInit = function() {
        $scope.tab = 0;
        $scope.setTab = setTab;
        $scope.getTab = getTab;
        $scope.isSet = isSet;

        $scope.$watch(() => {
            let listDataset = self.controller.tabs['training'].listDataset;
            return listDataset.map(dataset => dataset.idDataset);
        }, () => {
            self.updateListZoneset(0);
            let step = 'training';
            let listDataset = self.controller.tabs[step].listDataset;
            let zonesetName = self.controller.zonesetConfig[step].zonesetName;
            updateZonesArr(zonesetName, listDataset);
        }, true);
        $scope.$watch(() => {
            let listDataset = self.controller.tabs['verify'].listDataset;
            return listDataset.map(dataset => dataset.idDataset);
        }, () => {
            self.updateListZoneset(1);
            let step = 'verify';
            let listDataset = self.controller.tabs[step].listDataset;
            let zonesetName = self.controller.zonesetConfig[step].zonesetName;
            updateZonesArr(zonesetName, listDataset);
        }, true);
        $scope.$watch(() => {
            let listDataset = self.controller.tabs['prediction'].listDataset;
            return listDataset.map(dataset => dataset.idDataset);
        }, () => {
            self.updateListZoneset(2);
            let step = 'prediction';
            let listDataset = self.controller.tabs[step].listDataset;
            let zonesetName = self.controller.zonesetConfig[step].zonesetName;
            updateZonesArr(zonesetName, listDataset);
        }, true);
    }

    // ==========Zoneset List==========
    this.updateListZoneset = updateListZoneset;
    function updateListZoneset(tabNum) {
        let step = tabsName[tabNum];
        let listDataset = self.controller.tabs[step].listDataset;
        let dsItemHash = {};
        for (let dsItem of listDataset) {
            dsItemHash[`${dsItem.idProject}-${dsItem.owner}-${dsItem.prjName}-${dsItem.idWell}`] = dsItem;
        }

        let dsItemKeys = Object.keys(dsItemHash);
        dsItemKeys = _.uniq(dsItemKeys);

        //let uniqIdWells = _.uniq(listDataset.map(dataset => dataset.idWell));
        getZonesetsList(dsItemKeys, dsItemHash).then((zonesetsList) => {
            switch(step) {
                case 'training': {
                    self.trainingZonesets = processZonesetsList(zonesetsList);
                    break;
                }
                case 'verify': {
                    self.verifyZonesets = processZonesetsList(zonesetsList);
                    break;
                }
                case 'prediction': {
                    self.predictionZonesets = processZonesetsList(zonesetsList);
                    break;
                }
            }
        });
    }
    function getZoneset(dsItem, zonesetName) {
        return wiApi.client(mlApi.getClientId(dsItem.owner, dsItem.prjName)).getCachedWellPromise(dsItem.idWell).then((well) => {
            let toRet = well.zone_sets.find(zoneset => zoneset.name === zonesetName);
            if (!toRet) {
                throw new Error(`Zoneset ${zonesetName} not found in well ${well.name}`);
            }
            return toRet;
        });
    }
    //function getZonesetsList(idWells) {
    function getZonesetsList(dsItemKeys, dsItemHash) {

        return new Promise((resolve, reject) => {
            let jobs = dsItemKeys.map(dsItemKey => {
                let dsItem = dsItemHash[dsItemKey];
                return wiApi.client(mlApi.getClientId(dsItem.owner, dsItem.prjName)).getCachedWellPromise(dsItem.idWell);
            });
            Promise.all(jobs).then(wells => {
                let zonesetsListRes = wells.map(well => well.zone_sets);
                resolve(zonesetsListRes);
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }
    function processZonesetsList(zonesetsList) {
        if (!zonesetsList.length) return;
        let zsList;
        for (let zonesets of zonesetsList) {
            if (!zsList) {
                zsList = angular.copy(zonesets);
            } else if (zsList.length) {
                zsList = intersectAndMerge(zsList, zonesets);
            } else {
                break;
            }
        }
        return zsList;
    }
    function intersectAndMerge(dstZoneList, srcZoneList) {
        return dstZoneList.filter(zs => {
            let zoneset = srcZoneList.find(zs1 => zs.name === zs1.name);
            if (!zoneset) return false;
            for (let z of zoneset.zones) {
                let zone = zs.zones.find(zo => zo.zone_template.name == z.zone_template.name);
                if (!zone) {
                    zs.zones.push(angular.copy(z));
                }
            }
            return true;
        });
    }
    this.getListZoneset = getListZoneset;
    function getListZoneset() {
        switch(true) {
            case isSet(0): {
                return self.trainingZonesets;
            }
            case isSet(1): {
                return self.verifyZonesets;
            }
            case isSet(2): {
                return self.predictionZonesets;
            }
        }
    }
    this.refreshZonesetList = refreshZonesetList;
    function refreshZonesetList() {
        let step = tabsName[getTab()];
        $timeout(() => {
            self.controller.zonesetConfig[step].zoneList = null;
            self.controller.zonesetConfig[step].zonesetName = null;
        });
        self.updateListZoneset(getTab());
    }
    this.clickZonesetFn = clickZonesetFn;
    function clickZonesetFn(event, node, selectIds, rootnode) {
        let step = tabsName[getTab()];
        let preZonesetName = self.controller.zonesetConfig[step].zonesetName;
        if (preZonesetName != self.getZonesetLabel(node)) {
            self.controller.zonesetConfig[step].zonesetName = self.getZonesetLabel(node);
        }
        updateZoneList();
    }
    this.runMatchZoneset = function(node, filter) {
        let label = self.getZonesetLabel(node);
        return label.toLowerCase().includes(filter.toLowerCase());
    }
    this.getZonesetLabel = function(node) {
        return (node||{}).displayName || (node||{}).name || 'no name';
    }
    this.getZonesetIcon = function(node) {
        if(!node) return;
        return "user-define-16x16";
    }
    this.getZonesetChild = function(node) {
        return false;
    }

    // ==========Zone List==========
    function updateZoneList(tabNum) {
        let step = tabsName[tabNum || getTab()];
        let listDataset = self.controller.tabs[step].listDataset;
        let zonesetName = self.controller.zonesetConfig[step].zonesetName;
        //self.controller.zonesetConfig[step].zoneList = getUniqZones(zonesetName, listDataset);
        getUniqZones(zonesetName, listDataset).then(zones => {
            self.controller.zonesetConfig[step].zoneList = zones;
        }).catch(e => console.error(e));
    }
    function getUniqZones(zonesetName, listDataset) {
        let jobs = listDataset.map(dsItem => getZoneset(dsItem, zonesetName));
        return Promise.all(jobs).then((zonesets) => {
            let zones = [];
            for (let zoneset of zonesets) {
                zones.push(...zoneset.zones);
            }
            zones = _.uniqBy(zones, "zone_template.name");
            zones = zones.map(z => ({template_name: z.zone_template.name}));
            return zones;
        });
    }
    function getUniqZones1(zonesetName, listDataset) {
        let step = tabsName[getTab()];
        if (!listDataset || !listDataset.length) return null;
        let wells = (self.controller.dataProject || {}).wells;
        if (!wells || !wells.length) return null;
        let zonesRes = [];
        let tmpZonesList = [];
        for (let dataset of listDataset) {
            let idDataset = dataset.idDataset;
            let idWell = dataset.idWell;
            let well = _.find(wells, w => w.idWell === idWell);
            let zones = (_.find(well.zonesets, zoneset => {
                return zoneset.zone_set_template.name === zonesetName
            }) || {}).zones || [];
            zonesRes = [...zonesRes, ...zones];
            tmpZonesList.push(angular.copy(zones));
        }
        self.controller.zonesList[step] = tmpZonesList;
        zonesRes = _.uniqBy(zonesRes, 'zone_template.name');
        zonesRes = zonesRes.map(z => ({template_name: z.zone_template.name}));
        return zonesRes;
    }
    function updateZonesArr(zonesetName, listDataset) {
        let step = tabsName[getTab()];
        if (!listDataset || !listDataset.length) return null;
        let wells = (self.controller.dataProject || {}).wells;
        if (!wells || !wells.length) return null;
        let tmpZonesList = [];
        for (let dataset of listDataset) {
            let idDataset = dataset.idDataset;
            let idWell = dataset.idWell;
            let well = _.find(wells, w => w.idWell === idWell);
            let zones = (_.find(well.zonesets, zoneset => {
                return zoneset.zone_set_template.name === zonesetName
            }) || {}).zones || [];
            tmpZonesList.push(angular.copy(zones));
        }
        self.controller.zonesList[step] = tmpZonesList;
    }
    this.getListZone = function() {
        let step = tabsName[getTab()];
        return self.controller.zonesetConfig[step].zoneList;
    }
    this.clickZoneFn = function(event, node, selectIds, rootnode) {
        if (!node) return;
        node._notUsed = !node._notUsed;
    }
    this.refreshZoneList = function() {
        let step = tabsName[getTab()];
        self.controller.zonesetConfig[step].zoneList = null;
        updateZoneList();
    }
    this.getZoneChild = function(node) {
        return false;
    }
    this.runMatchZone = function(node, filter) {
        let label = self.getZoneLabel(node);
        return label.toLowerCase().includes(filter.toLowerCase());
    }
    this.getZoneLabel = function(node) {
        if (!node) return;
        return node.template_name || node.zone_template.name || 'no name';
    }
    this.getZoneIcon = function(node) {
        if (!node) return;
        return node._notUsed ? "ti ti-check check-off" : 'ti ti-check check-on';
    }
}
