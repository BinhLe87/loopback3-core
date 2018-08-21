#API Reference

#Item

To create two types of items:

* **Raw item**, which means item only contains text. For raw item type, call `Create item` api

* **Media item**, which means image file, video file, e.g. For media item, call `Upload item` api

##Create item

> Example Request

```json
{
    "name": "item_video",
    "item_attributes": [
    {
        "id": 1,
        "values": [
        {
            "value": "title"
        }]
    },
    {
        "id": 9,
        "values": [
        {
            "value": "https://coachingcloud.com/img/platform-intro.png"
        }]
    }],
    "is_public": 0,
    "item_typeId": 1
}
```

> Example Response

```json
{
    "id": 344,
    "type": "item",
    "attributes": {
        "name": "item_video",
        "item_attributes": [
            {
                "id": 1,
                "values": [
                    {
                        "value": "title"
                    }
                ]
            },
            {
                "id": 9,
                "values": [
                    {
                        "value": "https://coachingcloud.com/img/platform-intro.png"
                    }
                ]
            }
        ],
        "is_public": false,
        "item_typeId": 1
    },
    "relationships": {
        "pages": {
            "links": {
                "self": "http:/localhost:8080/api/items/344?filter[include][pages]",
                "related": "http:/localhost:8080/api/items/344/pages"
            }
        },
        "attributes": {
            "links": {
                "self": "http:/localhost:8080/api/items/344?filter[include][attributes]",
                "related": "http:/localhost:8080/api/items/344/attributes"
            }
        },
        "itemtype": {
            "links": {
                "self": "http:/localhost:8080/api/items/344?filter[include][itemtype]",
                "related": "http:/localhost:8080/api/items/344/itemtype"
            }
        }
    },
    "schema": {
        "name": {
            "type": "string"
        },
        "item_attributes": {
            "type": "object",
            "description": [
                "contains all attributes' values description"
            ]
        },
        "is_public": {
            "type": "boolean",
            "default": 0
        },
        "id": {
            "id": 1,
            "generated": true,
            "updateOnly": true
        },
        "createdAt": {
            "required": true,
            "defaultFn": "now"
        },
        "updatedAt": {
            "required": true
        },
        "item_typeId": {}
    }
}
```

### HTTP Request
POST `http://localhost:8080/api/items`

### Query Parameters

Parameter | Data type | Required? | Default | Description
--------- | ------- | ------- | ------- | -----------
name | string | optional | | item name
item_typeId | number  | required | | item type Id
is_public | boolean | optional | false | if true, it would be publicly published after creating
item_attributes | array | required | | array of attribute objects. Each attribute object will have `id` as attribute id and `values` is array of values of this attribute.

##Upload item




