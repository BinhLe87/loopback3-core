##Create item at specific position in page
Create and add item at specific position in page relying on `insert_after_item_id` parameter in request body.

- Before calling this api, you must determine which `item_typeId` and `item_attributes` you'd like to apply for new item. To achieve that, you can call these APIs in order as below:
  1. To get list of item types: `GET` /api/item_types
  2. To get list attributes associated with a specific `item_typeId`: `GET` /api/item_types/{item_typeId}/attributes
  3. Then you will pass these `attribute_id` into an array `item_attributes` property in following *creating item* API.

> Sample Request

```shell
curl -X POST \
  'http://localhost:8080/api/pages/1/items?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV' \
  -H 'Content-Type: application/json' \
  -d '{
  "title": "item_text",
  "item_attributes": [
  	{
  	  "id": 1,
       "value": "item_title"
    },
    {
     "id": 2,
      "value": "item_description"
    }
  ],
  "item_typeId": 1,
  "insert_after_item_id": 9
}'
```

> Sample Response

```json
{
    "id": 20,
    "type": "item",
    "attributes": {
        "title": "item_text",
        "item_attributes": [
            {
                "id": 1,
                "value": "item_title"
            },
            {
                "id": 2,
                "value": "item_description"
            }
        ],
        "is_active": true,
        "is_public": true,
        "item_typeId": 1,
        "insert_after_item_id": 9
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
If successful, return an object contains created item ID along with attributes, relationship, e.g
