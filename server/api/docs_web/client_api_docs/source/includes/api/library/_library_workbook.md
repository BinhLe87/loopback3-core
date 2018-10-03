## List of workbooks
Return list of workbooks of a library.

> Example Request

```shell
curl -X GET 'http://localhost:8080/api/libraries/1/workbooks'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/libraries/{library_id}/workbooks`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|library_id | number | Required | | The ID of the library will retrieve list of workbooks belongs to.


### Response
If successful, return an object contains list of workbooks belongs to this specified library.


