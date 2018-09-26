## List of user libraries
Get list of libraries of current user

> Example Request

```shell
curl -X GET \
  http://localhost:8080/api/users/1/libraries \
  -H 'cache-control: no-cache' \
  -H 'postman-token: c8d0a303-5abf-5127-2243-1baf0d8d6cff'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://localhost:8080/api/users/{user_id}/libraries`


### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|user_id | number | Required | | current user id|



### Response
If successful, return list of libraries of current user



