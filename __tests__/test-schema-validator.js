jest.autoMockOff();

describe('schema-validator', function (){
  var validation   = require('../schema-validator');
  var _            = validation._;
  var Schema       = validation.Schema;

  var Username     = validation.Username;
  var Password     = validation.Password;
  var Email        = validation.Email;
  var AlphaNumeric = validation.AlphaNumeric;

  var Missing    = validation.Missing;
  var Unexpected = validation.Unexpected;

  var Rule          = validation.Rule;
  var EvaluatedRule = validation.EvaluatedRule;

  var EvaluateSchema  = validation.EvaluateSchema;
  var EvaluatedSchema = validation.EvaluatedSchema;

  it('takes a simple schema and returns the evaluated schema', function (){



    /*
      Test Schema.
    */

    var TestSchemaSimple = Schema.of({
      username : Username,
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      username : 'generic_test_user',
      password : 'abcdefghijklmnop',
      email    : 'josh@joshsouthern.ca'
    };


    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      username : EvaluatedRule.of([true, true, true]),
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchemaSimple, TestObj)).toEqual(ExpectedResult);
  });

  it('takes a nested schema and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchemaNested = Schema.of({
      user : Schema.of({
        name: Username
      }),
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObjNested = {
      user: {
        name: 'generic_test_user'
      },
      password : 'abcdefghijklmnop',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResultNested = EvaluatedSchema.of({
      user : EvaluatedSchema.of({
        name: EvaluatedRule.of([true, true, true])
      }),
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchemaNested, TestObjNested)).toEqual(ExpectedResultNested);
  });

  it('takes an array schema and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Username],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      users: ['hello', 'numbertwo', 'another'],
      password : 'abcdefghijklmnop',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : [
        EvaluatedRule.of([true, true, true]), 
        EvaluatedRule.of([true, true, true]), 
        EvaluatedRule.of([true, true, true])
      ], 
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });

  it('takes an array schema with a missing element and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Username],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      password : 'abcdefghijklmnop',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : Missing.of(true), 
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });

  it('takes an array nested schema with and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Schema.of({
        name: Username
      })],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      users: [{ name: 'sdsds' },{ name: 'two' }, { name: 'three' }],
      password : 'abcdefghijklmnop',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : [
        EvaluatedSchema.of({ name: EvaluatedRule.of([true, true, true]) }), 
        EvaluatedSchema.of({ name: EvaluatedRule.of([true, true, true]) }), 
        EvaluatedSchema.of({ name: EvaluatedRule.of([true, true, true]) })
      ], 
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });

  it('takes an array nested schema with unexpected types and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Schema.of({
        name: Username
      })],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      users: [[],[], []],
      password : { foo: null },
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : [
        Unexpected.of([]), 
        Unexpected.of([]), 
        Unexpected.of([])
      ], 
      password : Unexpected.of({ foo: null }),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });

  it('takes a deeply nested schema with and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Schema.of({
        name: [Schema.of({
          type: AlphaNumeric,
          data: AlphaNumeric
        })]
      })],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var TestObj = {
      users: [{
        name: [{
          type: 'pooo',
          data: 'morepooo'
        },
        {
          type: 'pooo44$$$$',
          data: 'morepooo'
        },
        {
          type: 'pooo$$$$',
          data: 'morepooo$$$$'
        }
        ]
      }],
      password : 'testpassword',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : [
        EvaluatedSchema.of({
          name: [
            EvaluatedSchema.of({
              type: EvaluatedRule.of([true]),
              data: EvaluatedRule.of([true])
            }),
            EvaluatedSchema.of({
              type: EvaluatedRule.of([false]),
              data: EvaluatedRule.of([true])
            }),
            EvaluatedSchema.of({
              type: EvaluatedRule.of([false]),
              data: EvaluatedRule.of([false])
            }),
          ]
        }),
      ], 
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });

  it('takes a deeply nested schema with missing fields and unexpected fields and returns the evaluated schema', function (){

    /*
      Test Schema.
    */

    var TestSchema = Schema.of({
      users : [Schema.of({
        name: [Schema.of({
          type: AlphaNumeric,
          data: AlphaNumeric
        })]
      })],
      password : Password,
      email    : Email
    });

    /*
      Test obj
    */

    var Dummy = function (){
      return null;
    }

    var TestObj = {
      users: [{
        name: [{
          data: 'morepooo'
        },
        [],
        {
          type: Dummy,
          data: 'morepooo$$$$'
        }
        ]
      }],
      password : 'testpassword',
      email    : 'josh@joshsouthern.ca'
    };

    /*
      Expected result.
    */

    var ExpectedResult = EvaluatedSchema.of({
      users    : [
        EvaluatedSchema.of({
          name: [
            EvaluatedSchema.of({
              type: Missing.of(true),
              data: EvaluatedRule.of([true])
            }),
            Unexpected.of([]),
            EvaluatedSchema.of({
              type: Unexpected.of(Dummy),
              data: EvaluatedRule.of([false])
            }),
          ]
        }),
      ], 
      password : EvaluatedRule.of([true, true]),
      email    : EvaluatedRule.of([true, true])
    });

    expect(EvaluateSchema(TestSchema, TestObj)).toEqual(ExpectedResult);
  });
});