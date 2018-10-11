## List items of a page
Return list of items of a page.

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/pages/1/items?access_token=1YgNIc7EFtjnjuf087mHMVwUmxOTQkaHSAaoIWsnjtlDP2tId4cHCZDmYZY54OtM'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/pages/{page_id}/items?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|page_id | number | Required | | The ID of the page will retrieve list of items belongs to.


### Response
If successful, return an object contains list of items belongs to this specified page.


