##Create item at specific position in page
Create and add item at specific position in page relying on `insert_after_item_id` parameter in request body.

> Sample Request

```shell
curl -X POST \
  'http://localhost:8080/api/pages/1/items?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV' \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: a8b41aff-b1b6-4f64-a698-dc1f49a366ac' \
  -d '{
  "title": "item_video",
  "item_attributes": [
  	{
  	  "id": 1,
       "value": "title_new"
    },
    {
     "id": 2,
     "value": "http://google.com/logo.jpg"
    }
  ],
  "is_public": 0,
  "item_typeId": 1,
  "insert_after_item_id": 0
}'
```

> Sample Response

```json
{
    "id": 232,
    "type": "item",
    "attributes": {
        "title": "item_video",
        "item_attributes": [
            {
                "id": 1,
                "value": "title_new"
            },
            {
                "id": 2,
                "value": "http://google.com/logo.jpg"
            }
        ],
        "is_public": false,
        "item_typeId": 1,
        "insert_after_item_id": 0
    },
    "meta": {
        "createdAt": "2018-10-25T04:45:31.446Z",
        "updatedAt": "2018-10-25T04:45:31.446Z"
    },
    "relationships": {
        "pages": {
            "links": {
                "self": "http:/localhost:8080/api/pages/232?filter[include][pages]",
                "related": "http:/localhost:8080/api/pages/232/pages"
            }
        },
        "attributes": {
            "links": {
                "self": "http:/localhost:8080/api/pages/232?filter[include][attributes]",
                "related": "http:/localhost:8080/api/pages/232/attributes"
            }
        },
        "itemtype": {
            "links": {
                "self": "http:/localhost:8080/api/pages/232?filter[include][itemtype]",
                "related": "http:/localhost:8080/api/pages/232/itemtype"
            }
        }
    },
    "schema": {
        "title": {
            "type": "string"
        },
        "item_attributes": {
            "type": [
                "object"
            ],
            "description": "an array of attribute objects"
        },
        "is_public": {
            "type": "boolean",
            "default": 1
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
**POST** `http://localhost:8080/api/pages/{page_id}/items?access_token={access_token}`

### Header parameters

specify `Content-Type: application/json`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|page_id | number | Required | | The page identifier will contain created item. |


### Request body

| Parameter       | Data type | Required? | Default | Description                                                                                                                                                                                                                                 |
| --------------- | --------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title            | string    | optional  |         | item title                                                                                                                                                                                                                                   |
| item_typeId     | number    | required  |         | item type ID                                                                                                                                                                                                                                |
| item_attributes | array     | required  |         | array of attribute objects. Each `item_attributes` object has `id` property as attribute id and `value` property is either an array type or primitive type  contain value(s) of this attribute. Note that: the `value` property will be validated depend on the data type of item_attribute. |
|insert_after_item_id | number | optional | | if value is 0, it will insert at the top position of the page; if value is specified item id, it will insert below that specified item; otherwise, if value is unspecified, it will insert at the last position of the page |
| is_public       | boolean   | optional  | true   | if true, it would be publicly published after creating |                                                                                                                                                                                     |

### Response
If successful, return a object contains generated item ID along with attributes, relationship, e.g
