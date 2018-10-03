## List item types
Return a list of item types.

> Example Request

```shell
curl -X GET --header 'Accept: application/json' 'http://localhost:8080/api/item_types'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/item_types`

### Header parameters
specify `Content-Type: application/x-www-form-urlencoded`

### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|


### Response
If successful, return an object contains `data` property is an array of item types.

| Parameter | Data type | Description |
| --------- | --------- | --------- |


