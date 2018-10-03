## List of pages
Return list of pages of a chapter.

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/chapters/1/pages?access_token=1YgNIc7EFtjnjuf087mHMVwUmxOTQkaHSAaoIWsnjtlDP2tId4cHCZDmYZY54OtM'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/chapters/{chapter_id}/pages?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|chapter_id | number | Required | | The ID of the chapter will retrieve list of pages belongs to.


### Response
If successful, return an object contains list of pages belongs to this specified chapter.


