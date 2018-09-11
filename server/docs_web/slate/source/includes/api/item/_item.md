#API Reference

#Item

To create two types of items:

* **Raw item**, which means item only contains text. For raw item type, call `Create item` api

* **Media item**, which means image file, video file, e.g. For media item, call `Upload item` api

Note that: two APIs have the same URL endpoint, but they have different `Content-Type` value in HTTP header to specify the data format of the request body.

##Create item

> Sample Request

```shell
curl -X POST \
  http://localhost:8080/api/items \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d '{
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
    }
  ],
  "is_public": 0,
  "item_typeId": 1
}'
```

> Sample Response

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
**POST** `http://localhost:8080/api/items`

### Header parameters

specify `Content-Type: application/json`

### Request body

| Parameter       | Data type | Required? | Default | Description                                                                                                                                                                                                                                 |
| --------------- | --------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name            | string    | optional  |         | item name                                                                                                                                                                                                                                   |
| item_typeId     | number    | required  |         | item type ID                                                                                                                                                                                                                                |
| is_public       | boolean   | optional  | false   | if true, it would be publicly published after creating                                                                                                                                                                                      |
| item_attributes | array     | required  |         | array of attribute objects. Each `item_attributes` object has `id` property as attribute id and `values` property is array of values of this attribute. Note that: the `value` will be validated depend on the data type of item_attribute. |

### Response
If successful, return a object contains generated item ID along with attributes, relationship, e.g

##Upload item

Upload media file, it may be a image, a video, etc.

> Sample Request

> HTTP Request Headers
 
```shell
curl -X POST \
  http://localhost:8080/api/items \
  -H 'cache-control: no-cache' \
  -H 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F 'image=@work_logo youtube .jpg'
```

> HTTP Request Payload

```yaml
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="image"; filename="work_logo youtube .jpg"
Content-Type: image/jpeg
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

> Sample Response

```json
{
    "id": 352,
    "type": "item",
    "attributes": {
        "item_attributes": [
            {
                "id": 10,
                "values": [
                    {
                        "origin_url": "http:/localhost:8080/upload/apc/2018/08/21/work-logo-youtube_apc-20180821-c51253.jpg"
                    },
                    {
                        "desktop_url": "http:/localhost:8080/upload/apc/2018/08/21/work-logo-youtube_apc-20180821-c51253_530_298.jpg"
                    },
                    {
                        "mobile_url": "http:/localhost:8080/upload/apc/2018/08/21/work-logo-youtube_apc-20180821-c51253_530_298.jpg"
                    }
                ]
            }
        ],
        "is_public": 0,
        "item_typeId": 13
    },
    "relationships": {
        "pages": {
            "links": {
                "self": "http:/localhost:8080/api/items/352?filter[include][pages]",
                "related": "http:/localhost:8080/api/items/352/pages"
            }
        },
        "attributes": {
            "links": {
                "self": "http:/localhost:8080/api/items/352?filter[include][attributes]",
                "related": "http:/localhost:8080/api/items/352/attributes"
            }
        },
        "itemtype": {
            "links": {
                "self": "http:/localhost:8080/api/items/352?filter[include][itemtype]",
                "related": "http:/localhost:8080/api/items/352/itemtype"
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

**POST** `http://localhost:8080/api/items`

### Header parameters

specify `Content-Type: multipart/form-data`

### Request body

| Parameter | Data type | Required? | Default | Description |
| --------- | --------- | --------- | ------- | ----------- |
| image     | string | required | | image file name

### Response
If successful, returns a object contains links for 3 dimension verions with ordered resolution quality are high, medium, low. 
`item_attributes` property contains array `values` of links as above description.

| Parameter | Data type | Description |
| --------- | --------- | --------- |
high_url | string | image link for highest dimension
medium_url | string | image link for medium dimension
low_url | string | image link for low dimension

------------
## Add an item into a page
Add an existing item into an existing page.

> Example Request

```shell
```

> Example Response

```json
```

### HTTP Request
**POST** `http://localhost:8080/api/page_items`

### Header parameters

### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|display_order_id | number | optional | auto increment | The appearance order of a item on a page. If not specified, its value auto sequentially increments by 1. Notice that this value must be unique in a same page.


### Response
If successful, return an object reflect the relation between a item and a page

| Parameter | Data type | Description |
| --------- | --------- | --------- |
