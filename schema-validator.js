// util
var _ = {
  curry: function curry (fn){
    var arity = fn.length;
    var args  = Array.prototype.slice.call(arguments, 1);

    var acc = function (){
      var left = args;

      if (arguments.length > 0){
        // when we're called recursively
        left = left.concat(Array.prototype.slice.call(arguments, 0));
      }

      if (left.length >= arity){
        return fn.apply(this, left);
      }

      else {
        return curry.apply(this, [fn].concat(left));
      }
    }

    if (args.length >= arity){
      return acc();
    }

    else {
      return acc;
    }
  },
  map: function (fn, list){
    var res = [];

    for (var i = 0; i < list.length; i++){
      res.push(fn(list[i]));
    }

    return res;
  },
  all: function (list){
    var res = true;

    for (var i = 0; i < list.length; i++){
      if (list[i] !== true){
        res = false;
      }
    }

    return res;
  },
  ap: function (fnlist, list){
    var res = [];

    if (Array.isArray(fnlist)){
      for (var i = 0; i < fnlist.length; i++){
        for (var j = 0; j < list.length; j++){
          res.push(fnlist[i](list[j]));
        } 
      }      
    }

    else {
      for (var i = 0; i < list.length; i++){
        res.push(fnlist(list[i]));
      }
    }

    return res;
  }
};

/*
  
  Some wrappers for typing and comparison purposes with a generic function for 
  checking weather or not a wrapper is empty.

    Maybe : This type means whatever contained within it is optionally validated.
    Schema : This is a schema to be evaluated.
    Rule : This is a set of pattern matching functions and conditionals that must be tested against a value.
    EvaluatedRule : This is an evaluated Rule.
    Missing : This is set when an expected schema or value is missing. 
*/

function Generic(Type){
  var Type = function (val){
    this.__value = val;
  };

  Type.of = function (val){
    return new Type(val);
  };

  Type.prototype = {
    map: function (fn){
      return IsNothing(this) ? Type.of(null): Type.of(fn(this.__value));
    },

    chain: function (fn){
      return this.map(fn).join();
    },

    join: function (){
      return this.__value;
    }
  };

  return Type;
}

var Schema          = Generic();
var EvaluatedSchema = Generic();
var Rule            = Generic();
var Missing         = Generic();
var EvaluatedRule   = Generic();
var Unexpected      = Generic();

/*
  Type checkers.
*/

var IsSchema = function (obj){
  return obj instanceof Schema;
};

var IsRule = function (obj){
  return obj instanceof Rule;
};

var IsMaybe = function (obj){
  return obj instanceof Maybe;
};

var IsArray = function (obj){
  return Array.isArray(obj);
};

var IsString = function (string){
  return (typeof string === 'string');
};

var IsNumber = function (number){
  return (typeof number === 'number');
};

var IsFunction = function (fn){
  return typeof fn === 'function';
}

var IsObject = function (obj){
  // not strict yet
  return (typeof obj === 'object');
}

var IsNothing = function (PseudoType){
  return (PseudoType.__value === null || PseudoType.__value === undefined);
};

/*
  Pattern matchers and conditional validators.
*/



var IsPattern = _.curry(function (pattern, string){
  var Regex   = new RegExp(pattern);
  var matches = Regex.test(string);

  // simple matches only
  if (matches){
    return true;
  }

  else {
    return false;
  }
});

var IsMaxLength = _.curry(function (max, string){
  if (IsString(string)){
    if (string.length <= max){
      return true;
    }

    else {
      return false;
    }
  }

  else {
    return false;
  }
});

var IsMinLength = _.curry(function (min, string){
  if (IsString(string)){
    if (string.length >= min){
      return true;
    }

    else {
      return false;
    }
  }

  else {
    return false;
  }
});

var IsBetweenLength = _.curry(function (min, max, string){
  return _.all(IsMinLength(min)(string), IsMaxLength(max)(string));
});

var IsMaxInt = _.curry(function (max, number){
  if (IsNumber(number)){
    if (number <= max){
      return true;
    }

    else {
      return false;
    }
  }

  else {
    return false;
  }
});

var IsMinInt = _.curry(function (min, number){
  if (IsNumber(number)){
    if (number >= min){
      return true;
    }

    else {
      return false;
    }
  }

  else {
    return false;
  }
});

var IsUsername     = IsPattern(/^[a-zA-Z0-9\.\-_]+$/);
var IsEmail        = IsPattern(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/);
var IsAlphaNumeric = IsPattern(/^[a-zA-Z0-9]+$/);

/*
  Takes a set of patterns and conditions and returns the results in a list.
*/

var TestPatterns = _.curry(function (val, Patterns){
  return _.ap(Patterns, [val]);
});

var EvaluateRule = _.curry(function (rule, val){
  return EvaluatedRule.of(rule.chain(TestPatterns(val)));
});

/*
  Rules and test rules.
*/

var Username      = Rule.of([IsMinLength(1), IsMaxLength(64), IsUsername]);
var Password      = Rule.of([IsMinLength(1), IsMaxLength(128)]);
var Email         = Rule.of([IsBetweenLength(1, 256), IsEmail]);
var AlphaNumeric  = Rule.of([IsAlphaNumeric]);

/*
  EvaluateSchema traverses through the schema's object and returns the results
  of each of the rule sets against the reference obj's values.
*/

var EvaluateSchema = _.curry(function (cursor, obj){

  if (obj === undefined || obj === null || obj === '' || (IsArray(obj) && obj === [])){
    return Missing.of(true);
  }

  else {
    if (IsSchema(cursor)){
      var EachInSchema = function (schema){
        var new_schema = {};

        for (var prop in schema){
          var item  = schema[prop];
          var index = prop;

          new_schema[prop] = EvaluateSchema(item, obj[prop]);          
        }

        return new_schema;
      };

      if (IsArray(obj) || IsString(obj) || IsNumber(obj) || IsFunction(obj)){
        return Unexpected.of(obj);
      }

      else {
        return EvaluatedSchema.of(cursor.chain(EachInSchema));
      }
    } 

    else if (IsRule(cursor)){
      if (IsArray(obj)){
        return _.map(EvaluateRule(cursor), obj);
      }

      else if (IsString(obj) || IsNumber(obj)) {
        return EvaluateRule(cursor, obj);
      }

      else {
        return Unexpected.of(obj);
      }
    }

    else if (IsArray(cursor)){
      if (!IsArray(obj)){
        return Unexpected.of(obj);
      }

      else {
        return _.map(EvaluateSchema(cursor[0]), obj);
      }
    }

    else {
      // add error label
      console.log('Could not parse schema.');
    }
  }
});

module.exports = {
  Schema: Schema,
  Rule: Rule,
  Missing: Missing,
  EvaluatedRule: EvaluatedRule,
  Username: Username,
  Password: Password,
  Email: Email,
  AlphaNumeric: AlphaNumeric,
  EvaluateSchema: EvaluateSchema,
  EvaluatedSchema: EvaluatedSchema,
  Unexpected: Unexpected,
  Generic: Generic,
  _: _
};
