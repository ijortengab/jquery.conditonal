(function( $ ) {


    /**
     * param string
     * param reference array
     * @return boolean
     *
     * Example: logicalWithSquare('(1 or 2) and 4', {1:true, 2: false, 4: false})
     */
    var logicalWithSquare = function (string, reference) {
        var scope = string;
        var matches = scope.match(/\([^\(\)]+\)/);
        while(matches) {
            var clean = matches[0].replace(/[\(\)]/g, "");
            var result = logicalWithoutSquare(clean, reference)
            switch (result) {
                case true:
                    result = 'true';
                    break;
                case false:
                    result = 'false';
                    break;
            }
            scope = scope.substring(0,matches.index) + result + scope.substring(matches.index + matches[0].length);
            matches = scope.match(/\([^\(\)]+\)/);
        }
        reference.true = true;
        reference.false = false;
        return logicalWithoutSquare(scope, reference)
    }

    /**
     *
     */
    var logicalWithoutSquare = function (string, reference) {
        var conditions = [];
        var or = [];
        if (string.indexOf(' or ') !== -1) {
            conditions = string.split(' or ');
        }
        else {
            conditions.push(string)
        }
        for (x in conditions) {
            if (conditions[x].indexOf(' and ') !== -1) {
                var _conditions = conditions[x].split(' and ');
                var and = [];
                for (y in _conditions) {
                    var key = _conditions[y].trim();
                    if (typeof reference[key] == 'undefined') {
                        var value = false;
                    }
                    else {
                        var value = reference[key];
                    }
                    and.push(value)
                }
                or.push(and.indexOf(false) !== -1 ? false : true)
            }
            else {
                var key = conditions[x].trim();
                if (typeof reference[key] == 'undefined') {
                    var value = false;
                }
                else {
                    var value = reference[key];
                }
                or.push(value)
            }
        }
        return (or.indexOf(true) !== -1 ? true : false)
    }

    /**
     * Watcher object.
     */
    var watcher = function (condition, dependee, dependent, action, order) {
        var that = this;
        this.condition = condition;
        this.dependee = dependee;
        this.dependent = dependent;
        this.action = action;
        this.order = order;
        // console.debug('Watcher dibuat.');
        // console.log(condition);
        switch (condition) {
            case 'checked':
            case 'unchecked':
                this.detectChanges();
                break;
            case 'visible':
            case 'hidden':
                this.detectVisibility();
                // Do something.
                break;
            case 'has_value':
                this.detectMatchValue();
                // Do something.
                break;
            default:
                // Do something.
                break;
        }
       // console.debug('Watcher selesai dibuat.');
    }

    watcher.prototype.detectVisibility = function () {
        var that = this;
        var currentValue = $(this.dependent).is(':visible');
        setInterval(function () {
            if ($(that.dependent).is(':visible') != currentValue) {
                currentValue = $(that.dependent).is(':visible');
                that.trigger(currentValue);
            }
        }, 10);
        // todo, jadikan ini dapat diset di options.
    }

    watcher.prototype.detectMatchValue = function () {
        var that = this;
        $(this.dependent).change(function () {
           var currentValue = $(this).val();
           // console.log(currentValue);
           var conditionAsDependee = $(that.dependee).prop('conditionAsDependee');
           var optionValue = conditionAsDependee[that.action][that.order].optionValue;
           that.trigger(($.inArray(currentValue, optionValue) !== -1));
       }).change();
    }

    watcher.prototype.detectChanges = function () {
        var that = this;
        $(this.dependent).change(function () {
           var currentState = $(this).is(':checked');
           var conditionAsDependee = $(that.dependee).prop('conditionAsDependee');
           var value = conditionAsDependee[that.action][that.order].condition;
            switch (value) {
                // todo, mungkin ini gak perlu lagi pake 1 atau true
                case '1':
                case 1:
                case 'true':
                case 'checked':
                    value = true;
                    break;
                case '0':
                case 0:
                case 'false':
                case 'unchecked':
                    value = false;
                    break;
            }
            // console.log('value: ' + value);
            // console.log('this.checked: ' + this.checked);
            // Checked maupun Unchecked, apapun value-nya pasti men-trigger
            // karena terdapat perubahan.
            that.trigger((value == this.checked));
       }).change();
    }

    watcher.prototype.trigger = function (result) {
        // if (this.dependent.name == 'is_berita' || this.dependee.name == 'is_berita') {
            // console.log('Trigger ' + this.dependent.name + ', ' + this.condition + ' = ' + result);
        // }

        // Ganti nilai

       var conditionAsDependee = $(this.dependee).prop('conditionAsDependee');
       conditionAsDependee[this.action][this.order].currentState = result;
       $(this.dependee).prop('conditionAsDependee', conditionAsDependee);
        var referenceObject = {}
        var referenceArray = []
        for (order in conditionAsDependee[this.action]) {
            if ($.isNumeric(order)) {
                referenceObject[order] = conditionAsDependee[this.action][order].currentState;
                referenceArray.push(conditionAsDependee[this.action][order].currentState);
            }
        }


        switch (conditionAsDependee[this.action].logic) {
            case 'and':
                var logicResult = ($.inArray(false, referenceArray) === -1);
                break;
            case 'or':
                // console.log(referenceArray);
                var logicResult = ($.inArray(true, referenceArray) !== -1);
                // console.log(logicResult);
                break;
            default:
                var logicResult = logicalWithSquare(conditionAsDependee[this.action].logic, referenceObject);
                break;
        }
        //
        // if (this.dependent.name == 'is_berita' || this.dependee.name == 'is_berita') {
            // console.log('Impact ' + this.dependee.name + ', ' + this.action + ' = ' + logicResult);
            // console.log(conditionAsDependee);
        // }
        switch (this.action) {
            case 'check':
                if (logicResult) {
                    this.dependee.checked = true;
                }
                else if (conditionAsDependee[this.action].autoOpposite) {
                    this.dependee.checked = false;
                }
                this.updateConditionElementAsDependent();
                break;
            case 'uncheck':
                if (logicResult) {
                    this.dependee.checked = false;
                }
                else if (conditionAsDependee[this.action].autoOpposite) {
                    this.dependee.checked = true;
                }
                break;
            case 'enable':
                if (logicResult) {
                    this.dependee.disabled = false;
                }
                else if (conditionAsDependee[this.action].autoOpposite) {
                    this.dependee.disabled = true;
                }
                break;
            case 'disable':
                if (logicResult) {
                    this.dependee.disabled = true;
                }
                else if (conditionAsDependee[this.action].autoOpposite) {
                    this.dependee.disabled = false;
                }
                break;
            case 'show':
                var $target;
                // console.log(conditionAsDependee[this.action].target);
                if (typeof conditionAsDependee[this.action].target == 'undefined') {
                    $target = $(this.dependee)
                }
                else if (conditionAsDependee[this.action].target == 'parent') {
                    $target = $(this.dependee).parent()
                }
                else if (conditionAsDependee[this.action].target == 'parents') {
                    if (typeof conditionAsDependee[this.action].parents == 'undefined') {
                        $target = $(this.dependee).parent()
                    }
                    else{
                        // console.log(conditionAsDependee);
                        $target = $(this.dependee).parents(conditionAsDependee[this.action].parents)
                        // console.log($target);
                    }
                }
                if (logicResult) {
                    $target.show();
                }
                else if (conditionAsDependee[this.action].autoOpposite) {
                    $target.hide();
                }
                break;
        }
    }

    // todo lakukan juga dengan condiional yang lain.
    watcher.prototype.updateConditionElementAsDependent = function () {
        var conditionAsDependent = $(this.dependee).prop('conditionAsDependent');
        // console.log('updateConditionElementAsDependent');
        if (typeof conditionAsDependent !== 'undefined') {
            switch (this.action) {
                case 'check':
                case 'uncheck':
                    if (typeof conditionAsDependent.checked != 'undefined') {
                        for (x in conditionAsDependent.checked) {
                            var elementDependee = conditionAsDependent.checked[x]
                            for (_action in elementDependee.conditionAsDependee){
                                for (_order in elementDependee.conditionAsDependee[_action]) {
                                    if ($.isNumeric(_order)) {
                                        if (elementDependee.conditionAsDependee[_action][_order].condition == 'checked') {
                                            // console.log('Before: ');
                                            var before = elementDependee.conditionAsDependee[_action][_order].currentState;
                                            // console.log(elementDependee.conditionAsDependee[_action][_order].currentState);
                                            elementDependee.conditionAsDependee[_action][_order].currentState = this.dependee.checked;
                                            // jika berbeda, maka.
                                            if (before !== this.dependee.checked) {
                                                // console.log(this.dependent);
                                                // console.log(this.dependee);
                                                $(this.dependee).change();
                                            }
                                            // console.log('After: ');
                                            // console.log(elementDependee.conditionAsDependee[_action][_order].currentState);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;

                case '':
                    // Do something.
                    break;

                default:
                    // Do something.
                    break;
            }
        }
    }


    /**
     * filter element by
     */
    var readAttributes = function (elementDependee) {
        if (typeof elementDependee.attributes == 'undefined') {
            return;
        }
        // Read and validate attributes then populate condition information.
        var conditionAsDependee = {isThere: false};
        for(var i = elementDependee.attributes.length - 1; i >= 0; i--) {
            var matches = elementDependee.attributes[i].name.match(/^data-([^-]+)-depends-on-element(-\d+)?-(.*)/)
            if (matches != null) {
                conditionAsDependee.isThere = true;
                if (typeof conditionAsDependee[matches[1]] == 'undefined') {
                    conditionAsDependee[matches[1]] = {}
                }
                // Validated order.
                var action = matches[1];
                var order;
                if (typeof matches[2] == 'undefined') {
                    order = 0;
                }
                else {
                    order = matches[2].substring(1);
                }
                if (typeof conditionAsDependee[action][order] == 'undefined') {
                    conditionAsDependee[action][order] = {}
                }
                // Populate other information: elementSelector, elementName,
                // condition, optionValue.
                var otherInfo = matches[3];
                var value = elementDependee.attributes[i].value;
                switch (otherInfo) {
                    case 'selector':
                        conditionAsDependee[action][order].elementSelector = value;
                        break;
                    case 'name':
                        conditionAsDependee[action][order].elementName = value;
                        break;
                    case 'condition':
                        conditionAsDependee[action][order].condition = value;
                        break;
                    default:
                        var matches2 = otherInfo.match(/^option-value(-\d+)?$/);
                        if (matches2 != null) {
                            if (typeof conditionAsDependee[action][order].optionValue == 'undefined') {
                                conditionAsDependee[action][order].optionValue = []
                            }
                            var order2;
                            if (typeof matches2[1] == 'undefined') {
                                order2 = 0;
                            }
                            else {
                                order2 = matches2[1].substring(1);
                            }
                            if ($.isNumeric(order2)) {
                                conditionAsDependee[action][order].optionValue.push(elementDependee.attributes[i].value);
                            }
                        }
                        break;
                }
            }
        }
        // console.log(conditionAsDependee);
        if (conditionAsDependee.isThere === false) {
            return;
        }
        // console.log(conditionAsDependee);
        delete conditionAsDependee.isThere;
        // Looping to get other information: autoOpposite, logic, target,
        // parents.
        for(var i = elementDependee.attributes.length - 1; i >= 0; i--) {
            var matches3 = elementDependee.attributes[i].name.match(/^data-([^-]+)-auto-opposite$/)
            if (matches3 != null) {
                var value = elementDependee.attributes[i].value;
                switch (value) {
                    case 'true':
                        value = true
                        break;
                    case 'false':
                        value = false
                        break;
                }
                conditionAsDependee[matches3[1]].autoOpposite = value;
            }
            var matches5 = elementDependee.attributes[i].name.match(/^data-([^-]+)-(logic|target|parents)$/)
            if (matches5 != null) {
                conditionAsDependee[matches5[1]][matches5[2]] = elementDependee.attributes[i].value;
            }
        }
        return conditionAsDependee;

       // Set sebagai properties.
       console.log(conditionAsDependee);


    }

    var validateAction = function (check) {
        return true;
    }
    var validateOrderOrInfoAction = function (check) {
        return true;
    }
    var validateCondition = function (check) {
        return true;
    }
    var getCurrentState = function (condition, element, optionValue) {
        switch (condition) {
            case 'checked':
                return $(element).is(':checked');
            case 'unchecked':
                return ($(element).is(':checked') == false);
            case 'visible':
                return $(element).is(':visible');
            case 'hidden':
                return ($(element).is(':visible') == false);
            case 'has_value':
                var currentValue = $(element).val();
                return ($.inArray(currentValue, optionValue) !== -1)
        }
    }

    var setConditionAsDependent = function (condition, elementDependee, elementDependent) {
        var conditionAsDependent = $(elementDependent).prop('conditionAsDependent');
        if (typeof conditionAsDependent == 'undefined') {
            conditionAsDependent = {}
        }
        if (typeof conditionAsDependent[condition] == 'undefined') {
            conditionAsDependent[condition] = []
        }
        conditionAsDependent[condition].push(elementDependee);
        $(elementDependent).prop('conditionAsDependent', conditionAsDependent);
    }


    var createWatchers = function (elementDependee, conditionAsDependee) {
        // Validasi.
        for (a in conditionAsDependee) {
            if (validateAction(a)) {
                for (o in conditionAsDependee[a]) {
                    if (validateOrderOrInfoAction(o)) {
                        if (validateCondition(conditionAsDependee[a][o].condition)) {
                            // Set default value;
                            if (typeof conditionAsDependee[a].autoOpposite == 'undefined') {
                                conditionAsDependee[a].autoOpposite = true;
                            }
                            if (typeof conditionAsDependee[a].logic == 'undefined') {
                                conditionAsDependee[a].logic = 'and';
                            }
                            var $element;
                            for (i in conditionAsDependee[a][o]) {
                                switch (i) {
                                    case 'elementName':
                                        $element = $('[name='+conditionAsDependee[a][o].elementName+']')
                                        break;
                                    case 'elementSelector':
                                        $element = $(conditionAsDependee[a][o].elementSelector);
                                        break;
                                }
                            }
                            if ($element.length) {
                                conditionAsDependee[a][o].elementDependent = $element[0];
                                conditionAsDependee[a][o].currentState = getCurrentState(conditionAsDependee[a][o].condition, conditionAsDependee[a][o].elementDependent, conditionAsDependee[a][o].optionValue);
                                setConditionAsDependent(conditionAsDependee[a][o].condition, elementDependee, conditionAsDependee[a][o].elementDependent);
                            }
                        }
                    }
                }
            }
        }
        // Set sebagai properties.
        // console.log(conditionAsDependee);
        $(elementDependee).prop('conditionAsDependee',conditionAsDependee);
        // Create Watcher.
        for (a in conditionAsDependee) {
            for (o in conditionAsDependee[a]) {
                if ($.isNumeric(o)) {
                    new watcher(conditionAsDependee[a][o].condition, elementDependee, conditionAsDependee[a][o].elementDependent, a, o)
                }
            }
        }
    }

    $.fn.conditional = function(conditionAsDependee) {
        if (typeof conditionAsDependee == 'undefined') {
            $(this).each(function () {
                var conditionAsDependee = readAttributes(this);
                if (typeof conditionAsDependee != 'undefined') {
                    createWatchers(this, conditionAsDependee);
                }
            });
            $(this).find('*').each(function () {
                var conditionAsDependee = readAttributes(this);
                if (typeof conditionAsDependee != 'undefined') {
                    createWatchers(this, conditionAsDependee);
                }
            });
        }
        else {
            $(this).each(function () {
                createWatchers(this, conditionAsDependee);
            })
        }
    };

}( jQuery ));

