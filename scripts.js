var iaApp = angular.module('iaApp', ['ngRoute','ngStorage']);

iaApp.filter('myFilter', function() {
        return function(items, search){
            if (!search) return items;
            var not = false;
            if (search.endsWith("/")){
                not = true;
                search = search.substr(0, search.length-1);
            }
            search = search.toLowerCase();
            var searches = [];
            searches.push(search);
            if (search.indexOf(" ")!=-1){
                searches = search.split(" ");
            }
            return (items.filter(function(element,index){
			var searchOn = ""; 
			var keys = Object.keys(element);
			keys.forEach(function(key){
				searchOn += element[key];
			});
		
		searchOn = searchOn.toLowerCase();
                     var flag = true;
                     searches.forEach(function(sstr, index){
                         flag = (searchOn.indexOf(sstr) > -1) && flag;
                     })
                     flag = (not)? !flag : flag;
                     return flag;
                    }))
        }
    });


iaApp.config(function($routeProvider, $locationProvider) {
  		$routeProvider
   		.when('/addProcess/:key', {
    		templateUrl: 'addEditProcess.html',
    		controller: 'addProcessCtrl'})
		.when('/listProcess/:key', {
    		templateUrl: 'listProcesses.html',
    		controller: 'listProcessCtrl'})
		.when('/', {
    		templateUrl: 'home.html',
    		controller: 'homeController'})
		 })
iaApp.controller('MainController', function($scope, $route, $routeParams, $location, $http,$localStorage) {
     $scope.$route = $route;
     $scope.$location = $location;
     $scope.$routeParams = $routeParams;
	console.log('MainController executed');
     $scope.datacontent = null;
	$http.get('dataformat.json').success(onSuc).error(onE);
	function onSuc(data){
		//console.log(data);
		if (data){
			$scope.datacontent = data;
			var sizeCh = 0;
			data.pages.forEach(function(page){
				var list = $localStorage[page.key];
				sizeCh += JSON.stringify(list).length
			});
			console.log(sizeCh);
		}
	}
	function onE(err){
		console.log(err);
	}
	
	$scope.showUpdatedSize = function(){
		console.log("main controller function called");
		$scope.size = JSON.stringify($localStorage).length;
		if ($scope.size > 0)$scope.percentage= Math.round($scope.size/5200000*100);
	}
	$scope.showUpdatedSize();
 })

iaApp.controller('addProcessCtrl',function($scope, $route, $routeParams, $location, $http,$localStorage){
	$scope.buKey = ($routeParams.key);
	var what = $scope.buKey;
	
	function getPathList(){
		if ($localStorage[what]){
			return $localStorage[what].list;
		}
		else
		{
			$localStorage[what] = {list:[]};
			return $localStorage[what].list;
		}
	}

	var editor;
	$http.get('_processSchema.json').success(onSuc).error(onE);
	function onSuc(data){
		if (data){
			$scope.schema = data;
			buildUi(data);
			addOpsStatistics();
			addMilestoneValues();
			addProdRun();
		}
	}
	function onE(err){
		console.log(err);
	}
	function buildUi(schElement){
		const element = document.getElementById('processEditor');
		var options = {
		schema: schElement, 
		disable_edit_json: true, 
		disable_properties: true, 
		remove_button_labels: true,
		theme: "bootstrap4",
		iconlib: "fontawesome5",
		disable_array_add: true,
		disable_array_delete: true,
		disable_array_reorder: true,
		show_errors: "change"
		};
		editor = new JSONEditor(element,options);
	}
	function addMilestoneValues(){
		let val = [{phase:'1.Assessment'},{phase:'2.Build'}, {phase:'3.Verification'}, {phase:'4.Rollout'}];
		let phases = editor.getEditor('root.phases');
		phases.setValue(val);
	};
	function addProdRun(){
		let val = [{month:'Month 1'},{month:'Month 2'}, {month:'Month 3'}];
		let txns = editor.getEditor('root.rollout.prodStatistics');
		txns .setValue(val);
	};

	function addOpsStatistics(){
		let val = [{fte:0, aht:0,annualTxns:0}]
		let opsStatistics= editor.getEditor('root.opsStatistics');
		opsStatistics.setValue(val);
	}
	$scope.save = function(){
		var copy =  JSON.stringify(editor.getValue());
		var copiedObj = JSON.parse(copy);
		if (!copiedObj.id){
			copiedObj.id = (new Date()).getTime();
			getPathList().push(copiedObj);
			alert('Saved..locally...but can save to Server');
			$location.path('/listProcess/'+$scope.buKey);
		}
		else {
			// update the localstorage
			
		}
		console.log($scope.list);
		
	}

})

