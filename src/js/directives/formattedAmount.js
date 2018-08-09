'use strict';

/**
 * @desc amount directive that can be used to display formatted financial values
 * size-equal attribute is optional, defaults to false.
 * @example fee = {
 *  value: 12.49382901,
 *  currency: 'BCH'
 * }
 * @example <formatted-amount value="fee.value" currency="fee.currency"></formatted-amount>
 * @example <formatted-amount value="fee.value" currency="fee.currency" size-equal="true"></formatted-amount>
 */
angular.module('bitcoincom.directives')
  .directive('formattedAmount', function(uxLanguage) {
    return {
      restrict: 'E',
      scope: {
        value: '@',
        currency: '@',
        sizeEqual: '@'
      },
      templateUrl: 'views/includes/formatted-amount.html',
      controller: function($scope, $timeout) {
        $scope.canShow = false;

        $scope.displaySizeEqual = !!$scope.sizeEqual;

        $timeout(function onFormattedAmountTimeout() {

          var decimalPlaces = {
            '0': ['BIF', 'CLP', 'DJF', 'GNF', 'ILS', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'],
            '3': ['BHD', 'IQD', 'JOD', 'KWD', 'OMR', 'TND'],
            '8': ['BCH', 'BTC']
          };
          var localizeNumbers = function(x, minimumFractionDigits) {
            var parsed = parseFloat(x);
            var opts = {
              minimumFractionDigits: minimumFractionDigits,
              useGrouping: true
            };
            var lang = uxLanguage.getCurrentLanguage();
            var localized = parsed.toLocaleString(lang, opts);
            var corrected =  ensureEnoughFractionalDigits(localized, x, minimumFractionDigits);
            return corrected;
          };
  
          var buildAmount = function(start, middle, end) {
            $scope.start = start;
            $scope.middle = middle;
            $scope.end = end;
          };
  
          var getDecimalPlaces = function(currency) {
            if (decimalPlaces['0'].indexOf(currency.toUpperCase()) > -1) return '0';
            if (decimalPlaces['3'].indexOf(currency.toUpperCase()) > -1) return '3';
            if (decimalPlaces['8'].indexOf(currency.toUpperCase()) > -1) return '8';
            return '2';
          };

          var getDecimalSeparator = function() {
            var testNum = 1.5;
            var testString = testNum.toLocaleString(uxLanguage.getCurrentLanguage());
            // Some environments let you set decimal separators that are more than one character
            var separator = /^1(.+)5$/.exec(testString)[1]
            return separator;
          };
  
          var formatNumbers = function() {
            // During watch, may be changed from having a separate currency value,
            // to both being in value. Don't want to use previous currency value.
            // Try to extract currency from value..
            var currencySplit = $scope.value.split(" ");
            if (currencySplit.length === 2) {
              $scope.currency = currencySplit[1];
            }
            $scope.currency = $scope.currency || '';
            

            var parsed = parseFloat($scope.value);
            var valueFormatted = '';
            var valueProcessing = '';
            switch (getDecimalPlaces($scope.currency)) {
              case '0':
                  if (isNaN(parsed)) {
                  buildAmount('-', '', '');
                } else {
                  valueFormatted = localizeNumbers(Math.round(parsed), 0);
                  buildAmount(valueFormatted, '', '');
                }
                break;
    
              case '3':
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '---', '', '');
                } else {
                  valueProcessing = parsed.toFixed(3);
                  valueFormatted = localizeNumbers(valueProcessing, 3);
                  buildAmount(valueFormatted, '', '');
                }
                break;
    
              case '8':
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '---', '', '');
                } else if (parsed === 0) {
                  buildAmount('0', '', '');
                } else {
                  valueFormatted = parsed.toFixed(8);
                  valueFormatted = localizeNumbers(valueFormatted, 8);
                  var start = valueFormatted.slice(0, -5);
                  var middle = valueFormatted.slice(-5, -2);
                  var end = valueFormatted.substr(valueFormatted.length - 2);
                  buildAmount(start, middle, end);
                
                }
                break;
    
              default: // 2
                if (isNaN(parsed)) {
                  buildAmount('-' + getDecimalSeparator() + '--', '', '');
                } else {
                  valueProcessing = parseFloat(parsed.toFixed(2));
                  valueFormatted = localizeNumbers(valueProcessing, 2);
                  buildAmount(valueFormatted, '', '');
                }
                break;
            }
            $scope.canShow = true;
          };
          
          formatNumbers();
          $scope.$watchGroup(['currency', 'value'], function onFormattedAmountWatch() {
            formatNumbers();
          });

          /**
           * On Android 4.4, toLocaleString() only returns 3 fractional digits when 8 is specified.
           */
          function ensureEnoughFractionalDigits(localizedString, number, desiredFractionDigits) {
            if (desiredFractionDigits === 0) {
              // Assume it is OK
              return localizedString;
            }
            var fractionalRe = /^(\d*\D)(\d+)$/;
            var match = fractionalRe.exec(localizedString);
            if (match.length !== 3) {
              // Don't know what's happening, just return what we have
              return localizedString;
            }

            var decimals = match[2];
            var decimalCount = decimals.length;
            if (decimalCount >= desiredFractionDigits) {
              // Everything is OK.
              return localizedString;
            }

            if (typeof number !== 'number') {
              number = parseFloat(number);
            }
            
            var fixed = number.toFixed(desiredFractionDigits);
            var fixedMatch = fractionalRe.exec(fixed);
            if (fixedMatch.length !== 3) {
              // Don't know what's happening, just return what we have
              return localizedString;
            }

            // Keeps locale decimal separator.
            var enough = match[1] + fixedMatch[2];
            return enough;
          }
        });
      }
    };
  }
);