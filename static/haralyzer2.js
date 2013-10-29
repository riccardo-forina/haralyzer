(function(angular) {
  'use strict';

  var safeApply = function(scope, fn) {
    var phase = scope.$root.$$phase;
    if(phase === '$apply' || phase === '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      scope.$apply(fn);
    }
  };


  angular.module('HarApp', [])
    .controller('HarCtrl', [
      '$scope', '$http', '$log', '$filter', '$window',
      function($scope, $http, $log, $filter, $window) {
        $scope.files = [];
        $scope.selectedFiles = {};
        $scope.ranges = {
          min: {},
          max: {}
        };

        $scope.addFile = function(file, entry) {
          safeApply($scope, function(){
            entry.entriesLength = entry.entries.length;
            entry.entriesSize = 0;
            entry.entriesReqHeadersSize = 0;
            entry.entriesResHeadersSize = 0;
            entry.respCodes = [];
            for (var i = entry.entries.length - 1; i >= 0; i--) {
              entry.entriesSize += entry.entries[i].response.bodySize;
              entry.entriesReqHeadersSize += entry.entries[i].request.headersSize;
              entry.entriesResHeadersSize += entry.entries[i].response.headersSize;
              entry.respCodes[entry.entries[i].response.status] += 1;
            }
            $log.log('addFile', entry);
            $scope.files.push({
              name: file,
              data: entry
            });
            $scope.selectedFiles[file] = true;
          });
        };

        $scope.isSelected = function(file) {
          return $scope.selectedFiles[file.name] === true;
        };

        $scope.selectAll = function() {
          var selectedFiles = {};
          angular.forEach($scope.files, function(file) {
            selectedFiles[file.name] = false;
          });
          $scope.selectedFiles = selectedFiles;
        };

        $scope.removeSelected = function() {
          $scope.files = $filter('filter')($scope.files, function(file) {
            return !$scope.isSelected(file);
          });
        };

        $scope.demo = function() {
          $http.get('giko.it-before-gzip.har').then(function(response) {
            $scope.addFile('giko.it-before-gzip.har', response.data.log);
          });
          $http.get('giko.it-after-gzip.har').then(function(response) {
            $scope.addFile('giko.it-after-gzip.har', response.data.log);
          });
        };

        $scope.$watch('selectedFiles', function() {
          $log.log('recalcRanges');
          $scope.ranges = {'max': {}, 'min': {}};
          angular.forEach($filter('filter')($scope.files, $scope.isSelected), function(file) {
            angular.forEach(file.data, function(val, property) {
              var min = $scope.ranges.min[property] || val, // current min value, or the current value if not set
                  max = $scope.ranges.max[property] || val; // current max value, or the current value if not set
              $scope.ranges.min[property] = Math.min(min, val);
              $scope.ranges.max[property] = Math.max(max, val);
            });
          });
          $log.log($scope.ranges);
        }, true);

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
                $scope.addFile(f.name, JSON.parse(ev.target.result).log);
              };
            })(f);
            r.readAsText(f);
          }

        }

        if (window.File && window.FileList && window.FileReader && new XMLHttpRequest().upload) {
          var inputfile = document.getElementById('inputfile'),
          dragzone = document.getElementById('dragzone');

          dragzone.addEventListener('dragover', dragover, false);
          dragzone.addEventListener('dragleave', dragover, false);
          dragzone.addEventListener('drop', fileHandler, false);
          inputfile.addEventListener('change', fileHandler, false);
        }


      }
    ])

    .directive('showEntry', [
      function() {
        return {
          restrict: 'A',
          replace: true,
          scope: {
            showEntry: '=',
            value: '=',
            min: '=',
            max: '=',
          },
          templateUrl: 'partials/show-entry.html',
          controller: function($scope) {
            $scope.showDelta = false;
          }
        };
      }
    ])

  ;

})(angular);