iaApp.controller('listProcessCtrl',function($scope, $route, $routeParams, $location, $http,$localStorage){
	$scope.buKey = ($routeParams.key);
	console.log($scope.datacontent.listProcess);
	$scope.fields = ($scope.datacontent.listProcess);
	var what = $scope.buKey;
	function getPathList(){
		if ($localStorage[what]){
			return $localStorage[what].list;
		}
		else
		{
			$localStorage[what] = {list:[]};
			return $localStorage[what].list;
		}
	}
	
	$scope.listProcess = [];var list=[];
	list = getPathList();
	
	if (list && list.length>0) $scope.listProcess = list;
	else list = [];
	console.log($scope.listProcess);
	function getDeepRead(row, key){
		var objValue = row;
		var keysToBuild = key.split('.');
		for (var l in keysToBuild){
            objValue = objValue[keysToBuild[l]];
	     }
 		return objValue;
	}

	$scope.format = function(row, fieldInfo){
		var keyValue = getDeepRead(row, fieldInfo.key);
		if (fieldInfo.type == 'date'){
				keyValue = new Date(keyValue).toLocaleDateString('en-US');
			}
		return keyValue;

	}

})


iaApp.controller('homeController', function($scope, $route, $routeParams, $location, $http,$localStorage) {
	console.log("in Dashboard...........");
	
	$http.get('_resDashboard.json').success(onSuc).error(onE);
	function onSuc(data){
		if (data){
			$scope.dashboard = data;
		}
	}
	function onE(err){
		console.log(err);
	}

	
			
});

