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

### Request body

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|library_id | number | Required | | The ID of the library will retrieve list of workbooks belongs to.


### Response
If successful, return an object contains list of workbooks belongs to this specified library.


