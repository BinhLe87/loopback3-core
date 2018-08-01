---
title: API Reference

language_tabs: # must be one of https://git.io/vQNgJ
  - json

toc_footers:
  - <a href='http://dev01.cc.cloud:49173'>Try it out via Swagger</a>

includes:
  - errors

search: true
---

# Introduction

# Authentication

# Data filters
There're two ways to query Loopback models using either `Node API` syntax or a `REST API` syntax that supports a variety of `filters`. `Filters` specify criteria for the returned data set. The capabilities and options of the two APIs are the same–the only difference is the syntax used in HTTP requests or in Node function calls. In both cases, LoopBack models return JSON.
#### REST API syntax: specify filters in the HTTP query string
Formular: `?filter_filterType_=_spec_&_filterType_=_spec_....`
Sample: [http://dev01.cc.cloud:49173/api/libraries?filter[where][id]=2](http://dev01.cc.cloud:49173/api/libraries?filter[where][id]=2)
#### Node API syntax: specify filters in the JSON  string object
Formular: `?filter={ Stringified-JSON }`
Sample: [http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"id":"2"}}](http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"id":"2"}})

#### LoopBack supports the following kinds of filters:
    * Fields filter
    * Limit filter
    * Order filter
    * Skip filter
    * Where filter
    * Include filter

The following table describes Loopback's filter types:



| Filter type| Type | Description |
| -------- | -------- | -------- |
fields			|Object, Array, or String	|Specify fields to include in or exclude from the response. (x)
limit			|Number						|Limit the number of instances to return. (x)
order			|String						|Specify sort order: ascending or descending. 
skip (offset)	|Number						|Skip the specified number of instances. (x)
where			|Object						|Specify search criteria; similar to a WHERE clause in SQL.
include			|String, Object, or Array	|Include results from related models, for relations such asbelongsToandhasMany. 

---
Notice: For each syntax in a filter, it has two lines: first line is the syntax, second line is the sample. The `Return` section show the sample returned data of the response.

## Fields filter
Specify fields to include in or exclude from the response.
#### REST API
`filter[fields][propertyName]=<true|false>&filter[fields][propertyName]=<true|false>...`

[http://dev01.cc.cloud:49173/api/libraries?filter[fields][id]=true&filter[fields][createdBy]=true](http://dev01.cc.cloud:49173/api/libraries?filter[fields][id]=true&filter[fields][createdBy]=true)


#### NODE API
`{ fields: {propertyName: <true|false>, propertyName: <true|false>, ... } }`

[http://dev01.cc.cloud:49173/api/libraries?filter={"fields": {"id":"true","createdBy":"true"}}](http%3A%2F%2Fdev01.cc.cloud%3A49173%2Fapi%2Flibraries%3Ffilter%3D%7B%22fields%22%3A%20%7B%22id%22%3A%22true%22%2C%22createdBy%22%3A%22true%22%7D%7D)

##### Returns:
```
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

-------
## Limit filter
Limits the number of records returned to the specified number (or less).
#### REST API
`filter[limit]=n`

[http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2](http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2)


#### NODE API
`{ limit: n }`

[http://dev01.cc.cloud:49173/api/libraries?filter={"limit": 2}](http%3A%2F%2Fdev01.cc.cloud%3A49173%2Fapi%2Flibraries%3Ffilter%3D%7B%22limit%22%3A%202%7D)

##### Returns:
```
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

-------
## Skip filter
Omits the specified number of returned records. This is useful, for example, to paginate responses.
#### REST API
`?filter[skip]=n`

[http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2&filter[skip]=4](http://dev01.cc.cloud:49173/api/libraries?filter[limit]=2&filter[skip]=4)


#### NODE API
`{ skip: n }`

[http://dev01.cc.cloud:49173/api/libraries?filter={"limit":"2","skip":"4"}](http://dev01.cc.cloud:49173/api/libraries?filter={"limit":"2","skip":"4"})

##### Returns:
Return the third page has 2 items
```
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

-------
## Where filter
Specifies a set of logical conditions to match, similar to a WHERE clause in a SQL query.
#### REST API
`filter[where][property]=value` or
`filter[where][property][op]=value` with `op` is comparison operator. See operators availabes in the table *Operators* below.

[http://dev01.cc.cloud:49173/api/libraries?filter[where][createdBy]=system](http://dev01.cc.cloud:49173/api/libraries?filter[where][createdBy]=system) returns items has `createdBy` equals 'system'

[http://dev01.cc.cloud:49173/api/libraries?filter[where][id][gt]=20](http://dev01.cc.cloud:49173/api/libraries?filter[where][id][gt]=20) returns items has `id` greater than 20


#### NODE API
`{where: {property: value}}` or
`{where: {property: {op: value}}}`

[http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"createdBy":"system"}}](http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"createdBy":"system"}}) or

[http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"id":{"gt":"20"}}}](http://dev01.cc.cloud:49173/api/libraries?filter={"where":{"id":{"gt":"20"}}})

##### Returns:
Return the items has `id` field greater than 20
```
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
    },
```


#### Operators
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
regexp		|Regular expression. See examples below.
# Versioning
