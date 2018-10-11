## List chapters of a workbook
Return list of chapters of a workbook.

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/workbooks/1/chapters?access_token=1YgNIc7EFtjnjuf087mHMVwUmxOTQkaHSAaoIWsnjtlDP2tId4cHCZDmYZY54OtM'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/workbooks/{workbook_id}/chapters?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|workbook_id | number | Required | | The ID of the workbook will retrieve list of chapters belongs to.


### Response
If successful, return an object contains list of chapters belongs to this specified workbook.


