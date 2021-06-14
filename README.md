# SSQL
SSQL is a library for treating Google Spreadsheet like a database. This library is written in TypeScript and can be converted to ES6 JavaScript and executed in Google Apps Script.


# Installation
Script ID: `1NS-PMCAYnX1JoscFpPqhjp27EqABc_xgk6tYn01n8-DbMYoMGaenGgDm`

Apps Script>Libraries>Add a Library>Script ID:`1NS-PMCAYnX1JoscFpPqhjp27EqABc_xgk6tYn01n8-DbMYoMGaenGgDm`>Look up>Add


# Usage
The first line can be used for the field name, and the second and subsequent lines can be used for the data sheet.

![Data sheet sample](https://i.gyazo.com/bbb3f11f08d05e558bceaa43d8df03dc.png "sample")


## Select
```js
const id = 'SpreadSheets ID';
const name = 'SpreadSheets SheetName';
// values: json array
const values = SSQL.open(id, name).selectQ(['name', 'age']);

// [{"name": "Tom", "age": 28}, {"name": "Sophia", "age": 21}, ...]
console.log(values);

const valuesAs = SSQL.open(id, name).selectAs({"name": "name1", "age": "age1"});

// [{"name1": "Tom", "age1": 28}, {"name1": "Sophia", "age1": 21}, ...]
console.log(valuesAs);
```

You can use "\*" in the field name, but if you use "\*", other specified items will be ignored. Duplicate field names cannot be used because the return value is json array.

Example: When all field names are id, name, age.
```js
// return [{"id": , "name": , "age": }, ...]
const values = SSQL.open(id, name).selectQ(["*"]);

// return [{"id": , "name": , "age": }, ...]
const values = SSQL.open(id, name).selectQ(["*", "name"]);
```

## Insert
```js
const jsonArray = [
    {"name": "Lisa", "age": 31},
    {"name": "Paul", "age": 46}
];

SSQL.open(id, name).insertQ(jsonArray);
```

## Update
```js
const jsonArray = [
    {"stock_quantity": 0}
];

SSQL.open(id, name).updateQ(jsonArray, "book_name = 'NARUTO'");
```


## Delete
```js
SSQL.open(id, name).deleteQ("book_name = 'NARUTO'");
```

<br>

## Available Data Types
`Number`, `String`, `Boolean`, `Date`
<br>
<br>
## Available symbols
| Symbol | Example                             |
|:------:|:------------------------------------|
|    =   | age = 20                            |
|   <>   | age <> 20                           |
|    <   | age < 20                            |
|   <=   | age <= 20                           |
|    >   | age > 20                            |
|   >=   | age >= 20                           |
|   OR   | age < 10 OR age > 20                |
|   AND  | age > 10 AND age < 20               |

<br>

## You can use parentheses.
You can use parentheses. The items in parentheses are judged first.
```js
// Matches with a name of 'Tom' and an age of 28 or 26.
SSQL.open(id, name).selectQ(["*"], "name = 'Tom' AND (age = 28 OR age = 26)");
```

<br>

## Number type description
There are no particular modifiers. Please write the numbers as they are.
```js
SSQL.open(id, name).selectQ(["*"], "age = 28");
```

<br>

## String type description
Enclose the string. The characters that can be used are ["'`].
```js
SSQL.open(id, name).selectQ(["*"], "name = 'John'");
SSQL.open(id, name).selectQ(["*"], 'name = "John"');
SSQL.open(id, name).selectQ(["*"], "name = `John`");
```

<br>

## Date type description
Prefix the date string with the "date" modifier.The date string is `new Date("date string")`. You can specify the appropriate date string with `new Date()`.
```js
SSQL.open(id, name).selectQ(["*"], "birthday >= date '2020-1-1'");
SSQL.open(id, name).selectQ(["*"], 'birthday >= date "2020-1-1"');
SSQL.open(id, name).selectQ(["*"], "birthday >= date `2020-1-1`");
```

<br>

## Boolean type description
You can use "true" or "false" in all uppercase letters, all lowercase letters, and first uppercase letters.
```js
// ok: true, false, True, False, TRUE, FALSE
// ng: tRue, fALse
SSQL.open(id, name).selectQ(["*"], "japanese = true");
```

<br>

## Delimiter
Space is required as a delimiter.
```JavaScript
// ok
SSQL.open(id, name).select(["name", "age"], "age > 20");
// ng
SSQL.open(id, name).select(["name", "age"], "age>20");

```

<br>

## Supports Japanese field names
When using a Japanese field name in the Where clause, enclose the field name in "[ ]".

Example
```js
// ok
SSQL.open(id, name).select(["*"], "[年齢] = 20");
// ng
SSQL.open(id, name).select(["*"], "年齢 = 20");
```

<br>

# Author
* Sou
* [Twitter](https://twitter.com/kumope_sou)
* <mail@kumope.com>

# License
"SSQL" is under [MIT license](https://en.wikipedia.org/wiki/MIT_License).