iaApp.controller('genPageController', function($scope, $routeParams, $localStorage, $location) {
     var thisPath = $scope.$location.path();
	var params = JSON.parse($routeParams.key)
	var what = params.key;
	$scope.pageFor = params.display;
	$scope.params = $routeParams;
	$scope.completed = true;
	 
	function getPathList(){
		if ($localStorage[what]){
			return $localStorage[what].list;
		}
		else
		{
			$localStorage[what] = {list:[]};
			return $localStorage[what].list;
		}
	}
	$scope.list = [];var list=[];
	list = getPathList();
	
	if (list && list.length>0) $scope.list = list;
	else list = [];
     
     
	$scope.inputElements = {};
	$scope.fields = ($scope.datacontent[what]);
	$scope.datacontent.globalFields.forEach(function(el, ind){
		if ($scope.fields.indexOf(el) == -1)
		$scope.fields.push(el);
		//console.log($scope.fields);
	})
	$scope.fields.forEach(function(el, ind){
		$scope.inputElements[el.key]='';	
	});
	
	$scope.textNumberDateOnly = function(field){
		var allowed = ['text','number','date'];
		return (allowed.indexOf(field.type) != -1);
	}
	$scope.radioOnly = function(field){
		var allowed = ['radio'];
		return (allowed.indexOf(field.type) != -1);
	}
	
	$scope.test = function(k){
		console.log($scope.inputElements[k]);
	}
	$scope.reload = function(){
		console.log($scope.completed);
		if ($scope.completed){
			$scope.list = getPathList().filter(function(row)			{
				return row.status != 'Completed';
			})
		}
		else $scope.list = getPathList();
		
	}
	$scope.save = function(update){
		var copy = JSON.stringify($scope.inputElements);
		var copiedObj = JSON.parse(copy);
		if (!copiedObj.id){
			copiedObj.id = (new Date()).getTime();
			getPathList().push(copiedObj);
			$scope.list = getPathList();
		
		}
		else {
			// update the localstorage
			getPathList().forEach(function(el, ind){
				if (el.id == copiedObj.id)
				{
					$scope.fields.forEach(function(fld){
						el[fld.key] =$scope.inputElements[fld.key]
					});
				}
			})
			$scope.list = getPathList();
		}
		console.log($scope.list);
		$scope.inputElements = {};
		$("#addNewData").modal("hide");
		$scope.$parent.showUpdatedSize();
		$scope.reload();
	}
	$scope.new = function(){
		$scope.inputElements = {};
		console.log('.. clciked new');
	}
	$scope.delete = function(id){
		console.log(id);
		var flag = confirm('Do you want to delete','Yes','No');
		if (flag){
		$localStorage[what].list = getPathList().filter(item => item.id != id);
		$scope.reload();
		$scope.$parent.showUpdatedSize();
		}
	}
	
	$scope.format = function(row, fieldInfo){
		var keyValue;
		if (fieldInfo.type == 'date'){
				keyValue = new Date(row[fieldInfo.key]).toLocaleDateString('en-US');
			}
		else
			keyValue = row[fieldInfo.key];
		return keyValue;

	}
	$scope.update = function(updRow){
		$("#addNewData").modal("show");
		$scope.fields.forEach(function(el, ind){
			var keyValue = updRow[el.key];
			if (el.type == 'date'){
				keyValue = new Date(updRow[el.key]);
			}
			$scope.inputElements[el.key]=keyValue;
	});
		$scope.inputElements.id = updRow.id;
	}
	$scope.view = function(savedRow){
		
		$("#viewData").modal("show");
		populateViewElements(savedRow);
	}
	{
	$scope.clone = function(row){
		var copy = JSON.stringify(row);
		var copiedObj = JSON.parse(copy);
		delete copiedObj.id;
		$scope.update(copiedObj);
	}
	}
	function populateViewElements(updRow){
		$scope.viewElements = {};
		$scope.fields.forEach(function(el, ind){
			var keyValue = updRow[el.key];
			if (el.type == 'date'){
				keyValue = new Date(updRow[el.key]).toLocaleDateString('en-US');
			}
			$scope.viewElements[el.key]=keyValue;
	});

	}
	var x = -1;
     var lastSortField = '';
     $scope.sort = function(field, t){
		if (field == lastSortField) x = -1/x;
            if (t == 'number') $scope.list.sort(function(a,b){return x*(a[field]-b[field])});
		 if (t == 'date') $scope.list.sort(function(a,b)
			{
				return x*(new Date(a[field]).getTime() - new Date(b[field]).getTime());
			})
		if (t == 'text' || t == 'radio') $scope.list.sort(function(a,b){
			return x*(a[field]>b[field]?1:-1);
		});
		lastSortField = field;
        }

	$scope.reload();

//
	$scope.notLast = true; 
	$scope.isFirst=true;
	var lastCarousalIdKey = getLastKey();
	var firstKey = getFirstKey();
	console.log(firstKey);
	function getFirstKey(){
		if ($scope.fields && $scope.fields[0]) return $scope.fields[0].key;
	}

	function getLastKey(){
		let k = $scope.fields[$scope.fields.length-1];
		return k.key;
	}
	function updateNotLast(e){
	setTimeout(function(){
		$scope.notLast = !($("#"+lastCarousalIdKey).hasClass('active'));
		console.log('fired...change '+$scope.notLast);

		$scope.isFirst =  ($("#"+firstKey).hasClass('active'));
		$scope.$apply();

		console.log('isFirst '+$scope.isFirst +' notLast '+$scope.notLast); 
		},200);
	}
	$scope.prev = function(){
		console.log('fired prev');
  		if (!$scope.isFirst) $("#myCarousel").carousel("prev");
	}
	$scope.next = function(){
		console.log('fired next');
		if ($scope.notLast) $("#myCarousel").carousel("next");
	}
	$scope.calculate = function(){
		console.log('I am good');
	}
	
	$("#myCarousel").on("slid.bs.carousel", updateNotLast);
 })


