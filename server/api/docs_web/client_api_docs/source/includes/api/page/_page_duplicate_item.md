## Duplicate an item in a page
Duplicate an item in a page and place it at specific position relying on `insert_after_item_id` parameter in request body.

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/pages/1/items/15/move/29?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV'
```

> Example Response

```json
HTTP Response Status code: 200
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

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
| duplicate_from_item_id | number | Required | | source item identifier will be copied from|
|insert_after_item_id | number | optional | | if value is 0, it will insert at the top position of the page; if value is specified item id, it will insert below that specified item; otherwise, if value is unspecified, it will insert at the last position of the page |
| is_public       | boolean   | optional  | true   | if true, it would be publicly published after creating |


### Response
If successful, return an object contains created item ID along with attributes, relationship, e.g
