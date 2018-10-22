## Move position of a item within a page
Move position of a item within a page

> Example Request

```shell
curl -X PATCH \
  'http://localhost:8080/api/pages/9/items/15/move/29?access_token=sqlrd4F3Q9Xi5vXmS0dtRvFobcVaRTNGug2AGHauhlSo3hTbvHTbCtHFPDs7ZMqV'
```

> Example Response

```json
HTTP Response Status code: 200
```

### HTTP Request
**PATCH** `http://localhost:8080/api/pages/{page_id}/items/{from_item_id}/move/{to_item_id}?access_token={access_token}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|page_id | number | Required | | page identifier contains item will move position|
|from_item_id | number | Required | | item identifier that moves from (called as `from_item`)|
|to_item_id | number | Optional | | item identifier that moves to (called as `to_item`). If unspecified, the `from_item` will move to the last position in page, otherwise it will move the `from_item` to exact position of `to_item` and also move series of items down the list starting from the `to_item` that was at to_position.|


### Response
If successful, return http response status code 200.


<aside class="notice">
In order to swap positions between two items, you can use API instead:<br>
<code>curl -X PATCH
  'http://localhost:8080/api/pages/{page_id}/items/{from_item_id}/swap/{to_item_id}?access_token={access_token}'</code>
</aside>