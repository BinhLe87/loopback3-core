## List workbooks
Return a list of workbooks

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/workbooks?access_token=HAEnFp0XcppOw1tJmN2cateKqn2blRwlkjoN0xm3qDuOjeAuKHB95k8JiutJ6fDy'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/workbooks?access_token={access_token}`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|[filter][include]=user|string | Optional | | including user owner in each of workbook returns|


### Response
If successful, return an object contains `data` property is an array of workbooks.


