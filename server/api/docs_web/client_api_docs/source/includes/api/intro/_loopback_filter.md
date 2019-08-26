# Introduction

# Filter search result

APC API supports a variety of `filters`. `Filters` specify criteria for the returned data set

**REST API syntax: specify filters in the HTTP query string**

Formular: `?filter_filterType_=_spec_&_filterType_=_spec_....`
Sample: [http://dev01.cc.cloud:49173/api/libraries?filter[where][id]=2](http://dev01.cc.cloud:49173/api/libraries?filter[where][id]=2)


**APC API supports the following kinds of filters:**

- `Fields` filter
- `Limit` filter
- `Order` filter
- `Skip` filter
- `Where` filter
- `Include` filter

The following table describes Loopback's filter types:

| Filter type| Type | Description |
| -------- | -------- | -------- |
fields			|Object, Array, or String	|Specify fields to include in or exclude from the response. (x)
limit			|Number						|Limit the number of instances to return. (x)
order			|String						|Specify sort order: ascending or descending. 
skip (offset)	|Number						|Skip the specified number of instances. (x)
where			|Object						|Specify search criteria; similar to a WHERE clause in SQL.
include			|String, Object, or Array	|Include results from related models, for relations such asbelongsToandhasMany. 


## Fields filter

> Sample response:

```json
[
    {
        "createdBy": "system",
        "id": 2
    },
    {
        "createdBy": "system",
        "id": 3
    }
]
```

Specify fields to include in or exclude from the response.

**REST API**

`filter[fields][propertyName]=<true|false>&filter[fields][propertyName]=<true|false>...`

[http://dev01.cc.cloud:49173/api/libraries?filter[fields][id]=true&filter[fields][createdBy]=true](http://dev01.cc.cloud:49173/api/libraries?filter[fields][id]=true&filter[fields][createdBy]=true)


## Limit filter


> Sample response:

```json
[
    {
        "name": "placeat officiis sint non id ipsum et",
        "createdBy": "system",
        "owner": "20",
        "id": 2,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    },
    {
        "name": "et temporibus aut nulla tempora quod nisi",
        "createdBy": "system",
        "owner": "9",
        "id": 3,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    }
]
```

Limits the number of records returned to the specified number (or less).

**REST API**

`filter[limit]=n`

[http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2](http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2)


## Skip filter

> Sample response:
> Return the third page has 2 items

```json
[
    {
        "name": "repudiandae praesentium mollitia quaerat expedita sed asperiores",
        "createdBy": "system",
        "owner": "19",
        "id": 4,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    },
    {
        "name": "facere quaerat fuga repellat natus cumque nihil",
        "createdBy": "user",
        "owner": "2",
        "id": 5,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    }
]
```

Omits the specified number of returned records. This is useful, for example, to paginate responses.

**REST API**

`?filter[skip]=n`

[http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2&filter[skip]=4](http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2&filter[skip]=4)


## Where filter

> Sample response:
> Return the items has `id` field greater than 20

```json
[
    {
        "name": "nostrum quam iure ea temporibus in ut",
        "createdBy": "user",
        "owner": "11",
        "id": 21,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    },
    {
        "name": "qui non illum quia est nesciunt rerum",
        "createdBy": "system",
        "owner": "2",
        "id": 22,
        "createdAt": "2018-07-04T03:46:24.000Z",
        "updatedAt": "2018-07-04T03:46:24.000Z"
    }
]
```

Specifies a set of logical conditions to match, similar to a WHERE clause in a SQL query.

**REST API**

`filter[where][property]=value` or
`filter[where][property][op]=value` with `op` is comparison operator. See operators availabes in the table *Operators* below.

[http://dev01.cc.cloud:49173/api/libraries?filter[where][createdBy]=system](http://dev01.cc.cloud:49173/api/libraries?filter[where][createdBy]=system) returns items has `createdBy` equals 'system'

[http://dev01.cc.cloud:49173/api/libraries?filter[where][id][gt]=20](http://dev01.cc.cloud:49173/api/libraries?filter[where][id][gt]=20) returns items has `id` greater than 20

**OPERATORS**

This table describes the operators available in “where” filters.


| Operator| Description | 
| -------- | -------- | 
=			|Equivalence. 
and			|Logical AND operator.
or			|Logical OR operator. 
gt, gte		|Numerical greater than (>); greater than or equal (>=). Valid only for numerical and date values. 
lt, lte		|Numerical less than (<); less than or equal (<=). Valid only for numerical and date values. 
between		|True if the value is between the two specified values: greater than or equal to first value and 			|less than or equal to second value. See examples below.
inq, nin	|In / not in an array of values.
neq			|Not equal (!=)
like, nlike	|LIKE / NOT LIKE operators for use with regular expressions. The regular expression format depends 			  |on the backend data source.
regexp		| Regular expression. See examples below.