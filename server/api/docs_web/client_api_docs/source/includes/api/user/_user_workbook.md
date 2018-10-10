## List of user workbooks
Get list of workbooks owned by the current user

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/users/me/workbooks?access_token=1Q0P2HEc6fULYT3a7DmviI5jJt1Rtv2k9ApEqZ0Imzvj4hjHKu6E6cBN1ojRcZMM'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/users/me/workbooks?access_token={access_token}`


### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|


### Response
If successful, return list of workbooks owned by the current user



