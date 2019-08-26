## List of workbook themes
Return a list of workbook themes, including style attributes within each theme.

> Example Request

```shell
curl -X GET \
  'http://localhost:8080/api/workbooks/1/themes?access_token=a628MYIXe9A697xFAcGEg9C9wfWE8Cg0XYzrF8JSrtUwVGhcHQ1peO82MrAPUziH&filter[include]=attributes'
```

> Example Response

```json
```

### HTTP Request
**GET** `http://dev01.cc.cloud:49173/api/workbooks/{workbook_id}/themes?access_token={access_token}&filter[include]=attributes`

### Request params

| Parameter       | Data type | Required? | Default | Description |
| --------------- | --------- | --------- | ------- | ----------- |
|access_token | string | Required | | access token. In order to [get access token](http://dev01.cc.cloud:49173/public/client_api_docs/#get-an-access-token), make an API call `/api/login`.|
|workbook_id | number | Required | | The ID of the workbook that will receive a list of themes associated with |
|filter[include]=attributes|string | Optional | | enable including style attributes within each theme|


### Response
If successful, return an object contains `data` property is an array of themes of a specified workbook.


