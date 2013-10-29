function HarCtrl($scope, $http) {
    var props = ['entriesLength', 'entriesSize', 'entriesReqHeadersSize', 'entriesResHeadersSize'];

    $scope.files = [];
    $scope.ranges = {};
    $scope.compare = {
        'entriesLength': 100,
        'entriesSize': 100,
        'entriesReqHeadersSize': 100,
        'entriesResHeadersSize': 100
    };


    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.recalcRanges = function() {
       console.log('recalcRanges');
       delete $scope.ranges;
       var n = Date.now();
       $scope.ranges = {'max': {}, 'min': {}};
       angular.forEach($scope.selected(), function(file) {
           console.log(file);
           for (var i = props.length - 1; i >= 0; i--) {
               var val = file.data.log[props[i]]
                   min = $scope.ranges.min[props[i]] || val, // current min value, or the current value if not set
                   max = $scope.ranges.max[props[i]] || val; // current max value, or the current value if not set
               $scope.ranges.min[props[i]] = Math.min(min, val);
               $scope.ranges.max[props[i]] = Math.max(max, val);
           }
       });
       console.log($scope.ranges);
    };
    $scope.$watch('files', $scope.recalcRanges, true);

    $scope.addFile = function(f, e) {
        $scope.safeApply(function(){
            e.log.entriesLength = e.log.entries.length;
            e.log.entriesSize = 0;
            e.log.entriesReqHeadersSize = 0;
            e.log.entriesResHeadersSize = 0;
            e.log.respCodes = [];
            for (var i = e.log.entries.length - 1; i >= 0; i--) {
                e.log.entriesSize += e.log.entries[i].response.bodySize;
                e.log.entriesReqHeadersSize += e.log.entries[i].request.headersSize;
                e.log.entriesResHeadersSize += e.log.entries[i].response.headersSize;
                e.log.respCodes[e.log.entries[i].response.status] += 1;
            }
            // console.log(f, e);
            console.log('addFile');
            $scope.files.push({file: f, data: e, check: true, unit: false});
        });
    };

    $scope.unit = function(f) {
        angular.forEach($scope.selected(), function(file) {
            file.unit = false;
        });
        f.unit = !f.unit;
        $scope.compare = {
            'entriesLength': f.data.log.entriesLength,
            'entriesSize': f.data.log.entriesSize,
            'entriesReqHeadersSize': f.data.log.entriesReqHeadersSize,
            'entriesResHeadersSize': f.data.log.entriesResHeadersSize
        };
    };

    $scope.removeSelected = function() {
        var oldFiles = $scope.files;
        $scope.files = [];
        angular.forEach(oldFiles, function(file) {
            if (!file.check) {
                console.log('removeSelected');
                $scope.files.push(file);
            }
        });
    };

    $scope.selected = function() {
        var sel = [];
        angular.forEach($scope.files, function(file) {
            if (file.check) {
                sel.push(file);
            }
        });
        return sel;
    };

    $scope.selectAll = function() {
        var st = ($scope.selected().length < $scope.files.length) ? true : false;
        angular.forEach($scope.files, function(file) {
            file.check = st;
        });
    };

    $scope.demo = function() {
        $http.get('giko.it-before-gzip.har').then(function(response) {
            $scope.addFile('giko.it-before-gzip.har', response.data);
        });
        $http.get('giko.it-after-gzip.har').then(function(response) {
            $scope.addFile('giko.it-after-gzip.har', response.data);
        });
    };
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function fileHandler(e) {
    dragover(e);
    var files = e.target.files || e.dataTransfer.files;

    for (var i = 0, f; f = files[i]; i++) {
        var r = new FileReader();
        r.onload = (function(f) {
            return function(ev){
                angular.element(document.getElementById("main-controller")).scope().addFile(f.name, JSON.parse(ev.target.result));
            };
        })(f);
        r.readAsText(f);
    }
}

if (window.File && window.FileList && window.FileReader && new XMLHttpRequest().upload) {
    var inputfile = document.getElementById("inputfile"),
        dragzone = document.getElementById("dragzone");

    dragzone.addEventListener("dragover", dragover, false);
    dragzone.addEventListener("dragleave", dragover, false);
    dragzone.addEventListener("drop", fileHandler, false);
    inputfile.addEventListener("change", fileHandler, false);
}
